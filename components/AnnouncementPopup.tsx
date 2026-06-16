'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// このセッション中だけ非表示にするためのキー（sessionStorage）
const SESSION_KEY = 'ikevege_announcement_popup_dismissed';
// 「一定期間表示しない」の期限（ミリ秒）を記録するキー（localStorage）
const SNOOZE_UNTIL_KEY = 'ikevege_announcement_popup_snooze_until';
// 非表示にする日数（ここを変えれば期間を調整できる）
const SNOOZE_DAYS = 30;

/**
 * トップページの告知ポップアップ。
 * 「予約販売」と「定期便」を案内し、それぞれの一覧へ誘導する。
 *
 * - 「30日間表示しない」にチェックして閉じた人 → SNOOZE_DAYS 日間は表示しない（localStorage）
 *   期間が過ぎれば再び表示される。
 * - チェックせずに閉じた人 → このセッション中だけ非表示（sessionStorage）
 * - 内容（見出し・本文）は下記の定数を編集すれば差し替え可能。
 */
export default function AnnouncementPopup() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // スヌーズ期間内 or このセッションで既に閉じていれば表示しない
    let dismissed = false;
    try {
      const snoozeUntil = Number(localStorage.getItem(SNOOZE_UNTIL_KEY) || 0);
      dismissed =
        (snoozeUntil > Date.now()) ||
        sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // storage が使えない環境では毎回表示
    }
    if (dismissed) return;

    // 少し遅らせて表示（ファーストビューを邪魔しない）
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      // このセッション中は非表示
      sessionStorage.setItem(SESSION_KEY, '1');
      // 「30日間表示しない」が選択されていれば期限を記録
      if (dontShowAgain) {
        const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(SNOOZE_UNTIL_KEY, String(until));
      }
    } catch {
      // 失敗しても致命的ではない
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="お知らせ"
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />

      {/* 本体 */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={close}
          aria-label="閉じる"
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-gray-500 hover:text-gray-900 hover:bg-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pt-10 pb-8 text-center">
          <p className="text-[11px] md:text-xs text-amber-700 tracking-[0.3em] uppercase mb-3 font-medium">
            Information
          </p>
          <h2 className="text-lg md:text-xl font-serif font-semibold text-primary leading-relaxed mb-3">
            予約販売＆定期便のご案内
          </h2>
          <div className="w-10 h-px bg-amber-600 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 leading-loose mb-7">
            佐渡ヶ島の自然栽培米を、いまだけの予約販売と、
            <br className="hidden md:block" />
            いつでも10%OFFの定期便でお届けします。
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/collections/rice"
              onClick={close}
              className="block w-full py-3 rounded-full bg-primary text-white text-sm font-medium tracking-wider hover:opacity-90 transition-opacity"
            >
              予約販売を見る
            </Link>
            <Link
              href="/collections/rice/yearly?view=lp"
              onClick={close}
              className="block w-full py-3 rounded-full border border-amber-600 text-amber-700 text-sm font-medium tracking-wider hover:bg-amber-50 transition-colors"
            >
              定期便（10%OFF）を見る
            </Link>
          </div>

          {/* 一定期間表示しない */}
          <label className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            {SNOOZE_DAYS}日間表示しない
          </label>
        </div>
      </div>
    </div>
  );
}
