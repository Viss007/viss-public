import "dotenv/config";
import { startWorker } from "./worker.mjs";

console.log("speed-lead worker (standalone) — same queue as server");
startWorker();
