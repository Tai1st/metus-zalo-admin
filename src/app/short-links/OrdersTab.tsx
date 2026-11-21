"use client";

import { useState } from "react";
import { apiSend, useApi } from "@/hooks/useApi";
import {
  Badge,
  Button,
  Card,
  Notice,
  Table,
  TableEmpty,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { fmtTime, fmtVnd } from "./shared";

type Order = {
  id: string;
  code: string;
  userId: string;
  planCode: string;
  planName: string;
  months: number;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "cancelled";
  paidAt?: string | null;
  paidBy?: string | null;
  txRef?: string | null;
  createdAt: string;
};

const STATUSES = [
  { key: "pending", label: "Chờ thanh toán" },
  { key: "paid", label: "Đã thanh toán" },
  { key: "cancelled", label: "Đã hủy" },
] as const;
const TONE = { pending: "warning", paid: "success", cancelled: "default" } as const;

export function OrdersTab() {
  const [status, setStatus] = useState<string>("pending");
  const { data, loading, error, reload } = useApi<Order[]>(
    `/api/short-links/orders?status=${status}`,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  async function act(o: Order, action: "confirm" | "cancel") {
    const msg =
      action === "confirm"
        ? `Xác nhận đã nhận ${fmtVnd(o.amount)} cho đơn ${o.code}? Gói sẽ được kích hoạt ngay.`
        : `Hủy đơn ${o.code}?`;
    if (!confirm(msg)) return;
    setBusy(o.code);
    setActionError("");
    try {
      await apiSend(`/api/short-links/orders/${o.code}/${action}`, "POST");
      reload();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatus(s.key)}
            className={`rounded-full border px-3 py-1 text-xs ${
              status === s.key
                ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-surface hover:bg-background"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {(error || actionError) && (
        <div className="mb-3">
          <Notice>{actionError || error}</Notice>
        </div>
      )}
      <Table minWidth={860}>
        <Thead>
          <Th>Mã đơn</Th>
          <Th>Gói</Th>
          <Th>Số tháng</Th>
          <Th>Số tiền</Th>
          <Th>User ID</Th>
          <Th>Trạng thái</Th>
          <Th>Thời gian</Th>
          <Th className="text-right">Thao tác</Th>
        </Thead>
        <tbody>
          {(data ?? []).map((o) => (
            <Tr key={o.id}>
              <Td className="font-mono text-xs">{o.code}</Td>
              <Td>
                <div className="font-medium">{o.planName}</div>
                <div className="font-mono text-xs text-muted">{o.planCode}</div>
              </Td>
              <Td>{o.months}</Td>
              <Td>{fmtVnd(o.amount)}</Td>
              <Td className="font-mono text-xs">{o.userId}</Td>
              <Td>
                <Badge tone={TONE[o.status] ?? "default"}>
                  {STATUSES.find((s) => s.key === o.status)?.label ?? o.status}
                </Badge>
              </Td>
              <Td className="text-xs text-muted">
                <div>Tạo: {fmtTime(o.createdAt)}</div>
                {o.paidAt && <div>Thanh toán: {fmtTime(o.paidAt)}</div>}
              </Td>
              <Td className="text-right">
                {o.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      disabled={busy === o.code}
                      onClick={() => act(o, "confirm")}
                    >
                      Đã nhận tiền
                    </Button>{" "}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy === o.code}
                      onClick={() => act(o, "cancel")}
                    >
                      Hủy
                    </Button>
                  </>
                )}
              </Td>
            </Tr>
          ))}
          {!loading && (data ?? []).length === 0 && (
            <TableEmpty colSpan={8}>Chưa có đơn nào.</TableEmpty>
          )}
          {loading && !data && <TableEmpty colSpan={8}>Đang tải…</TableEmpty>}
        </tbody>
      </Table>
    </Card>
  );
}
