"use client";

import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { RevenueSection } from "@/components/RevenueSection";

type Stats = {
  totalCustomers: number;
  subscriptions: { active: number; pending: number; expired: number; cancelled: number };
  revenue: { thisMonth: number; total: number; byMonth: { month: string; total: number; count: number }[] };
  activeByPlan: { planCode: string; count: number }[];
  signupsByDay: { date: string; count: number }[];
};

const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";

export default function DashboardPage() {
  const { data, loading, error } = useApi<Stats>("/api/stats");

  return (
    <div>
      <PageHeader
        title="Tổng quan"
        subtitle="Số liệu tính trực tiếp từ cơ sở dữ liệu, không phải số mẫu."
      />

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading && !data && <p className="text-sm text-muted">Đang tải…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Khách hàng" value={data.totalCustomers} />
            <StatCard
              label="Đăng ký đang hiệu lực"
              value={data.subscriptions.active}
              hint={`${data.subscriptions.expired} hết hạn`}
            />
            <StatCard
              label="Doanh thu tháng này"
              value={fmtVnd(data.revenue.thisMonth)}
            />
            <StatCard label="Tổng doanh thu (6 tháng)" value={fmtVnd(data.revenue.total)} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Doanh thu theo tháng</h2>
              {data.revenue.byMonth.length === 0 ? (
                <p className="text-sm text-muted">Chưa có dữ liệu.</p>
              ) : (
                <div className="space-y-2">
                  {data.revenue.byMonth.map((m) => {
                    const max = Math.max(...data.revenue.byMonth.map((x) => x.total), 1);
                    return (
                      <div key={m.month} className="flex items-center gap-2 text-xs">
                        <span className="w-16 shrink-0 text-muted">{m.month}</span>
                        <div className="h-3 flex-1 overflow-hidden rounded bg-background">
                          <div
                            className="h-full rounded bg-brand"
                            style={{ width: `${(m.total / max) * 100}%` }}
                          />
                        </div>
                        <span className="w-28 shrink-0 text-right font-medium">
                          {fmtVnd(m.total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold">
                Đăng ký hiệu lực theo gói
              </h2>
              {data.activeByPlan.length === 0 ? (
                <p className="text-sm text-muted">Chưa có đăng ký nào hiệu lực.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.activeByPlan.map((p) => (
                    <li key={p.planCode} className="flex items-center justify-between">
                      <span className="capitalize">{p.planCode}</span>
                      <span className="font-medium">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
          <RevenueSection />
        </>
      )}
    </div>
  );
}
