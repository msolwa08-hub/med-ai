import './load-env.js';
import { buildApp } from './app.js';
import { betaConfig } from './lib/beta-config.js';

process.env.BETA_SERVER = '1';

const app = await buildApp({ serveStatic: true });

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
