"use client";

import { useState } from "react";
import { apiSend, useApi } from "@/hooks/useApi";
import {
  Badge,
  Button,
  Card,
  inputCls,
  Notice,
  Table,
  TableEmpty,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";

type Domain = {
  id: string;
  host: string;
  kind: "system";
  status: "active" | "disabled";
  isDefault: boolean;
};

export function DomainsTab() {
  const { data, loading, error, reload } = useApi<Domain[]>("/api/short-links/domains");
  const [host, setHost] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function run(fn: () => Promise<unknown>) {
    setMsg("");
    try {
      await fn();
      reload();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function add() {
    if (!host.trim()) return;
    setSaving(true);
    await run(async () => {
      await apiSend("/api/short-links/domains", "POST", {
        host: host.trim().toLowerCase(),
        isDefault,
      });
      setHost("");
      setIsDefault(false);
    });
    setSaving(false);
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block w-64 max-w-full">
          <span className="mb-1 block text-xs font-medium text-muted">Tên miền (host)</span>
          <input
            className={inputCls}
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="vd: link.metus.vn"
          />
        </label>
        <label className="flex h-9 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Đặt làm mặc định
        </label>
        <Button onClick={add} disabled={saving || !host.trim()}>
          + Thêm tên miền
        </Button>
      </div>
      {(error || msg) && (
        <div className="mb-3">
          <Notice>{msg || error}</Notice>
        </div>
      )}
      <Table minWidth={560}>
        <Thead>
          <Th>Tên miền</Th>
          <Th>Trạng thái</Th>
          <Th>Mặc định</Th>
          <Th className="text-right">Thao tác</Th>
        </Thead>
        <tbody>
          {(data ?? []).map((d) => (
            <Tr key={d.id}>
              <Td className="font-mono text-xs">{d.host}</Td>
              <Td>
                {d.status === "active" ? (
                  <Badge tone="success">Đang bật</Badge>
                ) : (
                  <Badge>Đã tắt</Badge>
                )}
              </Td>
              <Td>{d.isDefault ? <Badge tone="warning">Mặc định</Badge> : "—"}</Td>
              <Td className="text-right">
                {!d.isDefault && d.status === "active" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        run(() =>
                          apiSend(`/api/short-links/domains/${d.id}`, "PATCH", {
                            isDefault: true,
                          }),
                        )
                      }
                    >
                      Đặt mặc định
                    </Button>{" "}
                  </>
                )}
                {d.status === "active" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!confirm(`Tắt tên miền ${d.host}?`)) return;
                      run(() => apiSend(`/api/short-links/domains/${d.id}`, "DELETE"));
                    }}
                  >
                    Tắt
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      run(() =>
                        apiSend(`/api/short-links/domains/${d.id}`, "PATCH", {
                          isActive: true,
                        }),
                      )
                    }
                  >
                    Bật lại
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
          {!loading && (data ?? []).length === 0 && (
            <TableEmpty colSpan={4}>Chưa có tên miền hệ thống.</TableEmpty>
          )}
        </tbody>
      </Table>
    </Card>
  );
}
