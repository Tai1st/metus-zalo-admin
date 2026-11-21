"use client";

import { useState } from "react";
import { apiSend, useApi } from "@/hooks/useApi";
import { DateTimePicker } from "@/components/DateTimePicker";
import {
  Button,
  Card,
  Field,
  inputCls,
  Notice,
  Table,
  TableEmpty,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { fmtTime, type LinkPlan } from "./shared";

type Membership = { id: string; userId: string; planCode: string; expiresAt: string | null };
type Customer = { id: string; username: string; fullName: string };

export function MembershipsTab() {
  const members = useApi<Membership[]>("/api/short-links/plans/memberships");
  const plans = useApi<LinkPlan[]>("/api/short-links/plans");
  const customers = useApi<Customer[]>("/api/customers");

  const [userId, setUserId] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const userName = (id: string) => {
    const c = (customers.data ?? []).find((x) => x.id === id);
    return c ? `${c.fullName || c.username} (${c.username})` : "";
  };

  async function assign() {
    setSaving(true);
    setMsg(null);
    try {
      await apiSend("/api/short-links/plans/assign", "POST", {
        userId,
        planCode,
        expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
      });
      setMsg({ tone: "success", text: "Đã gán gói." });
      members.reload();
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Người dùng">
            <select
              className={inputCls}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">— Chọn người dùng —</option>
              {(customers.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName || c.username} ({c.username})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gói">
            <select
              className={inputCls}
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
            >
              <option value="">— Chọn gói —</option>
              {(plans.data ?? []).map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.code}){p.isActive ? "" : " - ngừng bán"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hết hạn (để trống = không hết hạn)">
            <DateTimePicker value={expiresAt} onChange={setExpiresAt} showTime />
          </Field>
          <div className="flex items-end">
            <Button onClick={assign} disabled={saving || !userId || !planCode}>
              Gán gói
            </Button>
          </div>
        </div>
        {msg && (
          <div className="mt-3">
            <Notice tone={msg.tone}>{msg.text}</Notice>
          </div>
        )}
      </Card>

      <Card className="p-0">
        {members.error && (
          <div className="p-3">
            <Notice>{members.error}</Notice>
          </div>
        )}
        <Table minWidth={560}>
          <Thead>
            <Th>Người dùng</Th>
            <Th>Gói</Th>
            <Th>Hết hạn</Th>
          </Thead>
          <tbody>
            {(members.data ?? []).map((m) => (
              <Tr key={m.id}>
                <Td>
                  <div>{userName(m.userId) || "—"}</div>
                  <div className="font-mono text-xs text-muted">{m.userId}</div>
                </Td>
                <Td className="font-mono text-xs">{m.planCode}</Td>
                <Td>{m.expiresAt ? fmtTime(m.expiresAt) : "Không hết hạn"}</Td>
              </Tr>
            ))}
            {!members.loading && (members.data ?? []).length === 0 && (
              <TableEmpty colSpan={3}>Chưa có ai được gán gói.</TableEmpty>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
