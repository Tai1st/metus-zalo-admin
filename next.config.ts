import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Mặc định Next.js chỉ đọc 10MB đầu của body trong Route Handler rồi âm thầm cắt bỏ phần
    // còn lại (không báo lỗi) — route upload IPA của Cert Shop cần tới 100MB nên phải nới ra.
    middlewareClientMaxBodySize: "110mb",
  },
};

export default nextConfig;
