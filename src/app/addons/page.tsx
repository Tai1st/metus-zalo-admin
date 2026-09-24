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
type Addon = {
  id: string;
  code: string;
  name: string;
  seats: number;
  prices: PricePoint[];
  requiresPlanCode: string;
  isActive: boolean;
};

const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";

type FormState = {
  code: string;
  name: string;
  seats: string;
  p3: string;
  p6: string;
  p12: string;
  requiresPlanCode: string;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  seats: "1",
  p3: "",
  p6: "",
  p12: "",
  requiresPlanCode: "business",
};

function toForm(a: Addon): FormState {
  const price = (m: number) => a.prices.find((x) => x.months === m)?.price;
  return {
    code: a.code,
    name: a.name,
    seats: String(a.seats),
    p3: price(3)?.toString() ?? "",
    p6: price(6)?.toString() ?? "",
    p12: price(12)?.toString() ?? "",
    requiresPlanCode: a.requiresPlanCode,
  };
}

function toBody(f: FormState) {
  const prices: PricePoint[] = [];
  for (const [months, raw] of [[3, f.p3], [6, f.p6], [12, f.p12]] as const) {
    if (raw.trim()) prices.push({ months, price: Number(raw) });
  }
  return {
    code: f.code.trim(),
    name: f.name.trim(),
    seats: Number(f.seats) || 1,
    prices,
    requiresPlanCode: f.requiresPlanCode.trim() || "business",
  };
}

export default function AddonsPage() {
  const { data, loading, error, reload } = useApi<Addon[]>("/api/addons");
  const [editing, setEditing] = useState<Addon | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function openNew() {
    setForm(EMPTY);
    setEditing("new");
    setSaveError("");
  }
  function openEdit(a: Addon) {
    setForm(toForm(a));
    setEditing(a);
    setSaveError("");
  }

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const body = toBody(form);
      if (editing === "new") await apiSend("/api/addons", "POST", body);
      else if (editing) await apiSend(`/api/addons/${editing.id}`, "PATCH", body);
      setEditing(null);
      reload();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(a: Addon) {
    if (!confirm(`Ngừng bán "${a.name}"?`)) return;
    await apiSend(`/api/addons/${a.id}`, "DELETE");
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Gói mua thêm"
        subtitle="Mua thêm tài khoản nhân sự — chỉ áp dụng cho một gói cước cụ thể."
        action={<Button onClick={openNew}>+ Thêm gói</Button>}
      />
      <Card className="p-0">
        <Table minWidth={700}>
          <Thead>
            <Th>Mã</Th>
            <Th>Tên</Th>
            <Th>+ Tài khoản</Th>
            <Th>Áp dụng cho gói</Th>
            <Th>Giá 3 / 6 / 12 tháng</Th>
            <Th>Trạng thái</Th>
            <Th className="text-right">Thao tác</Th>
          </Thead>
          <tbody>
            {(data ?? []).map((a) => {
              const price = (m: number) =>
                a.prices.find((x) => x.months === m)?.price;
              return (
                <Tr key={a.id}>
                  <Td className="font-mono text-xs">{a.code}</Td>
                  <Td className="font-medium">{a.name}</Td>
                  <Td>+{a.seats}</Td>
                  <Td className="capitalize text-muted">{a.requiresPlanCode}</Td>
                  <Td className="text-muted">
                    {[3, 6, 12]
                      .map((m) => (price(m) !== undefined ? fmtVnd(price(m)!) : "—"))
                      .join(" / ")}
                  </Td>
                  <Td>
                    {a.isActive ? (
                      <Badge tone="success">Đang bán</Badge>
                    ) : (
                      <Badge>Ngừng bán</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                      Sửa
                    </Button>{" "}
                    {a.isActive && (
                      <Button variant="ghost" size="sm" onClick={() => deactivate(a)}>
                        Ngừng bán
                      </Button>
                    )}
                  </Td>
                </Tr>
              );
            })}
            {(data ?? []).length === 0 && (
              <TableEmpty colSpan={7}>
                {loading ? "Đang tải…" : error ? error : "Chưa có gói mua thêm nào."}
              </TableEmpty>
            )}
          </tbody>
        </Table>
      </Card>

      {editing && (
        <Modal
          title={editing === "new" ? "Thêm gói mua thêm" : "Sửa gói mua thêm"}
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số tài khoản thêm">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: e.target.value })}
                />
              </Field>
              <Field label="Chỉ áp dụng cho gói (code)">
                <input
                  className={inputCls}
                  value={form.requiresPlanCode}
                  onChange={(e) =>
                    setForm({ ...form, requiresPlanCode: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
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
