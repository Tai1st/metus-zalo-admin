"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui";
import { OrdersTab } from "./OrdersTab";
import { PlansTab } from "./PlansTab";
import { DomainsTab } from "./DomainsTab";
import { MembershipsTab } from "./MembershipsTab";
import { LinksTab } from "./LinksTab";

const TABS = [
  { key: "orders", label: "Đơn hàng" },
  { key: "plans", label: "Gói link" },
  { key: "domains", label: "Tên miền hệ thống" },
  { key: "memberships", label: "Gán gói" },
  { key: "links", label: "Tất cả link" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ShortLinksPage() {
  const [tab, setTab] = useState<TabKey>("orders");
  return (
    <div>
      <PageHeader
        title="Link rút gọn"
        subtitle="Đơn mua gói, gói link, tên miền hệ thống, gán gói và toàn bộ link TikTok Shop."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1 text-xs ${
              tab === t.key
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface hover:bg-background"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "orders" && <OrdersTab />}
      {tab === "plans" && <PlansTab />}
      {tab === "domains" && <DomainsTab />}
      {tab === "memberships" && <MembershipsTab />}
      {tab === "links" && <LinksTab />}
    </div>
  );
}
