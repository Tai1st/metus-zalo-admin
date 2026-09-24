"use client";

import { useState } from "react";
import { apiSend, useApi } from "@/hooks/useApi";
import {
  Button,
  Card,
  Modal,
  PageHeader,
  Table,
  TableEmpty,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";

type Lead = {
  id: string;
  seq: number;
  fullName: string;
  phone: string;
  scale: string;
  referrer: string;
  createdAt: string;
  expireAt: string;
};

const SCALE: Record<string, string> = {
  personal: "Cá nhân / Freelancer",
  small: "Shop nhỏ (2–3 nhân sự)",
  medium: "Doanh nghiệp vừa (4–10 nhân sự)",
  large: "Doanh nghiệp lớn (trên 10 nhân sự)",
};

function remaining(expireAt: string) {
  const ms = new Date(expireAt).getTime() - Date.now();
  if (ms <= 0) return "Sắp xoá";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
}

export default function LeadsPage() {
  const { data, loading, error, reload } = useApi<Lead[]>("/api/leads");
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{
    fullName: string;
    username: string;
    password: string;
  } | null>(null);

  async function approve(l: Lead) {
    if (!confirm(`Duyệt ${l.fullName} (${l.phone})? Hệ thống sẽ tạo tài khoản và cấp gói Trial 30 ngày.`)) return;
    setBusy(l.id);
    try {
      const r = await apiSend<{ username: string; password: string }>(
        `/api/leads/${l.id}/approve`,
        "POST",
      );
      setResult({ fullName: l.fullName, ...r });
      reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function reject(l: Lead) {
    if (!confirm(`Từ chối và xoá yêu cầu của ${l.fullName}?`)) return;
    setBusy(l.id);
    try {
      await apiSend(`/api/leads/${l.id}`, "DELETE");
      reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Yêu cầu dùng thử"
        subtitle="Tài khoản chờ duyệt. Duyệt sẽ tạo tài khoản (tên đăng nhập là số điện thoại) và cấp gói Trial 30 ngày. Quá 48 giờ chưa duyệt sẽ tự xoá."
      />
      <Card className="p-0">
        <Table minWidth={900}>
          <Thead>
            <Th>Họ tên</Th>
            <Th>Số điện thoại</Th>
            <Th>Quy mô</Th>
            <Th>Người giới thiệu</Th>
            <Th>Gửi lúc</Th>
            <Th>Còn lại</Th>
            <Th className="text-right">Thao tác</Th>
          </Thead>
          <tbody>
            {(data ?? []).map((l) => (
              <Tr key={l.id}>
                <Td className="font-medium">{l.fullName}</Td>
                <Td>{l.phone}</Td>
                <Td>{SCALE[l.scale] ?? l.scale}</Td>
                <Td>{l.referrer || "—"}</Td>
                <Td className="text-muted">
                  {new Date(l.createdAt).toLocaleString("vi-VN")}
                </Td>
                <Td className="text-muted">{remaining(l.expireAt)}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" disabled={busy === l.id} onClick={() => approve(l)}>
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy === l.id}
                      onClick={() => reject(l)}
                    >
                      Từ chối
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
            {(data ?? []).length === 0 && (
              <TableEmpty colSpan={7}>
                {loading ? "Đang tải…" : error ? error : "Không có yêu cầu nào đang chờ duyệt."}
              </TableEmpty>
            )}
          </tbody>
        </Table>
      </Card>

      {result && (
        <Modal title="Đã duyệt" onClose={() => setResult(null)}>
          <p className="text-sm">
            Đã tạo tài khoản cho <b>{result.fullName}</b> với gói Trial 30 ngày. Gửi thông tin đăng nhập
            cho khách — mật khẩu chỉ hiện một lần.
          </p>
          <div className="mt-3 space-y-1 rounded-lg border border-border bg-background p-3 text-sm">
            <div>
              Tên đăng nhập: <span className="font-mono font-semibold select-all">{result.username}</span>
            </div>
            <div>
              Mật khẩu: <span className="font-mono font-semibold select-all">{result.password}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setResult(null)}>Đóng</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
