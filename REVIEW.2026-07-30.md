# Forge Next.js Codebase Review Report

## A. Executive Summary

Forge adalah aplikasi Next.js 14.2.15 berbasis client-side yang mengadopsi pola monolith sederhana dengan satu halaman (`src/app/page.tsx`) dan empat view utama: Projects, AI Workspace, Kanban, dan Design Canvas. Seluruh state dikelola oleh Zustand (`src/lib/store.ts`) dan tidak ada backend API, database, atau integrasi eksternal yang nyata. Fitur interaktif paling matang adalah Design Canvas (drag, resize, undo/redo, layer, inspector), sementara Projects, AI Workspace, dan Kanban berjalan sepenuhnya atas data mock/hardcode dan logika frontend-only. Build, lint, dan smoke test canvas berhasil dijalankan tanpa error. Tidak ada masalah fatal (broken route atau crash), tetapi aplikasi ini masih pada tahap prototipe/mockup fungsional tanpa persistence atau integrasi backend.

## B. Technology and Architecture Overview

| Item | Detail | Evidence |
|------|--------|----------|
| Framework | Next.js 14.2.15 (App Router) | `package.json` line 15 |
| Language | TypeScript 5 | `package.json` line 18, `tsconfig.json` |
| Styling | Tailwind CSS v3.4.1 | `package.json` line 23, `tailwind.config.ts` |
| State Management | Zustand | `src/lib/store.ts` line 1 (`import { create } from "zustand"`) |
| Pages | CSR single-page app (`"use client"`) | `src/app/page.tsx` line 1 |
| Routing | View-based conditional rendering (projects / ai / kanban / design) | `src/app/page.tsx` lines 24-31 |
| Backend / API | Tidak ada (`src/app/api/` tidak ditemukan, `grep` untuk `export const GET/POST` = 0 hasil) | Static search |
| Database | Tidak ada. Semua data in-memory | `grep` untuk `prisma/knex/mongoose/drizzle/supabase/firebase` = 0 hasil |
| Testing | Smol canvas smoke test saja (47 assertions, pure Node + TS transpile) | `scripts/canvas_test.cjs` |
| Build Output | Static prerendered halaman (`/`) | `npm run build` output: "○ (Static) prerendered as static content" |

## C. Functional Requirement Review

