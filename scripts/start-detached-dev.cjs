const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const logDir = path.join(root, ".codex-logs");
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, `next-dev-${process.pid}.log`);
const errPath = path.join(logDir, `next-dev-${process.pid}.err.log`);

const env = { ...process.env };
if (!env.PATH && env.Path) {
  env.PATH = env.Path;
}
if (!env.Path && env.PATH) {
  env.Path = env.PATH;
}

function timestamp() {
  return new Date().toISOString();
}

function append(file, text) {
  fs.appendFileSync(file, text);
}

function start() {
  append(logPath, `[${timestamp()}] Starting Next dev server\n`);

  const out = fs.openSync(logPath, "a");
  const err = fs.openSync(errPath, "a");
  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "--port", "3000"],
    {
      cwd: root,
      env,
      stdio: ["ignore", out, err],
      windowsHide: true,
    },
  );

  append(logPath, `[${timestamp()}] Next PID ${child.pid}\n`);

  child.on("exit", (code, signal) => {
    append(
      logPath,
      `[${timestamp()}] Next exited code=${code ?? ""} signal=${signal ?? ""}; restarting\n`,
    );
    fs.closeSync(out);
    fs.closeSync(err);
    setTimeout(start, 1000);
  });
}

process.title = "skybalam-next-keeper";
start();

setInterval(() => {}, 60_000);
