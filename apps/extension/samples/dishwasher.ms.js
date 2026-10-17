// 擴充功能生活題示範星系（馬來文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Kedudukan", D2: "Cara memilih", D3: "Tahap ubah suai", D4: "Kapasiti & pinggan" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Pihak lawan menolak ${dims[dim]} ke hujung yang bertentangan`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_MS = {
  schema_version: "1.0",
  core: {
    decision: "Patutkah anda ubah suai dapur demi mesin basuh pinggan, atau pilih mesin yang muat dalam dapur sedia ada?",
    metric: "Dalam 30 hari pertama, guna sekurang-kurangnya 5 kali seminggu dan basuh pinggan dengan tangan tidak lebih 5 minit sehari",
  },
  quadrants: {
    Q1: { scar: "Dah beli mesin basuh pinggan, masih basuh dengan tangan", sacred: "Kira pinggan mangkuk dulu" },
    Q2: { scar: "Baru tahu hos tak cukup panjang masa pemasangan", sacred: "Ukur dulu, baru beli" },
    Q3: { scar: "Beli ikut senarai terbaik dalam talian, tapi tak muat", sacred: "Pinjam idea dari bidang lain" },
    Q4: { scar: "Tiga kali tengok mesin basuh pinggan jadi rak pinggan", sacred: "Rancang untuk kegagalan dulu" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Masuk kabinet", "Buka kabinet 45 atau 60 cm di sebelah sinki dan pasang mesin secara terbina dalam, supaya ia tak ambil ruang kaunter dan tak halang laluan", "Tak sesuai jika lebar, tinggi atau dalam kabinet lebih kecil daripada ukuran terbina dalam mesin", null),
    N2: node("D2", 0, 1, "Kitaran pantas", "Pilih model dengan kitaran pantas bawah 1 jam dan jalankan selepas setiap kali makan, supaya pinggan kotor tak bermalam dalam sinki", "Tak sesuai jika pinggan masih berminyak selepas kitaran pantas lebih 2 kali dalam 14 hari", "Kitaran pantas biasanya tiada pengeringan, jadi anda perlu keringkan sendiri"),
    N3: node("D1", 1, 0, "Dekat sinki", "Letak mesin dalam jarak 1 meter dari sinki dan salurkan hos buangan terus ke longkang sinki, tanpa tebuk dinding atau tambah paip", "Tak sesuai jika hos buangan yang disertakan tak sampai ke sinki dan perlu disambung", null),
    N4: node("D4", 0, 2, "Saiz keluarga", "Jika 3 orang atau lebih di rumah, pilih 12+ set pinggan supaya periuk dan pinggan masuk sekali basuh, bukan dua", "Tak sesuai jika, lebih 2 hari dalam 14 hari, pinggan dan periuk tak muat sekali basuh", null),
    N5: node("D3", 2, 0, "Mini kaunter", "Beli model mini atas kaunter 8 set atau kurang: tak perlu buka kabinet, tak ubah paip, dan boleh dibawa bila pindah rumah", "Tak sesuai jika, lebih 3 hari dalam 14 hari, perlu 2 kali basuh untuk bersihkan semuanya", "Makan sebahagian ruang kaunter untuk menyediakan makanan"),
    N6: node("D3", 1, 2, "Cuba dulu", "Beli model yang boleh berdiri sendiri atau terbina dalam, letak di sebelah sinki selama 30 hari penuh, kemudian baru putuskan sama ada buka kabinet, bukan bongkar pada hari pertama", "Tak sesuai jika, sepanjang 30 hari percubaan, mesin menghalang laluan atau laci", null),
    N7: node("D3", 2, 1, "Tangki air", "Macam karavan dengan tangki air sendiri, pilih model atas kaunter yang diisi air dengan tangan: tak perlu sambung paip, tak ubah paip", "Tak sesuai jika, dalam mana-mana minggu, anda malas isi air dan basuh dengan tangan 2 kali atau lebih", "Mengisi air lebih leceh daripada yang anda sangka",
      { lateral: { src: "Perkhemahan: tangki air terbina", dist: 2, drop: "Sambungan paip kekal" } }),
    N8: node("D2", 1, 0, "Ukur dulu", "Macam senarai semak juruterbang sebelum terbang, ukur lebar, dalam dan tinggi sebelum memesan, kemudian semak kedudukan soket dan longkang; jika salah satu daripada 5 itu tiada, jangan pesan", "Tak sesuai jika ada yang tak padan atau tak boleh dipasang bila sampai", null,
      { lateral: { src: "Penerbangan: senarai semak pra-terbang", dist: 3, drop: "Memesan ikut gerak hati" } }),
    N9: node("D4", 2, 0, "Selamat mesin", "Macam restoran yang hanya guna pinggan tahan mesin, ganti semua periuk dan pinggan yang berlabel tak selamat untuk mesin basuh, supaya tiada lagi yang perlu dibasuh tangan", "Tak sesuai jika, dalam 14 hari selepas menukar, anda masih basuh lebih 3 barang sehari dengan tangan", null,
      { lateral: { src: "Restoran: pinggan gred komersial", dist: 4, drop: "Set pinggan lama bercampur di rumah" } }),
    N10: node("D2", 2, 0, "Jangan separuh", "Jika dijalankan kurang separuh penuh, ia guna air dan elektrik hampir sama seperti muatan penuh, jadi kos setiap pinggan lebih dua kali ganda", "Catat pinggan anda selama 7 hari sebelum memesan; jika purata bawah 6 set sehari, tukar ke model mini", "Pinggan mula berbau sementara menunggu muatan penuh",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Mesin besar yang separuh kosong tak berbaloi" } }),
    N11: node("D4", 1, 0, "Tiada periuk", "Jika anda sumbat kuali dan periuk besar demi senang, model mini tak dapat muatkan pinggan sekali basuh dan anda kembali basuh dengan tangan", "Batalkan jika periuk memaksa basuhan kedua lebih 2 kali dalam 14 hari", "Bukan semua orang di rumah akan ikut peraturan",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Menyumbat mesin demi senang" } }),
    N12: node("D3", 0, 1, "Jangan reno", "Jika memasang mesin basuh pinggan merebak menjadi ubah suai seluruh dapur, sebaik kerja bermula dan duit dibayar, anda terpaksa teruskan", "Jangan mula jika sebut harga sebelum buka kabinet lebih 2x harga mesin", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Sebaik kerja bermula, tiada jalan berundur" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Mesin 12+ set tak muat atas kaunter, jadi pilih sama ada itu atau model mini atas kaunter" },
    { type: "excludes", from: "N1", to: "N5", why: "Sebaik mesin dipasang dalam kabinet, anda takkan beli model mini atas kaunter juga; pilih salah satu" },
    { type: "excludes", from: "N4", to: "N11", why: "Tujuan pilih saiz keluarga ialah untuk basuh periuk juga, bercanggah dengan larangan periuk" },
    { type: "excludes", from: "N2", to: "N7", why: "Basuh selepas setiap kali makan bermakna isi tangki dengan tangan tiga kali sehari, susah untuk dikekalkan" },
    { type: "excludes", from: "N2", to: "N10", why: "Basuh selepas setiap kali makan selalunya kurang separuh muatan, bercanggah dengan peraturan jangan separuh" },
    { type: "excludes", from: "N9", to: "N11", why: "Tujuan menukar ke periuk dan pinggan selamat mesin ialah untuk memasukkannya, bercanggah dengan larangan periuk" },
    { type: "requires", from: "N1", to: "N8", why: "Tersasar 1 cm pun mesin takkan masuk kabinet, jadi anda mesti ukur semuanya sebelum memesan" },
    { type: "requires", from: "N4", to: "N10", why: "Mesin besar yang separuh kosong tetap guna air dan elektrik muatan penuh, jadi patuhi peraturan jangan separuh" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Upah buka kabinet dan pemasangan", v: "Kurang satu kabinet untuk simpanan", t: "Tunggu tukang datang ukur dan pasang", l: "Tunggu separuh muatan sebelum basuh", x: "Lepaskan model mini atas kaunter" },
      fatal: "N10", thesis: "Ukur kabinet, pasang mesin besar terbina dalam, basuh hanya bila separuh penuh", title: "Mesin besar terbina, sekali siap",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Periuk pinggan baharu, serta air dan elektrik setiap kali makan", v: "Menghalang laluan semasa percubaan", t: "Kabinet hanya dibuka selepas 30 hari", l: "Keringkan pinggan sendiri selepas kitaran pantas", x: "Lepaskan model mini atas kaunter" },
      fatal: "N12", thesis: "Basuh pantas selepas setiap kali makan; letak di tepi sinki sehingga serasi, kemudian baru pasang terbina dalam", title: "Basuh pantas harian, cuba dulu",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Isi air dengan tangan setiap kali", v: "Makan ruang kaunter untuk menyediakan makanan", t: "Basuh periuk dengan tangan setiap hari", l: "8 set pinggan atau kurang", x: "Lepaskan pemasangan terbina dalam dan kapasiti besar" },
      fatal: "N11", thesis: "Model mini atas kaunter yang anda isi sendiri; periuk kekal dibasuh tangan", title: "Mini atas kaunter, tanpa paip",
    },
  },
  recommend: { key: "alpha", why: "Untuk isi rumah 3 orang atau lebih, satu mesin besar boleh basuh pinggan sehari suntuk dalam sekali jalan" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Pinggan seluruh keluarga bergantung pada satu mesin ini; jika rosak, satu-satunya sandaran ialah basuh tangan", kill: "Batalkan jika pembaikan lebih 7 hari dan keluarga kembali basuh dengan tangan", label: "Satu mesin" },
};
