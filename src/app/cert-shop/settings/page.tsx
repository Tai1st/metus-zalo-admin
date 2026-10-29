"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button, Card, Field, inputCls, Notice, PageHeader } from "@/components/ui";

type UsdtNetworkConfig = {
  key: string;
  label: string;
  binanceNetwork: string;
  address: string;
  feeMicro: number;
  enabled: boolean;
};

type BinanceNetworkInfo = {
  network: string;
  name: string;
  depositEnable: boolean;
  depositDesc?: string;
};

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
  hasWeb2mToken: boolean;
  hasBinanceKey: boolean;
  hasBinanceSecret: boolean;
  usdtNetworks: UsdtNetworkConfig[];
  depositMinMicro: number;
  depositMaxMicro: number;
  usdtVndRate: number;
};

type NetworkForm = {
  key: string;
  label: string;
  binanceNetwork: string;
  address: string;
  feeUsdt: string;
  enabled: boolean;
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
  web2mToken: string;
  binanceApiKey: string;
  binanceApiSecret: string;
  usdtNetworks: NetworkForm[];
  depositMinUsdt: string;
  depositMaxUsdt: string;
  usdtVndRate: string;
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
    web2mToken: "",
    binanceApiKey: "",
    binanceApiSecret: "",
    usdtNetworks: s.usdtNetworks.map((n) => ({
      key: n.key,
      label: n.label,
      binanceNetwork: n.binanceNetwork,
      address: n.address,
      feeUsdt: String(n.feeMicro / 1e6),
      enabled: n.enabled,
    })),
    depositMinUsdt: String(s.depositMinMicro / 1e6),
    depositMaxUsdt: String(s.depositMaxMicro / 1e6),
    usdtVndRate: String(s.usdtVndRate),
  };
}

