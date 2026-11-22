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
  price1: string; // giá 1 tháng
  disc3: string; // % giảm khi mua 3 tháng
  disc12: string; // % giảm khi mua 1 năm
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
  price1: "",
  disc3: "17",
  disc12: "24",
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
    price1: String(p.prices.find((x) => x.months === 1)?.price ?? ""),
    disc3: String(p.discount3 ?? 17),
    disc12: String(p.discount12 ?? 24),
    systemDomains: p.systemDomains.join(", "),
    maxCustomDomains: String(p.maxCustomDomains),
    isActive: p.isActive,
    sortOrder: String(p.sortOrder),
  };
}

/** Giá 3 tháng / 12 tháng tính từ giá 1 tháng và % giảm, làm tròn đến nghìn đồng. */
function buildPrices(price1: number, disc3: number, disc12: number) {
  if (!price1 || price1 <= 0) return [];
  const at = (months: number, disc: number) =>
    Math.round((price1 * months * (1 - disc / 100)) / 1000) * 1000;
  return [
    { months: 1, price: price1 },
    { months: 3, price: at(3, disc3) },
    { months: 12, price: at(12, disc12) },
  ];
}

function formPrices(f: FormState) {
  const price1 = Number(f.price1) || 0;
  if (f.price1.trim() && (!Number.isInteger(price1) || price1 < 0))
    throw new Error("Giá 1 tháng phải là số nguyên không âm");
  return buildPrices(price1, Number(f.disc3) || 0, Number(f.disc12) || 0);
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
        // Chỉ gửi giá 1 tháng; backend tự tính giá 3 tháng và 1 năm theo % giảm.
        prices: formPrices(form).filter((x) => x.months === 1),
        discount3: Number(form.disc3) || 0,
        discount12: Number(form.disc12) || 0,
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
    const msg =
      p.code === "free"
        ? "Tắt gói miễn phí? Người chưa mua gói sẽ KHÔNG tạo được link mới (link đã tạo vẫn hoạt động). Bật lại bằng nút Sửa, tick Đang bán."
        : `Ngừng bán gói "${p.name}"? Người đã dùng vẫn giữ nguyên gói.`;
    if (!confirm(msg)) return;
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
                  {p.isActive && (
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
            <div className="grid grid-cols-3 gap-3">
              <Field label="Giá 1 tháng (đ, trống = không bán)">
                <input
                  type="number"
                  min={0}
                  step={1000}
                  className={inputCls}
                  value={form.price1}
                  onChange={(e) => set("price1", e.target.value)}
                  placeholder="299000"
                />
              </Field>
              <Field label="Giảm giá 3 tháng (%)">
                <input
                  type="number"
                  min={0}
                  max={90}
                  className={inputCls}
                  value={form.disc3}
                  onChange={(e) => set("disc3", e.target.value)}
                />
              </Field>
              <Field label="Giảm giá 1 năm (%)">
                <input
                  type="number"
                  min={0}
                  max={90}
                  className={inputCls}
                  value={form.disc12}
                  onChange={(e) => set("disc12", e.target.value)}
                />
              </Field>
            </div>
            <p className="text-xs text-muted">
              {(() => {
                try {
                  const pr = formPrices(form);
                  return pr.length
                    ? pr.map((x) => `${x.months === 12 ? "1 năm" : `${x.months} tháng`}: ${fmtVnd(x.price)}`).join(" · ")
                    : "Gói không bán (cấp thủ công).";
                } catch {
                  return "";
                }
              })()}
            </p>
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
