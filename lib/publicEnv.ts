/**
 * Next.js へ移行中の互換レイヤー:
 * NEXT_PUBLIC_* を優先し、未設定時のみ VITE_* を参照する。
 */
export function getPublicEnv(key: string): string {
  const nextKey = `NEXT_PUBLIC_${key}`;
  const viteKey = `VITE_${key}`;
  const env =
    typeof process !== 'undefined'
      ? (process.env as Record<string, string | undefined>)
      : ({} as Record<string, string | undefined>);
  return env[nextKey] ?? env[viteKey] ?? '';
}
