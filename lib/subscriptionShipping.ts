/**
 * 定期購入の発送日 / 請求日 計算ロジック
 *
 * オーナー仕様:
 *  - 当月の10日までに決済 → その月の15日に発送（1回目）
 *  - 11日以降の決済 → 翌月の15日に発送（1回目）
 *  - 2回目以降は毎月15日発送（インターバルが2か月以上ならそのスパン）
 *  - Stripe 請求は「お届け月の10日」に走る
 *  - 週次/隔週は 15日ルール対象外
 *
 * 重要 — タイムゾーンの取り扱い:
 *  - 業務は日本（JST = UTC+9）。
 *  - サーバー（Vercel）は UTC、ブラウザは Asia/Tokyo の想定。
 *  - 「○月○日」を判定するときは必ず JST で行う（UTCで判定すると深夜にズレる）。
 *  - Stripe へ渡す anchor は「JST 10日 05:00」を表す UTC 秒。
 *    Stripe推奨: 0:00 ぴったりを避けて 04:00〜05:00 を使う。請求書は支払の約2h前に作成されるため、
 *    日本の "朝5時" タイミングが安全帯になる。
 *
 * すべての関数は呼び出し側のタイムゾーン設定に依存しない（純粋関数）。
 */

export type SubscriptionIntervalKey =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
/** Stripe請求の安全時間 (JST 05:00) — 0:00を避けることでTZズレを回避 */
const SAFE_HOUR_JST = 5;

/** インターバル → 月数（週次系は 0 を返す） */
function intervalMonths(interval: string | null | undefined): number {
  switch (interval) {
    case 'monthly':
      return 1;
    case 'bimonthly':
      return 2;
    case 'quarterly':
      return 3;
    case 'semiannual':
      return 6;
    case 'annual':
      return 12;
    default:
      return 0;
  }
}

/** インターバル → 月数 を外部にも公開 */
export function intervalToMonths(interval: string | null | undefined): number {
  return intervalMonths(interval);
}

