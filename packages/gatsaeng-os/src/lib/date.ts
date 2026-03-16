/**
 * Get today's date in YYYY-MM-DD format, always in Asia/Seoul timezone.
 * Prevents UTC-based date shifts during 00:00-09:00 KST.
 */
export function getToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}
