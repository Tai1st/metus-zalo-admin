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
import { fmtTime } from "./shared";

type ShortLink = {
  id: string;
  code: string;
  kind: "product" | "campaign";
  title: string;
  image?: string;
  webUrl: string;
  domain: string;
  ownerId: string;
  clicks: number;
  createdAt: string;
};

export function LinksTab() {
  const { data, loading, error, reload } = useApi<ShortLink[]>("/api/short-links/links");
  const [msg, setMsg] = useState("");

  async function remove(l: ShortLink) {
    if (!confirm(`Xóa link ${l.domain}/${l.code}? Không thể hoàn tác.`)) return;
    setMsg("");
    try {
      await apiSend(`/api/short-links/links/${l.id}`, "DELETE");
      reload();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <Card className="p-4">
      {(error || msg) && (
        <div className="mb-3">
          <Notice>{msg || error}</Notice>
        </div>
      )}
      <Table minWidth={820}>
        <Thead>
          <Th>Link</Th>
          <Th>Tiêu đề</Th>
          <Th>Loại</Th>
          <Th>Chủ sở hữu</Th>
          <Th>Lượt bấm</Th>
          <Th>Tạo lúc</Th>
          <Th className="text-right">Thao tác</Th>
        </Thead>
        <tbody>
          {(data ?? []).map((l) => (
            <Tr key={l.id}>
              <Td className="font-mono text-xs">
                {l.domain}/{l.code}
              </Td>
              <Td className="max-w-64 truncate">
                <span title={l.title}>{l.title}</span>
              </Td>
              <Td>
                <Badge>{l.kind === "product" ? "Sản phẩm" : "Chiến dịch"}</Badge>
              </Td>
              <Td className="font-mono text-xs">{l.ownerId}</Td>
              <Td>{l.clicks}</Td>
              <Td className="text-xs text-muted">{fmtTime(l.createdAt)}</Td>
              <Td className="text-right">
                <Button variant="ghost" size="sm" onClick={() => remove(l)}>
                  Xóa
                </Button>
              </Td>
            </Tr>
          ))}
          {!loading && (data ?? []).length === 0 && (
            <TableEmpty colSpan={7}>Chưa có link nào.</TableEmpty>
          )}
        </tbody>
      </Table>
      <p className="mt-3 text-xs text-muted">Hiển thị tối đa 200 link.</p>
    </Card>
  );
}
