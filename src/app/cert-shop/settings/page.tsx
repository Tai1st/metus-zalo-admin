"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button, Card, Field, inputCls, Notice, PageHeader } from "@/components/ui";

type Settings = {
  siteUrl: string;
  bankId: string;
  bankAccountNo: string;
  bankAccountName: string;
  priceMarkup: number;
  priceRoundTo: number;
  planFeatures: string[];
  chungchiBaseUrl: string;
  hasApiKey: boolean;
  apiKeyHint: string;
  hasWebhookSecret: boolean;
};

type Form = {
  siteUrl: string;
  bankId: string;
  bankAccountNo: string;
  bankAccountName: string;
  priceMarkup: string;
  priceRoundTo: string;
  planFeatures: string;
  chungchiBaseUrl: string;
  chungchiApiKey: string;
  webhookSecret: string;
};

function toForm(s: Settings): Form {
  return {
    siteUrl: s.siteUrl,
    bankId: s.bankId,
    bankAccountNo: s.bankAccountNo,
    bankAccountName: s.bankAccountName,
    priceMarkup: String(s.priceMarkup),
    priceRoundTo: String(s.priceRoundTo),
    planFeatures: s.planFeatures.join("\n"),
    chungchiBaseUrl: s.chungchiBaseUrl,
    chungchiApiKey: "",
    webhookSecret: "",
  };
}

export default function CertShopSettingsPage() {
  const { data, loading, error, reload } = useApi<Settings>("/api/cert-shop/settings");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  async function save() {
    if (!form) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const res = await fetch("/api/cert-shop/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: form.siteUrl.trim(),
          bankId: form.bankId.trim(),
          bankAccountNo: form.bankAccountNo.trim(),
          bankAccountName: form.bankAccountName.trim(),
          priceMarkup: Number(form.priceMarkup),
          priceRoundTo: Number(form.priceRoundTo),
          planFeatures: form.planFeatures.split("\n"),
          chungchiBaseUrl: form.chungchiBaseUrl.trim(),
          ...(form.chungchiApiKey.trim() && { chungchiApiKey: form.chungchiApiKey.trim() }),
          ...(form.webhookSecret.trim() && { webhookSecret: form.webhookSecret.trim() }),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSaved(true);
      reload();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Cài đặt shop"
        subtitle="Thông tin thanh toán, giá bán và kết nối nhà cung cấp."
        action={
          <Link href="/cert-shop" className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3.5 text-sm font-medium hover:bg-background">
            ← Quản lý đơn
          </Link>
        }
      />

      {loading && <p className="text-sm text-muted">Đang tải…</p>}
      {error && <Notice>{error}</Notice>}

      {form && (
        <div className="max-w-2xl space-y-4">
          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Thanh toán chuyển khoản (VietQR)</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Mã ngân hàng (vd ACB, VCB, MB)">
                <input className={inputCls} value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })} />
              </Field>
              <Field label="Số tài khoản">
                <input className={inputCls} value={form.bankAccountNo} onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value })} />
              </Field>
              <Field label="Chủ tài khoản">
                <input className={inputCls} value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Giá bán</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Hệ số cộng giá (vd 1.3 = lãi 30%)">
                <input className={inputCls} inputMode="decimal" value={form.priceMarkup} onChange={(e) => setForm({ ...form, priceMarkup: e.target.value })} />
              </Field>
              <Field label="Làm tròn lên (đ)">
                <input className={inputCls} inputMode="numeric" value={form.priceRoundTo} onChange={(e) => setForm({ ...form, priceRoundTo: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Mô tả quyền lợi gói</h2>
            <Field label="Mỗi dòng một mục, hiện dưới thông tin hạn dùng/bảo hành (để trống = dùng mặc định)">
              <textarea
                className={`${inputCls} h-28 py-2`}
                value={form.planFeatures}
                onChange={(e) => setForm({ ...form, planFeatures: e.target.value })}
              />
            </Field>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Nhà cung cấp chungchi.store</h2>
            <Field label="Địa chỉ API">
              <input className={inputCls} value={form.chungchiBaseUrl} onChange={(e) => setForm({ ...form, chungchiBaseUrl: e.target.value })} />
            </Field>
            <Field label={data?.hasApiKey ? `API key (đã đặt, …${data.apiKeyHint.replace("…", "")}, để trống để giữ nguyên)` : "API key (chưa đặt)"}>
              <input className={inputCls} type="password" autoComplete="off" placeholder="Nhập để thay đổi" value={form.chungchiApiKey} onChange={(e) => setForm({ ...form, chungchiApiKey: e.target.value })} />
            </Field>
            <Field label={data?.hasWebhookSecret ? "Webhook secret (đã đặt, để trống để giữ nguyên)" : "Webhook secret (chưa đặt)"}>
              <input className={inputCls} type="password" autoComplete="off" placeholder="Nhập để thay đổi" value={form.webhookSecret} onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })} />
            </Field>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Địa chỉ website shop</h2>
            <Field label="URL công khai (HTTPS ở production)">
              <input className={inputCls} value={form.siteUrl} onChange={(e) => setForm({ ...form, siteUrl: e.target.value })} />
            </Field>
          </Card>

          {saveError && <Notice>{saveError}</Notice>}
          {saved && <Notice tone="success">Đã lưu cài đặt</Notice>}
          <Button onClick={save} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      )}
    </div>
  );
}
