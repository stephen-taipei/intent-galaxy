// 內建示範星系（IntentAnalysisResponse v1.0，馬來文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Cara kod dibahagi lapisan", D2: "Cara tema berbeza", D3: "Sejauh mana boleh diubah suai", D4: "Cara tetapan tema dibina" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Pihak sebelah lagi: bawa "${dims[dim]}" ke arah bertentangan`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_MS = {
  schema_version: "1.0",
  core: {
    decision: "Patutkah setiap jenama fork salinan komponennya sendiri, atau semua jenama berkongsi satu core dan menukar perbezaan melalui fail config?",
    metric: "Dalam 60 hari: tema baharu siap dalam 2 hari atau kurang, dan CSS setiap tema di bawah 50KB",
  },
  quadrants: {
    Q1: { scar: "Komponen dikongsi penuh dengan if jenama", sacred: "Tiada semakan jenama dalam core" },
    Q2: { scar: "Betulkan susun atur 100+ tema satu per satu dengan tangan", sacred: "Biar semakan jenis menangkap kesilapan" },
    Q3: { scar: "Tiru design system orang lain, akhirnya terlalu rumit", sacred: "Bahagian yang boleh ditukar keseluruhannya" },
    Q4: { scar: "Tiga kali melihat penyesuaian hilang kawalan", sacred: "Sempadan antara lapisan mesti kekal" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Pecah 3 lapisan", "Bahagikan komponen kepada tiga lapisan: core yang hanya ada logik, view yang menyambung semuanya, dan lapisan tema untuk gaya; core tidak boleh import ID tema atau laluan", "Gagal jika kod yang menyemak tema muncul dalam core dalam 14 hari", null),
    N2: node("D2", 0, 1, "CSS vars sahaja", "Tulis setiap perbezaan antara tema sebagai pemboleh ubah CSS (custom properties), tanpa sebarang semakan tema dalam komponen atau susun atur", "Gagal jika tema ke-3 sudah memerlukan perubahan komponen", "Perbezaan susun atur tidak boleh dibuat dengan warna sahaja"),
    N3: node("D1", 1, 0, "Muat satu tema", "Semasa digunakan, muatkan hanya stylesheet tema semasa dan bukannya menggabungkan semua tema ke dalam muatan halaman pertama", "Gagal jika CSS mana-mana tema melebihi 50KB dalam 14 hari", null),
    N4: node("D4", 0, 2, "Config bertaip", "Setiap tema membawa objek config TypeScript yang lengkap; tertinggal mana-mana medan, build akan gagal", "Gagal jika tema baharu masih memerlukan perubahan komponen dikongsi", null),
    N5: node("D3", 2, 0, "Fork per jenama", "Setiap tema menyalin folder komponen dan mengubahnya sendiri, supaya jenama tidak saling menjejaskan", "Gagal jika, selepas tema ke-10, membaiki satu pepijat perlu mengubah lebih 10 tempat", "Membaiki satu pepijat bermakna menampal setiap salinan"),
    N6: node("D3", 1, 2, "Uji 5% dulu", "Letakkan setiap tema baharu di sebalik feature flag untuk 5% pelanggan selama seminggu; buka kepada semua hanya jika kadar ralat kekal dalam sasaran", "Gagal jika kadar ralat melebihi 1% dalam minggu itu", null),
    N7: node("D3", 2, 1, "Tukar badan", "Seperti kereta yang berkongsi casis dan hanya menukar badan: tukar keseluruhan susun atur sementara view dan core dikongsi di bawahnya kekal", "Gagal jika menukar susun atur memerlukan perubahan core", "Kawalan mungkin berkelakuan berbeza antara susun atur",
      { lateral: { src: "Kereta: casis dikongsi", dist: 2, drop: "Acuan baharu untuk setiap model kereta" } }),
    N8: node("D2", 1, 0, "Slot tetap", "Seperti blok LEGO yang hanya boleh dipasang pada bonggolnya: susun atur menetapkan slot tetap, tema hanya boleh meletakkan komponen dalam slot itu, dan tiada apa di luarnya boleh diubah", "Gagal jika DOM di luar slot diubah walaupun sekali", null,
      { lateral: { src: "Mainan: blok LEGO", dist: 3, drop: "Mengubah DOM sesuka hati" } }),
    N9: node("D4", 2, 0, "Beza sahaja", "Seperti huruf tebal dan nipis daripada fon yang sama: tema hanya menyenaraikan apa yang berbeza daripada tema lalai, dan medan lain diwarisi secara automatik", "Gagal jika pewarisan melebihi 3 tahap", null,
      { lateral: { src: "Reka bentuk huruf: ketebalan fon", dist: 4, drop: "Salinan penuh bagi setiap tema" } }),
    N10: node("D2", 2, 0, "Hadkan config", "Jika setiap permintaan penyesuaian menambah satu medan config, lambat-laun kos menjaga config akan melebihi kos fork sahaja", "Berhenti menambah medan apabila mana-mana satu antara muka config melebihi 40 medan", "Terlalu banyak tetapan sehingga tiada siapa faham",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Kod serba guna akhirnya lebih mahal daripada kod salinan" } }),
    N11: node("D4", 1, 0, "Tiada pintasan", "Jika pihak bisnes boleh menuntut semakan jenama terus dalam komponen dikongsi, sempadan lapisan akan runtuh dalam satu suku tahun", "Hentikan pelan ini jika walaupun 1 semakan jenama ditambah ke komponen dikongsi dalam 14 hari", "Mengorbankan lapisan demi tarikh akhir",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Capai tarikh akhir dipuji; pecahkan lapisan tiada siapa hukum" } }),
    N12: node("D3", 0, 1, "Jangan rombak", "Jika kesemua 70 modul mesti dipindahkan sebelum apa-apa dilancarkan, makin banyak usaha dilaburkan makin sukar berhenti, dan penulisan semula cenderung terhenti di tengah jalan", "Berhenti jika modul pertama belum dilancarkan dalam 14 hari", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Menulis semula semuanya sekali gus merosakkan jadual" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Satu config bertaip dikongsi dan fork berasingan untuk setiap jenama: hanya boleh pilih satu" },
    { type: "excludes", from: "N1", to: "N5", why: "Core tiga lapisan dikongsi dan salinan komponen untuk setiap jenama: hanya boleh pilih satu" },
    { type: "excludes", from: "N4", to: "N11", why: "Config bertaip sudah menyekat jalan pintas semasa build, jadi semakan lapisan secara manual hanya menyemak perkara sama dua kali" },
    { type: "excludes", from: "N2", to: "N7", why: "Jika tema hanya menukar pemboleh ubah CSS, tiada siapa akan menukar keseluruhan komponen susun atur" },
    { type: "excludes", from: "N2", to: "N10", why: "Dengan pemboleh ubah CSS sahaja, tiada medan config yang bertimbun; pilih satu" },
    { type: "excludes", from: "N9", to: "N11", why: "Pewarisan membenarkan tema mengubah sedikit di tempat tertentu, dan ini bercanggah dengan had perlindungan tidak boleh melangkau lapisan langsung" },
    { type: "requires", from: "N1", to: "N8", why: "Sebaik ada tiga lapisan, tema mesti diubah suai melalui slot tetap, jika tidak lapisan view akan diubah sehingga rosak" },
    { type: "requires", from: "N4", to: "N10", why: "Config bertaip perlu had bilangan medan, jika tidak ia akan bertambah sehingga tiada siapa faham" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Kerja tulis semula di awal", v: "Tiada fork pantas", t: "60 hari untuk menyediakan struktur", l: "Mesti tulis ujian yang teliti", x: "Tiada jalan pintas khas untuk jenama" },
      fatal: "N10", thesis: "Tiga lapisan untuk komponen dan satu fail config bertaip bagi setiap tema, jadi setiap tema hanyalah satu config", title: "Dipacu config · 3 lapisan",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Kepelbagaian susun atur terhad", v: "Kurang kebebasan reka bentuk", t: "Sedikit perubahan setiap minggu", l: "Susun atur rumit tidak boleh dibuat", x: "Tiada perubahan struktur halaman" },
      fatal: "N12", thesis: "Guna pemboleh ubah CSS dan pewarisan sahaja; tunjukkan tema baharu kepada sebilangan kecil pengguna dulu, kemudian luaskan", title: "Gaya sahaja · dibuka beransur",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Kod berulang", v: "Baiki pepijat perlu ubah banyak tempat", t: "Paling pantas dilancarkan", l: "Makin banyak tema, makin berat penjagaan", x: "Lepaskan config bertaip" },
      fatal: "N11", thesis: "Tukar keseluruhan susun atur dan biarkan setiap jenama fork badannya sendiri", title: "Fork jenama · casis dikongsi",
    },
  },
  recommend: { key: "alpha", why: "Dengan 100+ tema, hanya cara dipacu config yang dapat mengawal kos penjagaan" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Setiap tema mewarisi daripada tema lalai yang sama", kill: "Jika tema lalai rosak, susun atur setiap tema turut rosak", label: "Semua pada lalai" },
};
