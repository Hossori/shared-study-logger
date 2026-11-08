/**
 * `CLOUDFLARE_ENV=preview` を付けて `pnpm build` し、終了後にその変数を消す。
 * 変数はこのプロセスだけにあり、親のシェルには残らない。
 */
import { spawn } from "node:child_process";

process.env.CLOUDFLARE_ENV = "preview";

const child = spawn("pnpm build", {
  env: process.env,
  stdio: "inherit",
  shell: true,
});

function finish(code) {
  delete process.env.CLOUDFLARE_ENV;
  process.exit(code);
}

child.on("exit", (code, signal) => {
  finish(signal ? 1 : (code ?? 1));
});

child.on("error", (error) => {
  console.error(error);
  finish(1);
});
