import "dotenv/config";
import IORedis from "ioredis";

const url = process.env.REDIS_URL;
const conn = url
  ? new IORedis(url, { maxRetriesPerRequest: 1, connectTimeout: 5000 })
  : new IORedis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
  });

try {
  const pong = await conn.ping();
  if (pong !== "PONG") {
    throw new Error(`PING expected PONG, got ${pong}`);
  }
  const info = await conn.info("server");
  const m = info.match(/redis_version:([\d.]+)/);
  const ver = m ? m[1] : "0";
  const major = Number(ver.split(".")[0]);
  if (Number.isNaN(major) || major < 5) {
    console.error(
      `Redis ${ver} is too old for BullMQ (need >= 5.0). Use Memurai Developer or WSL2 Redis 7+.`
    );
    await conn.quit().catch(() => { });
    process.exit(1);
  }
  console.log(`Redis OK: ${ver} (PING -> PONG). BullMQ can use this server.`);
  await conn.quit();
  process.exit(0);
} catch (e) {
  console.error("Redis check failed:", e.message ?? e);
  await conn.quit().catch(() => { });
  process.exit(1);
}
