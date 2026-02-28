export interface UsageEvent {
  eventType: 'generate' | 'chat' | 'cache_hit';
  ip: string;
  hasEmail: boolean;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  destinations?: string;
  duration?: string;
  budgetLevel?: string;
  cacheHit?: boolean;
  queryHash?: string;
}

export async function logUsage(db: any, event: UsageEvent): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO usage_analytics (event_type, ip, has_email, input_tokens, output_tokens, model, destinations, duration, budget_level, cache_hit, query_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      event.eventType,
      event.ip,
      event.hasEmail ? 1 : 0,
      event.inputTokens ?? 0,
      event.outputTokens ?? 0,
      event.model ?? '',
      event.destinations ?? '',
      event.duration ?? '',
      event.budgetLevel ?? '',
      event.cacheHit ? 1 : 0,
      event.queryHash ?? '',
    ).run();
  } catch {
    // Silent — tracking must never break the planner
  }
}
