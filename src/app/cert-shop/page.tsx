"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { apiSend, useApi } from "@/hooks/useApi";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  StatCard,
  Table,
  TableEmpty,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";

const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  provisioning: "Đang cấp chứng chỉ",
  completed: "Hoạt động",
  failed: "Thất bại",
  cancelled: "Đã hủy",
};
const STATUS_TONE: Record<string, "default" | "success" | "warning" | "danger"> = {
  awaiting_payment: "warning",
  paid: "warning",
  provisioning: "warning",
  completed: "success",
  failed: "danger",
  cancelled: "default",
};

type Stats = {
  counts: Record<string, number>;
  totalOrders: number;
  ordersToday: number;
  revenue: number;
  profit: number;
  providerWallet: { wallet: number; currency: string } | null;
};

type Order = {
  code: string;
  username: string;
  udid: string;
  planTitle: string;
  price: number;
  status: string;
  error?: string;
  createdAt: string;
};

type OrdersPage = { total: number; page: number; pageSize: number; items: Order[] };

type AppInfo =
  | { available: false; maxMb: number }
  | {
      available: true;
      maxMb: number;
      name: string;
      version: string;
      bundleId: string;
      minOs: string;
      size: number;
    };

const fmtSize = (n: number) => (n / 1048576).toFixed(1) + " MB";

type QuickApp = {
  slug: string;
  name: string;
  version?: string;
  bundleId?: string;
  minOs?: string;
  size?: number;
};

