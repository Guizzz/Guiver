import { spawn, ChildProcess } from "child_process";
import http from "http";

const TEST_API_PORT = "8085";
const BASE_URL = `http://localhost:${TEST_API_PORT}`;

let serverProcess: ChildProcess | null = null;

function httpGet(url: string): Promise<{ status: number }> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        res.resume();
        resolve({ status: res.statusCode! });
      })
      .on("error", reject);
  });
}

function waitForServer(url: string, timeout = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      if (Date.now() - start > timeout) {
        return reject(new Error(`Server not ready after ${timeout}ms`));
      }
      httpGet(url)
        .then(() => resolve())
        .catch(() => setTimeout(poll, 500));
    };
    poll();
  });
}

export async function setup(): Promise<() => void> {
  if (process.env.PI_HOST) {
    const host = process.env.PI_HOST;
    const port = process.env.PI_API_PORT || process.env.API_PORT || "8080";
    const url = `http://${host}:${port}`;
    console.log(`[remote] Waiting for server at ${url}...`);
    await waitForServer(url);
    console.log("[remote] Server reachable");
    return () => {};
  }

  return new Promise((resolve, reject) => {
    serverProcess = spawn(process.execPath, ["--import", "tsx", "index.ts"], {
      cwd: process.cwd(),
      stdio: "pipe",
      env: {
        ...process.env,
        API_PORT: TEST_API_PORT,
        WSS_CLI_PORT: "8086",
        WSS_MDL_PORT: "8087",
        INFO_PORT: "54322",
      },
    });

    serverProcess.stdout?.on("data", (data: Buffer) => {
      process.stdout.write(data);
    });

    serverProcess.stderr?.on("data", (data: Buffer) => {
      process.stderr.write(data);
    });

    serverProcess.on("error", (err) => {
      reject(err);
    });

    waitForServer(BASE_URL)
      .then(() => resolve(() => teardown()))
      .catch(reject);
  });
}

function teardown() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

export { teardown };
