// 內建示範星系（IntentAnalysisResponse v1.0，印尼文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Batas lapisan", D2: "Cara variasi diekspresikan", D3: "Cakupan kustomisasi", D4: "Komposisi tema" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Posisi tandingan: dorong ${dims[dim]} ke ekstrem sebaliknya`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_ID = {
  schema_version: "1.0",
  core: {
    decision: "Apakah setiap brand sebaiknya fork komponennya sendiri, atau satu core bersama yang digerakkan konfigurasi?",
    metric: "Dalam 60 hari: tema baru rilis dalam ≤2 hari, dan CSS tiap tema <50KB",
  },
  quadrants: {
    Q1: { scar: "Komponen bersama penuh if khusus brand", sacred: "Nol percabangan di core" },
    Q2: { scar: "100+ tema ditambal manual satu per satu", sacred: "Tipe menangkap kesalahan" },
    Q3: { scar: "Meniru design system, malah over-abstraksi", sacred: "Struktur bisa ditukar" },
    Q4: { scar: "Tiga kali menyaksikan kustomisasi lepas kendali", sacred: "Batas harus bertahan" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Pisah 3 lapis", "Pisahkan komponen menjadi core murni, view sebagai koordinator, dan theme sebagai daun; core dilarang meng-import ID tema atau route", "Salah jika pengecekan tema muncul di core dalam 14 hari", null),
    N2: node("D2", 0, 1, "Hanya CSS vars", "Ekspresikan setiap perbedaan tema hanya lewat CSS custom properties, tanpa percabangan sama sekali di komponen atau layout", "Salah jika tema ke-3 sudah butuh perubahan komponen", "Perbedaan layout tidak bisa diekspresikan hanya dengan warna"),
    N3: node("D1", 1, 0, "CSS tema lazy", "Saat runtime, muat hanya satu stylesheet tema yang aktif, bukan membundel semua tema ke tampilan pertama", "Salah jika CSS satu tema mana pun melebihi 50KB dalam 14 hari", null),
    N4: node("D4", 0, 2, "Config bertipe", "Setiap tema membawa objek config TypeScript yang lengkap; field yang hilang membuat build gagal", "Salah jika tema baru masih butuh perubahan komponen bersama", null),
    N5: node("D3", 2, 0, "Fork per brand", "Setiap tema menyalin direktori komponen dan mengubahnya sendiri, sehingga antar-brand tidak saling memengaruhi", "Salah jika, setelah tema ke-10, memperbaiki satu bug menyentuh >10 tempat", "Satu perbaikan bug berarti menambal N salinan"),
    N6: node("D3", 1, 2, "Tema canary", "Rilis setiap tema baru di balik feature flag ke 5% tenant selama seminggu; naik ke 100% hanya jika tingkat error sesuai target", "Salah jika tingkat error canary melebihi 1%", null),
    N7: node("D3", 2, 1, "Ganti bodi", "[D2 platform mobil] Layout ibarat bodi mobil: ganti seluruh bodi sementara sasis bersama (view dan core) tetap", "Salah jika mengganti layout butuh perubahan core", "Interaksi mulai berbeda antar-layout",
      { lateral: { src: "Otomotif: sasis platform", dist: 2, drop: "Membangun ulang tiap model mobil dari nol" } }),
    N8: node("D2", 1, 0, "Slot tetap", "[D3 balok LEGO] Layout mendeklarasikan slot tetap; tema hanya boleh memasang komponen ke slot dan tidak boleh mengubah struktur di luarnya", "Salah jika DOM di luar slot diubah walau sekali", null,
      { lateral: { src: "Mainan: antarmuka balok LEGO", dist: 3, drop: "Kustomisasi DOM bebas" } }),
    N9: node("D4", 2, 0, "Warisi selisih", "[D4 keluarga font] Tema hanya mendeklarasikan selisihnya dari default; semua field lain diwarisi otomatis", "Salah jika pewarisan lebih dalam dari 3 tingkat", null,
      { lateral: { src: "Desain huruf: keluarga ketebalan", dist: 4, drop: "Salinan penuh per tema" } }),
    N10: node("D2", 2, 0, "Batasi config", "Jika setiap permintaan kustomisasi menambah satu field config, biaya merawat config pasti melampaui biaya fork saja", "Berhenti menambah field begitu satu interface config melebihi 40 field", "Neraka config",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraksi lebih mahal daripada duplikasi" } }),
    N11: node("D4", 1, 0, "Blokir bypass", "Jika pihak bisnis bisa menuntut pengecekan brand langsung di komponen bersama, batasnya akan runtuh dalam satu kuartal", "Batal jika ada pengecekan brand ditambahkan ke komponen bersama dalam 14 hari", "Menukar batas demi tenggat",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Tekanan tenggat memberi insentif untuk melanggar batas" } }),
    N12: node("D3", 0, 1, "Tanpa rombak", "Jika ke-70 modul harus dimigrasi sebelum ada yang rilis, sunk cost akan membuat refactor macet di tengah jalan", "Berhenti jika modul pertama belum rilis dalam 14 hari", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Refactor besar-besaran menyandera tenggat" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Config bertipe bersama dan fork komponen per brand adalah pilihan salah satu" },
    { type: "excludes", from: "N1", to: "N5", why: "Core tiga lapis bersama dan salinan komponen per brand saling meniadakan" },
    { type: "excludes", from: "N4", to: "N11", why: "Config bertipe sudah memblokir jalan pintas saat kompilasi, jadi review batas manual menjadi gerbang yang berlebihan" },
    { type: "excludes", from: "N2", to: "N7", why: "Jika tema hanya mengubah CSS variables, tidak ada penggantian komponen layout secara utuh" },
    { type: "excludes", from: "N2", to: "N10", why: "CSS variables murni tidak punya field config yang bisa membengkak; pilih salah satu" },
    { type: "excludes", from: "N9", to: "N11", why: "Rantai pewarisan mengizinkan override lokal, yang bertentangan dengan rambu pengaman tanpa jalan pintas" },
    { type: "requires", from: "N1", to: "N8", why: "Setelah dipisah tiga lapis, tema harus dikustomisasi lewat slot tetap, kalau tidak lapisan view akan jebol" },
    { type: "requires", from: "N4", to: "N10", why: "Config bertipe butuh batas field, kalau tidak akan membengkak jadi neraka config" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Upaya refactor di awal", v: "Tidak ada fork cepat", t: "60 hari membangun kerangka", l: "Wajib menulis tes integritas", x: "Tidak ada jalan pintas khusus brand" },
      fatal: "N10", thesis: "Batas tiga lapis ditambah config bertipe menyusutkan tiap tema menjadi satu daun saja", title: "Berbasis config · 3 lapis",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Variasi layout terbatas", v: "Kebebasan desain berkurang", t: "Langkah kecil tiap minggu", l: "Layout kompleks tidak dimungkinkan", x: "Tidak ada kustomisasi struktur" },
      fatal: "N12", thesis: "Gunakan hanya CSS variables dan pewarisan, rilis tema bertahap di balik canary", title: "Murni styling · bertahap",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Kode terduplikasi", v: "Perbaikan bug menyentuh banyak tempat", t: "Paling cepat rilis", l: "Biaya perawatan naik linear", x: "Melepas config bertipe" },
      fatal: "N11", thesis: "Ganti layout secara utuh dan biarkan tiap brand fork bodinya sendiri", title: "Fork brand · sasis bersama",
    },
  },
  recommend: { key: "alpha", why: "Dengan 100+ tema, hanya desain berbasis config yang bisa menjaga biaya perawatan tetap terkendali" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Setiap tema mewarisi dari tema default yang sama", kill: "Rusakkan default dan layout semua tema ikut rusak", label: "SPOF default" },
};