| Fitur | Status Implementasi | Keterangan + Evidence |
|-------|---------------------|------------------------|
| Navigasi utama (Projects, AI Workspace, Kanban, Design Canvas) | **Partial** | Tombol ada dan meng-switch view (`src/app/page.tsx` lines 24-31). Namun halaman lain kecuali Projects dan Design Canvas berupa konten komponen; Sidebar menonaktifkan canvas selain Design Canvas (`src/components/Sidebar.tsx` lines 41-49). |
| Project List (Projects view) | **UI Only (Mock/Hardcode)** | Kartu proyek dirender dari `seedProjects()` (`src/lib/store.ts` lines 52-69). Data 8 proyek hardcode. Tidak ada CRUD create/edit/delete project. |
| AI Workspace Chat | **Mock** | `sendChat()` hanya memodifikasi Zustand store lokal (`src/lib/store.ts` lines 95-109). Balasan AI adalah fungsi string `aiReply()` (line 121-126) dan `applyReqEdit()` (line 128-140). Tidak ada panggilan API/LLM sunggal. |
| Model selector (GPT-4o, Claude, dll) | **UI Only (Mock)** | Hanya state `model` lokal untuk UI (`src/components/AIWorkspace.tsx` lines 34, 97, 202-229). Tidak ada pengaruh terhadap eksekusi. |
| Attachment (File/Folder/Knowledge) | **UI Only (Mock/Hardcode)** | `toggleAttach()` menghasilkan angka acak `Math.floor(Math.random() * 3) + 1` (`src/components/AIWorkspace.tsx` lines 64-66). Drag-and-drop menambah counter file tanpa upload nyata. |
| Requirement Generation (PRD, Stories, FR, NFR, AC, BR) | **Mock (Hardcode template)** | `generateRequirement()` menghasilkan konten berdasarkan template string dengan `slice(0, count)` (`src/lib/store.ts` lines 10-49). |
| Requirement Panel | **Partial (Frontend Only)** | Menampilkan requirement dari Zustand (`src/components/RequirementPanel.tsx` lines 19-98). Tidak ada penyimpanan permanen. |
| Send to Kanban / Sync Kanban | **Mock (In-memory)** | `sendToKanban()` memanggil `backfillKanban()` dan update flag `kanbanSyncedVer` di memory (`src/lib/store.ts` lines 110-118). |
| Kanban Board | **UI Only (Mock)** | Kartu dirender dari `p.kanban` (in-memory), tanpa drag-and-drop antar kolom, tanpa create/update/delete card (`src/components/Kanban.tsx` lines 47-66). |
| Design Canvas (Board + Screen mode) | **Partial (Functional Frontend)** | Mode board menampilkan daftar screen (halaman yang bisa diklik) dan mode screen menyediakan canvas interaktif (`src/components/DesignCanvas.tsx`). |
| Canvas Object Operations | **Partial (Functional Frontend)** | Tambah/duplikasi/hapus/paste/copy/cut/group/ungroup frame, text, shape (`src/lib/store.ts` lines 469-667). |
| Geometry (Move/Resize/Rotate) | **Partial (Functional Frontend)** | `setGeom()` dan event handler di `DesignCanvas.tsx` lines 214-287. |
| Undo/Redo | **Partial (Functional Frontend)** | Snapshot-based history (serialisasi JSON seluruh screens + guides) (`src/lib/store.ts` lines 783-822). |
| Rulers, Guides, Minimap, Alignment Grid | **Partial (Functional Frontend)** | Semua toggle dan interaksi ada (`src/lib/store.ts` lines 466-468, 824-836; `src/components/DesignCanvas.tsx` lines 508-564). |
| Layer Panel | **Partial (Functional Frontend)** | Search, expand/collapse, rename, visibility/lock toggle, delete, reorder (`src/components/LayersPanel.tsx`). |
| Inspector Panel (Design/Selected Node) | **Partial (Functional Frontend)** | Background, typography, autolayout, fill, stroke, effects, layer order (`src/components/SelectedNodeInspector.tsx`; `src/components/InspectorPanel.tsx`). |
| Auto-layout (Flexbox-like) | **Partial (Functional Frontend)** | Padding, gap, direction row/col, wrap (`src/lib/store.ts` lines 398-409, resizeAutoLayoutContainer). |
| Screen Management | **Hardcode Seed** | 3 screen awal (Dashboard, Login Page, Settings) dibuat di `seedScreens()` (`src/lib/store.ts` lines 196-234). Tidak ada UI untuk add/delete/rename screen. |
| Persistence (Save/Load) | **Not Implemented** | Interface `CanvasRepository` ada (`src/lib/canvasRepository.ts`) tetapi implementasi tunggal `InMemoryCanvasRepository` yang tidak pernah dipanggil di UI (`grep` untuk `canvasRepository` = 0 pemakaian aktif di komponen). |
| Collaboration / Real-time | **Not Implemented** | Tidak ada WebSocket, polling, atau multi-user state. |
| Export / Import | **Not Implemented** | Tidak ada menu export JSON/PNG/SVG/SQL. |
| Authentication | **Not Implemented** | Tidak ada login/signup/session API. |

## D. Frontend–Backend–Database Traceability

