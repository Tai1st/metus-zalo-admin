"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import {
  Badge,
  Card,
  inputCls,
  Table,
  TableEmpty,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";

type Sub = {
  id: string;
  userId: { username?: string; fullName?: string } | string;
  status: "pending" | "active" | "expired" | "cancelled";
  snapshot: {
    planName: string;
    months: number;
    totalPrice: number;
    addon: { name: string } | null;
  };
  startedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString("vi-VN") : "—");
const STATUS_LABEL = { pending: "Đang chờ", active: "Đang hiệu lực", expired: "Hết hạn", cancelled: "Đã huỷ" } as const;
const STATUS_TONE = { pending: "warning", active: "success", expired: "default", cancelled: "danger" } as const;
const owner = (s: Sub) =>
  typeof s.userId === "string" ? { username: s.userId, fullName: "" } : { username: s.userId?.username ?? "—", fullName: s.userId?.fullName ?? "" };

export function RevenueSection() {
  const { data, loading, error } = useApi<Sub[]>("/api/subscriptions");
  const [view, setView] = useState<"customer" | "order">("customer");
  const [q, setQ] = useState("");

  // Only subscriptions that were actually activated count as revenue.
  const paid = useMemo(
    () => (data ?? []).filter((s) => s.status === "active" || s.status === "expired"),
    [data],
  );

  const byCustomer = useMemo(() => {
    const map = new Map<string, { username: string; fullName: string; total: number; count: number; last: Sub }>();
    for (const s of paid) {
      const o = owner(s);
      const cur = map.get(o.username);
      if (cur) {
        cur.total += s.snapshot.totalPrice;
        cur.count += 1;
        if (new Date(s.createdAt) > new Date(cur.last.createdAt)) cur.last = s;
      } else {
        map.set(o.username, { ...o, total: s.snapshot.totalPrice, count: 1, last: s });
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [paid]);

  const needle = q.trim().toLowerCase();
  const match = (u: string, n: string) => !needle || u.toLowerCase().includes(needle) || n.toLowerCase().includes(needle);
  const customers = byCustomer.filter((c) => match(c.username, c.fullName));
  const orders = paid.filter((s) => match(owner(s).username, owner(s).fullName));

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Doanh thu theo khách hàng</h2>
          <p className="text-xs text-muted">Tính từ các gói đã kích hoạt.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 text-xs">
          {(["customer", "order"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 font-medium ${view === v ? "bg-brand text-white" : "text-muted"}`}
            >
              {v === "customer" ? "Theo khách hàng" : "Theo lượt mua"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 max-w-xs">
        <input className={inputCls} placeholder="Tìm khách hàng…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="p-0">
        {view === "customer" ? (
          <Table minWidth={720}>
            <Thead>
              <Th>Khách hàng</Th>
              <Th>Số lần mua</Th>
              <Th>Gói gần nhất</Th>
              <Th>Hết hạn</Th>
              <Th className="text-right">Tổng đã trả</Th>
            </Thead>
            <tbody>
              {customers.map((c) => (
                <Tr key={c.username}>
                  <Td>
                    <div className="font-medium">{c.username}</div>
                    {c.fullName && <div className="text-xs text-muted">{c.fullName}</div>}
                  </Td>
                  <Td>{c.count}</Td>
                  <Td>
                    {c.last.snapshot.planName}
                    {c.last.snapshot.addon && <span className="text-muted"> + {c.last.snapshot.addon.name}</span>}
                  </Td>
                  <Td className="text-muted">{fmtDate(c.last.expiresAt)}</Td>
                  <Td className="text-right font-semibold">{fmtVnd(c.total)}</Td>
                </Tr>
              ))}
              {customers.length === 0 && (
                <TableEmpty colSpan={5}>{loading ? "Đang tải…" : error || "Chưa có doanh thu."}</TableEmpty>
              )}
            </tbody>
          </Table>
        ) : (
          <Table minWidth={840}>
            <Thead>
              <Th>Khách hàng</Th>
              <Th>Gói</Th>
              <Th>Chu kỳ</Th>
              <Th>Số tiền</Th>
              <Th>Ngày tạo</Th>
              <Th>Hết hạn</Th>
              <Th>Trạng thái</Th>
            </Thead>
            <tbody>
              {orders.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-medium">{owner(s).username}</Td>
                  <Td>
                    {s.snapshot.planName}
                    {s.snapshot.addon && <span className="text-muted"> + {s.snapshot.addon.name}</span>}
                  </Td>
                  <Td>{s.snapshot.months} tháng</Td>
                  <Td className="font-medium">{fmtVnd(s.snapshot.totalPrice)}</Td>
                  <Td className="text-muted">{fmtDate(s.createdAt)}</Td>
                  <Td className="text-muted">{fmtDate(s.expiresAt)}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                  </Td>
                </Tr>
              ))}
              {orders.length === 0 && (
                <TableEmpty colSpan={7}>{loading ? "Đang tải…" : error || "Chưa có lượt mua."}</TableEmpty>
              )}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
