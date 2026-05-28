/**
 * 定期購入の発送日計算ロジック
 *
 * オーナー仕様:
 *  - 当月の10日までに決済 → その月の15日に発送（1回目）
 *  - 11日以降の決済 → 翌月の15日に発送（1回目）
 *  - 2回目以降は毎月15日発送（インターバルが2か月以上ならそのスパン）
 *  - 週次/隔週は 15日ルール対象外
 */

export type SubscriptionIntervalKey =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual';

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

/**
 * 「N日までは当月の15日、11日以降は翌月の15日」のルールで発送日を返す。
 * 主に「決済日 → 初回お届け日」の計算に使う。
 */
export function computeFirstShippingDate(checkoutDate: Date): Date {
  const day = checkoutDate.getDate();
  const y = checkoutDate.getFullYear();
  const m = checkoutDate.getMonth();
  if (day <= 10) {
    return new Date(y, m, 15);
  }
  return new Date(y, m + 1, 15);
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
}): Date | null {
  const today = new Date();

  // 週次/隔週は 15日ルール対象外
  if (sub.interval === 'weekly' || sub.interval === 'biweekly') {
    return sub.next_billing_at ? new Date(sub.next_billing_at) : null;
  }

  // 1) 初回未発送なら初回日
  if (sub.created_at) {
    const createdAt = new Date(sub.created_at);
    if (!isNaN(createdAt.getTime())) {
      const firstShipping = computeFirstShippingDate(createdAt);
      if (firstShipping >= startOfDay(today)) {
        return firstShipping;
      }
    }
  }

  // 2) 2回目以降: next_billing_at の月の15日（未来になるまで interval 月ずつ進める）
  if (sub.next_billing_at) {
    const billing = new Date(sub.next_billing_at);
    if (!isNaN(billing.getTime())) {
      let candidate = new Date(billing.getFullYear(), billing.getMonth(), 15);
      const months = intervalMonths(sub.interval) || 1;
      while (candidate < startOfDay(today)) {
        candidate = new Date(candidate.getFullYear(), candidate.getMonth() + months, 15);
      }
      return candidate;
    }
  }

  return null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 「2026年6月15日」形式でフォーマット */
export function formatJapaneseDate(date: Date | null): string {
  if (!date) return '-';
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
