"use client";

import Link from "next/link";
import { use, useState } from "react";
import { DateTimePicker } from "@/components/DateTimePicker";
import { apiSend, useApi } from "@/hooks/useApi";
import {
  Badge,
  Button,
  Card,
  Field,
  inputCls,
  Notice,
  PageHeader,
} from "@/components/ui";

type Customer = {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
};
type Price = { months: number; price: number };
type Plan = { id: string; code: string; name: string; prices: Price[]; maxUsers: number; isActive: boolean };
type Addon = { id: string; name: string; seats: number; prices: Price[]; requiresPlanCode: string; isActive: boolean };
type Sub = {
  id: string;
  planId: string;
  userId: { id?: string; username?: string } | string;
  status: string;
  startedAt: string | null;
  expiresAt: string | null;
  snapshot: {
    planCode: string;
    planName: string;
    months: number;
    totalPrice: number;
    maxUsers: number;
    addon: { seats: number } | null;
  };
};

const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";
const subOwner = (s: Sub) =>
  typeof s.userId === "string" ? s.userId : (s.userId?.username ?? "");

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const cust = useApi<Customer>(`/api/customers/${id}`);
  const subs = useApi<Sub[]>("/api/subscriptions");
  const plans = useApi<Plan[]>("/api/plans");
  const addons = useApi<Addon[]>("/api/addons");

  const customer = cust.data;
  const sub = customer
    ? (subs.data ?? []).find(
        (s) => s.status === "active" && subOwner(s) === customer.username,
      )
    : undefined;

  return (
    <div className="max-w-3xl">
      <Link href="/customers" className="text-sm text-brand hover:underline">
        ← Danh sách khách hàng
      </Link>
      <div className="mt-2">
        <PageHeader
          title={customer ? `Khách hàng ${customer.username}` : "Khách hàng"}
          subtitle="Thông tin tài khoản và gói đang dùng."
        />
      </div>
      {cust.error && <Notice>{cust.error}</Notice>}
      {cust.loading && !customer && <p className="text-sm text-muted">Đang tải…</p>}

      {customer && (
        <div className="space-y-5">
          <InfoCard customer={customer} onSaved={cust.reload} />
          <PasswordCard customer={customer} />
          {subs.loading && !subs.data ? (
            <p className="text-sm text-muted">Đang tải gói…</p>
          ) : sub ? (
            <EditPlanCard
              key={`${sub.id}-${sub.expiresAt}-${sub.snapshot.maxUsers}-${sub.planId}`}
              sub={sub}
              plans={plans.data ?? []}
              addons={addons.data ?? []}
              onSaved={subs.reload}
            />
          ) : (
            <GrantCard
              customer={customer}
              plans={plans.data ?? []}
              addons={addons.data ?? []}
              onSaved={subs.reload}
            />
          )}
        </div>
      )}
    </div>
  );
}

function useSave() {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  async function run(fn: () => Promise<unknown>, okText: string) {
    setSaving(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ tone: "success", text: okText });
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }
  return { saving, msg, run };
}

function randomPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join("");
}