export default function CertShopPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [page, setPage] = useState(1);

  const stats = useApi<Stats>("/api/cert-shop/stats");
  const app = useApi<AppInfo>("/api/cert-shop/app");
  const quickApps = useApi<QuickApp[]>("/api/cert-shop/quick-apps");
  const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (status) qs.set("status", status);
  if (q) qs.set("q", q);
  const orders = useApi<OrdersPage>(`/api/cert-shop/orders?${qs}`);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(code: string, action: "confirm" | "cancel" | "sync") {
    setBusy(code);
    try {
      await apiSend(`/api/cert-shop/orders/${code}/${action}`, "POST");
      orders.reload();
      stats.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const items = orders.data?.items ?? [];
  const total = orders.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <PageHeader
        title="Cert Shop"
        subtitle="Đơn hàng, doanh thu và ứng dụng phát hành của appstore.metus.vn."
        action={
          <Link
            href="/cert-shop/settings"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3.5 text-sm font-medium hover:bg-background"
          >
            Cài đặt
          </Link>
        }
      />

      {stats.data && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Doanh thu" value={fmtVnd(stats.data.revenue)} hint="Đơn đã hoàn tất" />
          <StatCard label="Lãi ước tính" value={fmtVnd(stats.data.profit)} hint="Sau giá nhập" />
          <StatCard label="Đơn hôm nay" value={String(stats.data.ordersToday)} hint="Tính theo giờ server" />
          <StatCard
            label="Ví nhà cung cấp"
            value={
              stats.data.providerWallet
                ? `${stats.data.providerWallet.wallet.toLocaleString("vi-VN")} ${stats.data.providerWallet.currency}`
                : "—"
            }
            hint="chungchi.store"
          />
        </div>
      )}

      <div className="mb-5">
        <AppUpload app={app.data ?? null} onChanged={app.reload} />
      </div>

      <div className="mb-5">
        <QuickApps items={quickApps.data ?? []} loading={quickApps.loading} onChanged={quickApps.reload} />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatus("");
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1 text-xs ${
              !status ? "border-brand/40 bg-brand/10 text-brand" : "border-border bg-surface"
            }`}
          >
            Tất cả{stats.data ? ` (${stats.data.totalOrders})` : ""}
          </button>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <button
              key={k}
              onClick={() => {
                setStatus(k);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs ${
                status === k ? "border-brand/40 bg-brand/10 text-brand" : "border-border bg-surface"
              }`}
            >
              {v}
              {stats.data?.counts[k] ? ` (${stats.data.counts[k]})` : ""}
            </button>
          ))}
        </div>

        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(qInput.trim());
            setPage(1);
          }}
        >
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Tìm mã đơn, UDID, tên đăng nhập..."
            className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
          />
          <Button type="submit">Tìm</Button>
        </form>

        <Table minWidth={760}>
          <Thead>
            <Th>Mã đơn</Th>
            <Th>Khách hàng</Th>
            <Th>Gói</Th>
            <Th>Giá</Th>
            <Th>Trạng thái</Th>
            <Th className="text-right">Thao tác</Th>
          </Thead>
          <tbody>
            {items.map((o) => (
              <Tr key={o.code}>
                <Td className="font-mono text-xs">{o.code}</Td>
                <Td>
                  <div>{o.username}</div>
                  <div className="font-mono text-xs text-muted">{o.udid}</div>
                </Td>
                <Td>{o.planTitle}</Td>
                <Td>{fmtVnd(o.price)}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[o.status] ?? "default"}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                  {o.error && <div className="mt-1 text-xs text-danger">{o.error}</div>}
                </Td>
                <Td className="text-right">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {o.status === "awaiting_payment" && (
                      <>
                        <Button size="sm" disabled={busy === o.code} onClick={() => act(o.code, "confirm")}>
                          Đã nhận tiền
                        </Button>
                        <Button variant="danger" size="sm" disabled={busy === o.code} onClick={() => act(o.code, "cancel")}>
                          Hủy
                        </Button>
                      </>
                    )}
                    {o.status === "paid" && (
                      <Button size="sm" disabled={busy === o.code} onClick={() => act(o.code, "confirm")}>
                        Gửi lại đơn
                      </Button>
                    )}
                    {o.status === "provisioning" && (
                      <Button size="sm" disabled={busy === o.code} onClick={() => act(o.code, "sync")}>
                        Đồng bộ
                      </Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
            {items.length === 0 && (
              <TableEmpty colSpan={6}>
                {orders.loading ? "Đang tải…" : orders.error ? orders.error : "Không có đơn nào."}
              </TableEmpty>
            )}
          </tbody>
        </Table>

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            {page > 1 && (
              <button className="text-brand" onClick={() => setPage((p) => p - 1)}>
                ← Trước
              </button>
            )}
            <span className="text-muted">
              Trang {page}/{pages}
            </span>
            {page < pages && (
              <button className="text-brand" onClick={() => setPage((p) => p + 1)}>
                Sau →
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function AppUpload({ app, onChanged }: { app: AppInfo | null; onChanged: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const maxMb = app?.maxMb ?? 100;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setVersion(f.name.match(/(\d+\.\d+(?:\.\d+)?)/)?.[1] ?? "");
  }

  function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];
    setMsg("");
    setError("");
    if (!file) return setError("Chọn file .ipa để tải lên");
    if (!/\.ipa$/i.test(file.name)) return setError("Chỉ nhận file .ipa");
    if (file.size > maxMb * 1048576) return setError(`File lớn hơn ${maxMb}MB, vượt giới hạn`);

    const q = new URLSearchParams({
      version: String(form.get("version") || "").trim(),
      name: String(form.get("name") || "").trim(),
      bundleId: String(form.get("bundleId") || "").trim(),
      minOs: String(form.get("minOs") || "").trim(),
    });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/cert-shop/app/upload?${q}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let body: { ok?: boolean; error?: string; data?: { sha256?: string } } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* nginx/Cloudflare có thể trả trang chữ khi lỗi */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.ok) {
        setMsg(`Đã tải lên. SHA-256: ${body.data?.sha256?.slice(0, 16) ?? ""}…`);
        if (fileRef.current) fileRef.current.value = "";
        onChanged();
      } else {
        setError(body.error || (xhr.status === 413 ? "File vượt giới hạn server" : `Tải lên thất bại (${xhr.status})`));
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Mất kết nối khi đang tải lên, vui lòng thử lại");
    };
    setProgress(0);
    xhr.send(file);
  }

  async function remove() {
    if (!confirm("Gỡ app khỏi shop? Khách sẽ không tải được nữa và file trên server sẽ bị xóa.")) return;
    try {
      await apiSend("/api/cert-shop/app", "DELETE");
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Ứng dụng đã phát hành (IPA)</h2>
          <p className="mt-0.5 text-xs text-muted">Khách có đơn hàng hoàn tất sẽ tải được file này từ trang đơn hàng.</p>
        </div>
        {app?.available && (
          <button onClick={remove} className="shrink-0 text-xs text-danger hover:underline">
            Gỡ app
          </button>
        )}
      </div>

      {app?.available ? (
        <div className="rounded-lg bg-background p-3 text-xs leading-[1.8]">
          <b>{app.name}</b> · v{app.version} · {fmtSize(app.size)}
          <br />
          <span className="text-muted">{[app.bundleId, app.minOs && `iOS ${app.minOs}+`].filter(Boolean).join(" · ") || "Chưa có thông tin bundle"}</span>
        </div>
      ) : (
        <p className="rounded-lg bg-background p-3 text-xs text-muted">Chưa có app nào được phát hành.</p>
      )}

      <form onSubmit={upload} className="grid gap-2 sm:grid-cols-2">
        <input ref={fileRef} type="file" accept=".ipa" onChange={pick} className="sm:col-span-2 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm" />
        <input name="name" defaultValue={app?.available ? app.name : "Metus Browser"} placeholder="Tên hiển thị" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />
        <input name="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Phiên bản (vd 1.0.2)" required className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />
        <input name="bundleId" defaultValue={app?.available ? app.bundleId : "com.metus.browser"} placeholder="Bundle ID" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />
        <input name="minOs" defaultValue={app?.available ? app.minOs : ""} placeholder="iOS tối thiểu (vd 16.4)" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />

        {progress !== null && (
          <div className="sm:col-span-2">
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 text-xs text-muted">Đang tải lên… {progress}%</div>
          </div>
        )}
        {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
        {msg && <p className="text-xs text-success sm:col-span-2">{msg}</p>}
        <Button disabled={progress !== null} className="sm:col-span-2">
          {progress !== null ? "Đang tải lên…" : app?.available ? "Tải phiên bản mới (thay bản cũ)" : "Tải IPA lên"}
        </Button>
        <p className="text-xs text-muted sm:col-span-2">Tối đa {maxMb}MB. Bản cũ chỉ bị thay sau khi file mới hợp lệ.</p>
      </form>
    </Card>
  );
}

function QuickApps({
  items,
  loading,
  onChanged,
}: {
  items: QuickApp[];
  loading: boolean;
  onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    setMsg("");
    setError("");
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) return setError("Nhập slug (vd: esign)");
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) return setError("Slug chỉ gồm chữ thường, số và dấu gạch ngang");
    if (!file) return setError("Chọn file .ipa để tải lên");
    if (!/\.ipa$/i.test(file.name)) return setError("Chỉ nhận file .ipa");

    const q = new URLSearchParams({ name: name.trim() || cleanSlug });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/cert-shop/quick-apps/${encodeURIComponent(cleanSlug)}?${q}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let body: { ok?: boolean; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* nginx/Cloudflare có thể trả trang chữ khi lỗi */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.ok) {
        setMsg(`Đã thêm "${cleanSlug}"`);
        setSlug("");
        setName("");
        if (fileRef.current) fileRef.current.value = "";
        onChanged();
      } else {
        setError(body.error || (xhr.status === 413 ? "File vượt giới hạn server" : `Tải lên thất bại (${xhr.status})`));
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Mất kết nối khi đang tải lên, vui lòng thử lại");
    };
    setProgress(0);
    xhr.send(file);
  }

  async function remove(a: QuickApp) {
    if (!confirm(`Gỡ "${a.name}" (${a.slug}) khỏi danh sách ký nhanh?`)) return;
    setBusy(a.slug);
    try {
      await apiSend(`/api/cert-shop/quick-apps/${a.slug}`, "DELETE");
      onChanged();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="font-semibold">Kho ứng dụng (ký nhanh)</h2>
        <p className="mt-0.5 text-xs text-muted">Các app như ESign khách có thể chọn để ký nhanh mà không cần tự tải IPA lên.</p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.slug} className="flex items-center justify-between gap-3 rounded-lg bg-background p-3 text-xs">
              <div className="min-w-0">
                <div className="font-medium">
                  {a.name} <span className="font-mono text-muted">({a.slug})</span>
                </div>
                <div className="truncate text-muted">
                  {[a.version && `v${a.version}`, a.bundleId, a.minOs && `iOS ${a.minOs}+`, a.size && fmtSize(a.size)].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <Button variant="danger" size="sm" disabled={busy === a.slug} onClick={() => remove(a)}>
                Gỡ
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-background p-3 text-xs text-muted">{loading ? "Đang tải…" : "Chưa có app ký nhanh nào."}</p>
      )}

      <form onSubmit={upload} className="grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
        <input ref={fileRef} type="file" accept=".ipa" className="sm:col-span-2 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug (vd: esign)" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên hiển thị" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand" />

        {progress !== null && (
          <div className="sm:col-span-2">
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 text-xs text-muted">Đang tải lên… {progress}%</div>
          </div>
        )}
        {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
        {msg && <p className="text-xs text-success sm:col-span-2">{msg}</p>}
        <Button disabled={progress !== null} className="sm:col-span-2">
          {progress !== null ? "Đang tải lên…" : "Thêm app ký nhanh"}
        </Button>
      </form>
    </Card>
  );
}
