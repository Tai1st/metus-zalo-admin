"use client";

import { useState } from "react";
import { apiSend, useApi } from "@/hooks/useApi";
import {
  Badge,
  Button,
  Card,
  Field,
  inputCls,
  Modal,
  Notice,
  Table,
  TableEmpty,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { fmtVnd, PERIOD_LABEL, type LinkPlan } from "./shared";

type FormState = {
  code: string;
  name: string;
  description: string;
  limit: string;
  period: "day" | "week" | "month";
  prices: string; // "1:99000, 3:249000"
  systemDomains: string; // comma/newline separated hosts
  maxCustomDomains: string;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  description: "",
  limit: "10",
  period: "month",
  prices: "",
  systemDomains: "",
  maxCustomDomains: "0",
  isActive: true,
  sortOrder: "0",
};

function toForm(p: LinkPlan): FormState {
  return {
    code: p.code,
    name: p.name,
    description: p.description ?? "",
    limit: String(p.limit),
    period: p.period,
    prices: p.prices.map((x) => `${x.months}:${x.price}`).join(", "),
    systemDomains: p.systemDomains.join(", "),
    maxCustomDomains: String(p.maxCustomDomains),
    isActive: p.isActive,
    sortOrder: String(p.sortOrder),
  };
}

/** Parse "1:99000, 3:249000" into price points; throws a Vietnamese message on bad input. */
function parsePrices(raw: string) {
  const out: { months: number; price: number }[] = [];
  for (const part of raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)) {
    const m = /^(\d+)\s*:\s*(\d+)$/.exec(part);
    if (!m) throw new Error(`Giá "${part}" sai định dạng, dùng "số tháng:giá" (vd 1:99000)`);
    const months = Number(m[1]);
    if (months < 1 || months > 60) throw new Error("Số tháng phải từ 1 đến 60");
    if (out.some((x) => x.months === months))
      throw new Error(`Số tháng ${months} bị trùng`);
    out.push({ months, price: Number(m[2]) });
  }
  return out;
}

export function PlansTab() {
  const { data, loading, error, reload } = useApi<LinkPlan[]>("/api/short-links/plans");
  const [editing, setEditing] = useState<LinkPlan | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [msg, setMsg] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function openNew() {
    setForm(EMPTY);
    setEditing("new");
    setSaveError("");
  }
  function openEdit(p: LinkPlan) {
    setForm(toForm(p));
    setEditing(p);
    setSaveError("");
  }

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        limit: Number(form.limit),
        period: form.period,
        prices: parsePrices(form.prices),
        systemDomains: form.systemDomains
          .split(/[,\n]/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
        maxCustomDomains: Number(form.maxCustomDomains) || 0,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing === "new") {
        await apiSend("/api/short-links/plans", "POST", {
          code: form.code.trim(),
          ...body,
        });
      } else if (editing) {
        await apiSend(`/api/short-links/plans/${editing.code}`, "PATCH", body);
      }
      setEditing(null);
      reload();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(p: LinkPlan) {
    if (!confirm(`Ngừng bán gói "${p.name}"? Người đã dùng vẫn giữ nguyên gói.`)) return;
    setMsg("");
    try {
      await apiSend(`/api/short-links/plans/${p.code}`, "DELETE");
      reload();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={openNew}>+ Thêm gói</Button>
      </div>
      {(error || msg) && (
        <div className="mb-3">
          <Notice>{msg || error}</Notice>
        </div>
      )}
      <Card className="p-0">
        <Table minWidth={900}>
          <Thead>
            <Th>Mã</Th>
            <Th>Tên</Th>
            <Th>Hạn mức</Th>
            <Th>Giá</Th>
            <Th>Tên miền hệ thống</Th>
            <Th>Tên miền riêng</Th>
            <Th>Trạng thái</Th>
            <Th className="text-right">Thao tác</Th>
          </Thead>
          <tbody>
            {(data ?? []).map((p) => (
              <Tr key={p.id}>
                <Td className="font-mono text-xs">{p.code}</Td>
                <Td>
                  <div className="font-medium">{p.name}</div>
                  {p.description && (
                    <div className="max-w-56 truncate text-xs text-muted" title={p.description}>
                      {p.description}
                    </div>
                  )}
                </Td>
                <Td>
                  {p.limit} link / {PERIOD_LABEL[p.period] ?? p.period}
                </Td>
                <Td className="text-xs text-muted">
                  {p.prices.length
                    ? p.prices.map((x) => `${x.months}th: ${fmtVnd(x.price)}`).join(" · ")
                    : "—"}
                </Td>
                <Td className="text-xs">
                  {p.systemDomains.length ? p.systemDomains.join(", ") : "Tất cả"}
                </Td>
                <Td>{p.maxCustomDomains}</Td>
                <Td>
                  {p.isActive ? <Badge tone="success">Đang bán</Badge> : <Badge>Ngừng bán</Badge>}
                </Td>
                <Td className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                    Sửa
                  </Button>{" "}
                  {p.isActive && p.code !== "free" && (
                    <Button variant="ghost" size="sm" onClick={() => deactivate(p)}>
                      Ngừng bán
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
            {!loading && (data ?? []).length === 0 && (
              <TableEmpty colSpan={8}>Chưa có gói nào.</TableEmpty>
            )}
          </tbody>
        </Table>
      </Card>

      {editing && (
        <Modal
          title={editing === "new" ? "Thêm gói link" : `Sửa gói ${editing.code}`}
          onClose={() => setEditing(null)}
        >
          <div className="space-y-3">
            {editing === "new" && (
              <Field label="Mã gói (a-z, 0-9, dấu gạch ngang)">
                <input
                  className={inputCls}
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="vd: pro"
                />
              </Field>
            )}
            <Field label="Tên gói">
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                className={`${inputCls} h-20 py-2`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số link mỗi chu kỳ">
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={form.limit}
                  onChange={(e) => set("limit", e.target.value)}
                />
              </Field>
              <Field label="Chu kỳ">
                <select
                  className={inputCls}
                  value={form.period}
                  onChange={(e) => set("period", e.target.value as FormState["period"])}
                >
                  <option value="day">Ngày</option>
                  <option value="week">Tuần</option>
                  <option value="month">Tháng</option>
                </select>
              </Field>
            </div>
            <Field label='Giá (số tháng:giá, vd "1:99000, 3:249000")'>
              <input
                className={inputCls}
                value={form.prices}
                onChange={(e) => set("prices", e.target.value)}
                placeholder="1:99000, 3:249000"
              />
            </Field>
            <Field label="Tên miền hệ thống được dùng (cách nhau dấu phẩy, trống = tất cả)">
              <input
                className={inputCls}
                value={form.systemDomains}
                onChange={(e) => set("systemDomains", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số tên miền riêng tối đa (0 = không cho)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputCls}
                  value={form.maxCustomDomains}
                  onChange={(e) => set("maxCustomDomains", e.target.value)}
                />
              </Field>
              <Field label="Thứ tự hiển thị">
                <input
                  type="number"
                  className={inputCls}
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
              />
              Đang bán
            </label>
            {saveError && <Notice>{saveError}</Notice>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Hủy
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Đang lưu…" : "Lưu"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
