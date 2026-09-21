const URL = process.argv[2] || "https://uplink.uplinklfg.workers.dev/api/health/auth/status";
const TOTAL = Number(process.argv[3] || 1000);
const CONCURRENCY = Number(process.argv[4] || 50);

const timings = [];
const statusCounts = {};
let errors = 0;

async function hit() {
  const start = Date.now();
  try {
    const res = await fetch(URL);
    timings.push(Date.now() - start);
    statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
    if (!res.ok) errors++;
  } catch {
    timings.push(Date.now() - start);
    errors++;
  }
}

async function run() {
  let i = 0;
  const pool = Math.min(CONCURRENCY, TOTAL);
  await Promise.all(
    Array.from({ length: pool }, async () => {
      while (i < TOTAL) {
        i++;
        await hit();
      }
    })
  );
}

(async () => {
  const started = Date.now();
  await run();
  const elapsedMs = Date.now() - started;

  timings.sort((a, b) => a - b);
  const pct = (q) =>
    timings[Math.min(timings.length - 1, Math.floor((q / 100) * timings.length))];

  console.log(
    JSON.stringify(
      {
        url: URL,
        total: TOTAL,
        concurrency: CONCURRENCY,
        elapsedMs,
        reqPerSec: Math.round((TOTAL / elapsedMs) * 1000),
        errors,
        statusCounts,
        p50Ms: pct(50),
        p90Ms: pct(90),
        p95Ms: pct(95),
        p99Ms: pct(99),
      },
      null,
      2
    )
  );
})();