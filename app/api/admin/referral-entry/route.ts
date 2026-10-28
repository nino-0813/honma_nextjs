import { createClient } from "@supabase/supabase-js";
import { loadReferralMonthly } from "@/lib/loadReferralMonthly";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const url =
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key)
      return Response.json({ error: "保存先が未設定です" }, { status: 503 });
    const token = request.headers.get("authorization");
    if (!token?.startsWith("Bearer "))
      return Response.json({ error: "ログインしてください" }, { status: 401 });
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: user, error: authError } = await db.auth.getUser(
      token.slice(7),
    );
    if (authError || !user.user)
      return Response.json({ error: "認証に失敗しました" }, { status: 401 });
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("is_admin")
      .eq("id", user.user.id)
      .maybeSingle();
    if (profileError || !profile?.is_admin)
      return Response.json({ error: "管理者権限が必要です" }, { status: 403 });
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json({ error: "入力がありません" }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 8000) {
        await reader.cancel();
        return Response.json({ error: "入力サイズ超過" }, { status: 400 });
      }
      chunks.push(value);
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    let input: any;
    try {
      input = JSON.parse(raw);
    } catch {
      return Response.json({ error: "入力形式が不正です" }, { status: 400 });
    }
    const validDate =
      typeof input?.date === "string" &&
      /^20\d{2}-\d{2}-\d{2}$/.test(input.date) &&
      Number.isFinite(Date.parse(input.date)) &&
      new Date(input.date).toISOString().slice(0, 10) === input.date;
    if (
      !validDate ||
      !["direct", "refund"].includes(input.kind) ||
      typeof input.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        input.id,
      ) ||
      typeof input.amount !== "number" ||
      !Number.isSafeInteger(input.amount) ||
      input.amount < (input.kind === "refund" ? 1 : 0) ||
      input.amount > 1e9 ||
      typeof input.reference !== "string" ||
      !input.reference.trim() ||
      input.reference.length > 200 ||
      typeof input.reason !== "string" ||
      !input.reason.trim() ||
      input.reason.length > 200
    ) {
      return Response.json(
        {
          error: "日付・整数金額・元の伝票番号／返金ID・理由を確認してください",
        },
        { status: 400 },
      );
    }
    let customer: string | null = null,
      saleKey: string | null = null,
      basis: number | null = null;
    if (input.kind === "direct") {
      if (typeof input.customerId !== "string")
        return Response.json(
          { error: "顧客を選択してください" },
          { status: 400 },
        );
      const { data: found, error } = await db
        .from("customers")
        .select("id")
        .eq("id", input.customerId)
        .maybeSingle();
      if (error || !found)
        return Response.json(
          { error: "既存の顧客IDを選択してください" },
          { status: 400 },
        );
      customer = found.id;
    } else {
      const data = await loadReferralMonthly(db);
      const sale = data.sales.find((s) => s.key === input.saleKey);
      if (!sale)
        return Response.json(
          {
            error:
              "返金元の確定売上がありません。顧客・商品代金を照合してください",
          },
          { status: 400 },
        );
      if (input.date < sale.date)
        return Response.json(
          { error: "返金日が注文日より前です" },
          { status: 400 },
        );
      saleKey = sale.key;
      basis = sale.amount;
    }
    const { error } = await db.rpc("record_referral_sale_or_refund", {
      p_id: input.id,
      p_kind: input.kind,
      p_customer: customer,
      p_date: input.date,
      p_amount: input.amount,
      p_reference: input.reference.trim(),
      p_reason: input.reason.trim(),
      p_actor: user.user.id,
      p_sale_key: saleKey,
      p_sale_basis: basis,
    });
    if (error) {
      console.error("[ReferralEntry] save rejected", { code: error.code });
      return Response.json(
        {
          error:
            "保存できません。同じ伝票／返金IDの重複や、商品返金累計をご確認ください。",
        },
        { status: 409 },
      );
    }
    return Response.json({
      saved: true,
      refundExecuted: false,
      inventoryChanged: false,
    });
  } catch {
    console.error("[ReferralEntry] unavailable");
    return Response.json(
      { error: "保存できません。接続と紹介集計用SQLをご確認ください" },
      { status: 503 },
    );
  }
}
