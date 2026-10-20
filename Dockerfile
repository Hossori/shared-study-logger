FROM node:22-bookworm-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates git curl gosu \
	&& rm -rf /var/lib/apt/lists/*

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN chown -R node:node /app

USER node
ENV PNPM_HOME=/home/node/.local/share/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
ENV SIMPLE_GIT_HOOKS=0
RUN pnpm install --frozen-lockfile

USER root
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
# ソースはイメージ内（Linux ファイルシステム）に置く。
# Windows の bind mount だと Vite / workerd の起動が数分でタイムアウトする。
COPY --chown=node:node . .
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0", "--port", "5173"]