export default function CertShopSettingsPage() {
  const { data, loading, error, reload } = useApi<Settings>("/api/cert-shop/settings");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [binanceNetworks, setBinanceNetworks] = useState<BinanceNetworkInfo[] | null>(null);
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [networksError, setNetworksError] = useState("");

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  async function loadBinanceNetworks() {
    setLoadingNetworks(true);
    setNetworksError("");
    try {
      const res = await fetch("/api/cert-shop/binance/usdt-networks");
      const json = (await res.json()) as { ok: boolean; data?: BinanceNetworkInfo[]; error?: string };
      if (!json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setBinanceNetworks(json.data ?? []);
    } catch (e) {
      setNetworksError((e as Error).message);
    } finally {
      setLoadingNetworks(false);
    }
  }

  function updateNetwork(key: string, patch: Partial<NetworkForm>) {
    if (!form) return;
    setForm({
      ...form,
      usdtNetworks: form.usdtNetworks.map((n) => (n.key === key ? { ...n, ...patch } : n)),
    });
  }

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
          ...(form.web2mToken.trim() && { web2mToken: form.web2mToken.trim() }),
          ...(form.binanceApiKey.trim() && { binanceApiKey: form.binanceApiKey.trim() }),
          ...(form.binanceApiSecret.trim() && { binanceApiSecret: form.binanceApiSecret.trim() }),
          usdtNetworks: form.usdtNetworks.map((n) => ({
            key: n.key,
            label: n.label,
            binanceNetwork: n.binanceNetwork.trim(),
            address: n.address.trim(),
            feeMicro: Math.round(Number(n.feeUsdt) * 1e6),
            enabled: n.enabled,
          })),
          depositMinMicro: Math.round(Number(form.depositMinUsdt) * 1e6),
          depositMaxMicro: Math.round(Number(form.depositMaxUsdt) * 1e6),
          usdtVndRate: Number(form.usdtVndRate),
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

  async function registerWebhook() {
    setRegistering(true);
    setRegisterError("");
    setRegisterMsg("");
    try {
      const res = await fetch("/api/cert-shop/webhook/register", { method: "POST" });
      const json = (await res.json()) as { ok: boolean; data?: { url: string }; error?: string };
      if (!json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setRegisterMsg(`Đã đăng ký: ${json.data?.url}`);
      reload();
    } catch (e) {
      setRegisterError((e as Error).message);
    } finally {
      setRegistering(false);
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
            <div>
              <Button type="button" variant="ghost" disabled={registering} onClick={registerWebhook}>
                {registering ? "Đang đăng ký…" : "Đăng ký webhook tự động"}
              </Button>
              <p className="mt-1.5 text-xs text-muted">
                Gọi thẳng chungchi.store để đăng ký URL webhook bằng địa chỉ shop ở dưới và tự lưu secret họ trả về — secret
                chỉ hiện đúng một lần nên không nhập tay được, phải dùng nút này.
              </p>
              {registerMsg && <p className="mt-1.5 text-xs text-success">{registerMsg}</p>}
              {registerError && <p className="mt-1.5 text-xs text-danger">{registerError}</p>}
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Tự động xác nhận thanh toán (web2m.com)</h2>
            <p className="text-xs text-muted">
              Hệ thống kiểm tra lịch sử giao dịch ACB mỗi 30 giây, khớp đúng mã đơn (nội dung chuyển khoản) và số tiền để tự
              chuyển đơn sang &quot;Đã thanh toán&quot; — không cần bấm thủ công.
            </p>
            <Field label={data?.hasWeb2mToken ? "Token web2m.com (đã đặt, để trống để giữ nguyên)" : "Token web2m.com (chưa đặt — chưa tự động xác nhận)"}>
              <input className={inputCls} type="password" autoComplete="off" placeholder="Nhập để thay đổi" value={form.web2mToken} onChange={(e) => setForm({ ...form, web2mToken: e.target.value })} />
            </Field>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Nạp USDT qua Binance (nhiều mạng)</h2>
            <p className="text-xs text-muted">
              API key chỉ cần quyền đọc (capital/deposit) — không bật trade/withdraw/transfer. Chỉ bật một mạng sau khi đã
              xác minh đúng <b>mã mạng Binance</b> và <b>địa chỉ nhận</b> khớp với màn hình nạp Binance thật — không đoán mã
              từ tên hiển thị. Dùng nút bên dưới để xem đúng mã Binance đang hỗ trợ trên tài khoản.
            </p>
            <Field label={data?.hasBinanceKey ? "API Key (đã đặt, để trống để giữ nguyên)" : "API Key (chưa đặt)"}>
              <input className={inputCls} type="password" autoComplete="off" placeholder="Nhập để thay đổi" value={form.binanceApiKey} onChange={(e) => setForm({ ...form, binanceApiKey: e.target.value })} />
            </Field>
            <Field label={data?.hasBinanceSecret ? "API Secret (đã đặt, để trống để giữ nguyên)" : "API Secret (chưa đặt)"}>
              <input className={inputCls} type="password" autoComplete="off" placeholder="Nhập để thay đổi" value={form.binanceApiSecret} onChange={(e) => setForm({ ...form, binanceApiSecret: e.target.value })} />
            </Field>

            <div>
              <Button type="button" variant="ghost" disabled={loadingNetworks} onClick={loadBinanceNetworks}>
                {loadingNetworks ? "Đang tải…" : "Xem mạng Binance thực sự hỗ trợ"}
              </Button>
              {networksError && <p className="mt-1.5 text-xs text-danger">{networksError}</p>}
              {binanceNetworks && (
                <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-background text-muted">
                      <tr>
                        <th className="px-2.5 py-1.5 text-left">Mã mạng (network)</th>
                        <th className="px-2.5 py-1.5 text-left">Tên</th>
                        <th className="px-2.5 py-1.5 text-left">Nạp được</th>
                      </tr>
                    </thead>
                    <tbody>
                      {binanceNetworks.map((n) => (
                        <tr key={n.network} className="border-t border-border">
                          <td className="px-2.5 py-1.5 font-mono">{n.network}</td>
                          <td className="px-2.5 py-1.5">{n.name}</td>
                          <td className="px-2.5 py-1.5">{n.depositEnable ? "Có" : "Không"}</td>
                        </tr>
                      ))}
                      {!binanceNetworks.length && (
                        <tr>
                          <td colSpan={3} className="px-2.5 py-2 text-center text-muted">Không có dữ liệu</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {form.usdtNetworks.map((n) => (
                <div key={n.key} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">{n.label}</span>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={n.enabled} onChange={(e) => updateNetwork(n.key, { enabled: e.target.checked })} />
                      Bật mạng này
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
                    <Field label="Mã mạng Binance (vd BSC, TRX)">
                      <input className={`${inputCls} font-mono`} value={n.binanceNetwork} onChange={(e) => updateNetwork(n.key, { binanceNetwork: e.target.value })} />
                    </Field>
                    <Field label="Địa chỉ nhận (đã xác minh thủ công)">
                      <input className={`${inputCls} font-mono`} value={n.address} onChange={(e) => updateNetwork(n.key, { address: e.target.value })} />
                    </Field>
                    <Field label="Phí dịch vụ (USDT)">
                      <input className={inputCls} inputMode="decimal" value={n.feeUsdt} onChange={(e) => updateNetwork(n.key, { feeUsdt: e.target.value })} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Tối thiểu (USDT)">
                <input className={inputCls} inputMode="decimal" value={form.depositMinUsdt} onChange={(e) => setForm({ ...form, depositMinUsdt: e.target.value })} />
              </Field>
              <Field label="Tối đa (USDT)">
                <input className={inputCls} inputMode="decimal" value={form.depositMaxUsdt} onChange={(e) => setForm({ ...form, depositMaxUsdt: e.target.value })} />
              </Field>
              <Field label="Tỷ giá 1 USDT = ? VND">
                <input className={inputCls} inputMode="numeric" value={form.usdtVndRate} onChange={(e) => setForm({ ...form, usdtVndRate: e.target.value })} />
              </Field>
            </div>
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
