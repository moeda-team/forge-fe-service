# Forge Copy

Plugin Figma lokal untuk menyalin selection ke Forge sebagai layer editable.
Source plugin dirilis dengan lisensi MIT.

## Instalasi

1. Di Figma Desktop buka **Plugins → Development → Import plugin from manifest…**
2. Pilih file `figma-plugin/manifest.json`.
3. Pilih frame/layer di Figma, jalankan **Plugins → Development → Forge Copy**.
4. Klik **Copy to Forge**, kembali ke Forge, lalu tekan **Cmd/Ctrl+V** di canvas.

Frame, group, component, instance, rectangle, ellipse, text, fill, stroke, opacity,
radius, hierarchy, dan auto layout dasar dipertahankan. Image fill dibawa sebagai
image layer. Efek dan vector path kompleks saat ini diturunkan ke bentuk Forge
terdekat.