function PasswordCard({ customer }: { customer: Customer }) {
  const [newPw, setNewPw] = useState("");
  const { saving, msg, run } = useSave();
  return (
    <Card className="p-5">
      <h2 className="mb-1 text-sm font-semibold">Đổi mật khẩu</h2>
      <p className="mb-3 text-xs text-muted">
        Bấm nút để tạo mật khẩu ngẫu nhiên mới cho khách hàng. Mật khẩu chỉ hiện một lần, hãy sao chép gửi cho khách.
      </p>
      {newPw && (
        <div className="mb-3 rounded-lg border border-border bg-background p-3 text-sm">
          Mật khẩu mới: <span className="font-mono font-semibold select-all">{newPw}</span>
        </div>
      )}
      {msg && <div className="mb-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="flex justify-end">
        <Button
          disabled={saving}
          onClick={() => {
            const pw = randomPassword();
            setNewPw("");
            void run(async () => {
              await apiSend(`/api/customers/${customer.id}/password`, "PATCH", {
                newPassword: pw,
              });
              setNewPw(pw);
            }, "Đã đổi mật khẩu");
          }}
        >
          {saving ? "Đang đổi…" : "Đổi mật khẩu"}
        </Button>
      </div>
    </Card>
  );
}

function InfoCard({ customer, onSaved }: { customer: Customer; onSaved: () => void }) {
  const [fullName, setFullName] = useState(customer.fullName);
  const [phone, setPhone] = useState(customer.phone);
  const { saving, msg, run } = useSave();
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Thông tin khách hàng</h2>
        {customer.isActive ? (
          <Badge tone="success">Đang hoạt động</Badge>
        ) : (
          <Badge tone="danger">Đã khoá</Badge>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tên đăng nhập">
          <input className={inputCls} value={customer.username} disabled />
        </Field>
        <Field label="Ngày tạo">
          <input
            className={inputCls}
            value={new Date(customer.createdAt).toLocaleDateString("vi-VN")}
            disabled
          />
        </Field>
        <Field label="Họ tên">
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Số điện thoại">
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="mt-4 flex justify-end">
        <Button
          disabled={saving || !fullName.trim()}
          onClick={() =>
            run(async () => {
              await apiSend(`/api/customers/${customer.id}`, "PATCH", { fullName, phone });
              onSaved();
            }, "Đã lưu thông tin")
          }
        >
          {saving ? "Đang lưu…" : "Lưu thông tin"}
        </Button>
      </div>
    </Card>
  );
}

function EditPlanCard({
  sub,
  plans,
  addons,
  onSaved,
}: {
  sub: Sub;
  plans: Plan[];
  addons: Addon[];
  onSaved: () => void;
}) {
  const [planId, setPlanId] = useState(sub.planId);
  const [expiresAt, setExpiresAt] = useState<Date | null>(sub.expiresAt ? new Date(sub.expiresAt) : null);
  const curSeats = sub.snapshot.addon?.seats ?? 0;
  const curAddon = addons.find((a) => a.seats === curSeats && a.requiresPlanCode === sub.snapshot.planCode);
  const [addonId, setAddonId] = useState(curAddon?.id ?? "");
  const [months, setMonths] = useState(sub.snapshot.months);
  const { saving, msg, run } = useSave();

  const plan = plans.find((p) => p.id === planId);
  const usable = addons.filter((a) => a.isActive && a.requiresPlanCode === plan?.code);
  const chosen = usable.find((a) => a.id === addonId);
  const planPrice = plan?.prices.find((p) => p.months === months)?.price;
  const addonPrice = chosen?.prices.find((p) => p.months === months)?.price ?? 0;
  const newPrice = planPrice === undefined ? undefined : planPrice + addonPrice;
  const total = (plan?.maxUsers ?? sub.snapshot.maxUsers - curSeats) + (chosen?.seats ?? 0);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Gói đang dùng</h2>
        <Badge tone="success">Đang hiệu lực</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Gói cước">
          <select
            className={inputCls}
            value={planId}
            onChange={(e) => {
              setPlanId(e.target.value);
              setAddonId("");
              const np = plans.find((p) => p.id === e.target.value);
              if (np && !np.prices.some((p) => p.months === months)) {
                setMonths(np.prices[0]?.months ?? months);
              }
            }}
          >
            {plans
              .filter((p) => p.isActive || p.id === sub.planId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Chu kỳ">
          <select
            className={inputCls}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          >
            {(plan?.prices ?? []).map((p) => (
              <option key={p.months} value={p.months}>
                {p.months} tháng — {fmtVnd(p.price)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Hạn dùng">
          <DateTimePicker value={expiresAt} onChange={setExpiresAt} minDate={new Date()} />
        </Field>
        {usable.length > 0 && (
          <Field label="Gói mua thêm (nhân sự)">
            <select
              className={inputCls}
              value={addonId}
              onChange={(e) => setAddonId(e.target.value)}
            >
              <option value="">Không có</option>
              {usable.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (+{a.seats} nhân sự) — +{fmtVnd(a.prices.find((p) => p.months === months)?.price ?? 0)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="flex items-end text-sm text-muted">
          Tổng nhân sự tối đa:&nbsp;<b className="text-foreground">{total}</b>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-background p-3 text-sm">
        <div className="flex justify-between text-muted">
          <span>Giá gói {plan?.name ?? ""} ({months} tháng)</span>
          <span>{planPrice === undefined ? "—" : fmtVnd(planPrice)}</span>
        </div>
        {chosen && (
          <div className="flex justify-between text-muted">
            <span>Phí {chosen.name}</span>
            <span>+ {fmtVnd(addonPrice)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold">
          <span>Tổng giá hiện tại</span>
          <span>{newPrice === undefined ? "—" : fmtVnd(newPrice)}</span>
        </div>
        {newPrice !== undefined && newPrice !== sub.snapshot.totalPrice && (
          <div className="mt-1 text-xs text-muted">
            Đang lưu: {fmtVnd(sub.snapshot.totalPrice)} — bấm &quot;Lưu thay đổi&quot; để cập nhật.
          </div>
        )}
      </div>
      {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="mt-4 flex justify-end">
        <Button
          disabled={saving}
          onClick={() =>
            run(async () => {
              const body: Record<string, unknown> = {};
              if (planId !== sub.planId) body.planId = planId;
              if (expiresAt && expiresAt.getTime() !== new Date(sub.expiresAt ?? 0).getTime()) {
                body.expiresAt = expiresAt.toISOString();
              }
              const changedPlan = planId !== sub.planId;
              const changedMonths = months !== sub.snapshot.months;
              if (changedMonths) body.months = months;
              if (addonId) {
                if (addonId !== curAddon?.id || changedPlan || changedMonths) body.addonId = addonId;
              } else if (curSeats > 0 || changedPlan) {
                body.extraSeats = 0;
              }
              if (Object.keys(body).length === 0) throw new Error("Chưa có thay đổi nào");
              await apiSend(`/api/subscriptions/${sub.id}/admin`, "PATCH", body);
              onSaved();
            }, "Đã lưu thay đổi")
          }
        >
          {saving ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
      </div>
    </Card>
  );
}

function GrantCard({
  customer,
  plans,
  addons,
  onSaved,
}: {
  customer: Customer;
  plans: Plan[];
  addons: Addon[];
  onSaved: () => void;
}) {
  const sellable = plans.filter((p) => p.isActive);
  const [planId, setPlanId] = useState("");
  const [chosenMonths, setMonths] = useState(3);
  const [addonId, setAddonId] = useState("");
  const { saving, msg, run } = useSave();

  const plan = sellable.find((p) => p.id === planId) ?? sellable[0];
  const months = plan?.prices.some((p) => p.months === chosenMonths)
    ? chosenMonths
    : (plan?.prices[0]?.months ?? chosenMonths);
  const usable = addons.filter((a) => a.isActive && a.requiresPlanCode === plan?.code);

  return (
    <Card className="p-5">
      <h2 className="mb-1 text-sm font-semibold">Chưa có gói</h2>
      <p className="mb-3 text-xs text-muted">Gán gói cho khách hàng — kích hoạt ngay.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Gói cước">
          <select
            className={inputCls}
            value={plan?.id ?? ""}
            onChange={(e) => {
              setPlanId(e.target.value);
              setAddonId("");
            }}
          >
            {sellable.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Chu kỳ">
          <select className={inputCls} value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {(plan?.prices ?? []).map((p) => (
              <option key={p.months} value={p.months}>
                {p.months} tháng — {fmtVnd(p.price)}
              </option>
            ))}
          </select>
        </Field>
        {usable.length > 0 && (
          <Field label="Thêm nhân sự">
            <select className={inputCls} value={addonId} onChange={(e) => setAddonId(e.target.value)}>
              <option value="">Không thêm</option>
              {usable.map((a) => (
                <option key={a.id} value={a.id}>{a.name} (+{a.seats})</option>
              ))}
            </select>
          </Field>
        )}
      </div>
      {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="mt-4 flex justify-end">
        <Button
          disabled={saving || !plan}
          onClick={() =>
            run(async () => {
              await apiSend("/api/subscriptions/grant", "POST", {
                userId: customer.id,
                planId: plan!.id,
                months,
                addonId: addonId || undefined,
              });
              onSaved();
            }, "Đã kích hoạt gói")
          }
        >
          {saving ? "Đang lưu…" : "Kích hoạt gói"}
        </Button>
      </div>
    </Card>
  );
}
