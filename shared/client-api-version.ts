/**
 * ブラウザクライアントと API 間の互換性を表す、数値3要素のバージョン契約。
 *
 * pre-release や build metadata は API 互換性の判定対象にしないため受け付けない。
 */
export const CLIENT_API_VERSION = "1.0.0";

/**
 * `null` は最小対応版の強制を無効にする。
 * 初回ブリッジの間は、旧クライアントを 426 で拒否しない。
 */
export const MIN_SUPPORTED_CLIENT_API_VERSION: string | null = null;

export const CLIENT_API_VERSION_HEADER = "X-Client-Api-Version";

export type ClientApiVersionParts = readonly [
  major: number,
  minor: number,
  patch: number,
];

const CLIENT_API_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * API 契約用の `major.minor.patch` を数値要素へ変換する。
 * 桁の省略、符号、先頭ゼロ、pre-release は互換性判定を曖昧にするため無効とする。
 */
export function parseClientApiVersion(
  version: string,
): ClientApiVersionParts | null {
  const match = CLIENT_API_VERSION_PATTERN.exec(version);
  if (!match) {
    return null;
  }

  const [, major, minor, patch] = match;
  return [Number(major), Number(minor), Number(patch)];
}

/**
 * `left` が新しければ正、同一なら 0、古ければ負を返す。
 * いずれかが API 契約として無効なら `null` を返す。
 */
export function compareClientApiVersions(
  left: string,
  right: string,
): -1 | 0 | 1 | null {
  const leftParts = parseClientApiVersion(left);
  const rightParts = parseClientApiVersion(right);
  if (!leftParts || !rightParts) {
    return null;
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] > rightParts[index]) {
      return 1;
    }
    if (leftParts[index] < rightParts[index]) {
      return -1;
    }
  }

  return 0;
}

/**
 * 強制が無効な場合は常に対応済みとする。
 * 強制中に無効なクライアント版が渡された場合は、対応外として扱う。
 */
export function isClientApiVersionSupported(
  clientVersion: string,
  minimumVersion: string | null = MIN_SUPPORTED_CLIENT_API_VERSION,
): boolean {
  if (minimumVersion === null) {
    return true;
  }

  const comparison = compareClientApiVersions(clientVersion, minimumVersion);
  return comparison !== null && comparison >= 0;
}
