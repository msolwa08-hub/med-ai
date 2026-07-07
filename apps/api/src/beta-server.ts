import './load-env.js';
import { buildApp } from './app.js';
import { betaConfig } from './lib/beta-config.js';

process.env.BETA_SERVER = '1';

const app = await buildApp({ serveStatic: true });

// Process-level resilience. Under concurrent ward load an unhandled rejection
// (a promise nobody awaited — a background Anthropic/DB call that rejects) would
// otherwise terminate the whole Node process in modern Node, taking every
// in-flight intern's session down with it. Fastify already catches errors
// thrown inside request handlers; these guards catch the ones that escape the
// request lifecycle. We LOG and stay up rather than exit: a single bad call
// must not become a ward-wide outage. A sustained storm of uncaught exceptions
// means the process state is likely corrupt, so we then bail and let the
// platform (Render) restart us clean rather than serve garbage.
process.on('unhandledRejection', (reason) => {
  app.log.error({ reason }, 'unhandledRejection — kept alive, single request degraded');
});

let fatalExceptions = 0;
process.on('uncaughtException', (err) => {
  fatalExceptions += 1;
  app.log.error({ err, count: fatalExceptions }, 'uncaughtException — kept alive');
  if (fatalExceptions >= 10) {
    app.log.fatal('uncaughtException storm — exiting for a clean restart');
    process.exit(1);
  }
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, async () => {
    app.log.info(`${signal} received — closing server gracefully`);
    try {
      await app.close();
    } finally {
      process.exit(0);
    }
  });
}

try {
  await app.listen({ port: betaConfig.PORT, host: '0.0.0.0' });
  console.log(`\n🏥 MedAI Beta Server running on http://localhost:${betaConfig.PORT}`);
  console.log(`   API Key (beta):   ${betaConfig.BETA_ACCESS_KEYS}`);
  console.log(`   API Key (doctor): ${betaConfig.BETA_DOCTOR_KEYS}`);
  console.log(`   API Key (tools):  ${betaConfig.BETA_TOOLS_KEYS}\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
