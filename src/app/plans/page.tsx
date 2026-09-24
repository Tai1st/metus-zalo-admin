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
  PageHeader,
  Table,
  TableEmpty,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";

type PricePoint = { months: number; price: number };
type Plan = {
  id: string;
  code: string;
  name: string;
  tagline: string;
  description: string;
  prices: PricePoint[];
  maxUsers: number;
  isPopular: boolean;
  isActive: boolean;
  features: string[];
};

const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";

type FormState = {
  code: string;
  name: string;
  tagline: string;
  description: string;
  p1: string;
  p3: string;
  p6: string;
  p12: string;
  maxUsers: string;
  isPopular: boolean;
  features: string;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  tagline: "",
  description: "",
  p1: "",
  p3: "",
  p6: "",
  p12: "",
  maxUsers: "1",
  isPopular: false,
  features: "",
};

function toForm(p: Plan): FormState {
  const price = (m: number) => p.prices.find((x) => x.months === m)?.price;
  return {
    code: p.code,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    p1: price(1)?.toString() ?? "",
    p3: price(3)?.toString() ?? "",
    p6: price(6)?.toString() ?? "",
    p12: price(12)?.toString() ?? "",
    maxUsers: String(p.maxUsers),
    isPopular: p.isPopular,
    features: p.features.join("\n"),
  };
}

function toBody(f: FormState) {
  const prices: PricePoint[] = [];
  for (const [months, raw] of [[1, f.p1], [3, f.p3], [6, f.p6], [12, f.p12]] as const) {
    if (raw.trim()) prices.push({ months, price: Number(raw) });
  }
  return {
    code: f.code.trim(),
    name: f.name.trim(),
    tagline: f.tagline.trim() || undefined,
    description: f.description.trim() || undefined,
    prices,
    maxUsers: Number(f.maxUsers) || 1,
    isPopular: f.isPopular,
    features: f.features
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export default function PlansPage() {
  const { data, loading, error, reload } = useApi<Plan[]>("/api/plans");
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function openNew() {
    setForm(EMPTY);
    setEditing("new");
    setSaveError("");
  }
  function openEdit(p: Plan) {
    setForm(toForm(p));
    setEditing(p);
    setSaveError("");
  }

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const body = toBody(form);
      if (editing === "new") {
        await apiSend("/api/plans", "POST", body);
      } else if (editing) {
        await apiSend(`/api/plans/${editing.id}`, "PATCH", body);
      }
      setEditing(null);
      reload();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(p: Plan) {
    if (!confirm(`Ngừng bán gói "${p.name}"? Người đã mua vẫn giữ nguyên gói.`))
      return;
    await apiSend(`/api/plans/${p.id}`, "DELETE");
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Gói cước"
        subtitle="Personal / Business — giá theo chu kỳ 3, 6, 12 tháng."
        action={<Button onClick={openNew}>+ Thêm gói</Button>}
      />
      <Card className="p-0">
        <Table minWidth={760}>
          <Thead>
            <Th>Mã</Th>
            <Th>Tên</Th>
            <Th>Giá 1 / 3 / 6 / 12 tháng</Th>
            <Th>Số tài khoản</Th>
            <Th>Trạng thái</Th>
            <Th className="text-right">Thao tác</Th>
          </Thead>
          <tbody>
            {(data ?? []).map((p) => {
              const price = (m: number) =>
                p.prices.find((x) => x.months === m)?.price;
              return (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs">{p.code}</Td>
                  <Td>
                    <div className="font-medium">{p.name}</div>
                    {p.isPopular && (
                      <Badge tone="warning">Phổ biến nhất</Badge>
                    )}
                  </Td>
                  <Td className="text-muted">
                    {[1, 3, 6, 12]
                      .map((m) =>
                        price(m) !== undefined ? fmtVnd(price(m)!) : "—",
                      )
                      .join(" / ")}
                  </Td>
                  <Td>{p.maxUsers}</Td>
                  <Td>
                    {p.isActive ? (
                      <Badge tone="success">Đang bán</Badge>
                    ) : (
                      <Badge>Ngừng bán</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      Sửa
                    </Button>{" "}
                    {p.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deactivate(p)}
                      >
                        Ngừng bán
                      </Button>
                    )}
                  </Td>
                </Tr>
              );
            })}
            {(data ?? []).length === 0 && (
              <TableEmpty colSpan={6}>
                {loading ? "Đang tải…" : error ? error : "Chưa có gói cước nào."}
              </TableEmpty>
            )}
          </tbody>
        </Table>
      </Card>

      {editing && (
        <Modal
          title={editing === "new" ? "Thêm gói cước" : "Sửa gói cước"}
          onClose={() => setEditing(null)}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mã (code)">
                <input
                  className={inputCls}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  disabled={editing !== "new"}
                />
              </Field>
              <Field label="Tên hiển thị">
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Nhãn nhỏ (tagline)">
              <input
                className={inputCls}
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </Field>
            <Field label="Mô tả">
              <input
                className={inputCls}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Giá 1 tháng (đ)">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.p1}
                  onChange={(e) => setForm({ ...form, p1: e.target.value })}
                />
              </Field>
              <Field label="Giá 3 tháng (đ)">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.p3}
                  onChange={(e) => setForm({ ...form, p3: e.target.value })}
                />
              </Field>
              <Field label="Giá 6 tháng (đ)">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.p6}
                  onChange={(e) => setForm({ ...form, p6: e.target.value })}
                />
              </Field>
              <Field label="Giá 12 tháng (đ)">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.p12}
                  onChange={(e) => setForm({ ...form, p12: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số tài khoản đi kèm">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.maxUsers}
                  onChange={(e) =>
                    setForm({ ...form, maxUsers: e.target.value })
                  }
                />
              </Field>
              <label className="mt-5 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPopular}
                  onChange={(e) =>
                    setForm({ ...form, isPopular: e.target.checked })
                  }
                />
                Đánh dấu &quot;phổ biến nhất&quot;
              </label>
            </div>
            <Field label="Tính năng (mỗi dòng một mục)">
              <textarea
                className={`${inputCls} h-24 py-2`}
                value={form.features}
                onChange={(e) =>
                  setForm({ ...form, features: e.target.value })
                }
              />
            </Field>
            {saveError && <p className="text-sm text-danger">{saveError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Huỷ
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Đang lưu…" : "Lưu"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
