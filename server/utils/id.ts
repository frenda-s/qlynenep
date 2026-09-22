export function genQrCode(): string {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  return `STUDENT-${rand}`
}

export function genStudentCode(seq: number): string {
  return `HS${String(seq).padStart(4, '0')}`
}

export function genIdempotencyKey(): string {
  return crypto.randomUUID()
}

export function isValidUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}
