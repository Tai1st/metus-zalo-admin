# Deploy metus-zalo-admin lên VPS — cms-zalo.metus.vn

Cùng VPS với FE/BE (xem `deploy.md` của metus-zalo-be). Admin chạy cổng **3001**, gọi BE nội bộ qua `127.0.0.1:4100`.

## 1. DNS
A record: `cms-zalo → <IP VPS>`

## 2. Lần đầu trên VPS
```bash
cd /var/www
git clone git@github.com:Tai1st/metus-zalo-admin.git
cd metus-zalo-admin
printf 'BE_URL=http://127.0.0.1:4100\n' > .env
npm ci && npm run build
pm2 start npm --name metus-zalo-admin -- start   # next start -p 3001
pm2 save
```
(VPS cần quyền đọc repo: thêm deploy key hoặc dùng key sẵn có của user deploy.)

## 3. Nginx
```nginx
server {
    listen 80;
    server_name cms-zalo.metus.vn;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/metus-zalo-admin /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d cms-zalo.metus.vn      # bắt buộc HTTPS: cookie đăng nhập đặt cờ Secure
```

## 4. Tài khoản admin
Đăng nhập bằng tài khoản role `admin` của BE. Tạo trên VPS:
```bash
cd /var/www/metus-zalo-be
echo '<mật-khẩu>' | node scripts/create-admin.mjs --username adminweb --name "Quản trị viên"
```

## 5. Tự động deploy
Workflow `.github/workflows/deploy.yml` chạy khi push `main`. Cần secrets của repo:
`VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY` (giống repo FE/BE).
