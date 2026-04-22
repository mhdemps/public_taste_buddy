import { spawn } from "node:child_process";

const apiCommand = process.platform === "win32" ? "node server/index.js" : `${process.execPath} server/index.js`;
const viteCommand = process.platform === "win32" ? "npm run dev:vite" : "npm run dev:vite";

const apiProc = spawn(apiCommand, {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

const viteProc = spawn(viteCommand, {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

function shutdown() {
  apiProc.kill();
  viteProc.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

apiProc.on("exit", (code) => {
  if (code && code !== 0) {
    viteProc.kill();
    process.exit(code);
  }
});

viteProc.on("exit", (code) => {
  if (code && code !== 0) {
    apiProc.kill();
    process.exit(code);
  }
});
