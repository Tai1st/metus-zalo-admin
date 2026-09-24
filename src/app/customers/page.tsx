"use client";

import Link from "next/link";
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

type Customer = {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  allowedZaloIds: string[];
  createdAt: string;
};
type Sub = {
  id: string;
  userId: { username?: string } | string;
  status: string;
  expiresAt: string | null;
  snapshot: { planCode: string; planName: string; months: number; maxUsers: number };
};

const subUsername = (s: Sub) =>
  typeof s.userId === "string" ? s.userId : (s.userId?.username ?? "");

type Dialog =
  | { kind: "create" }
  | { kind: "password"; customer: Customer }
  | { kind: "delete"; customer: Customer };

export default function CustomersPage() {
  const cust = useApi<Customer[]>("/api/customers");
  const subs = useApi<Sub[]>("/api/subscriptions");
  const [busy, setBusy] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const activeByUser = new Map<string, Sub>();
  for (const s of subs.data ?? []) {
    if (s.status === "active") activeByUser.set(subUsername(s), s);
  }

  async function toggle(c: Customer) {
    setBusy(c.id);
    try {
      await apiSend(`/api/customers/${c.id}/active`, "PATCH", {
        isActive: !c.isActive,
      });
      cust.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        subtitle="Tài khoản đăng nhập để mua và dùng gói (không gồm nhân sự / quản trị viên)."
        action={<Button onClick={() => setDialog({ kind: "create" })}>+ Thêm khách hàng</Button>}
      />
      <Card className="p-0">
        <Table minWidth={900}>
          <Thead>
            <Th>Tên đăng nhập</Th>
            <Th>Họ tên</Th>
            <Th>Gói hiện tại</Th>
            <Th>Nhân sự tối đa</Th>
            <Th>Ngày tạo</Th>
            <Th>Trạng thái</Th>
            <Th className="text-right">Thao tác</Th>
          </Thead>
          <tbody>
            {(cust.data ?? []).map((c) => {
              const sub = activeByUser.get(c.username);
              return (
                <Tr key={c.id}>
                  <Td className="font-medium">{c.username}</Td>
                  <Td>{c.fullName || "—"}</Td>
                  <Td>
                    {sub ? (
                      <>
                        <div>{sub.snapshot.planName}</div>
                        <div className="text-xs text-muted">
                          {sub.snapshot.months} tháng · hết hạn{" "}
                          {sub.expiresAt
                            ? new Date(sub.expiresAt).toLocaleDateString("vi-VN")
                            : "—"}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted">Chưa có gói</span>
                    )}
                  </Td>
                  <Td>{sub ? sub.snapshot.maxUsers : "—"}</Td>
                  <Td className="text-muted">
                    {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                  </Td>
                  <Td>
                    {c.isActive ? (
                      <Badge tone="success">Đang hoạt động</Badge>
                    ) : (
                      <Badge tone="danger">Đã khoá</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Link
                        href={`/customers/${c.id}`}
                        className="inline-flex h-7 items-center rounded-lg bg-brand px-2.5 text-xs font-medium text-white hover:bg-brand-dark"
                      >
                        Sửa
                      </Link>
                      <Button
                        variant={c.isActive ? "danger" : "primary"}
                        size="sm"
                        disabled={busy === c.id}
                        onClick={() => toggle(c)}
                      >
                        {c.isActive ? "Khoá" : "Mở khoá"}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busy === c.id}
                        onClick={() => setDialog({ kind: "delete", customer: c })}
                      >
                        Xoá
                      </Button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
            {(cust.data ?? []).length === 0 && (
              <TableEmpty colSpan={7}>
                {cust.loading
                  ? "Đang tải…"
                  : cust.error
                    ? cust.error
                    : "Chưa có khách hàng nào."}
              </TableEmpty>
            )}
          </tbody>
        </Table>
      </Card>

      {dialog?.kind === "password" && (
        <PasswordDialog
          customer={dialog.customer}
          onClose={() => setDialog(null)}
          onDone={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "delete" && (
        <DeleteDialog
          customer={dialog.customer}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            cust.reload();
          }}
        />
      )}
      {dialog?.kind === "create" && (
        <CreateDialog
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            cust.reload();
          }}
        />
      )}
    </div>
  );
}

function useSubmit(onDone: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function run(fn: () => Promise<unknown>) {
    setSaving(true);
    setError("");
    try {
      await fn();
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }
  return { saving, error, run };
}

function Footer({
  error,
  saving,
  label,
  onClose,
  onSave,
}: {
  error: string;
  saving: boolean;
  label: string;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Huỷ
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Đang lưu…" : label}
        </Button>
      </div>
    </>
  );
}

function PasswordDialog({
  customer,
  onClose,
  onDone,
}: {
  customer: Customer;
  onClose: () => void;
  onDone: () => void;
}) {
  const [pw, setPw] = useState("");
  const { saving, error, run } = useSubmit(onDone);
  return (
    <Modal title={`Đổi mật khẩu · ${customer.username}`} onClose={onClose}>
      <Field label="Mật khẩu mới (tối thiểu 8 ký tự)">
        <input
          className={inputCls}
          type="text"
          autoComplete="off"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </Field>
      <Footer
        error={error}
        saving={saving}
        label="Đổi mật khẩu"
        onClose={onClose}
        onSave={() =>
          run(() =>
            apiSend(`/api/customers/${customer.id}/password`, "PATCH", {
              newPassword: pw,
            }),
          )
        }
      />
    </Modal>
  );
}

function DeleteDialog({
  customer,
  onClose,
  onDone,
}: {
  customer: Customer;
  onClose: () => void;
  onDone: () => void;
}) {
  const { saving, error, run } = useSubmit(onDone);
  return (
    <Modal title={`Xoá khách hàng · ${customer.username}`} onClose={onClose}>
      <p className="text-sm text-danger">
        Thao tác này xoá vĩnh viễn tài khoản, nhân sự, tài khoản Zalo, chiến
        dịch, lịch trình, lịch sử chat, lời mời kết bạn, proxy và đăng ký gói
        của khách hàng này. Không thể hoàn tác.
      </p>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Huỷ
        </Button>
        <Button
          variant="danger"
          disabled={saving}
          onClick={() =>
            run(() => apiSend(`/api/customers/${customer.id}`, "DELETE"))
          }
        >
          {saving ? "Đang xoá…" : "Xoá vĩnh viễn"}
        </Button>
      </div>
    </Modal>
  );
}

function CreateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ username: "", password: "", fullName: "", phone: "" });
  const { saving, error, run } = useSubmit(onDone);
  return (
    <Modal title="Thêm khách hàng" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tên đăng nhập">
            <input
              className={inputCls}
              value={f.username}
              autoCapitalize="none"
              onChange={(e) => setF({ ...f, username: e.target.value })}
            />
          </Field>
          <Field label="Mật khẩu (tối thiểu 8 ký tự)">
            <input
              className={inputCls}
              type="text"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Họ tên">
            <input
              className={inputCls}
              value={f.fullName}
              onChange={(e) => setF({ ...f, fullName: e.target.value })}
            />
          </Field>
          <Field label="Số điện thoại">
            <input
              className={inputCls}
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
            />
          </Field>
        </div>
      </div>
      <Footer
        error={error}
        saving={saving}
        label="Tạo tài khoản"
        onClose={onClose}
        onSave={() =>
          run(() =>
            apiSend("/api/customers", "POST", {
              ...f,
              phone: f.phone.trim() || undefined,
            }),
          )
        }
      />
    </Modal>
  );
}