/** Date を JST の {year, month, day, hour, minute} に分解 */
function toJSTParts(date: Date): {
  year: number;
  month: number; // 0-11
  day: number;
  hour: number;
  minute: number;
} {
  const shifted = new Date(date.getTime() + JST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

/**
 * JST の年/月/日/時を表す瞬間を、UTC ベースの Date として返す。
 * 例: jstMomentToUtcDate(2026, 5, 10, 5) → JST 2026/6/10 05:00 = UTC 2026/6/9 20:00 (month=5は0-indexedで6月)
 *
 * Date.UTC は month +1 や day overflow を自動補正してくれるので、月末・年末の越境も安全。
 */
function jstMomentToUtcDate(year: number, month: number, day: number, hour: number = 0): Date {
  const utcMs = Date.UTC(year, month, day, hour, 0, 0) - JST_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * JST の年/月/日（00:00時点）を表す瞬間を Date として返す。表示・比較用。
 */
function jstDateOnlyToUtcDate(year: number, month: number, day: number): Date {
  return jstMomentToUtcDate(year, month, day, 0);
}

/**
 * 「N日までは当月の15日、11日以降は翌月の15日」のルールで「JST 15日 00:00」を Date で返す。
 * 主に「決済日 → 初回お届け日」の計算に使う。
 *
 * override が指定されており未来日なら、override を優先する（全員その日が初回発送）。
 * override が過去日なら無視（15日ルールにフォールバック）。
 */
export function computeFirstShippingDate(checkoutDate: Date, override?: string | null): Date {
  // override 優先（未来日のみ）
  if (override) {
    const overrideDate = parseJstDateString(override);
    if (overrideDate && overrideDate >= jstStartOfDay(checkoutDate)) {
      return overrideDate;
    }
  }
  // 15日ルール
  const { year, month, day } = toJSTParts(checkoutDate);
  if (day <= 10) {
    return jstDateOnlyToUtcDate(year, month, 15);
  }
  return jstDateOnlyToUtcDate(year, month + 1, 15);
}

/** "YYYY-MM-DD" を JST の 00:00 とみなして Date を返す */
function parseJstDateString(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!y || isNaN(mo) || !d) return null;
  return jstDateOnlyToUtcDate(y, mo, d);
}

/**
 * 定期購入の「次回お届け予定日」を返す。
 *  - 初回未発送（today < firstShipping）なら初回日
 *  - 既に初回発送済みなら next_billing_at の月の15日（未来日になるまで interval 月ずつ進める）
 *  - 週次/隔週は 15日ルール対象外 → next_billing_at をそのまま返す
 *  - 不明な場合は null
 */
export function computeNextShippingDate(sub: {
  created_at: string | null | undefined;
  next_billing_at: string | null | undefined;
  interval: string | null | undefined;
  firstShippingOverride?: string | null;
}): Date | null {
  const today = new Date();
  const todayJstStart = jstStartOfDay(today);

  // 週次/隔週は 15日ルール対象外
  if (sub.interval === 'weekly' || sub.interval === 'biweekly') {
    return sub.next_billing_at ? new Date(sub.next_billing_at) : null;
  }

  // 1) 初回未発送なら初回日（override 対応）
  if (sub.created_at) {
    const createdAt = new Date(sub.created_at);
    if (!isNaN(createdAt.getTime())) {
      const firstShipping = computeFirstShippingDate(createdAt, sub.firstShippingOverride ?? null);
      if (firstShipping >= todayJstStart) {
        return firstShipping;
      }
    }
  }

  // 2) 2回目以降: next_billing_at の月（JST）の15日。未来になるまで interval 月ずつ進める
  if (sub.next_billing_at) {
    const billing = new Date(sub.next_billing_at);
    if (!isNaN(billing.getTime())) {
      const billingJst = toJSTParts(billing);
      let candidate = jstDateOnlyToUtcDate(billingJst.year, billingJst.month, 15);
      const months = intervalMonths(sub.interval) || 1;
      // 月数を加算。Date.UTC が month overflow を補正してくれる
      let yr = billingJst.year;
      let mo = billingJst.month;
      while (candidate < todayJstStart) {
        mo += months;
        candidate = jstDateOnlyToUtcDate(yr, mo, 15);
      }
      return candidate;
    }
  }

  return null;
}

/** その日(JST)の 00:00 を表す Date */
function jstStartOfDay(d: Date): Date {
  const p = toJSTParts(d);
  return jstDateOnlyToUtcDate(p.year, p.month, p.day);
}

/** 「2026年6月15日」形式でフォーマット（JST基準） */
export function formatJapaneseDate(date: Date | null): string {
  if (!date) return '-';
  const { year, month, day } = toJSTParts(date);
  return `${year}年${month + 1}月${day}日`;
}

/**
 * Stripe Subscription の billing_cycle_anchor (Unix秒) を返す。
 *
 * 仕様:
 *  - 「初回お届け月の "interval月後" の 10日 05:00 JST」を anchor にする
 *  - Stripe推奨に従い 0:00ジャストではなく 05:00 JST を使う（タイムゾーン境界の事故防止）
 *  - 月跨ぎ・年跨ぎは Date.UTC の自動補正に任せる
 *
 * 例（monthly）:
 *  - 5/8 契約 → 初回発送 5/15 → anchor = 2026/6/10 05:00 JST = Unix秒
 *  - 5/20契約 → 初回発送 6/15 → anchor = 2026/7/10 05:00 JST = Unix秒
 *
 * 週次/隔週は対象外（null を返す → 呼び出し側で anchor を指定しない）
 */
/**
 * スキップ・変更・解約の締切日（JST）を返す。
 *
 * 仕様:
 *  - 次回発送予定月の "9日 23:59:59 JST" が締切（決済が10日に走るため）
 *  - 例: 次回発送 = 2026/7/15 → 締切 = 2026/7/9 23:59:59 JST
 */
export function getChangeDeadline(nextShipping: Date): Date {
  const p = toJSTParts(nextShipping);
  // 9日の 23:59:59 JST = 10日 00:00 JST から1秒前
  return new Date(jstMomentToUtcDate(p.year, p.month, 10, 0).getTime() - 1000);
}

/**
 * 今この瞬間が、次回発送に対するスキップ/変更/解約の締切内かどうか判定。
 *
 * @param now - 判定基準日時（通常は new Date()）
 * @param nextShipping - 次回発送予定日
 * @returns true: まだ操作可能 / false: 締切超過
 */
export function isWithinChangeDeadline(now: Date, nextShipping: Date | null): boolean {
  if (!nextShipping) return false;
  const deadline = getChangeDeadline(nextShipping);
  return now.getTime() <= deadline.getTime();
}

export function computeBillingCycleAnchor(
  checkoutDate: Date,
  interval: string | null | undefined,
  firstShippingOverride?: string | null
): number | null {
  if (!interval) return null;
  if (interval === 'weekly' || interval === 'biweekly') return null;
  const months = intervalMonths(interval);
  if (months <= 0) return null;

  const firstShipping = computeFirstShippingDate(checkoutDate, firstShippingOverride ?? null);
  const fs = toJSTParts(firstShipping);
  const anchor = jstMomentToUtcDate(fs.year, fs.month + months, 10, SAFE_HOUR_JST);
  return Math.floor(anchor.getTime() / 1000);
}
