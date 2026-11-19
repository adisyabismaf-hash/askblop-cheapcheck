# askblop-cheapcheck

Mod Claude Code untuk audit naskah e-book Ask Blop. Menambah satu slash command, `/blopcheck`, yang memeriksa file naskah markdown lewat kode biasa (0 token): jumlah kata, URL duplikat, handle sosmed, pengingat bukan saran keuangan, caption "Gambar:", em dash, frasa khas AI, huruf awal terpotong, dan kelengkapan pola bab. Opsi `--haiku` menambah review gaya singkat oleh Haiku.

## Pakai

```
/blopcheck
/blopcheck path/ke/naskah.md
/blopcheck --haiku
```

Tanpa path, yang diperiksa adalah `Apa itu Layer 2/1. Draft/00-naskah-lengkap.md` relatif ke folder kerja.

## Pasang

Di prompt sesi terminal:

```
/plugin install askblop-cheapcheck --marketplace adisyabismaf-hash/askblop-cheapcheck
```

Dari shell:

```
claude plugin install askblop-cheapcheck --marketplace adisyabismaf-hash/askblop-cheapcheck
```

Di aplikasi desktop, tempat `/plugin` tidak jalan: klik + di sebelah kotak prompt, pilih Plugins, Add marketplace dengan `adisyabismaf-hash/askblop-cheapcheck`, lalu Add plugin.
