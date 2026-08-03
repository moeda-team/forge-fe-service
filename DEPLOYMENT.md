# Deploy Forge Frontend ke Vercel

Dokumen ini menjelaskan deployment `forge-fe` setelah `forge-be` dan database Neon tersedia.

## Prasyarat

- Backend sudah bisa diakses melalui HTTPS.
- `GET https://<forge-be>/health/ready` menghasilkan status 200.
- Prisma migration pada database Production sudah dijalankan.
- Repository `forge-fe` sudah ada di GitHub.

Panduan lengkap backend tersedia pada `DEPLOYMENT.md` di repository `forge-be`.

## 1. Validasi sebelum push

```bash
cd forge-fe
npm install
npm run build
npm run test:canvas
npm audit
```

Jangan deploy untuk public production jika audit masih melaporkan vulnerability kritis. Upgrade dependency secara terkontrol dan jalankan kembali build serta smoke test.

Commit dan push perubahan terbaru:

```bash
git add .
git commit -m "Integrate Forge frontend with backend"
git push origin main
```

## 2. Import repository ke Vercel

1. Di Vercel Dashboard, pilih **Add New → Project**.
2. Import repository `forge-fe`.
3. Framework Preset seharusnya otomatis terdeteksi sebagai **Next.js**.
4. Pastikan **Root Directory** adalah root `forge-fe`.
5. Gunakan build command default `npm run build`.

## 3. Tambahkan environment variable frontend

Di **Project Settings → Environment Variables**, tambahkan:

```env
NEXT_PUBLIC_FORGE_API_ENABLED=true
FORGE_API_URL="https://forge-be.example.com"
```

Gunakan URL backend tanpa trailing slash dan tanpa `/api` di belakangnya.

Benar:

```text
https://forge-be.vercel.app
```

Salah:

```text
https://forge-be.vercel.app/
https://forge-be.vercel.app/api
```

Hanya `NEXT_PUBLIC_FORGE_API_ENABLED` yang masuk ke bundle browser. `FORGE_API_URL` digunakan oleh server Next.js untuk proxy `/api/v1`; jangan pernah menyimpan `GEMINI_API_KEY`, database URL, atau JWT secret di frontend.

Pilih Production, dan tambahkan nilai Preview terpisah jika diperlukan. Vercel hanya menerapkan perubahan environment variable pada deployment baru, bukan deployment lama. Lihat [Vercel environment variables](https://vercel.com/docs/environment-variables).

## 4. Deploy frontend

Klik **Deploy**. Setelah berhasil, catat URL production, misalnya:

```text
https://forge-fe.vercel.app
```

## 5. Izinkan frontend pada CORS backend

Kembali ke Vercel project `forge-be`, lalu ubah:

```env
API_ORIGIN="https://forge-fe.vercel.app"
```

Jika ada beberapa origin yang memang diizinkan, pisahkan dengan koma:

```env
API_ORIGIN="https://forge-fe.vercel.app,https://preview-forge-fe.vercel.app"
```

Redeploy backend. Tanpa redeploy, backend lama tetap memakai nilai CORS sebelumnya.

## 6. Verifikasi frontend

1. Buka URL production frontend.
2. Pastikan halaman Login/Register muncul. Jika langsung muncul data mock, `NEXT_PUBLIC_FORGE_API_ENABLED` belum terbaca saat build.
3. Register akun baru.
4. Buat project dan refresh halaman Projects.
5. Pastikan project masih tersedia setelah refresh.
6. Kirim prompt melalui AI Workspace.
7. Pastikan Requirement berubah berdasarkan respons backend.
8. Kirim Requirement ke Kanban dan verifikasi task.
9. Buat objek pada Design Canvas, tunggu minimal satu detik, refresh, dan pastikan objek tetap ada.
10. Sign out dan sign in kembali untuk memeriksa session flow.

## Local production-like test

Backend `.env`:

```env
API_ORIGIN="http://localhost:3000"
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_FORGE_API_ENABLED=true
FORGE_API_URL="http://localhost:4000"
```

Jalankan dua terminal:

```bash
# Terminal 1
cd forge-be
npm run dev
```

```bash
# Terminal 2
cd forge-fe
npm run dev
```

Buka `http://localhost:3000`.

## Preview deployment

- Branch selain production branch akan menghasilkan Preview Deployment.
- Isi `NEXT_PUBLIC_FORGE_API_ENABLED` dan `FORGE_API_URL` untuk environment Preview.
- Pastikan URL Preview frontend diizinkan oleh `API_ORIGIN` backend Preview bila ada akses browser langsung.
- Gunakan database atau Neon branch khusus Preview jika data harus terisolasi.
- Hindari memasukkan semua dynamic preview domain ke CORS; fixed branch alias lebih mudah dikontrol.

## Troubleshooting

### Frontend masih menampilkan data demo

- Pastikan `NEXT_PUBLIC_FORGE_API_ENABLED=true` dan `FORGE_API_URL` tersedia pada environment deployment yang benar.
- Pastikan `FORGE_API_URL` tidak berakhiran `/api`.
- Redeploy frontend setelah mengubah variable.

### `Failed to fetch`

- Buka backend `/health/ready` secara langsung.
- Periksa browser Network dan Vercel Function logs.
- Periksa `API_ORIGIN` pada backend bila ada panggilan lintas-origin.
- Pastikan frontend dan backend sama-sama memakai HTTPS di production.

### CORS error

Pastikan backend memiliki exact origin frontend tanpa trailing slash, kemudian redeploy backend.

### Login selalu kembali ke halaman login

- Periksa respons `/api/v1/auth/login` pada browser Network.
- Pastikan `JWT_SECRET` backend tersedia dan tidak berubah.
- Hapus token lama dengan Sign out, lalu login kembali.

### Chat menjawab `Request failed`

- Periksa respons `/api/v1/ai/chat` dan Vercel logs backend.
- Pastikan `GEMINI_API_KEY` hanya dikonfigurasi di backend.
- Jika backend mengembalikan `mode: local`, periksa key, quota, dan model Gemini.

### Canvas tidak tersimpan

- Tunggu minimal 600 ms setelah edit sebelum refresh karena penyimpanan menggunakan debounce.
- Pastikan screen berhasil dibuat dan request `PUT /api/v1/screens/:id/document` tidak error.
- Periksa token login dan membership project.

## Checklist production

- [ ] Build dan canvas smoke test lulus.
- [ ] Tidak ada vulnerability kritis yang belum ditangani.
- [ ] `NEXT_PUBLIC_FORGE_API_ENABLED=true` dan `FORGE_API_URL` menunjuk backend Production.
- [ ] Tidak ada secret backend pada variable `NEXT_PUBLIC_*`.
- [ ] Backend mengizinkan exact origin frontend.
- [ ] Login/register, project, Gemini, Kanban, dan canvas persistence lulus end-to-end test.
- [ ] Environment Preview dan Production tidak tertukar.
