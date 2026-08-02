# Panduan Lengkap Figma

> Panduan dari tingkat dasar sampai siap membuat UI, prototype, design system, dan handoff ke developer.
>
> **Catatan:** Nama menu, tampilan antarmuka, serta ketersediaan fitur dapat berubah mengikuti pembaruan Figma dan jenis paket akun.

---

## Daftar Isi

1. [Apa Itu Figma?](#1-apa-itu-figma)
2. [Produk dan Ekosistem Figma](#2-produk-dan-ekosistem-figma)
3. [Struktur Workspace Figma](#3-struktur-workspace-figma)
4. [Mengenal Antarmuka Figma Design](#4-mengenal-antarmuka-figma-design)
5. [Kamus Elemen Dasar Figma](#5-kamus-elemen-dasar-figma)
6. [Perbedaan Frame, Group, Section, dan Component](#6-perbedaan-frame-group-section-dan-component)
7. [Layer dan Hubungan Parent–Child](#7-layer-dan-hubungan-parentchild)
8. [Posisi, Ukuran, Alignment, dan Distribusi](#8-posisi-ukuran-alignment-dan-distribusi)
9. [Frame dan Constraints](#9-frame-dan-constraints)
10. [Auto Layout Secara Lengkap](#10-auto-layout-secara-lengkap)
11. [Responsive Design di Figma](#11-responsive-design-di-figma)
12. [Text dan Typography](#12-text-dan-typography)
13. [Warna, Fill, Stroke, dan Effects](#13-warna-fill-stroke-dan-effects)
14. [Shape, Vector, Boolean, Mask, dan Illustration](#14-shape-vector-boolean-mask-dan-illustration)
15. [Image, Video, dan Media](#15-image-video-dan-media)
16. [Component, Instance, Variant, dan Component Properties](#16-component-instance-variant-dan-component-properties)
17. [Styles, Variables, Modes, dan Design Tokens](#17-styles-variables-modes-dan-design-tokens)
18. [Library dan Design System](#18-library-dan-design-system)
19. [Prototyping Dasar](#19-prototyping-dasar)
20. [Prototyping Lanjutan](#20-prototyping-lanjutan)
21. [Kolaborasi, Komentar, dan Permission](#21-kolaborasi-komentar-dan-permission)
22. [Version History dan Branching](#22-version-history-dan-branching)
23. [Dev Mode dan Handoff ke Developer](#23-dev-mode-dan-handoff-ke-developer)
24. [Export Asset](#24-export-asset)
25. [Community, Plugin, Widget, dan Template](#25-community-plugin-widget-dan-template)
26. [Produk Figma Lainnya](#26-produk-figma-lainnya)
27. [Alur Kerja UI/UX dari Awal sampai Handoff](#27-alur-kerja-uiux-dari-awal-sampai-handoff)
28. [Cara Menata File Figma](#28-cara-menata-file-figma)
29. [Contoh Pembuatan Komponen UI](#29-contoh-pembuatan-komponen-ui)
30. [Shortcut Penting](#30-shortcut-penting)
31. [Kesalahan Umum dan Cara Memperbaikinya](#31-kesalahan-umum-dan-cara-memperbaikinya)
32. [Roadmap Belajar Figma](#32-roadmap-belajar-figma)
33. [Checklist Kualitas Desain](#33-checklist-kualitas-desain)
34. [Glosarium](#34-glosarium)
35. [Sumber Resmi](#35-sumber-resmi)

---

# 1. Apa Itu Figma?

Figma adalah platform kolaboratif untuk merancang antarmuka digital, membuat prototype interaktif, membangun design system, berdiskusi dalam satu file, dan menyerahkan spesifikasi desain kepada developer.

Figma umum digunakan untuk:

- UI aplikasi mobile.
- UI website dan dashboard.
- Wireframe dan user flow.
- Prototype interaktif.
- Design system dan component library.
- Diagram, workshop, dan brainstorming melalui FigJam.
- Presentasi melalui Figma Slides.
- Website yang dapat dipublikasikan melalui Figma Sites.
- Eksplorasi aplikasi atau prototype berbasis AI melalui Figma Make.
- Materi pemasaran berbasis template melalui Figma Buzz.
- Ilustrasi lebih ekspresif melalui Figma Draw.

## Kelebihan utama Figma

1. **Kolaboratif** — beberapa orang dapat bekerja dalam file yang sama secara langsung.
2. **Berbasis cloud** — perubahan tersimpan dan dapat dilihat oleh anggota tim sesuai izin akses.
3. **Lintas platform** — dapat digunakan melalui browser dan aplikasi desktop.
4. **Mendukung design system** — component, variable, style, dan library dapat digunakan berulang.
5. **Mendukung prototyping** — desain dapat dihubungkan menjadi simulasi produk.
6. **Mendukung developer handoff** — developer dapat melihat ukuran, warna, spacing, aset, serta informasi implementasi.

## Yang perlu dipahami sejak awal

Figma bukan sekadar alat menggambar. Figma bekerja dengan struktur objek, hubungan parent–child, aturan layout, reusable component, serta sistem nilai desain. Karena itu, desain yang terlihat sama belum tentu memiliki struktur yang sama baiknya.

Contohnya, dua tombol dapat terlihat identik. Namun:

- Tombol pertama dibuat dari rectangle dan text yang diposisikan manual.
- Tombol kedua dibuat memakai auto layout, padding, component, variant, dan variable.

Tombol kedua biasanya lebih mudah digunakan kembali, lebih responsif, dan lebih siap diserahkan kepada developer.

---

# 2. Produk dan Ekosistem Figma

Figma berkembang menjadi ekosistem beberapa produk. Fungsi masing-masing berbeda.

## 2.1 Figma Design

Digunakan untuk membuat UI, wireframe, mockup, prototype, component, design system, dan aset visual.

**Contoh penggunaan:**

- Mendesain login page.
- Membuat dashboard admin.
- Mendesain aplikasi mobile.
- Membuat komponen button, input, modal, dan table.
- Membuat prototype klik antarhalaman.

## 2.2 FigJam

Whiteboard kolaboratif untuk brainstorming, diagram, workshop, retrospective, mind map, user flow, dan diskusi tim.

**Contoh penggunaan:**

- Menyusun ide fitur.
- Membuat customer journey.
- Membuat flow proses bisnis.
- Voting ide saat workshop.
- Menulis sticky notes bersama tim.

## 2.3 Dev Mode

Mode khusus untuk membantu developer membaca desain dan menyiapkan implementasi.

Developer dapat menggunakannya untuk:

- Memeriksa ukuran dan jarak.
- Melihat properti layer.
- Mengambil asset.
- Melihat variable atau token.
- Mengetahui desain yang sudah berstatus siap dikembangkan.
- Membandingkan perubahan desain.

## 2.4 Figma Slides

Alat presentasi kolaboratif yang menggabungkan kemudahan membuat slide dengan kemampuan desain Figma.

Cocok untuk:

- Presentasi proyek.
- Design review.
- Pitch deck.
- Materi kelas.
- Presentasi produk.

## 2.5 Figma Sites

Alat untuk mendesain, membuat responsive layout, menambahkan interaksi, dan memublikasikan website.

Figma Sites memakai banyak konsep yang sudah dikenal dari Figma Design, seperti frame, auto layout, component, responsive behavior, dan library.

## 2.6 Figma Make

Alat berbasis AI untuk mengubah prompt dan konteks desain menjadi prototype atau produk interaktif berbasis kode.

Figma Make dapat digunakan untuk:

- Membuat eksplorasi produk dari prompt.
- Membuat prototype lebih fungsional.
- Mengembangkan ide berdasarkan design system.
- Melakukan iterasi dengan instruksi bahasa natural.

## 2.7 Figma Buzz

Alat pembuatan aset pemasaran yang tetap mengikuti aturan merek.

Contohnya:

- Konten media sosial.
- Digital ads.
- Poster acara.
- Materi kampanye.
- Variasi aset dalam banyak ukuran.

## 2.8 Figma Draw

Sekumpulan alat ilustrasi di dalam Figma Design untuk membuat visual yang lebih ekspresif menggunakan brush, transform, texture, vector editing, dan efek artistik.

---

# 3. Struktur Workspace Figma

Pemahaman struktur workspace penting supaya file tidak berantakan.

Secara umum, struktur Figma dapat dipahami seperti berikut:

```text
Organization / Workspace
└── Team
    └── Project
        └── File
            └── Page
                └── Section / Frame / Component / Layer
```

## 3.1 Organization atau Workspace

Ruang kerja tingkat atas untuk sebuah perusahaan, organisasi, atau kelompok besar. Di dalamnya dapat terdapat beberapa team dan project.

## 3.2 Team

Kelompok kerja yang berisi anggota dan project tertentu.

Contoh:

- Product Design Team.
- Marketing Team.
- Mobile App Team.
- Design System Team.

## 3.3 Project

Folder untuk mengelompokkan beberapa file yang berkaitan.

Contoh project:

- HRIS Redesign.
- Mobile Banking.
- Website Company Profile.
- Design System.

## 3.4 File

Dokumen kerja utama. Satu file dapat berisi banyak page.

Contoh nama file:

```text
HRIS — Attendance & Shift Scheduling
Mobile App — Authentication Flow
Design System — Core Components
```

## 3.5 Page

Halaman di dalam file untuk memisahkan kelompok pekerjaan.

Contoh struktur page:

```text
00 — Cover
01 — Research
02 — User Flow
03 — Wireframe
04 — UI Design
05 — Prototype
06 — Components
99 — Archive
```

## 3.6 Section

Area berlabel di dalam canvas untuk mengelompokkan frame atau desain berdasarkan topik, status, atau alur.

Contoh section:

- Login Flow.
- Employee Management.
- Ready for Review.
- Ready for Development.
- Exploration.

---

# 4. Mengenal Antarmuka Figma Design

Antarmuka Figma umumnya terdiri dari empat bagian utama.

## 4.1 Toolbar

Berisi alat untuk memilih, membuat, dan mengedit objek.

Alat yang umum ditemui:

- Move/Select.
- Frame.
- Section.
- Shape.
- Pen.
- Pencil atau brush pada mode tertentu.
- Text.
- Comment.
- Resources.

## 4.2 Left Sidebar

Biasanya memuat:

### Layers

Menampilkan urutan dan hierarki seluruh objek pada page.

### Assets

Menampilkan component lokal dan component dari library yang aktif.

### Pages

Menampilkan daftar page di dalam file.

## 4.3 Canvas

Area kerja tempat seluruh objek diletakkan.

Canvas Figma bersifat luas. Desainer dapat menempatkan banyak flow, frame, section, dan eksplorasi di area yang sama.

## 4.4 Right Sidebar

Menampilkan properti objek terpilih.

Properti yang muncul bergantung pada jenis objek, misalnya:

- Position dan size.
- Layout.
- Auto layout.
- Constraints.
- Fill.
- Stroke.
- Effects.
- Typography.
- Export.
- Component properties.
- Prototype interaction.

## 4.5 Design, Prototype, dan Dev Mode

- **Design** digunakan untuk membuat dan mengatur tampilan.
- **Prototype** digunakan untuk menambahkan interaksi dan perpindahan.
- **Dev Mode** digunakan untuk membaca desain dalam konteks implementasi.

---

# 5. Kamus Elemen Dasar Figma

Bagian ini dapat dipakai sebagai daftar deskripsi singkat seperti yang sebelumnya kamu buat.

## 5.1 Text

**Text** adalah elemen untuk menampilkan tulisan. Area text dapat mengikuti panjang isi, memiliki lebar tetap dengan tinggi otomatis, atau dibuat dalam ukuran tetap.

## 5.2 Shape

**Shape** adalah bentuk dasar seperti rectangle, ellipse, line, arrow, polygon, dan star yang digunakan untuk membangun elemen visual.

## 5.3 Vector

**Vector** adalah objek berbasis titik dan garis yang dapat diedit untuk membuat icon, ilustrasi, atau bentuk khusus.

## 5.4 Image

**Image** adalah gambar raster yang dimasukkan ke desain dan dapat diatur melalui crop, fill, fit, tile, atau penyesuaian visual lainnya.

## 5.5 Frame

**Frame** adalah wadah yang dapat mengatur dan memengaruhi elemen di dalamnya. Frame mendukung constraints, layout grid, auto layout, clip content, dan prototyping.

## 5.6 Frame Auto Layout

**Frame Auto Layout** adalah frame yang menyusun elemen secara otomatis berdasarkan arah, padding, jarak, alignment, serta aturan ukuran sehingga layout mudah menyesuaikan saat konten berubah.

## 5.7 Group

**Group** menggabungkan beberapa elemen agar dapat dipilih, dipindahkan, dan diubah bersama, tetapi tidak memiliki kemampuan layout selengkap frame.

## 5.8 Section

**Section** adalah area berlabel untuk mengelompokkan beberapa frame atau desain supaya canvas lebih terorganisasi.

## 5.9 Component

**Component** adalah elemen utama yang dirancang untuk digunakan berulang kali. Perubahan pada main component dapat diteruskan ke instance yang terhubung.

## 5.10 Instance

**Instance** adalah salinan dari component yang tetap memiliki hubungan dengan main component, tetapi dapat diberi override tertentu.

## 5.11 Component Set

**Component Set** adalah wadah yang mengelompokkan beberapa variant dari component yang sama.

## 5.12 Variant

**Variant** adalah versi berbeda dari component, misalnya state default, hover, pressed, disabled, size small, dan size large.

## 5.13 Slice

**Slice** menentukan area tertentu pada canvas yang ingin diekspor sebagai aset.

## 5.14 Mask

**Mask** memakai satu bentuk untuk menentukan bagian objek lain yang terlihat dan tersembunyi.

## 5.15 Boolean Group

**Boolean Group** menggabungkan beberapa shape menggunakan operasi union, subtract, intersect, atau exclude.

## 5.16 Comment

**Comment** digunakan untuk memberikan catatan atau feedback langsung pada posisi tertentu di canvas atau prototype.

## 5.17 Connector

**Connector** adalah garis penghubung yang umum digunakan untuk diagram dan flow, terutama di FigJam.

## 5.18 Sticky Note

**Sticky Note** adalah catatan singkat untuk brainstorming, pengelompokan ide, dan workshop di FigJam.

---

# 6. Perbedaan Frame, Group, Section, dan Component

| Elemen | Fungsi utama | Memiliki child layer | Mendukung layout | Dapat dipakai ulang | Cocok untuk |
|---|---|---:|---:|---:|---|
| Group | Menggabungkan objek sementara | Ya | Terbatas | Tidak | Memindahkan objek bersama |
| Frame | Wadah desain | Ya | Ya | Tidak otomatis | Screen, card, container |
| Auto Layout Frame | Wadah dengan susunan otomatis | Ya | Sangat kuat | Tidak otomatis | Button, list, form, navbar |
| Section | Mengorganisasi area canvas | Ya | Bukan untuk UI internal | Tidak | Mengelompokkan flow/status |
| Component | Elemen reusable utama | Ya | Bisa memakai auto layout | Ya | Button, input, modal, card |
| Instance | Salinan component | Ya | Mengikuti component | Ya | Penggunaan component di desain |

## Kapan memakai Group?

Gunakan group ketika hanya ingin menyatukan beberapa objek untuk dipindahkan atau diatur bersama secara sementara.

Jangan terlalu sering memakai group untuk container UI karena:

- Group tidak sefleksibel frame.
- Group tidak memiliki clip content.
- Group tidak cocok untuk responsive behavior.
- Group tidak mendukung auto layout secara langsung.

## Kapan memakai Frame?

Gunakan frame untuk:

- Screen aplikasi.
- Card.
- Modal.
- Sidebar.
- Container.
- Area dengan background.
- Area yang membutuhkan clipping.
- Elemen yang membutuhkan constraints.

## Kapan memakai Auto Layout?

Gunakan auto layout ketika elemen harus menyesuaikan berdasarkan isi atau ukuran container.

Contohnya:

- Button mengikuti panjang label.
- Card bertambah tinggi saat deskripsi panjang.
- List menambah item tanpa mengatur ulang posisi manual.
- Navbar membagi ruang antar-menu.

## Kapan memakai Section?

Gunakan section untuk menata canvas, bukan sebagai pengganti frame UI.

Contoh:

```text
Section: Authentication
├── Frame: Login
├── Frame: Forgot Password
└── Frame: Reset Password
```

## Kapan memakai Component?

Jadikan objek sebagai component ketika:

- Dipakai lebih dari satu kali.
- Harus konsisten.
- Memiliki beberapa state atau ukuran.
- Akan dimasukkan ke design system.
- Perubahan perlu diterapkan ke banyak lokasi.

---

# 7. Layer dan Hubungan Parent–Child

Setiap objek dalam Figma dapat memiliki hubungan parent dan child.

Contoh:

```text
Card — Parent
├── Image — Child
├── Content — Child
│   ├── Title — Child
│   └── Description — Child
└── Button — Child
```

## 7.1 Parent

Parent adalah wadah yang berisi objek lain. Parent dapat memengaruhi ukuran, posisi, clipping, dan layout child.

## 7.2 Child

Child adalah objek yang berada di dalam parent.

## 7.3 Nested Layer

Nested layer adalah layer yang berada beberapa tingkat di dalam struktur.

Contoh:

```text
Page
└── Modal
    └── Content
        └── Form
            └── Input
                └── Label
```

## 7.4 Z-Index atau Urutan Layer

Layer yang lebih atas di panel layer biasanya ditampilkan di depan layer di bawahnya.

Namun, memilih layer belakang tidak seharusnya mengubah urutannya. Layer hanya pindah ke depan apabila pengguna menjalankan tindakan seperti:

- Bring forward.
- Bring to front.
- Memindahkan posisi layer di panel.

## 7.5 Penamaan Layer

Hindari nama otomatis seperti:

```text
Rectangle 453
Frame 1882
Group 92
```

Gunakan nama berdasarkan fungsi:

```text
Sidebar
Header
Profile avatar
Employee name
Search input
Primary button
```

Penamaan yang baik membantu:

- Pencarian layer.
- Handoff developer.
- Pengelolaan component.
- Prototyping.
- Kolaborasi tim.

---

# 8. Posisi, Ukuran, Alignment, dan Distribusi

## 8.1 Position X dan Y

- **X** menunjukkan posisi horizontal.
- **Y** menunjukkan posisi vertikal.

Nilai ini dibaca relatif terhadap parent.

## 8.2 Width dan Height

- **W** menunjukkan lebar.
- **H** menunjukkan tinggi.

Ukuran dapat berupa:

- Fixed.
- Hug contents.
- Fill container.
- Minimum atau maximum pada konteks tertentu.

## 8.3 Rotation

Rotation mengatur sudut objek.

Contoh:

- `0°` normal.
- `90°` diputar ke kanan.
- `-90°` diputar ke kiri.
- `180°` terbalik.

## 8.4 Alignment

Alignment menyelaraskan beberapa objek berdasarkan sisi atau pusatnya.

Jenis umum:

- Align left.
- Align horizontal center.
- Align right.
- Align top.
- Align vertical center.
- Align bottom.

## 8.5 Distribution

Distribution menyamakan jarak beberapa objek.

- Distribute horizontal spacing.
- Distribute vertical spacing.

## 8.6 Tidy Up

Tidy up merapikan distribusi objek dan membantu mengatur jarak secara konsisten.

## 8.7 Smart Selection

Saat beberapa objek sejenis dipilih, Figma dapat mengenali pola dan memudahkan pengaturan jarak atau urutan.

---

# 9. Frame dan Constraints

## 9.1 Frame sebagai Container

Frame tidak hanya membungkus objek. Frame dapat memiliki:

- Fill.
- Stroke.
- Corner radius.
- Effects.
- Layout grid.
- Clip content.
- Constraints.
- Auto layout.
- Prototype connection.

## 9.2 Clip Content

Clip content menyembunyikan bagian child yang keluar dari batas frame.

Contoh penggunaan:

- Gambar di dalam card.
- Scrollable content.
- Carousel.
- Avatar bulat.

## 9.3 Constraints

Constraints menentukan bagaimana posisi dan ukuran child bereaksi ketika parent diubah ukurannya.

### Constraints horizontal

- Left.
- Right.
- Left and right.
- Center.
- Scale.

### Constraints vertical

- Top.
- Bottom.
- Top and bottom.
- Center.
- Scale.

## 9.4 Contoh Constraints

### Tombol di kanan bawah modal

```text
Horizontal: Right
Vertical: Bottom
```

Tombol akan mempertahankan jarak terhadap sisi kanan dan bawah modal.

### Header penuh

```text
Horizontal: Left and right
Vertical: Top
```

Header melebar ketika frame parent diperbesar.

### Logo di tengah

```text
Horizontal: Center
Vertical: Top
```

Logo tetap berada di tengah secara horizontal.

## 9.5 Constraints vs Auto Layout

Constraints lebih cocok untuk hubungan posisi child terhadap parent biasa. Auto layout lebih cocok untuk susunan dinamis berdasarkan konten dan spacing.

Keduanya dapat dipakai dalam struktur berbeda. Misalnya, screen memakai constraints untuk floating button, sedangkan isi form memakai auto layout.

---

# 10. Auto Layout Secara Lengkap

Auto layout adalah salah satu konsep terpenting dalam Figma.

## 10.1 Fungsi Auto Layout

Auto layout mengatur child berdasarkan aturan, bukan koordinat manual.

Manfaatnya:

- Konten mudah ditambah atau dikurangi.
- Padding konsisten.
- Spacing konsisten.
- Komponen mengikuti isi.
- Responsive layout lebih mudah dibuat.
- Desain lebih dekat dengan cara layout dibuat dalam kode.

## 10.2 Menambahkan Auto Layout

Shortcut umum:

```text
Shift + A
```

Auto layout dapat diterapkan pada satu atau beberapa objek yang dipilih.

## 10.3 Direction

### Vertical

Child disusun dari atas ke bawah.

Contoh:

- Form.
- List.
- Sidebar menu.
- Card content.

### Horizontal

Child disusun dari kiri ke kanan.

Contoh:

- Button dengan icon.
- Navbar.
- Chip.
- Toolbar.

### Wrap

Child dapat berpindah ke baris berikutnya ketika ruang horizontal tidak cukup.

Contoh:

- Tag list.
- Gallery.
- Filter chips.
- Card grid sederhana.

## 10.4 Gap atau Spacing Between Items

Menentukan jarak antar-child.

Contoh:

```text
Gap: 8 px
```

Artinya setiap child memiliki jarak 8 px.

## 10.5 Padding

Padding adalah jarak antara child dan batas parent.

Jenisnya:

- Top.
- Right.
- Bottom.
- Left.

Contoh button:

```text
Padding vertical: 10 px
Padding horizontal: 16 px
Gap icon-label: 8 px
```

## 10.6 Alignment

Alignment menentukan posisi child di area parent.

Contoh:

- Top-left.
- Center-left.
- Center.
- Bottom-right.

## 10.7 Packed dan Space Between

### Packed

Child dikelompokkan berdasarkan gap yang ditentukan.

### Space Between

Child pertama dan terakhir menempel pada sisi berlawanan, sedangkan ruang sisanya dibagi di antara child.

Contoh:

```text
Navbar
├── Logo
└── Menu/Profile
```

Gunakan horizontal auto layout dan space between agar logo di kiri dan menu di kanan.

## 10.8 Resizing pada Auto Layout

### Fixed

Ukuran ditentukan secara tetap.

Contoh:

```text
Width: 320 px
```

### Hug Contents

Ukuran parent atau child mengikuti isi.

Contoh:

- Button mengikuti panjang label.
- Chip mengikuti panjang teks.
- Card menyesuaikan tinggi isi.

### Fill Container

Objek mengisi ruang yang tersedia dalam parent auto layout.

Contoh:

- Input memenuhi lebar form.
- Search bar memenuhi sisa navbar.
- Kolom utama memenuhi area yang tersedia.

## 10.9 Min Width, Max Width, Min Height, Max Height

Batas minimum dan maksimum membantu menjaga komponen tetap masuk akal.

Contoh:

```text
Button min width: 80 px
Card max width: 480 px
Input min height: 40 px
```

## 10.10 Absolute Position

Child dapat dikeluarkan dari alur auto layout dan diposisikan secara bebas di dalam parent.

Contoh penggunaan:

- Badge di pojok card.
- Close button pada modal.
- Decorative element.
- Floating icon.

Gunakan seperlunya karena terlalu banyak absolute positioning mengurangi fleksibilitas layout.

## 10.11 Ignore Auto Layout

Objek tertentu dapat diatur agar tidak mengikuti susunan utama auto layout. Konsepnya mirip absolute positioning di dalam container.

## 10.12 Nested Auto Layout

UI yang baik biasanya memakai beberapa tingkat auto layout.

Contoh card:

```text
Card — Vertical Auto Layout
├── Image
├── Content — Vertical Auto Layout
│   ├── Title
│   ├── Description
│   └── Metadata — Horizontal Auto Layout
└── Actions — Horizontal Auto Layout
    ├── Secondary button
    └── Primary button
```

## 10.13 Auto Layout dan Komponen

Auto layout sebaiknya digunakan pada component agar:

- Label panjang tidak rusak.
- Icon dapat ditampilkan atau disembunyikan.
- State component tetap konsisten.
- Instance lebih fleksibel.

## 10.14 Contoh Button yang Benar

```text
Button — Horizontal Auto Layout
├── Leading icon
└── Label
```

Pengaturan contoh:

```text
Height: Hug contents
Width: Hug contents
Padding horizontal: 16
Padding vertical: 10
Gap: 8
Alignment: Center
Corner radius: 8
```

## 10.15 Kesalahan Auto Layout yang Umum

1. Semua ukuran dibuat fixed.
2. Tidak memakai hug pada container kecil.
3. Menggunakan fill pada semua child tanpa kebutuhan.
4. Terlalu banyak absolute positioning.
5. Gap tidak konsisten.
6. Nested structure terlalu dalam tanpa alasan.
7. Text dibuat fixed height sehingga terpotong.

---

# 11. Responsive Design di Figma

Responsive design berarti layout dapat menyesuaikan ukuran layar atau container.

## 11.1 Konsep Utama

Responsive design di Figma biasanya dibangun dari kombinasi:

- Auto layout.
- Constraints.
- Fill container.
- Hug contents.
- Min/max size.
- Layout grid.
- Component variants.
- Breakpoint pada produk atau alur tertentu.

## 11.2 Fixed vs Fluid

### Fixed

Ukuran tidak berubah.

Contoh:

- Icon 24 × 24 px.
- Avatar 40 × 40 px.
- Button height 40 px.

### Fluid

Ukuran mengikuti ruang yang tersedia.

Contoh:

- Search input memenuhi sisa navbar.
- Main content memenuhi area di samping sidebar.

## 11.3 Contoh Layout Dashboard

```text
Dashboard — Horizontal Auto Layout
├── Sidebar — Fixed width 240
└── Main content — Fill container
    ├── Header — Fill container
    └── Page content — Fill container
```

## 11.4 Contoh Dua Kolom

```text
Content — Horizontal Auto Layout
├── Main column — Fill container
└── Right panel — Fixed width 320
```

## 11.5 Mobile dan Desktop

Jangan hanya mengecilkan desain desktop menjadi mobile. Pertimbangkan perubahan struktur.

Contoh:

### Desktop

```text
Header: logo + menu + profile
Sidebar: visible
Cards: 3 columns
```

### Mobile

```text
Header: logo + menu button
Sidebar: hidden/drawer
Cards: 1 column
```

## 11.6 Layout Grid

Layout grid membantu menjaga alignment dan struktur kolom.

Jenis grid:

- Grid persegi.
- Columns.
- Rows.

Contoh web desktop:

```text
Columns: 12
Type: Stretch
Margin: 80
Gutter: 24
```

Nilai ini hanya contoh. Gunakan aturan sesuai kebutuhan proyek.

## 11.7 Breakpoint

Breakpoint adalah ukuran tertentu ketika susunan layout berubah.

Contoh konseptual:

```text
Mobile: < 768 px
Tablet: 768–1023 px
Desktop: ≥ 1024 px
```

Breakpoint bukan angka universal. Tentukan berdasarkan saat konten mulai terlihat tidak nyaman, bukan hanya berdasarkan nama perangkat.

---

# 12. Text dan Typography

Typography memengaruhi keterbacaan, hierarki, dan karakter visual produk.

## 12.1 Jenis Resizing Text

### Auto Width

Lebar text mengikuti panjang isi dalam satu baris.

Cocok untuk:

- Label pendek.
- Badge.
- Menu.
- Button text.

### Auto Height

Lebar ditentukan, tinggi bertambah otomatis ketika teks membungkus.

Cocok untuk:

- Paragraph.
- Description.
- Card content.
- Artikel.

### Fixed Size

Lebar dan tinggi ditentukan. Teks dapat terpotong apabila ruang tidak cukup.

Gunakan hanya ketika memang diperlukan.

## 12.2 Properti Typography

- Font family.
- Font weight.
- Font size.
- Line height.
- Letter spacing.
- Paragraph spacing.
- Text alignment.
- Text decoration.
- Case.

## 12.3 Hierarki Typography

Contoh sistem sederhana:

```text
Display: 48/56, Bold
Heading 1: 32/40, Bold
Heading 2: 24/32, Semi Bold
Heading 3: 20/28, Semi Bold
Body Large: 16/24, Regular
Body Medium: 14/20, Regular
Caption: 12/16, Regular
```

Format `16/24` berarti font size 16 px dan line height 24 px.

## 12.4 Prinsip Typography

1. Gunakan sedikit jenis font.
2. Bedakan hierarki melalui size, weight, dan spacing.
3. Pastikan line height cukup nyaman.
4. Hindari terlalu banyak ukuran yang hampir sama.
5. Gunakan warna teks sesuai tingkat kepentingan.
6. Uji teks panjang, bukan hanya contoh pendek.

## 12.5 Text Style

Text style menyimpan kombinasi typography agar dapat dipakai ulang.

Contoh nama:

```text
Typography/Heading/H1
Typography/Heading/H2
Typography/Body/Medium
Typography/Label/Small
```

## 12.6 Truncation

Untuk teks yang panjang pada ruang terbatas, desain dapat menggunakan:

- Single-line ellipsis.
- Multi-line clamp.
- Tooltip.
- Expand/collapse.

Pastikan perilakunya dijelaskan kepada developer.

---

# 13. Warna, Fill, Stroke, dan Effects

## 13.1 Fill

Fill adalah isi visual objek.

Jenis fill dapat meliputi:

- Solid color.
- Gradient.
- Image.
- Pattern pada konteks tertentu.

Satu objek dapat memiliki beberapa fill.

## 13.2 Color Format

Warna biasanya ditampilkan dalam format:

- Hex.
- RGB/RGBA.
- HSL/HSLA.

Contoh:

```text
#2563EB
rgba(37, 99, 235, 1)
```

## 13.3 Opacity

Opacity mengatur transparansi keseluruhan objek atau fill tertentu.

## 13.4 Stroke

Stroke adalah garis tepi objek.

Properti umum:

- Color.
- Width.
- Position: inside, center, outside.
- Dash pattern.
- Cap.
- Join.

## 13.5 Corner Radius

Corner radius membulatkan sudut.

Contoh:

- Button: 8 px.
- Card: 12 px.
- Modal: 16 px.
- Pill/chip: radius sangat besar.

Nilai tersebut hanya contoh, bukan aturan wajib.

## 13.6 Independent Corners

Setiap sudut dapat memiliki radius berbeda.

Contoh:

```text
Top-left: 16
Top-right: 16
Bottom-right: 0
Bottom-left: 0
```

## 13.7 Effects

Effects dapat berupa:

- Drop shadow.
- Inner shadow.
- Layer blur.
- Background blur.
- Efek tambahan pada alat tertentu.

## 13.8 Drop Shadow

Contoh shadow ringan:

```text
X: 0
Y: 2
Blur: 8
Spread: 0
Color: rgba(0, 0, 0, 0.12)
```

Gunakan shadow untuk membantu hierarki, bukan sekadar dekorasi.

## 13.9 Blur

### Layer Blur

Memburamkan objek yang dipilih.

### Background Blur

Memburamkan objek di belakang layer transparan.

Cocok untuk efek glass, overlay, atau navigation bar transparan.

## 13.10 Blend Mode

Blend mode menentukan cara warna layer bercampur dengan layer di bawahnya.

Contohnya:

- Multiply.
- Screen.
- Overlay.
- Darken.
- Lighten.

## 13.11 Color Style

Color style menyimpan warna agar mudah digunakan ulang.

Namun, untuk design system yang lebih dinamis, variable sering lebih sesuai karena mendukung mode dan alias.

---

# 14. Shape, Vector, Boolean, Mask, dan Illustration

## 14.1 Rectangle

Digunakan untuk:

- Background.
- Card.
- Button sederhana.
- Container.
- Placeholder image.

## 14.2 Ellipse

Digunakan untuk:

- Avatar.
- Radio button.
- Status dot.
- Diagram.

## 14.3 Line dan Arrow

Digunakan untuk:

- Divider.
- Connector.
- Annotation.
- Direction indicator.

## 14.4 Polygon dan Star

Digunakan untuk bentuk dekoratif atau icon sederhana.

## 14.5 Pen Tool

Pen tool digunakan untuk membuat vector path dengan node dan segment.

Cocok untuk:

- Icon custom.
- Logo.
- Ilustrasi.
- Bentuk tidak beraturan.

## 14.6 Vector Network

Figma mendukung jaringan vector yang memungkinkan segment terhubung dengan lebih fleksibel dibanding path tradisional yang hanya berurutan.

## 14.7 Boolean Operations

### Union Selection

Menggabungkan area shape.

### Subtract Selection

Mengurangi shape atas dari shape bawah.

### Intersect Selection

Menyisakan area yang saling bertumpuk.

### Exclude Selection

Menghilangkan area perpotongan dan mempertahankan area lainnya.

## 14.8 Flatten

Flatten mengubah beberapa objek atau boolean menjadi satu vector path.

Gunakan dengan hati-hati karena struktur sebelumnya menjadi lebih sulit diedit.

## 14.9 Outline Stroke

Mengubah stroke menjadi vector shape.

Berguna untuk:

- Menyiapkan icon tertentu.
- Menghindari perubahan stroke saat scaling.
- Mengedit bentuk stroke secara manual.

## 14.10 Mask

Contoh avatar:

```text
Ellipse — Mask
Image — Content
```

Hasilnya, gambar hanya terlihat di area ellipse.

## 14.11 Figma Draw

Figma Draw menambah kemampuan ilustrasi seperti brush, texture, transform, serta vector editing yang lebih artistik di dalam file desain.

---

# 15. Image, Video, dan Media

## 15.1 Memasukkan Gambar

Gambar dapat dimasukkan dengan:

- Drag and drop.
- Place image.
- Copy-paste.
- Fill pada shape.

## 15.2 Mode Image Fill

### Fill

Gambar memenuhi area dan dapat terpotong.

### Fit

Seluruh gambar terlihat, tetapi dapat menyisakan ruang kosong.

### Crop

Pengguna menentukan bagian gambar yang terlihat.

### Tile

Gambar diulang menjadi pola.

## 15.3 Image Adjustment

Penyesuaian dapat mencakup:

- Exposure.
- Contrast.
- Saturation.
- Temperature.
- Tint.
- Highlights.
- Shadows.

## 15.4 Video dan Animated Media

Media bergerak dapat digunakan pada konteks prototype atau presentasi tertentu. Pastikan format, ukuran file, dan perilaku playback sesuai kebutuhan.

## 15.5 Praktik Baik Gambar

1. Gunakan resolusi cukup.
2. Hindari file terlalu besar.
3. Tentukan crop dengan sengaja.
4. Gunakan rasio gambar konsisten.
5. Jelaskan fallback atau placeholder.
6. Hindari memakai gambar sebagai pengganti teks UI penting.

---

# 16. Component, Instance, Variant, dan Component Properties

## 16.1 Main Component

Main component adalah sumber utama reusable element.

Contoh:

- Button.
- Input.
- Checkbox.
- Tab.
- Navbar item.
- Modal.
- Card.

## 16.2 Instance

Instance adalah penggunaan component pada desain.

Instance dapat memiliki override seperti:

- Mengubah text.
- Mengganti icon.
- Menampilkan atau menyembunyikan layer tertentu.
- Mengganti nested instance.
- Memilih variant.

## 16.3 Override

Override adalah perubahan yang dilakukan pada instance tanpa memutus hubungannya dari main component.

Contoh:

- Label `Save` menjadi `Submit`.
- Icon `plus` menjadi `download`.
- State `default` menjadi `disabled`.

## 16.4 Detach Instance

Detach memutus hubungan instance dari main component.

Setelah detach:

- Objek menjadi layer biasa.
- Update main component tidak lagi diterapkan.
- Component properties tidak lagi tersedia.

Hindari detach tanpa alasan karena dapat merusak konsistensi design system.

## 16.5 Variant

Variant mengelompokkan versi component berdasarkan property.

Contoh button:

```text
Type: Primary | Secondary | Tertiary
State: Default | Hover | Pressed | Disabled
Size: Small | Medium | Large
Icon: None | Leading | Trailing | Only
```

## 16.6 Penamaan Variant yang Baik

Gunakan property dan value yang jelas.

Baik:

```text
Type=Primary, State=Default, Size=Medium
```

Kurang baik:

```text
Button 1
Button Blue
Button Copy 7
```

## 16.7 Component Properties

Component properties memudahkan pengguna instance mengubah bagian yang memang boleh dikustomisasi.

Jenis yang umum:

### Text Property

Mengubah text dari panel properties.

### Boolean Property

Menampilkan atau menyembunyikan layer.

Contoh:

```text
Show leading icon: True/False
Show helper text: True/False
```

### Instance Swap Property

Mengganti nested component, misalnya icon.

### Variant Property

Memilih variant tertentu.

## 16.8 Nested Component

Component dapat berisi component lain.

Contoh:

```text
Input field component
├── Label component
├── Text area
├── Icon component
└── Helper text component
```

## 16.9 Interactive Component

Interactive component memiliki interaksi antarvariant yang dapat digunakan setiap kali instance ditempatkan di prototype.

Contoh:

```text
Default → Hover
Hover → Pressed
Pressed → Default
```

## 16.10 Praktik Baik Component

1. Gunakan auto layout.
2. Gunakan nama berdasarkan fungsi.
3. Hindari terlalu banyak variant yang tidak diperlukan.
4. Gunakan component properties untuk kontrol yang relevan.
5. Uji dengan label panjang.
6. Uji tanpa icon dan dengan icon.
7. Uji state disabled dan error.
8. Dokumentasikan penggunaan.
9. Jangan menjadikan semua hal sebagai component.
10. Hindari component terlalu besar dan sulit dipahami.

---

# 17. Styles, Variables, Modes, dan Design Tokens

## 17.1 Styles

Styles menyimpan kumpulan properti visual agar digunakan ulang.

Jenis umum:

- Color style.
- Text style.
- Effect style.
- Grid style.

## 17.2 Variables

Variable adalah nilai tersimpan yang dapat digunakan pada desain atau prototype.

Tipe variable yang umum meliputi:

- Color.
- Number.
- String.
- Boolean.

Contoh:

```text
color/blue/600 = #2563EB
spacing/4 = 16
radius/md = 8
isSidebarOpen = true
userName = "Denis"
```

## 17.3 Collection

Collection mengelompokkan variable yang berkaitan.

Contoh:

```text
Collection: Primitives
Collection: Semantic colors
Collection: Spacing
Collection: Component tokens
```

## 17.4 Mode

Mode memungkinkan satu variable memiliki nilai berbeda dalam konteks berbeda.

Contoh light dan dark:

```text
Variable: color/background/page
Light mode: #FFFFFF
Dark mode: #111827
```

Contoh density:

```text
Variable: spacing/input-padding
Comfortable: 12
Compact: 8
```

## 17.5 Primitive Token

Primitive token menyimpan nilai dasar.

Contoh:

```text
blue/50
blue/100
blue/500
blue/600
gray/50
gray/900
```

## 17.6 Semantic Token

Semantic token menyimpan makna penggunaan.

Contoh:

```text
background/primary
background/disabled
text/primary
text/secondary
border/default
action/primary
status/error
```

Semantic token dapat mengarah ke primitive token melalui alias.

Contoh:

```text
text/primary → gray/900
```

Pada dark mode:

```text
text/primary → gray/50
```

## 17.7 Component Token

Component token lebih spesifik untuk component.

Contoh:

```text
button/primary/background/default
button/primary/background/hover
button/primary/text/default
input/border/error
```

## 17.8 Variable Alias

Alias membuat satu variable merujuk ke variable lain.

Struktur contoh:

```text
Primitive: blue/600 = #2563EB
Semantic: action/primary = blue/600
Component: button/primary/bg = action/primary
```

## 17.9 Styles vs Variables

Secara sederhana:

- Style cocok untuk menyimpan kombinasi properti visual.
- Variable cocok untuk menyimpan nilai yang dapat dipakai ulang, di-alias, dan memiliki mode.

Keduanya dapat digunakan bersama.

## 17.10 Variables untuk Prototype

Variable juga dapat menyimpan state prototype.

Contoh:

```text
cartCount = 0
isLoggedIn = false
selectedPlan = "pro"
```

Interaksi prototype dapat mengubah nilai tersebut.

---

# 18. Library dan Design System

## 18.1 Apa Itu Library?

Library adalah kumpulan aset reusable yang dapat dibagikan ke file lain, seperti:

- Components.
- Styles.
- Variables.

## 18.2 Local Component vs Library Component

### Local Component

Hanya tersedia di file yang sama.

### Library Component

Dipublikasikan dan dapat digunakan di file lain yang memiliki akses.

## 18.3 Struktur Design System

Contoh struktur:

```text
Foundations
├── Color
├── Typography
├── Spacing
├── Radius
├── Elevation
└── Grid

Components
├── Button
├── Input
├── Checkbox
├── Radio
├── Select
├── Badge
├── Tabs
├── Modal
├── Table
└── Navigation

Patterns
├── Form layout
├── Empty state
├── Filter bar
├── Data table toolbar
└── Authentication flow
```

## 18.4 Foundations

Foundations adalah aturan dasar visual dan struktur.

Contohnya:

- Color system.
- Typography scale.
- Spacing scale.
- Radius scale.
- Shadow/elevation.
- Iconography.
- Layout grid.

## 18.5 Components

Components adalah elemen reusable yang lebih konkret.

## 18.6 Patterns

Patterns adalah kombinasi beberapa component untuk menyelesaikan kebutuhan tertentu.

Contoh:

- Search and filter.
- Form validation.
- Confirmation flow.
- Empty state.

## 18.7 Dokumentasi Component

Setiap component sebaiknya memiliki:

- Tujuan.
- Kapan digunakan.
- Kapan tidak digunakan.
- Anatomy.
- Variants.
- States.
- Content guideline.
- Accessibility notes.
- Contoh penggunaan.

## 18.8 Publish dan Update Library

Alur umum:

1. Edit source library.
2. Tinjau perubahan.
3. Tambahkan deskripsi update.
4. Publish.
5. File consumer menerima update.
6. Designer meninjau dan menerima perubahan.

## 18.9 Governance

Design system membutuhkan aturan pengelolaan.

Pertanyaan penting:

- Siapa yang boleh mengedit library?
- Siapa yang menyetujui component baru?
- Bagaimana versioning dilakukan?
- Bagaimana breaking change diumumkan?
- Bagaimana component deprecated ditandai?

---

# 19. Prototyping Dasar

Prototype menghubungkan frame dan interaction untuk mensimulasikan pengalaman pengguna.

## 19.1 Flow

Flow adalah rangkaian screen yang dimulai dari titik tertentu.

Contoh:

- Login flow.
- Checkout flow.
- Employee creation flow.
- Leave request flow.

## 19.2 Starting Point

Starting point menentukan frame awal ketika prototype dijalankan.

Satu page dapat memiliki beberapa flow.

## 19.3 Trigger

Trigger menentukan kapan interaction dijalankan.

Contoh:

- On click/tap.
- On drag.
- While hovering.
- While pressing.
- Mouse enter.
- Mouse leave.
- After delay.
- Key/gamepad pada konteks tertentu.

## 19.4 Action

Action menentukan hasil interaction.

Contoh:

- Navigate to.
- Back.
- Open overlay.
- Close overlay.
- Scroll to.
- Open link.
- Change to.
- Set variable.
- Conditional.

## 19.5 Transition

Transition mengatur perpindahan visual.

Contoh:

- Instant.
- Dissolve.
- Smart animate.
- Move in.
- Move out.
- Push.
- Slide in.
- Slide out.

## 19.6 Smart Animate

Smart animate menganimasikan perubahan antara layer yang cocok di dua state atau frame.

Agar hasilnya baik:

- Gunakan nama layer yang konsisten.
- Pertahankan struktur layer serupa.
- Hindari perubahan hierarki yang tidak perlu.
- Atur duration dan easing sesuai konteks.

## 19.7 Overlay

Overlay menampilkan frame di atas screen saat ini.

Contoh:

- Modal.
- Dropdown.
- Tooltip.
- Popover.
- Bottom sheet.

Pengaturan overlay dapat mencakup:

- Posisi.
- Background overlay.
- Close when clicking outside.
- Manual positioning.

## 19.8 Scroll Behavior

Frame dapat dibuat scrollable secara vertikal atau horizontal.

Contoh:

- Long page.
- Horizontal carousel.
- Scrollable table.

## 19.9 Fixed Position saat Scroll

Elemen tertentu dapat tetap terlihat saat konten di-scroll.

Contoh:

- Header.
- Bottom navigation.
- Floating action button.
- Sticky filter.

---

# 20. Prototyping Lanjutan

## 20.1 Interactive Components

Interactive components menghubungkan variant dalam component set.

Contoh checkbox:

```text
Unchecked --On click--> Checked
Checked --On click--> Unchecked
```

## 20.2 Variables dalam Prototype

Variables dapat menyimpan data atau state.

Contoh counter:

```text
quantity = 1
```

Saat tombol plus diklik:

```text
quantity = quantity + 1
```

## 20.3 Conditional Logic

Conditional menjalankan action berdasarkan kondisi.

Contoh:

```text
IF isLoggedIn = true
  Navigate to Dashboard
ELSE
  Navigate to Login
```

## 20.4 Expressions

Expressions memungkinkan perhitungan atau manipulasi nilai.

Contoh konseptual:

```text
subtotal = price * quantity
total = subtotal + shipping
```

## 20.5 Multiple Actions

Satu interaction dapat menjalankan beberapa action sesuai urutan tertentu.

Contoh:

```text
On click:
1. Set isMenuOpen = false
2. Navigate to Profile
```

## 20.6 Variable Mode dalam Prototype

Prototype dapat mengganti mode variable.

Contoh:

```text
On click theme toggle:
Set mode → Dark
```

## 20.7 Prototype Fidelity

### Low Fidelity

Fokus pada flow dan struktur.

### Medium Fidelity

Menunjukkan layout dan interaksi utama.

### High Fidelity

Mendekati produk final dengan visual, state, animasi, dan konten realistis.

## 20.8 Jangan Membuat Prototype Terlalu Rumit

Prototype bukan selalu aplikasi final. Tentukan tujuan pengujian terlebih dahulu.

Contoh:

- Jika ingin menguji navigasi, tidak perlu mensimulasikan seluruh database.
- Jika ingin menguji checkout, cukup buat kondisi yang relevan dengan skenario pengujian.

---

# 21. Kolaborasi, Komentar, dan Permission

## 21.1 Real-Time Collaboration

Beberapa orang dapat berada di file yang sama. Cursor dan pilihan mereka dapat terlihat secara langsung.

## 21.2 Comment

Comment dapat digunakan untuk:

- Memberi feedback.
- Menanyakan requirement.
- Menandai masalah.
- Menyebut anggota tim.
- Menyimpan keputusan singkat.

## 21.3 Praktik Comment yang Baik

Kurang jelas:

```text
Ini salah.
```

Lebih baik:

```text
Mohon ubah label menjadi “Save changes” agar konsisten dengan halaman Profile. Setelah diperbarui, tandai komentar sebagai resolved.
```

## 21.4 Resolve Comment

Comment yang sudah selesai dapat di-resolve agar canvas tidak penuh.

## 21.5 Permission

Jenis izin yang umum:

- Can view.
- Can edit.
- Akses terbatas lain sesuai produk atau paket.

## 21.6 Sharing

File dapat dibagikan kepada:

- Individu.
- Team.
- Project.
- Pengguna dengan link sesuai pengaturan.

Jangan membagikan akses edit jika orang tersebut hanya perlu melihat atau memberikan komentar.

## 21.7 Cursor Chat dan Kolaborasi Ringan

Fitur kolaborasi dapat digunakan untuk komunikasi cepat di canvas saat bekerja bersama.

---

# 22. Version History dan Branching

## 22.1 Version History

Version history menyimpan riwayat perubahan file.

Kegunaannya:

- Melihat perubahan lama.
- Mengembalikan kondisi file.
- Memberi nama checkpoint.
- Mencatat milestone.

Contoh nama version:

```text
Before usability testing
Approved design — Sprint 12
Release candidate v1.4
Before design system migration
```

## 22.2 Branching

Branch memungkinkan perubahan dilakukan terpisah dari main file, kemudian ditinjau dan digabungkan.

Cocok untuk:

- Perubahan besar.
- Eksperimen design system.
- Pengerjaan beberapa designer.
- Redesign komponen tanpa mengganggu main.

## 22.3 Alur Branch

```text
Main file
↓
Create branch
↓
Make changes
↓
Request review
↓
Resolve conflict if needed
↓
Merge to main
```

## 22.4 Kapan Tidak Perlu Branch?

Untuk perubahan kecil dan risiko rendah, branch mungkin tidak diperlukan. Gunakan sesuai skala tim dan tingkat risiko.

---

# 23. Dev Mode dan Handoff ke Developer

## 23.1 Tujuan Handoff

Handoff memastikan developer memahami:

- Tampilan yang harus dibuat.
- Ukuran dan spacing.
- State component.
- Behavior responsive.
- Interaction.
- Asset.
- Token atau variable.
- Kondisi kosong, loading, error, dan success.

## 23.2 Dev Mode

Dev Mode membantu developer menavigasi file dan menerjemahkan desain ke implementasi.

Informasi yang dapat diperiksa meliputi:

- Dimensions.
- Spacing.
- Typography.
- Color.
- Border.
- Radius.
- Effects.
- Assets.
- Component properties.
- Variables.
- Prototype behavior.

## 23.3 Ready for Dev

Frame, section, atau component yang telah matang dapat diberi status siap dikembangkan.

Sebelum menandai ready:

- Desain sudah disetujui.
- State lengkap.
- Edge case sudah dijelaskan.
- Responsiveness jelas.
- Copy final atau status copy dijelaskan.
- Asset tersedia.
- Comment penting telah diselesaikan.

## 23.4 Annotation

Annotation menjelaskan hal yang tidak cukup terlihat dari desain statis.

Contoh:

```text
Jika nama lebih dari dua baris, tampilkan ellipsis.
Button tetap disabled sampai seluruh field wajib valid.
Table header tetap terlihat saat scroll vertikal.
Sidebar berubah menjadi drawer pada lebar di bawah breakpoint tablet.
```

## 23.5 Mengukur Jarak

Developer dapat memilih layer dan melihat jarak terhadap layer lain atau parent.

## 23.6 Code Snippet

Dev Mode dapat menampilkan snippet atau informasi kode sebagai referensi. Snippet bukan selalu kode final dan tetap perlu disesuaikan dengan arsitektur proyek.

## 23.7 Code Connect

Code Connect dapat membantu menghubungkan component desain dengan component kode pada workflow tertentu.

## 23.8 Checklist Handoff

- [ ] Semua frame diberi nama.
- [ ] Component memakai nama konsisten.
- [ ] State default, hover, focus, active, disabled tersedia.
- [ ] Error, empty, loading, dan success tersedia.
- [ ] Responsive behavior dijelaskan.
- [ ] Text panjang telah diuji.
- [ ] Asset export sudah benar.
- [ ] Variable/token sudah digunakan.
- [ ] Prototype atau flow utama tersedia.
- [ ] Desain yang final ditandai dengan jelas.

---

# 24. Export Asset

## 24.1 Objek yang Dapat Diekspor

Umumnya dapat mengekspor:

- Layer.
- Frame.
- Group.
- Component.
- Section.
- Slice.
- Page/canvas dalam konteks tertentu.
- Salinan file `.fig`.

## 24.2 Format Export

### PNG

Cocok untuk gambar raster dengan transparansi.

### JPG

Cocok untuk foto atau gambar tanpa kebutuhan transparansi.

### SVG

Cocok untuk icon dan vector yang perlu tetap tajam saat diperbesar.

### PDF

Cocok untuk dokumen, presentasi sederhana, atau kebutuhan cetak tertentu.

## 24.3 Scale

Contoh scale:

- `1x`.
- `2x`.
- `3x`.
- Width tertentu.
- Height tertentu.

## 24.4 Suffix

Suffix membantu penamaan otomatis.

Contoh:

```text
icon@2x.png
logo-dark.svg
```

## 24.5 Export Icon

Sebelum export icon:

- Pastikan ukuran frame konsisten, misalnya 24 × 24.
- Pastikan icon berada di tengah.
- Periksa stroke.
- Hindari layer tersembunyi yang tidak perlu.
- Gunakan nama semantik.

## 24.6 Jangan Export Semua sebagai Gambar

Elemen UI seperti text, button, dan input sebaiknya diimplementasikan sebagai component kode, bukan satu gambar besar.

---

# 25. Community, Plugin, Widget, dan Template

## 25.1 Figma Community

Community berisi resource yang dibuat pengguna dan tim lain.

Resource dapat berupa:

- File desain.
- UI kit.
- Template.
- Plugin.
- Widget.
- Aplikasi atau extension terkait.

## 25.2 Plugin

Plugin menambah atau mempercepat workflow.

Contoh fungsi plugin:

- Mengisi data dummy.
- Mengoptimalkan icon.
- Mengecek contrast.
- Menghapus background.
- Membuat chart.
- Mengganti nama layer.
- Mengekspor asset.

## 25.3 Widget

Widget adalah objek interaktif yang dapat digunakan bersama di canvas, terutama untuk aktivitas kolaboratif.

Contoh:

- Voting.
- Timer.
- Checklist.
- Poll.
- Game workshop.

## 25.4 Template

Template adalah file atau struktur awal yang dapat diduplikasi.

Contoh:

- Wireframe kit.
- Design system starter.
- Presentation template.
- Social media template.
- User journey map.

## 25.5 Risiko Menggunakan Resource Community

Selalu periksa:

- Lisensi penggunaan.
- Kualitas struktur layer.
- Konsistensi component.
- Keamanan plugin.
- Update terakhir.
- Kesesuaian dengan design system.

Jangan memasang terlalu banyak plugin tanpa kebutuhan.

---

# 26. Produk Figma Lainnya

## 26.1 FigJam Secara Ringkas

Elemen umum:

- Sticky note.
- Shape.
- Connector.
- Stamp.
- Section.
- Table.
- Diagram.
- Widget.

Contoh struktur workshop:

```text
1. Context
2. Problem statements
3. Individual ideas
4. Grouping
5. Voting
6. Prioritization
7. Action items
```

## 26.2 Figma Slides Secara Ringkas

Gunakan untuk membuat deck kolaboratif dengan:

- Slide layout.
- Presenter notes.
- Interactive content.
- Prototype embedding.
- Media.
- Kolaborasi langsung.

## 26.3 Figma Sites Secara Ringkas

Dapat digunakan untuk:

- Mendesain halaman web.
- Membuat responsive layout.
- Menggunakan component dan library.
- Menambahkan interaction dan animation.
- Menggunakan breakpoint.
- Memublikasikan situs.
- Mengelola konten melalui fitur CMS pada konteks yang tersedia.

## 26.4 Figma Make Secara Ringkas

Dapat digunakan untuk menghasilkan dan mengembangkan prototype atau aplikasi dari prompt, design system, serta konteks yang diberikan.

## 26.5 Figma Buzz Secara Ringkas

Cocok untuk tim brand dan marketing yang membutuhkan:

- Template terkendali.
- Aset dalam banyak ukuran.
- Penggantian teks dan gambar.
- Produksi banyak variasi aset.
- Konsistensi merek.

## 26.6 Figma Draw Secara Ringkas

Cocok untuk:

- Ilustrasi.
- Visual ekspresif.
- Brush work.
- Texture.
- Vector editing lanjutan.
- Text on path dan transform tertentu.

---

# 27. Alur Kerja UI/UX dari Awal sampai Handoff

## Tahap 1 — Memahami Masalah

Kumpulkan:

- Tujuan bisnis.
- Masalah pengguna.
- Target pengguna.
- Platform.
- Constraint teknis.
- Timeline.
- Success metrics.

## Tahap 2 — Research

Aktivitas dapat meliputi:

- Interview.
- Survey.
- Competitor analysis.
- Analytics review.
- Usability review.
- Stakeholder discussion.

## Tahap 3 — Information Architecture

Tentukan:

- Struktur menu.
- Hubungan halaman.
- Prioritas informasi.
- Navigation model.

## Tahap 4 — User Flow

Contoh:

```text
Login
→ Dashboard
→ Employee list
→ Add employee
→ Fill form
→ Review
→ Save
→ Success
```

## Tahap 5 — Wireframe

Fokus pada:

- Struktur.
- Hierarki.
- Flow.
- Konten utama.

Jangan terlalu fokus pada warna dan dekorasi.

## Tahap 6 — UI Design

Terapkan:

- Typography.
- Color.
- Spacing.
- Component.
- States.
- Responsive behavior.

## Tahap 7 — Prototype

Hubungkan flow utama dan interaksi penting.

## Tahap 8 — Testing

Uji:

- Apakah pengguna memahami flow?
- Apakah label jelas?
- Apakah action mudah ditemukan?
- Apakah error mudah dipahami?
- Apakah tugas dapat diselesaikan?

## Tahap 9 — Iteration

Perbaiki desain berdasarkan temuan.

## Tahap 10 — Handoff

Siapkan:

- Final screens.
- Component states.
- Annotation.
- Assets.
- Variables/tokens.
- Prototype.
- Ready for dev status.

## Tahap 11 — Design QA

Setelah implementasi, bandingkan hasil development dengan desain.

Periksa:

- Layout.
- Spacing.
- Typography.
- Color.
- Responsive behavior.
- Interaction.
- Empty/error/loading state.

---

# 28. Cara Menata File Figma

## 28.1 Gunakan Cover

Cover membantu mengenali file dari browser.

Isi cover dapat mencakup:

- Nama proyek.
- Platform.
- Status.
- Owner.
- Last updated.

## 28.2 Gunakan Nomor pada Page

Contoh:

```text
00 — Cover
01 — Brief
02 — Research
03 — User Flow
04 — Wireframes
05 — UI Design
06 — Prototype
07 — Components
08 — Handoff
99 — Archive
```

## 28.3 Pisahkan Exploration dan Final

Jangan mencampur semua eksperimen dengan desain final.

Contoh section:

```text
Exploration
In Review
Approved
Ready for Dev
Deprecated
```

## 28.4 Gunakan Naming Convention

Contoh nama frame:

```text
Auth / Login / Default
Auth / Login / Error
Employee / List / Empty
Employee / List / Populated
Employee / Create / Step 1
```

## 28.5 Buat Area Parking Lot

Parking lot digunakan untuk meletakkan alternatif yang belum dipilih tanpa mengganggu area utama.

## 28.6 Archive dengan Benar

Pindahkan versi lama ke page archive, bukan hanya menumpuk di samping desain final.

## 28.7 Hindari Canvas Terlalu Padat

Gunakan section dan spacing antarkelompok agar flow mudah dibaca.

## 28.8 Gunakan Deskripsi

Tambahkan deskripsi pada component, style, dan variable penting.

---

# 29. Contoh Pembuatan Komponen UI

## 29.1 Button

### Anatomy

```text
Button
├── Leading icon — optional
├── Label
└── Trailing icon — optional
```

### Properties

```text
Type: Primary | Secondary | Ghost | Danger
Size: Small | Medium | Large
State: Default | Hover | Pressed | Focus | Disabled
Leading icon: Boolean
Trailing icon: Boolean
Label: Text property
```

### Auto Layout

```text
Direction: Horizontal
Alignment: Center
Gap: 8
Padding horizontal: 16
Padding vertical: 10
Width: Hug contents
```

## 29.2 Input Field

### Anatomy

```text
Input field
├── Label
├── Field container
│   ├── Leading icon — optional
│   ├── Value/Placeholder
│   └── Trailing icon — optional
└── Helper/Error text — optional
```

### States

- Default.
- Hover.
- Focus.
- Filled.
- Disabled.
- Error.
- Success bila dibutuhkan.

## 29.3 Card

```text
Card — Vertical Auto Layout
├── Media — optional
├── Header
├── Body
└── Actions — optional
```

Pastikan card dapat menangani:

- Judul panjang.
- Body kosong.
- Gambar tidak tersedia.
- Satu atau dua action.
- Lebar berbeda.

## 29.4 Modal

```text
Overlay
└── Modal
    ├── Header
    │   ├── Title
    │   └── Close button
    ├── Content
    └── Footer
        ├── Secondary button
        └── Primary button
```

Pertimbangkan:

- Focus behavior.
- Close action.
- Click outside.
- Scroll content.
- Mobile adaptation.

## 29.5 Navbar

```text
Navbar — Horizontal Auto Layout, Space Between
├── Brand
├── Navigation
└── User actions
```

Pada mobile, navigation dapat berubah menjadi menu button atau drawer.

## 29.6 Data Table

Anatomy:

```text
Table
├── Toolbar
├── Header row
├── Data rows
└── Pagination
```

State penting:

- Loading.
- Empty.
- No search result.
- Error.
- Selected row.
- Sort active.
- Filter active.

## 29.7 Chat UI

```text
Chat screen — Vertical Auto Layout
├── Header
├── Messages — Vertical Auto Layout
│   ├── AI message — Align left
│   ├── User message — Align right
│   └── AI message — Align left
└── Composer
```

User message biasanya di kanan dan AI/agent message di kiri. Gunakan max width agar bubble tidak terlalu lebar.

Contoh:

```text
Message max width: 70%
Bubble width: Hug contents
Text width: Fill container atau batas maksimum tertentu
```

## 29.8 Sidebar

```text
Sidebar — Vertical Auto Layout
├── Logo
├── Main navigation — Fill container
└── Account section
```

Main navigation dapat memakai fill container agar account section tetap di bawah.

---

# 30. Shortcut Penting

> Shortcut dapat berbeda menurut sistem operasi dan layout keyboard. Buka panel Keyboard Shortcuts di Figma untuk daftar yang sesuai perangkatmu.

## 30.1 Dasar

| Tindakan | Mac | Windows |
|---|---|---|
| Select/Move | `V` | `V` |
| Frame | `F` | `F` |
| Rectangle | `R` | `R` |
| Ellipse | `O` | `O` |
| Line | `L` | `L` |
| Pen | `P` | `P` |
| Text | `T` | `T` |
| Comment | `C` | `C` |
| Add Auto Layout | `Shift + A` | `Shift + A` |
| Group | `⌘ + G` | `Ctrl + G` |
| Ungroup | `Shift + ⌘ + G` | `Shift + Ctrl + G` |
| Duplicate | `⌘ + D` | `Ctrl + D` |
| Copy | `⌘ + C` | `Ctrl + C` |
| Paste | `⌘ + V` | `Ctrl + V` |
| Undo | `⌘ + Z` | `Ctrl + Z` |
| Redo | `Shift + ⌘ + Z` | `Shift + Ctrl + Z` |

## 30.2 Component

| Tindakan | Mac | Windows |
|---|---|---|
| Create component | `Option + ⌘ + K` | `Ctrl + Alt + K` |
| Detach instance | `Option + ⌘ + B` | `Ctrl + Alt + B` |

## 30.3 Zoom dan View

| Tindakan | Mac | Windows |
|---|---|---|
| Zoom to fit | `Shift + 1` | `Shift + 1` |
| Zoom to selection | `Shift + 2` | `Shift + 2` |
| Zoom in | `+` | `+` |
| Zoom out | `-` | `-` |
| Show keyboard shortcuts | `Control + Shift + ?` | `Ctrl + Shift + ?` |

## 30.4 Selection

| Tindakan | Mac | Windows |
|---|---|---|
| Select multiple | `Shift + Click` | `Shift + Click` |
| Select inside frame | `⌘ + Click` | `Ctrl + Click` |
| Deep select | `⌘ + Click` berulang | `Ctrl + Click` berulang |
| Select all | `⌘ + A` | `Ctrl + A` |

## 30.5 Tips Shortcut

1. Gunakan `Shift + A` sesering mungkin untuk struktur UI.
2. Gunakan zoom to selection untuk berpindah cepat.
3. Gunakan quick actions untuk mencari perintah yang lupa lokasinya.
4. Buka panel shortcut resmi karena beberapa kombinasi bergantung pada keyboard.

---

# 31. Kesalahan Umum dan Cara Memperbaikinya

## 31.1 Memakai Group untuk Semua Container

**Masalah:** layout sulit dibuat responsive.

**Perbaikan:** gunakan frame atau auto layout frame.

## 31.2 Posisi Semua Elemen Manual

**Masalah:** saat konten berubah, seluruh posisi harus diperbaiki.

**Perbaikan:** gunakan auto layout dan constraints.

## 31.3 Text Fixed Height

**Masalah:** teks panjang terpotong.

**Perbaikan:** gunakan auto height dan uji dengan konten panjang.

## 31.4 Semua Ukuran Fixed

**Masalah:** komponen tidak fleksibel.

**Perbaikan:** kombinasikan fixed, hug contents, dan fill container.

## 31.5 Component Terlalu Banyak Variant

**Masalah:** component set sulit dikelola.

**Perbaikan:** gunakan component properties, nested component, atau pisahkan component berdasarkan fungsi.

## 31.6 Detach Instance Sembarangan

**Masalah:** desain tidak lagi mengikuti library.

**Perbaikan:** gunakan override atau perbaiki component source.

## 31.7 Layer Tidak Dinamai

**Masalah:** file dan handoff sulit dipahami.

**Perbaikan:** beri nama berdasarkan fungsi.

## 31.8 Tidak Menyediakan State

**Masalah:** developer menebak-nebak behavior.

**Perbaikan:** sediakan state seperti hover, focus, disabled, loading, error, empty, dan success.

## 31.9 Mengabaikan Responsive Behavior

**Masalah:** desain hanya bekerja pada satu ukuran.

**Perbaikan:** uji frame pada beberapa lebar dan jelaskan perubahan struktur.

## 31.10 Terlalu Banyak Shadow

**Masalah:** visual terlihat berat dan hierarki tidak jelas.

**Perbaikan:** gunakan elevation secara sistematis.

## 31.11 Mengandalkan Warna Saja

**Masalah:** status sulit dipahami oleh sebagian pengguna.

**Perbaikan:** kombinasikan warna dengan icon, label, atau pattern.

## 31.12 Tidak Menguji Konten Nyata

**Masalah:** desain hanya bagus dengan dummy pendek.

**Perbaikan:** uji nama panjang, angka besar, empty state, dan data ekstrem.

## 31.13 Canvas Penuh Versi Lama

**Masalah:** tim tidak tahu mana desain final.

**Perbaikan:** gunakan section status dan page archive.

## 31.14 Main Component Diletakkan Sembarangan

**Masalah:** component sulit ditemukan.

**Perbaikan:** letakkan di page khusus atau library file.

## 31.15 Prototype Menjadi “Noodle Soup”

**Masalah:** terlalu banyak koneksi antarframe.

**Perbaikan:** gunakan interactive component, variable, dan flow yang terpisah.

---

# 32. Roadmap Belajar Figma

## Level 1 — Dasar

Pelajari:

- Interface.
- Selection.
- Shape.
- Text.
- Fill dan stroke.
- Frame.
- Group.
- Alignment.
- Export.

Latihan:

- Buat login screen sederhana.
- Buat card profile.
- Buat poster sederhana.

## Level 2 — Layout

Pelajari:

- Auto layout.
- Hug contents.
- Fill container.
- Constraints.
- Nested frame.
- Layout grid.

Latihan:

- Buat navbar responsive.
- Buat list item.
- Buat form dengan beberapa input.

## Level 3 — Reusable UI

Pelajari:

- Component.
- Instance.
- Variant.
- Component properties.
- Nested component.

Latihan:

- Buat button system.
- Buat input system.
- Buat modal component.

## Level 4 — Design System

Pelajari:

- Styles.
- Variables.
- Collections.
- Modes.
- Token naming.
- Library.

Latihan:

- Buat color tokens light/dark.
- Buat typography scale.
- Publish mini library.

## Level 5 — Prototype

Pelajari:

- Flow.
- Trigger.
- Action.
- Overlay.
- Smart animate.
- Interactive components.
- Variables dan conditionals.

Latihan:

- Buat login flow.
- Buat dropdown interaktif.
- Buat cart quantity sederhana.

## Level 6 — Handoff

Pelajari:

- Dev Mode.
- Ready for dev.
- Annotation.
- Export asset.
- Responsive specification.
- Design QA.

Latihan:

- Rapikan file seolah akan diserahkan kepada developer.
- Buat dokumentasi state dan behavior.

## Level 7 — Kolaborasi dan Skala

Pelajari:

- Library governance.
- Branching.
- Version history.
- Design system contribution.
- Documentation.

---

# 33. Checklist Kualitas Desain

## Struktur

- [ ] Frame dan section diberi nama.
- [ ] Group hanya digunakan jika memang sesuai.
- [ ] Layer memiliki hierarki yang logis.
- [ ] Auto layout digunakan pada container dinamis.
- [ ] Tidak ada layer duplikat yang tidak diperlukan.

## Visual

- [ ] Typography konsisten.
- [ ] Warna memakai style atau variable.
- [ ] Spacing mengikuti skala.
- [ ] Radius dan shadow konsisten.
- [ ] Alignment rapi.

## Component

- [ ] Elemen berulang menjadi component.
- [ ] Variant memiliki property jelas.
- [ ] Instance tidak banyak di-detach.
- [ ] Component diuji dengan konten panjang.
- [ ] State penting tersedia.

## Responsive

- [ ] Screen diuji pada beberapa ukuran.
- [ ] Fill dan hug digunakan dengan benar.
- [ ] Min/max size dipertimbangkan.
- [ ] Mobile behavior dijelaskan.
- [ ] Overflow dan scroll dijelaskan.

## UX

- [ ] Label action jelas.
- [ ] Error message membantu.
- [ ] Loading, empty, dan success state tersedia.
- [ ] Feedback setelah action tersedia.
- [ ] Focus dan keyboard behavior dipertimbangkan.

## Handoff

- [ ] Desain final ditandai.
- [ ] Annotation tersedia.
- [ ] Asset dapat diekspor.
- [ ] Token atau variable dapat dibaca.
- [ ] Comment penting sudah resolved.
- [ ] Prototype flow utama tersedia.

---

# 34. Glosarium

| Istilah | Arti |
|---|---|
| Alignment | Penyelarasan posisi beberapa objek |
| Auto Layout | Sistem penyusunan child secara otomatis |
| Boolean | Operasi penggabungan atau pengurangan shape |
| Branch | Versi kerja terpisah dari main file |
| Canvas | Area kerja utama |
| Child | Objek yang berada di dalam parent |
| Clip Content | Menyembunyikan isi yang keluar dari batas frame |
| Component | Elemen utama yang dapat digunakan ulang |
| Component Property | Kontrol yang dapat diubah pada instance |
| Component Set | Wadah beberapa variant |
| Constraint | Aturan posisi atau ukuran saat parent berubah |
| Design System | Kumpulan aturan, aset, dan pola desain reusable |
| Dev Mode | Mode untuk pemeriksaan dan handoff development |
| Effect | Shadow, blur, dan efek visual lainnya |
| Fill | Isi visual objek |
| Fill Container | Mengisi ruang yang tersedia pada auto layout parent |
| Fixed | Ukuran tetap |
| Flow | Rangkaian screen prototype |
| Frame | Wadah desain dengan fitur layout dan prototyping |
| Group | Gabungan objek untuk diperlakukan bersama |
| Hug Contents | Ukuran mengikuti isi |
| Instance | Salinan component yang terhubung ke main component |
| Layer | Objek dalam struktur desain |
| Library | Kumpulan component, style, dan variable yang dibagikan |
| Main Component | Sumber utama component |
| Mask | Bentuk yang membatasi area objek yang terlihat |
| Mode | Kumpulan nilai berbeda untuk variable dalam konteks tertentu |
| Nested | Berada di dalam struktur objek lain |
| Overlay | Frame yang tampil di atas frame aktif |
| Override | Perubahan pada instance tanpa memutus component |
| Padding | Jarak isi terhadap batas parent |
| Parent | Wadah yang memiliki child |
| Prototype | Simulasi interaksi desain |
| Section | Area berlabel untuk menata canvas |
| Slice | Area khusus untuk export |
| Spacing/Gap | Jarak antarobjek |
| Stroke | Garis tepi objek |
| Style | Kumpulan properti visual reusable |
| Token | Nilai desain bernama untuk menjaga konsistensi |
| Trigger | Peristiwa yang menjalankan interaction |
| Variable | Nilai tersimpan untuk desain atau prototype |
| Variant | Versi berbeda dari component |
| Vector | Bentuk berbasis titik dan garis |

---

# 35. Sumber Resmi

Panduan ini disusun berdasarkan konsep dan dokumentasi resmi Figma. Berikut referensi utama untuk pendalaman:

- [What is Figma?](https://help.figma.com/hc/en-us/articles/14563969806359-What-is-Figma)
- [Figma Design Help Center](https://help.figma.com/hc/en-us/categories/360002042553-Figma-Design)
- [Frames in Figma Design](https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design)
- [Guide to Auto Layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)
- [Apply Constraints](https://help.figma.com/hc/en-us/articles/360039957734-Apply-constraints-to-define-how-layers-resize)
- [Create and Use Variants](https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants)
- [Explore Component Properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)
- [Guide to Variables](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
- [Difference Between Variables and Styles](https://help.figma.com/hc/en-us/articles/15871097384471-The-difference-between-variables-and-styles)
- [Guide to Libraries](https://help.figma.com/hc/en-us/articles/360041051154-Guide-to-libraries-in-Figma)
- [Guide to Prototyping](https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma)
- [Prototype Actions](https://help.figma.com/hc/en-us/articles/360040035874-Prototype-actions)
- [Variables in Prototypes](https://help.figma.com/hc/en-us/articles/14506587589399-Use-variables-in-prototypes)
- [Multiple Actions and Conditionals](https://help.figma.com/hc/en-us/articles/15253220891799-Multiple-actions-and-conditionals)
- [Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode)
- [Guide to Inspecting](https://help.figma.com/hc/en-us/articles/22012921621015-Guide-to-inspecting)
- [Guide to Sharing and Permissions](https://help.figma.com/hc/en-us/articles/1500007609322-Guide-to-sharing-and-permissions)
- [Guide to Branching](https://help.figma.com/hc/en-us/articles/360063144053-Guide-to-branching)
- [Export Static Designs](https://help.figma.com/hc/en-us/articles/360040028114-Export-static-designs-from-Figma)
- [Guide to Figma Community](https://help.figma.com/hc/en-us/articles/360038510693-Guide-to-the-Figma-Community)
- [Use Figma Products with a Keyboard](https://help.figma.com/hc/en-us/articles/360040328653-Use-Figma-products-with-a-keyboard)
- [Explore Figma Slides](https://help.figma.com/hc/en-us/articles/24170630629911-Explore-Figma-Slides)
- [Explore Figma Sites](https://help.figma.com/hc/en-us/articles/31230436657815-Explore-Figma-Sites)
- [Guide to Figma Buzz](https://help.figma.com/hc/en-us/articles/31271566667543-Guide-to-Figma-Buzz)
- [Explore Figma Draw](https://help.figma.com/hc/en-us/articles/31440394517143-Explore-Figma-Draw)
- [Figma Make](https://www.figma.com/make/)

---

## Ringkasan Paling Penting

Apabila baru mulai belajar, fokuskan urutan berikut:

```text
Frame
→ Auto Layout
→ Hug / Fill / Fixed
→ Constraints
→ Component
→ Instance
→ Variant
→ Variables
→ Prototype
→ Dev Mode
```

Prinsip utamanya:

1. Gunakan **frame** sebagai wadah UI.
2. Gunakan **auto layout** untuk konten yang dinamis.
3. Gunakan **component** untuk elemen yang berulang.
4. Gunakan **variant** untuk state dan versi component.
5. Gunakan **variable** untuk nilai desain yang konsisten dan memiliki mode.
6. Gunakan **prototype** untuk menjelaskan flow dan behavior.
7. Rapikan **nama layer, section, state, dan annotation** sebelum handoff.

