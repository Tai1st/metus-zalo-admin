"use client";

import { useState } from "react";
import { apiSend, useApi } from "@/hooks/useApi";
import { Badge, Button, Card, Notice, Table, TableEmpty, Td, Th, Thead, Tr } from "@/components/ui";

type CustomDomain = {
  id: string;
  host: string;
  status: "pending" | "active" | "disabled";
  verifiedAt: string | null;
  createdAt: string;
  nameServers?: string[];
  cfZoneId?: string;
  owner: { username: string; fullName: string } | null;
  linkCount: number;
};

const STATUS = {
  active: <Badge tone="success">Đang hoạt động</Badge>,
  pending: <Badge tone="warning">Chờ xác minh</Badge>,
  disabled: <Badge tone="danger">Đã tắt</Badge>,
} as const;

/** Tên miền riêng do người dùng tự thêm: admin xem, xác minh thay, bật/tắt, xóa. */
export function CustomDomainsTab() {
  const { data, loading, error, reload } = useApi<CustomDomain[]>("/api/short-links/custom-domains");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  async function run(id: string, fn: () => Promise<unknown>) {
    setMsg("");
    setBusy(id);
    try {
      await fn();
      reload();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const url = (d: CustomDomain) => `/api/short-links/custom-domains/${d.id}`;

  return (
    <Card className="p-4">
      {(error || msg) && (
        <div className="mb-3">
          <Notice>{msg || error}</Notice>
        </div>
      )}
      <Table minWidth={900}>
        <Thead>
          <Th>Tên miền</Th>
          <Th>Chủ sở hữu</Th>
          <Th>Trạng thái</Th>
          <Th>Số link</Th>
          <Th>Ngày thêm</Th>
          <Th className="text-right">Thao tác</Th>
        </Thead>
        <tbody>
          {(data ?? []).map((d) => (
            <Tr key={d.id}>
              <Td>
                <div className="font-mono text-xs">{d.host}</div>
                {d.status === "pending" && d.nameServers && d.nameServers.length > 0 && (
                  <div className="mt-0.5 text-[11px] text-muted">NS: {d.nameServers.join(", ")}</div>
                )}
              </Td>
              <Td>
                {d.owner ? (
                  <>
                    <div>{d.owner.username}</div>
                    {d.owner.fullName && <div className="text-xs text-muted">{d.owner.fullName}</div>}
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Td>
              <Td>{STATUS[d.status]}</Td>
              <Td>{d.linkCount}</Td>
              <Td className="text-muted">{new Date(d.createdAt).toLocaleDateString("vi-VN")}</Td>
              <Td className="text-right">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {d.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy === d.id}
                      onClick={() => run(d.id, () => apiSend(`${url(d)}/verify`, "POST"))}
                    >
                      Xác minh
                    </Button>
                  )}
                  {d.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy === d.id}
                      onClick={() => {
                        if (!confirm(`Tắt tên miền ${d.host}? Người dùng sẽ không chọn được khi tạo link mới.`)) return;
                        void run(d.id, () => apiSend(url(d), "PATCH", { isActive: false }));
                      }}
                    >
                      Tắt
                    </Button>
                  )}
                  {d.status === "disabled" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy === d.id}
                      onClick={() => run(d.id, () => apiSend(url(d), "PATCH", { isActive: true }))}
                    >
                      Bật lại
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busy === d.id}
                    onClick={() => {
                      const extra = d.linkCount ? ` ${d.linkCount} link đang dùng tên miền này sẽ không còn mở được.` : "";
                      if (!confirm(`Xóa tên miền ${d.host}?${extra}`)) return;
                      void run(d.id, () => apiSend(url(d), "DELETE"));
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
          {!loading && (data ?? []).length === 0 && <TableEmpty colSpan={6}>Chưa có người dùng nào thêm tên miền riêng.</TableEmpty>}
        </tbody>
      </Table>
    </Card>
  );
}
