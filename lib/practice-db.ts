export function validPracticeToken(token: string | null): boolean {
  return !!token && !!process.env.PRACTICE_TOKEN && token === process.env.PRACTICE_TOKEN;
}
