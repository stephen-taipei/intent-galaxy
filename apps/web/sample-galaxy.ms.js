// 內建示範星系（IntentAnalysisResponse v1.0，馬來文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Sempadan lapisan", D2: "Cara variasi dinyatakan", D3: "Skop penyesuaian", D4: "Komposisi tema" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Pandangan bertentangan: tolak ${dims[dim]} ke hujung yang berlawanan`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_MS = {
  schema_version: "1.0",
  core: {
    decision: "Patutkah setiap jenama fork komponennya sendiri, atau satu core dikongsi yang dipacu konfigurasi?",
    metric: "Dalam 60 hari: tema baharu siap dalam ≤2 hari, dan CSS setiap tema <50KB",
  },
  quadrants: {
    Q1: { scar: "Komponen dikongsi penuh dengan if jenama", sacred: "Sifar cabang dalam core" },
    Q2: { scar: "100+ tema ditampal satu per satu secara manual", sacred: "Jenis data menangkap kesilapan" },
    Q3: { scar: "Meniru design system, akhirnya terlebih abstrak", sacred: "Struktur boleh ditukar ganti" },
    Q4: { scar: "Tiga kali melihat penyesuaian hilang kawalan", sacred: "Sempadan mesti kekal" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Pecah 3 lapisan", "Pecahkan komponen kepada core tulen, view sebagai penyelaras, dan theme sebagai daun; core tidak boleh import ID tema atau laluan", "Salah jika semakan tema muncul dalam core dalam 14 hari", null),
    N2: node("D2", 0, 1, "CSS vars sahaja", "Nyatakan setiap perbezaan tema melalui CSS custom properties sahaja, tanpa sebarang cabang dalam komponen atau susun atur", "Salah jika tema ke-3 sudah memerlukan perubahan komponen", "Perbezaan susun atur tidak boleh dinyatakan dengan warna sahaja"),
    N3: node("D1", 1, 0, "Muat CSS lewat", "Semasa runtime, muatkan hanya satu stylesheet tema aktif dan bukannya membundel semua tema ke dalam paparan pertama", "Salah jika CSS mana-mana satu tema melebihi 50KB dalam 14 hari", null),
    N4: node("D4", 0, 2, "Config bertaip", "Setiap tema membawa objek config TypeScript yang lengkap; sebarang medan yang tiada akan menggagalkan build", "Salah jika tema baharu masih memerlukan perubahan komponen dikongsi", null),
    N5: node("D3", 2, 0, "Fork per jenama", "Setiap tema menyalin direktori komponen dan mengubahnya sendiri, supaya jenama tidak saling menjejaskan", "Salah jika, selepas tema ke-10, membaiki satu pepijat menyentuh >10 tempat", "Membaiki satu pepijat bermakna menampal N salinan"),
    N6: node("D3", 1, 2, "Tema canary", "Lancarkan setiap tema baharu di sebalik feature flag kepada 5% penyewa selama seminggu; naik ke 100% hanya jika kadar ralat capai sasaran", "Salah jika kadar ralat canary melebihi 1%", null),
    N7: node("D3", 2, 1, "Tukar badan", "[D2 platform kereta] Susun atur ibarat badan kereta: tukar seluruh badan sementara casis dikongsi (view dan core) kekal", "Salah jika menukar susun atur memerlukan perubahan core", "Interaksi mula berbeza antara susun atur",
      { lateral: { src: "Automotif: casis platform", dist: 2, drop: "Membina setiap model kereta dari awal" } }),
    N8: node("D2", 1, 0, "Slot tetap", "[D3 blok LEGO] Susun atur mengisytiharkan slot tetap; tema hanya boleh memasang komponen ke dalam slot dan tidak boleh mengubah struktur di luarnya", "Salah jika DOM di luar slot diubah walaupun sekali", null,
      { lateral: { src: "Mainan: antara muka blok LEGO", dist: 3, drop: "Penyesuaian DOM sesuka hati" } }),
    N9: node("D4", 2, 0, "Warisi beza", "[D4 keluarga fon] Tema hanya mengisytiharkan perbezaannya daripada lalai; semua medan lain diwarisi secara automatik", "Salah jika pewarisan melebihi 3 tahap", null,
      { lateral: { src: "Reka bentuk huruf: keluarga ketebalan", dist: 4, drop: "Salinan penuh bagi setiap tema" } }),
    N10: node("D2", 2, 0, "Hadkan config", "Jika setiap permintaan penyesuaian menambah satu medan config, kos menyelenggara config pasti melebihi kos fork sahaja", "Berhenti menambah medan apabila mana-mana satu antara muka config melebihi 40 medan", "Neraka config",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraksi lebih mahal daripada duplikasi" } }),
    N11: node("D4", 1, 0, "Sekat pintasan", "Jika pihak bisnes boleh menuntut semakan jenama terus dalam komponen dikongsi, sempadan akan runtuh dalam satu suku tahun", "Batal jika ada semakan jenama ditambah ke komponen dikongsi dalam 14 hari", "Menukar sempadan dengan tarikh akhir",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Tekanan tarikh akhir memberi ganjaran kepada pelanggaran sempadan" } }),
    N12: node("D3", 0, 1, "Elak rombak", "Jika kesemua 70 modul mesti dipindahkan sebelum apa-apa dilancarkan, kos tenggelam akan membantutkan refactor di tengah jalan", "Berhenti jika modul pertama belum dilancarkan dalam 14 hari", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Refactor besar-besaran menjadikan tarikh akhir tebusan" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Config bertaip yang dikongsi dan fork komponen ikut jenama adalah pilihan salah satu" },
    { type: "excludes", from: "N1", to: "N5", why: "Core tiga lapisan yang dikongsi dan salinan komponen ikut jenama tidak boleh wujud bersama" },
    { type: "excludes", from: "N4", to: "N11", why: "Config bertaip sudah menyekat pintasan semasa kompil, jadi semakan sempadan manual menjadi pintu kawalan berlebihan" },
    { type: "excludes", from: "N2", to: "N7", why: "Jika tema hanya menukar CSS variables, tiada pertukaran keseluruhan komponen susun atur" },
    { type: "excludes", from: "N2", to: "N10", why: "CSS variables tulen tiada medan config untuk membengkak; pilih satu" },
    { type: "excludes", from: "N9", to: "N11", why: "Rantaian pewarisan membenarkan override setempat, yang bercanggah dengan had perlindungan sifar pintasan" },
    { type: "requires", from: "N1", to: "N8", why: "Selepas dipecah kepada tiga lapisan, tema mesti disesuaikan melalui slot tetap, jika tidak lapisan view akan ditembusi" },
    { type: "requires", from: "N4", to: "N10", why: "Config bertaip memerlukan had medan, jika tidak ia akan membengkak menjadi neraka config" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Usaha refactor di awal", v: "Tiada fork pantas", t: "60 hari untuk membina rangka", l: "Mesti menulis ujian integriti", x: "Tiada jalan pintas khusus jenama" },
      fatal: "N10", thesis: "Sempadan tiga lapisan serta config bertaip mengecilkan setiap tema kepada satu daun sahaja", title: "Dipacu config · 3 lapisan",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Variasi susun atur terhad", v: "Kurang kebebasan reka bentuk", t: "Langkah kecil setiap minggu", l: "Susun atur kompleks tidak dibenarkan", x: "Tiada penyesuaian struktur" },
      fatal: "N12", thesis: "Gunakan CSS variables dan pewarisan sahaja, lancarkan tema secara beransur-ansur di sebalik canary", title: "Gaya tulen · beransur",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Kod berganda", v: "Pembaikan pepijat menyentuh banyak tempat", t: "Paling cepat dilancarkan", l: "Kos penyelenggaraan meningkat secara linear", x: "Lepaskan config bertaip" },
      fatal: "N11", thesis: "Tukar keseluruhan susun atur dan biarkan setiap jenama fork badannya sendiri", title: "Fork jenama · casis dikongsi",
    },
  },
  recommend: { key: "alpha", why: "Dengan 100+ tema, hanya reka bentuk dipacu config yang dapat mengawal kos penyelenggaraan" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Setiap tema mewarisi daripada tema lalai yang sama", kill: "Rosakkan tema lalai dan susun atur setiap tema turut rosak", label: "SPOF tema lalai" },
};
