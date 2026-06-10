import { Worker } from "bullmq";
import {
  idempotencyRedis,
  isNotifyProcessed,
  markNotifyProcessed,
  releaseIngressLock,
} from "./idempotency.mjs";
import { getRedisConnection, QUEUE_NAME } from "./queue.mjs";
import { sendEmailNotify } from "./email.mjs";
import { sendSlackWebhook, slackIncomingWebhookBody } from "./notify.mjs";
import { maybeSendSmsAfterNotify } from "./sms.mjs";
import { recordJobProcessMs } from "./metrics.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startWorker() {
  const connection = getRedisConnection();
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const t0 = Date.now();
      const { eventType, payload, receivedAt, idempotencyKey } = job.data;
      await sleep(2000);

      const redis = idempotencyRedis();
      if (idempotencyKey && (await isNotifyProcessed(redis, idempotencyKey))) {
        console.log(
          "[worker] skip notify (already processed): " +
          JSON.stringify({
            eventType,
            jobId: job.id,
            idempotencyKey,
          })
        );
      } else {
        const slackBody = slackIncomingWebhookBody({
          eventType,
          payload,
          receivedAt,
          jobId: job.id,
          idempotencyKey: idempotencyKey ?? null,
        });
        await sendSlackWebhook(slackBody);

        await sendEmailNotify({
          eventType,
          payload,
          receivedAt,
          jobId: job.id,
          idempotencyKey: idempotencyKey ?? null,
        });

        await maybeSendSmsAfterNotify({
          eventType,
          payload,
          receivedAt,
          jobId: job.id,
        });

        if (idempotencyKey) {
          await markNotifyProcessed(redis, idempotencyKey);
        }

        console.log(
          "notified:  " +
          JSON.stringify({
            eventType,
            payload,
            receivedAt,
            jobId: job.id,
            idempotencyKey: idempotencyKey ?? null,
          })
        );
      }
      recordJobProcessMs(Date.now() - t0);
    },
    { connection, concurrency: 5 }
  );

  worker.on("failed", async (job, err) => {
    console.error(
      `[worker] job failed id=${job?.id} attemptsMade=${job?.attemptsMade}`,
      err?.message ?? err
    );
    const max = job?.opts?.attempts ?? 1;
    const done = (job?.attemptsMade ?? 0) >= max;
    if (done && job?.data?.idempotencyKey) {
      const redis = idempotencyRedis();
      await releaseIngressLock(redis, job.data.idempotencyKey);
    }
  });

  return worker;
}
