/**
 * Central model policy + usage telemetry.
 *
 * One place decides which Claude model each class of call uses, so cost/quality
 * tiering is a config change, not a refactor:
 *  - REASONING: the clinical brain — differentials, rounds, presentations,
 *    the confidence engine. Accuracy first (within the <10c/prompt ceiling).
 *  - FAST: high-frequency, lighter calls — assist turn-taking, formatting.
 *    ~1/3 the cost; promoted per-call only when the eval harness proves the
 *    quality holds.
 *
 * Every call made through `createMessage()` is tallied in-memory so the eval
 * harness can report MEASURED cost per clerking instead of guessing.
 */
import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from './beta-config.js';

export const MODELS = {
  reasoning: process.env.MEDAI_REASONING_MODEL || 'claude-sonnet-5',
  fast: process.env.MEDAI_FAST_MODEL || 'claude-haiku-4-5-20251001',
} as const;

// USD per million tokens — used only for the telemetry report, not billing.
const PRICES: Record<string, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  'claude-sonnet-5': { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-sonnet-4-6': { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

export interface UsageStats {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estCostUSD: number;
  byModel: Record<string, { calls: number; estCostUSD: number }>;
  maxSingleCallUSD: number;
}

const stats: UsageStats = {
  calls: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  estCostUSD: 0,
  byModel: {},
  maxSingleCallUSD: 0,
};

export function usageStats(): UsageStats {
  return { ...stats, byModel: { ...stats.byModel } };
}

export function resetUsageStats(): void {
  stats.calls = 0;
  stats.inputTokens = 0;
  stats.outputTokens = 0;
  stats.cacheReadTokens = 0;
  stats.cacheWriteTokens = 0;
  stats.estCostUSD = 0;
  stats.byModel = {};
  stats.maxSingleCallUSD = 0;
}

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });

type CreateParams = Anthropic.MessageCreateParamsNonStreaming;

/**
 * Drop-in replacement for `client.messages.create` that records usage + cost.
 * Services should route all Anthropic calls through this.
 */
export async function createMessage(params: CreateParams): Promise<Anthropic.Message> {
  const response = await client.messages.create(params);
  try {
    const u = response.usage as unknown as {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
    const price = PRICES[params.model] ?? PRICES['claude-sonnet-5'];
    const inTok = u.input_tokens ?? 0;
    const outTok = u.output_tokens ?? 0;
    const cacheRead = u.cache_read_input_tokens ?? 0;
    const cacheWrite = u.cache_creation_input_tokens ?? 0;
    const cost =
      (inTok * price.in + outTok * price.out + cacheRead * price.cacheRead + cacheWrite * price.cacheWrite) / 1_000_000;
    stats.calls += 1;
    stats.inputTokens += inTok;
    stats.outputTokens += outTok;
    stats.cacheReadTokens += cacheRead;
    stats.cacheWriteTokens += cacheWrite;
    stats.estCostUSD += cost;
    stats.maxSingleCallUSD = Math.max(stats.maxSingleCallUSD, cost);
    const m = (stats.byModel[params.model] ??= { calls: 0, estCostUSD: 0 });
    m.calls += 1;
    m.estCostUSD += cost;
  } catch {
    // Telemetry must never break a clinical call.
  }
  return response;
}