| User Action | Frontend Component | API / Controller | Service | Database | Response / UI Result | Bukti |
|-------------|-------------------|------------------|---------|----------|----------------------|-------|
| Buka app | `page.tsx` memilih view awal (`view: "ai"`) | Tidak ada API route | Zustand `useStore` / `useCanvas` | Tidak ada (in-memory) | AIWorkspace ditampilkan, project Atlas aktif | `src/app/page.tsx` lines 9-20; `src/lib/store.ts` lines 84-119 |
| Klik Projects → ProjectCard | `ProjectView` + `ProjectCard` meng-panggil `openProject(id)` | Memanggil `set({currentId, view:"ai"})` | Zustand store | In-memory projects array | View beralih ke AIWorkspace untuk project terpilih | `src/components/ProjectView.tsx` line 7; `src/lib/store.ts` line 93 |
| Kirim chat "generate brief" | `AIWorkspace` `submit()` → `sendChat(text)` | Tidak ada HTTP request | `aiReply()` + `applyReqEdit()` mencek kata kunci (brief/prd/story/fr/nfr/ac) | In-memory `p.requirement` di-update | Pesan AI tampil di log chat; requirement bertambah / berubah | `src/components/AIWorkspace.tsx` lines 73-81; `src/lib/store.ts` lines 95-109, 121-140 |
| Klik "Send to Kanban" | `RequirementPanel` `onSend()` → `sendToKanban(id)` | Tidak ada API route | `backfillKanban(p)` memecah requirement menjadi kartu | In-memory `p.kanban` | Kartu muncul di 4 kolom Kanban; badge "Synced" muncul | `src/components/RequirementPanel.tsx` lines 40-45; `src/lib/store.ts` lines 110-118, 181-194 |
| Klik Design Canvas → Board | `Sidebar` setView("design") → `DesignCanvas` | Tidak ada API route | `useCanvas` store | In-memory `SCREENS` | Board menampilkan 3 screen thumbnail | `src/components/Sidebar.tsx` lines 41-49; `src/components/DesignCanvas.tsx` lines 473-487 |
| Klik screen thumbnail → screen mode | `setCanvasScreen(name)` + set mode "screen" | Tidak ada API route | `useCanvas` | In-memory `SCREENS` | Canvas viewport menampilkan nodes dengan zoom-to-fit | `src/components/DesignCanvas.tsx` lines 109-119, 473-488 |
| Tambah frame + ketik teks | Toolbar/tooltip + keyboard shortcut → `addNode()` → selected + editing | Tidak ada API route | `useCanvas.addNode`, `measureTextNode` | In-memory nodes array | Frame/text muncul di canvas, bisa diketik, ukuran menyesuaikan teks | `src/lib/store.ts` lines 649-659; `src/components/DesignCanvas.tsx` lines 169-189, 300-315 |
| Drag frame + resize | `onNodeDown` / `onResizeStart` + `onVpMove` → `setGeom()` | Tidak ada API route | `useCanvas.setGeom` | In-memory node props | Posisi/size berubah saat drag | `src/components/DesignCanvas.tsx` lines 191-241 |
| Copy/Paste + Group/Ungroup | Shortcut / menu button → `copySelected/cutSelected/pasteClipboard/groupSelected/ungroupSelected` | Tidak ada API route | `useCanvas` mutations | In-memory nodes + clipbaord | Node disalin/dikelompokkan/di-ungroup di layers | `src/lib/store.ts` lines 469-667 |
| Undo/Redo | Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z → `undo()/redo()` | Tidak ada API route | `useCanvas.undo/redo` memuat snapshot JSON history | In-memory `SCREENS` reference yang dimutasi | Canvas kembali ke state sebelumnya | `src/lib/store.ts` lines 810-822 |

## E. Missing or Non-Functional Features

| Fitur / Requirement | Status | Keterangan |
|---------------------|--------|------------|
| Backend API (REST/GraphQL/Next.js Route Handlers) | **Missing** | `src/app/api/` tidak ada. Semua logika di client. |
| Database (persistent storage) | **Missing** | `InMemoryCanvasRepository` ada tapi tidak digunakan di komponen (`src/lib/canvasRepository.ts`). |
| Authentication & Authorization | **Not Implemented** | Tidak ada login, session, atau RBAC. |
| Project CRUD | **Not Implemented** | Hanya open project (read). Tidak ada create/update/delete project UI atau logic. |
| Kanban drag-and-drop antar kolom | **Missing** | Kartu statis tanpa DnD (`src/components/Kanban.tsx` lines 47-66). |
| Kanban card create/edit/delete | **Missing** | Hanya render card dari requirement. Tidak ada form atau editor card. |
| Real AI / LLM Integration | **Not Implemented** | Balasan AI hanya logika string matching + template lokal (`src/lib/store.ts` lines 121-140). |
| File upload (attachment) | **Not Implemented** | Counter file acak UI-only (`src/components/AIWorkspace.tsx` lines 64-66). |
| Knowledge/Folder attachment storage | **UI Only** | Tidak ada upload, indexing, atau penyimpanan file. |
| Canvas Save/Load | **Not Implemented** | `CanvasRepository` interface ada tapi tidak dipakai di komponen. Navigasi reload kehilangan state. |
| Canvas Export (PNG/JPG/SVG/JSON) | **Missing** | Tidak ada tombol export atau library DOM-to-image. |
| Multi-screen management UI | **Not Implemented** | `seedScreens()` membuat 3 screen, tetapi tidak ada UI untuk add/delete/rename screen. |
| Collaboration (multi-user, comments) | **Missing** | Tidak ada real-time, comment thread, atau user presence. |
| Validation & Error Boundaries | **Partial** | Tidak ada React Error Boundary, hanya validasi sederhana (hex color, zoom clamp). Tidak ada handling error global untuk API (karena API tidak ada). |
| Logging / Monitoring | **Missing** | Tidak ada logger. `grep` untuk `console.log/error/warn` = 0 di `src/`. |

