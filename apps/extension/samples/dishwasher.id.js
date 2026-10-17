// 擴充功能生活題示範星系（印尼文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Penempatan", D2: "Cara memilih", D3: "Seberapa banyak renovasi", D4: "Kapasitas & peralatan makan" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Pihak seberang mendorong ${dims[dim]} ke ekstrem sebaliknya`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_ID = {
  schema_version: "1.0",
  core: {
    decision: "Apakah dapur sebaiknya direnovasi demi mesin cuci piring, atau pilih mesin yang muat di dapur yang sudah ada?",
    metric: "Dalam 30 hari pertama, pakai minimal 5 kali seminggu dan cuci piring manual tidak lebih dari 5 menit sehari",
  },
  quadrants: {
    Q1: { scar: "Sudah beli mesin cuci piring, tetap cuci manual", sacred: "Hitung dulu jumlah piringmu" },
    Q2: { scar: "Baru sadar selangnya kurang panjang saat dipasang", sacred: "Ukur dulu, baru beli" },
    Q3: { scar: "Beli dari daftar rekomendasi online, ternyata tidak muat", sacred: "Pinjam ide dari bidang lain" },
    Q4: { scar: "Tiga kali melihat mesin cuci piring jadi rak piring", sacred: "Rencanakan kegagalan dulu" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tanam kabinet", "Bongkar kabinet 45 atau 60 cm di samping wastafel dan pasang mesin secara tanam, jadi tidak makan meja dapur dan tidak menghalangi jalan", "Tidak cocok jika lebar, tinggi, atau kedalaman kabinet lebih kecil dari dimensi tanam mesin", null),
    N2: node("D2", 0, 1, "Cuci tiap makan", "Pilih model dengan siklus cepat di bawah 1 jam dan jalankan setiap habis makan, supaya piring kotor tidak menginap di wastafel", "Tidak cocok jika piring masih terasa berminyak setelah siklus cepat lebih dari 2 kali dalam 14 hari", "Siklus cepat biasanya tanpa pengeringan, jadi piring harus diangin-anginkan sendiri"),
    N3: node("D1", 1, 0, "Dekat wastafel", "Taruh mesin dalam jarak 1 meter dari wastafel dan arahkan selang buang langsung ke saluran wastafel, tanpa bobok tembok atau pipa baru", "Tidak cocok jika selang buang bawaan tidak sampai ke wastafel dan perlu disambung", null),
    N4: node("D4", 0, 2, "Ukuran keluarga", "Untuk rumah berisi 3 orang atau lebih, pilih 12+ set alat makan supaya panci dan piring masuk sekali cuci, bukan dua", "Tidak cocok jika, lebih dari 2 hari dalam 14 hari, piring dan panci tidak muat sekali cuci", null),
    N5: node("D3", 2, 0, "Mini di meja", "Beli model mini di atas meja dengan 8 set atau kurang: tanpa bongkar kabinet, tanpa ubah pipa, dan bisa dibawa saat pindahan", "Tidak cocok jika, lebih dari 3 hari dalam 14 hari, butuh 2 kali jalan untuk membersihkan semuanya", "Memakan sebagian meja untuk menyiapkan masakan"),
    N6: node("D3", 1, 2, "Coba dulu", "Beli model yang bisa berdiri bebas atau ditanam, taruh di samping wastafel selama 30 hari penuh, baru putuskan apakah kabinet dibongkar, bukan dibongkar di hari pertama", "Tidak cocok jika, selama 30 hari uji coba, mesin menghalangi jalan atau laci", null),
    N7: node("D3", 2, 1, "Pakai tangki", "Seperti karavan dengan tangki air sendiri, pilih model meja yang diisi air manual: tanpa sambungan keran, tanpa ubah pipa", "Tidak cocok jika, dalam minggu mana pun, kamu malas mengisi air dan cuci manual 2 kali atau lebih", "Mengisi air lebih repot dari yang dibayangkan",
      { lateral: { src: "Berkemah: tangki air bawaan", dist: 2, drop: "Sambungan keran permanen" } }),
    N8: node("D2", 1, 0, "Ukur dulu", "Seperti checklist pilot sebelum terbang, ukur lebar, kedalaman, dan tinggi sebelum memesan, lalu cek posisi stopkontak dan saluran buang; jika satu dari 5 itu kurang, jangan pesan", "Tidak cocok jika ada yang tidak pas atau tidak bisa dipasang saat barang tiba", null,
      { lateral: { src: "Penerbangan: checklist pra-terbang", dist: 3, drop: "Memesan berdasarkan feeling" } }),
    N9: node("D4", 2, 0, "Aman mesin", "Seperti restoran yang hanya memakai peralatan tahan mesin, ganti semua panci dan piring berlabel tidak aman untuk mesin cuci piring, sampai tidak ada yang perlu dicuci manual", "Tidak cocok jika, dalam 14 hari setelah ganti, kamu masih mencuci manual lebih dari 3 barang sehari", null,
      { lateral: { src: "Restoran: peralatan makan kelas komersial", dist: 4, drop: "Campuran piring lama di rumah" } }),
    N10: node("D2", 2, 0, "Jangan setengah", "Jika dijalankan kurang dari setengah penuh, air dan listriknya hampir sama dengan muatan penuh, jadi biaya per piring lebih dari dua kali lipat", "Catat piringmu selama 7 hari sebelum memesan; jika rata-rata di bawah 6 set sehari, beralih ke model mini", "Piring mulai bau selagi menunggu muatan penuh",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Mesin besar yang setengah kosong tidak sepadan" } }),
    N11: node("D4", 1, 0, "Tanpa panci", "Jika wajan dan panci besar dijejalkan demi praktis, model mini tidak muat semua piring sekali cuci dan kamu kembali cuci manual", "Batalkan jika panci memaksa cucian kedua lebih dari 2 kali dalam 14 hari", "Tidak semua orang di rumah akan patuh aturan",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Menjejali mesin demi praktis" } }),
    N12: node("D3", 0, 1, "Tanpa renovasi", "Jika pasang mesin cuci piring merembet jadi renovasi seluruh dapur, begitu pekerjaan mulai dan uang sudah dibayar, kamu terpaksa menuntaskannya", "Jangan mulai jika penawaran harga sebelum bongkar kabinet lebih dari 2x harga mesin", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Begitu pekerjaan mulai, tidak bisa mundur" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Mesin 12+ set tidak muat di atas meja, jadi pilih itu atau model mini di meja" },
    { type: "excludes", from: "N1", to: "N5", why: "Begitu mesin ditanam di kabinet, kamu tidak akan beli model mini di meja juga; pilih salah satu" },
    { type: "excludes", from: "N4", to: "N11", why: "Tujuan memilih ukuran keluarga justru agar panci ikut dicuci, bertentangan dengan larangan panci" },
    { type: "excludes", from: "N2", to: "N7", why: "Cuci setiap habis makan berarti mengisi tangki manual tiga kali sehari, sulit dipertahankan" },
    { type: "excludes", from: "N2", to: "N10", why: "Cuci setiap habis makan sering kurang dari setengah muatan, bertentangan dengan aturan jangan setengah" },
    { type: "excludes", from: "N9", to: "N11", why: "Tujuan beralih ke panci dan piring aman mesin justru agar dimasukkan, bertentangan dengan larangan panci" },
    { type: "requires", from: "N1", to: "N8", why: "Meleset 1 cm saja mesin tidak bisa masuk kabinet, jadi semuanya harus diukur sebelum memesan" },
    { type: "requires", from: "N4", to: "N10", why: "Mesin besar yang setengah kosong tetap memakai air dan listrik muatan penuh, jadi patuhi aturan jangan setengah" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ongkos bongkar kabinet dan pemasangan", v: "Berkurang satu kabinet penyimpanan", t: "Menunggu tukang datang mengukur dan memasang", l: "Tunggu setengah muatan sebelum menjalankan", x: "Melepas model mini di meja" },
      fatal: "N10", thesis: "Ukur kabinet, tanam mesin besar, jalankan hanya saat setengah penuh", title: "Mesin besar tanam, sekali beres",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Panci dan piring baru, plus air dan listrik setiap makan", v: "Menghalangi jalan selama uji coba", t: "Kabinet baru dibongkar setelah 30 hari", l: "Angin-anginkan piring setelah siklus cepat", x: "Melepas model mini di meja" },
      fatal: "N12", thesis: "Cuci cepat setiap habis makan; taruh di samping wastafel sampai cocok, baru ditanam", title: "Cuci cepat harian, coba dulu",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Isi air manual setiap kali jalan", v: "Memakan sebagian meja masak", t: "Cuci panci manual setiap hari", l: "8 set alat makan atau kurang", x: "Melepas model tanam dan kapasitas besar" },
      fatal: "N11", thesis: "Model mini di meja yang diisi sendiri; panci tetap dicuci manual", title: "Mini di meja, tanpa pipa",
    },
  },
  recommend: { key: "alpha", why: "Untuk rumah berisi 3 orang atau lebih, satu mesin besar menangani piring seharian dalam sekali jalan" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Piring seluruh keluarga bergantung pada satu mesin ini; jika rusak, satu-satunya cadangan adalah cuci manual", kill: "Batalkan jika perbaikan makan lebih dari 7 hari dan keluarga kembali cuci manual", label: "Satu mesin" },
};
