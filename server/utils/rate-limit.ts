/**
 * Rate limiter bộ nhớ (best-effort).
 * ponytail: Map trong RAM chỉ chặn brute-force trong một isolate; trên Cloudflare
 * Workers mỗi isolate có bộ đếm riêng nên giới hạn KHÔNG tuyệt đối giữa các
 * request. Nâng cấp khi cần chặn cứng: Cloudflare WAF rate-limiting rule, hoặc
 * counter trong DB/Turso (Durable Object cho độ chính xác tuyệt đối).
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const cur = buckets.get(key)

  if (!cur || now > cur.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (cur.count >= limit) return false
  cur.count += 1
  return true
}

/** Dọn bucket quá hạn để Map không phình vô hạn. */
export function pruneRateLimits(): void {
  const now = Date.now()
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k)
  }
}