## F. Gap Analysis

| Area | Current State (Based on Code) | Target / Expected State | Gap |
|------|-------------------------------|-------------------------|-----|
| State persistence | In-memory Zustand, `InMemoryCanvasRepository` unused | Save ke IndexedDB / backend API agar survive reload | `src/lib/canvasRepository.ts` tidak diintegrasikan; semua perubahan hilang saat refresh. |
| Backend services | Kosong. Tidak ada Next.js Route Handlers. | API routes untuk project, requirement, kanban, canvas save/load. | Tidak ada file `src/app/api/**`. |
| Database | Tidak ada schema atau koneksi DB. | Minimal schema: projects, requirements, kanban_cards, canvas_screens, nodes, users. | Path `prisma/`, `drizzle/`, `migrations/` tidak ada. |
| AI | Local heuristic reply (template string). | Panggilan ke LLM API (OpenAI/Anthropic) dengan context requirement + canvas state. | `src/lib/store.ts` lines 121-140 bukan integrasi API sunggal. |
| Kanban | Read-only generated cards dari requirement. | Drag-drop antar kolom, create/edit/delete card, assignment, due date. | `src/components/Kanban.tsx` tanpa DnD atau form editor. |
| File/Knowledge attachment | Counter random + drag visual only. | Upload ke storage (S3/local), metadata disimpan, preview di chat. | `src/components/AIWorkspace.tsx` lines 64-66, 89-94. |
| Project management | Open existing project hanya. | Create project form, delete/archive, settings (name, type, stage, progress). | `src/lib/store.ts` line 93 hanya `openProject`. |
| Canvas management | 3 hardcoded screens dari `seedScreens()`. | CRUD screen, import/export design file, template library. | `src/lib/store.ts` lines 196-234 + tidak ada UI manajemen. |
| Testing | 1 smoke test Node (store logic). | Unit test per component, E2E (Playwright/Cypress), lint + typecheck di CI. | `scripts/canvas_test.cjs` saja. |

## G. AI Recommendation Review

| Komponen AI | Realitas Berdasarkan Kode | Masalah / Risiko |
|-------------|--------------------------|------------------|
| AI Chat (AIWorkspace) | **Tidak ada LLM sunggal.** `sendChat()` hanya regex + template (`src/lib/store.ts` lines 95-109, 121-140). | User akan merasa ditipu jika ekspektasi "AI partner" tinggi. Tidak ada konteks window, prompt engineering, guardrail, atau streaming. |
| Model selector | **Purely cosmetic.** State `model` disimpan dan ditampilkan, tidak mempengaruhi output (`src/components/AIWorkspace.tsx` lines 34, 78-80, 202-229). | Menyesatkan user; cleanup atau integrasi backend diperlukan agar benar-benar berpengaruh. |
| Requirement auto-generation | **Hardcode template dengan `.slice(0, c.stories)`** (`src/lib/store.ts` lines 14-49). | Tekstur dan kualitas terbatas. Tidak ada adaptasi konteks proyek sunggal. |
| Canvas AI context menu | **Hardcode 3 opsi + literal replace** (`src/components/DesignCanvas.tsx` lines 386-394). | Hanya "Make it dark", "Add chart", "Turn into sidebar". Tidak generatif. |
| AI sebagai single source of truth | **Klaim di UI tetapi hanya in-memory Zustand.** Requirement disimpan di `p.requirement` yang hilang saat reload. | Over claim. Feature "source of truth" hanyalah istilah marketing tanpa persistence. |

