#!/usr/bin/env bash
# CASCADE wipe canary: snapshot / compare core D1 table row counts.
set -euo pipefail

TABLES=(users groups group_members study_records record_reactions push_subscriptions app_notifications)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARSE_JSON=(node "$SCRIPT_DIR/parse-wrangler-d1-json.mjs")
DB_NAME=shared-study-logger-db

d1_query() {
  local sql="$1"
  local raw
  raw="$(pnpm exec wrangler d1 execute "$DB_NAME" --remote --yes --json --command "$sql" 2>&1)"
  printf '%s' "$raw" | "${PARSE_JSON[@]}"
}

table_exists() {
  local table="$1"
  local rows
  rows="$(d1_query "SELECT name FROM sqlite_master WHERE type='table' AND name='${table}';")"
  [[ "$(jq 'length' <<< "$rows")" -gt 0 ]]
}

snapshot_counts() {
  local counts='{}'
  local table count
  for table in "${TABLES[@]}"; do
    if table_exists "$table"; then
      count="$(d1_query "SELECT COUNT(*) AS count FROM ${table};" | jq -er '.[0].count | tonumber')"
      counts="$(jq -c --arg t "$table" --argjson c "$count" '. + {($t): $c}' <<< "$counts")"
    fi
  done
  printf '%s\n' "$counts"
}

usage() {
  echo "Usage: $0 snapshot <outfile> | compare <before-file>" >&2
  exit 2
}

cmd="${1:-}"
file="${2:-}"

case "$cmd" in
  snapshot)
    if [[ -z "$file" ]]; then
      usage
    fi
    counts="$(snapshot_counts)"
    printf '%s\n' "$counts" > "$file"
    echo "D1 row counts: $counts"
    ;;
  compare)
    if [[ -z "$file" || ! -f "$file" ]]; then
      echo "Missing pre-migration counts at ${file:-<none>}" >&2
      exit 1
    fi
    before="$(cat "$file")"
    after="$(snapshot_counts)"
    echo "Post-migration row counts: $after"

    failed=0
    if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
      {
        echo "## D1 row-count canary"
        echo
        echo "| Table | Before | After |"
        echo "| --- | ---: | ---: |"
      } >> "$GITHUB_STEP_SUMMARY"
    fi

    while IFS= read -r table; do
      before_count="$(jq -r --arg t "$table" '.[$t] // empty' <<< "$before")"
      after_count="$(jq -r --arg t "$table" '.[$t] // empty' <<< "$after")"
      if [[ -z "$before_count" ]]; then
        continue
      fi
      if [[ -z "$after_count" ]]; then
        echo "Table $table existed before migration but is missing after." >&2
        if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
          echo "| $table | $before_count | (missing) |" >> "$GITHUB_STEP_SUMMARY"
        fi
        failed=1
        continue
      fi
      if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
        echo "| $table | $before_count | $after_count |" >> "$GITHUB_STEP_SUMMARY"
      fi
      if (( after_count < before_count )); then
        echo "Row count dropped for $table: $before_count -> $after_count" >&2
        failed=1
      fi
    done < <(jq -r 'keys[]' <<< "$before")

    if (( failed )); then
      if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
        {
          echo
          echo "**Migration aborted:** core table row counts decreased. Worker will not deploy."
          echo "Restore D1 with the Time Travel bookmark recorded in the D1 recovery point step above."
        } >> "$GITHUB_STEP_SUMMARY"
      fi
      exit 1
    fi

    echo "D1 row-count canary passed."
    ;;
  *)
    usage
    ;;
esac
