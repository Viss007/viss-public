/**
 * Free a TCP listen port for local dev by killing owning process(es).
 * Windows: netstat -ano; Unix: lsof. Never kills process.pid.
 */
import { execSync } from "child_process";

/**
 * @param {string} output netstat -ano stdout
 * @param {number} port
 * @returns {number[]}
 */
export function parseWindowsNetstatListenPids(output, port) {
  const pids = new Set();
  const p = String(port);
  const lines = output.split(/\r?\n/);
  for (const line of lines) {
    if (!/LISTENING/i.test(line)) continue;
    const trimmed = line.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) continue;
    const local = parts[1];
    const pid = parseInt(parts[parts.length - 1], 10);
    if (!Number.isFinite(pid) || pid <= 0) continue;
    if (!localAddrHasListenPort(local, p)) continue;
    pids.add(pid);
  }
  return [...pids];
}

/** Local address column ends with :port (IPv4 or IPv6). */
export function localAddrHasListenPort(local, portStr) {
  if (local.endsWith(":" + portStr)) return true;
  if (local.includes("]:" + portStr)) return true;
  return false;
}

function getListenPidsUnix(port) {
  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out
      .trim()
      .split(/\n/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  } catch {
    return [];
  }
}

function getListenPidsWin32(port) {
  try {
    const out = execSync("netstat -ano", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    return parseWindowsNetstatListenPids(out, port);
  } catch {
    return [];
  }
}

/**
 * @param {number} port
 * @returns {number[]} PIDs that were listening (before filter), for logging
 */
export function getListenPidsOnPort(port) {
  if (process.platform === "win32") return getListenPidsWin32(port);
  return getListenPidsUnix(port);
}

/**
 * Kill all processes listening on `port` except the current process.
 * @param {number} port
 * @returns {number[]} PIDs we attempted to kill (successful taskkill/kill)
 */
export function killListenProcessesOnPort(port) {
  const selfPid = process.pid;
  const candidates = getListenPidsOnPort(port).filter((p) => p !== selfPid);
  const killed = [];
  for (const pid of candidates) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /PID ${pid} /F`, {
          stdio: "ignore",
          windowsHide: true,
        });
      } else {
        try {
          process.kill(pid, "SIGKILL");
        } catch {
          /* already exited or no permission */
        }
      }
      killed.push(pid);
    } catch {
      /* access denied or already gone */
    }
  }
  return killed;
}