## H. Recommended Backlog

| Priority | Item | Justifikasi (berdasarkan bukti kode) |
|----------|------|--------------------------------------|
| P0 | **Persistensi State (localStorage + API)** | Semua project, requirement, kanban, dan canvas hilang saat reload. `InMemoryCanvasRepository` belum dipakai (`src/lib/canvasRepository.ts`). |
| P0 | **Real backend API (Next.js Route Handlers)** | Tidak ada `src/app/api/**`. Tanpa ini fitur lain tidak bisa di-share/disimpan. |
| P1 | **Project CRUD UI + Validation** | Tidak ada create/edit/delete project. Hanya `openProject` (`src/lib/store.ts` line 93). |
| P1 | **Integrasi LLM sunggal untuk AI Workspace** | `aiReply()` dan `applyReqEdit()` hanya template string (`src/lib/store.ts` lines 121-140). Model selector adalah opsi kosong (`src/components/AIWorkspace.tsx`). |
| P1 | **Kanban card editor + drag-and-drop** | Kartu statis tanpa aksi edit/drag (`src/components/Kanban.tsx` lines 47-66). |
| P1 | **Canvas Save/Load integration** | Repository ada (`src/lib/canvasRepository.ts`) tetapi tidak ada pemanggilan dari komponen. |
| P2 | **Multi-screen management** | `seedScreens()` menghasilkan 3 screen (`src/lib/store.ts` lines 196-234) tanpa UI tambah/hapus. |
| P2 | **Export/Import Design** | Tidak ada tombol export PNG/JPG/JSON pada Design Canvas. |
| P2 | **File upload + Knowledge base** | Attachment UI hanya counter acak (`src/components/AIWorkspace.tsx` lines 64-66). |
| P2 | **Authentication & multi-user** | Required sebelum fitur sharing/collaboration/logging. |
| P3 | **Testing & CI** | Hanya 1 smoke test. Perlu unit test (zustand logic), component test, dan E2E. |
| P3 | **Error Boundary + Global Error Handling** | Tidak ada safety net untuk crash React (misal error render di canvas). |
| P3 | **Cleanup unused hardcode & misleading AI claims** | Label "AUTO" / "source of truth" tanpa persistence menyesatkan (`src/components/RequirementPanel.tsx` line 106; `src/lib/store.ts` line 43). |

## I. Final Conclusion

Forge adalah prototipe monolith client-side yang berhasil membangun **Design Canvas yang cukup fungsional** (operasi node, zoom/pan, undo/redo, layer inspector, autolayout) namun selain itu seluruh fitur lain — Projects, AI Workspace, dan Kanban — berada pada tingkat **UI-only / mock / hardcode**. Tidak ada backend, tidak ada database, tidak ada API routes, dan tidak ada integration LLM sunggal. Aplikasi ini cocok sebagai **deskripsi visual dan alur produk** atau proof-of-concept, tetapi belum memenuhi kriteria produksi yang membutuhkan persistence, keamanan, atau kolaborasi. Langkah realistis berikutnya adalah menambahkan persistence (localStorage sementara, kemudian API + database), mengintegrasikan LLM sunggal, serta memperluas kanban dan manajemen project sebelum menambahkan canvas baru yang lain.

---

### Pertanyaan Klarifikasi untuk User

1. Apakah canvas Frontend/Backend/Database/Testing/Brand harus benar-benar memiliki konten dan fungsi masing-masing, atau cukup placeholder UI?
2. Apakah ada target deployment/storage (misal Vercel + Supabase, atau tetap lokal)?
3. Apakah AI Workspace memang perlu integrasi LLM sunggal, atau cukup heuristik lokal yang dijelaskan sebagai "assistant" (bukan "AI")?
4. Apakah ada requirement khusus untuk export format design (Figma-like JSON, PNG, atau code generation)?
5. Apakah user authentication dan multi-tenant diharapkan di scope awal atau bisa ditunda ke fase berikut?
