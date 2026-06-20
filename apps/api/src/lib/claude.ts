import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

// Singleton Anthropic client
export const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY,
});

// Model to use for medical history taking and diagnosis
export const CLAUDE_MODEL = 'claude-opus-4-5';

// Medical history taking model (cost-effective for long conversations)
export const CLAUDE_HISTORY_MODEL = 'claude-sonnet-4-6';

// Validated beta history-taking model
export const CLAUDE_BETA_MODEL = 'claude-sonnet-4-6';

export default anthropic;
