import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

export const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY,
});

// Tier 1 — Fast & cheap: structured lookups, document templates, single-word classifications
export const CLAUDE_HAIKU_MODEL = 'claude-haiku-4-5-20251001';

// Tier 2 — Complex reasoning: clinical education, management plans, medical history AI
export const CLAUDE_SONNET_MODEL = 'claude-sonnet-5';

// Legacy aliases so existing services keep compiling
export const CLAUDE_MODEL = CLAUDE_SONNET_MODEL;
export const CLAUDE_HISTORY_MODEL = CLAUDE_SONNET_MODEL;
export const CLAUDE_BETA_MODEL = CLAUDE_SONNET_MODEL;

// Input cost per token (dollars)
const INPUT_COST: Record<string, number> = {
  [CLAUDE_HAIKU_MODEL]: 1e-6,   // $1/MTok
  [CLAUDE_SONNET_MODEL]: 3e-6,  // $3/MTok
};

// Output cost per token (dollars)
const OUTPUT_COST: Record<string, number> = {
  [CLAUDE_HAIKU_MODEL]: 5e-6,   // $5/MTok
  [CLAUDE_SONNET_MODEL]: 15e-6, // $15/MTok
};

// Cache fields are `number | null` in SDK >=0.30 Usage, so response.usage can
// be passed straight through.
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export function logUsage(service: string, model: string, usage: TokenUsage): void {
  const inCost = (INPUT_COST[model] ?? 3e-6) * usage.input_tokens;
  const outCost = (OUTPUT_COST[model] ?? 15e-6) * usage.output_tokens;
  const cacheReadCost = (INPUT_COST[model] ?? 3e-6) * 0.1 * (usage.cache_read_input_tokens ?? 0);
  const total = (inCost + outCost + cacheReadCost).toFixed(6);

  const cache = usage.cache_read_input_tokens || usage.cache_creation_input_tokens
    ? ` cache_read=${usage.cache_read_input_tokens ?? 0} cache_write=${usage.cache_creation_input_tokens ?? 0}`
    : '';

  console.log(
    `[TOKEN_USAGE] ${service} | model=${model} | in=${usage.input_tokens} out=${usage.output_tokens}${cache} | cost=$${total}`
  );
}

export default anthropic;
