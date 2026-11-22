export const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";
export const fmtTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("vi-VN") : "—";

export type LinkPlan = {
  id: string;
  code: string;
  name: string;
  description?: string;
  limit: number;
  period: "day" | "week" | "month";
  prices: { months: number; price: number }[];
  currency: string;
  systemDomains: string[];
  maxCustomDomains: number;
  isActive: boolean;
  sortOrder: number;
  /** % giảm khi mua 3 tháng / 1 năm; giá các kỳ này do backend tự tính từ giá 1 tháng. */
  discount3?: number;
  discount12?: number;
};

export const PERIOD_LABEL: Record<string, string> = {
  day: "ngày",
  week: "tuần",
  month: "tháng",
};
