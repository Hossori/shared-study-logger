import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import {
	CLIENT_API_VERSION_HEADER,
	isClientApiVersionSupported,
	MIN_SUPPORTED_CLIENT_API_VERSION,
} from "../../../shared/client-api-version";

type ClientApiVersionEnvironment = {
	Bindings: Env;
};

/**
 * 指定した最小クライアント API 版を満たさないリクエストを 426 で拒否する。
 *
 * 最小版が `null` のブリッジ期間は、既存クライアントとの互換性を保つため常に通過する。
 */
export function createRequireClientApiVersion(
	minimumClientApiVersion: string | null = MIN_SUPPORTED_CLIENT_API_VERSION,
): MiddlewareHandler<ClientApiVersionEnvironment> {
	return createMiddleware<ClientApiVersionEnvironment>(async (c, next) => {
		if (
			minimumClientApiVersion === null ||
			isClientApiVersionSupported(
				c.req.header(CLIENT_API_VERSION_HEADER) ?? "",
				minimumClientApiVersion,
			)
		) {
			await next();
			return;
		}

		return c.json(
			{
				error: "client_update_required",
				minimumClientApiVersion,
			},
			426,
			{ "Cache-Control": "no-store" },
		);
	});
}

export const requireClientApiVersion = createRequireClientApiVersion();
