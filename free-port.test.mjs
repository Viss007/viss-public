import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseWindowsNetstatListenPids,
  localAddrHasListenPort,
} from "./free-port.mjs";

describe("localAddrHasListenPort", () => {
  it("matches IPv4", () => {
    assert.equal(localAddrHasListenPort("127.0.0.1:3333", "3333"), true);
    assert.equal(localAddrHasListenPort("0.0.0.0:3333", "3333"), true);
  });
  it("matches IPv6 bracket form", () => {
    assert.equal(localAddrHasListenPort("[::1]:3333", "3333"), true);
    assert.equal(localAddrHasListenPort("[::]:3333", "3333"), true);
  });
  it("rejects wrong port", () => {
    assert.equal(localAddrHasListenPort("127.0.0.1:33330", "3333"), false);
    assert.equal(localAddrHasListenPort("127.0.0.1:13333", "3333"), false);
  });
});

describe("parseWindowsNetstatListenPids", () => {
  it("extracts PIDs for LISTENING rows on the target port", () => {
    const sample = `
  TCP    127.0.0.1:3333         0.0.0.0:0              LISTENING       27952
  TCP    0.0.0.0:3333           0.0.0.0:0              LISTENING       100
  UDP    0.0.0.0:12345          *:*                                    7
`;
    const pids = parseWindowsNetstatListenPids(sample, 3333);
    assert.deepEqual([...pids].sort((a, b) => a - b), [100, 27952]);
  });
  it("ignores other ports", () => {
    const sample =
      "  TCP    127.0.0.1:3334         0.0.0.0:0              LISTENING       99\n";
    assert.deepEqual(parseWindowsNetstatListenPids(sample, 3333), []);
  });
  it("ignores non-LISTENING", () => {
    const sample =
      "  TCP    127.0.0.1:3333         1.2.3.4:443            ESTABLISHED     5\n";
    assert.deepEqual(parseWindowsNetstatListenPids(sample, 3333), []);
  });
});
