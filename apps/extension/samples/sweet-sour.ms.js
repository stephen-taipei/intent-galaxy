// 擴充功能內建生活題示範星系（馬來文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Sumber rasa manis", D2: "Saluran keinginan", D3: "Besar perubahan", D4: "Stok di rumah" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Pandangan bertentangan membawa ${dims[dim]} ke hujung yang lain`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_MS = {
  schema_version: "1.0",
  core: {
    decision: "Patutkah anda tukar semua makanan manis kepada buah segar, atau terus makan yang anda suka tetapi kurangkan sahaja?",
    metric: "Sepanjang 30 hari, tidak lebih 3 snek dan minuman bergula seminggu secara keseluruhan (dicatat dalam telefon untuk disemak)",
  },
  quadrants: {
    Q1: { scar: "Habiskan sebungkus buah kering, sangka snek sihat", sacred: "Rasa manis hanya dari buah segar" },
    Q2: { scar: "Tiga kali berhenti gula, kalah pada minggu kedua setiap kali", sacred: "Hanya kira kalau betul-betul boleh dikekalkan" },
    Q3: { scar: "Tiru pelan makan rendah karbohidrat, muak dalam tiga hari", sacred: "Tukar cara, bukan rasa" },
    Q4: { scar: "Terlalu ramai yang berhenti gula lalu kembali semula", sacred: "Tetapkan peraturan, jangan bergantung pada kemahuan" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Buah segar", "Bila teringin sesuatu yang manis, makan hanya buah segar seperti kiwi, nanas, beri atau oren; jus, buah kering dan jeruk buah tidak dikira", "Gagal jika, dalam 14 hari, anda beli pencuci mulut untuk puaskan keinginan lebih 3 hari", null),
    N2: node("D2", 0, 1, "Air berkarbonat", "Bila keinginan datang, minum dulu segelas air berkarbonat tanpa gula dengan limau atau markisa; jika masih mahu sesuatu manis selepas 15 minit, simpan untuk selepas makan seterusnya. Hanya minuman yang berubah: hidangan kekal sama dan tiada snek pengganti dibeli", "Gagal jika, dalam 14 hari, anda masih mahu sesuatu manis selepas menunggu 15 minit lebih separuh daripada masa", "Minuman tak dapat memuaskan keinginan untuk mengunyah"),
    N3: node("D1", 1, 0, "Selepas makan", "Makan snek masam manis dan buah hanya dalam 1 jam selepas makan; tiada apa-apa ketika perut kosong dan tiada apa-apa dalam 3 jam sebelum tidur", "Gagal jika, selepas 14 hari begini, anda masih cari snek sebelum tidur lebih 3 malam", null),
    N4: node("D4", 0, 2, "Larang gula", "Beli barang dapur seminggu sekali: buah bermusim sekotak dan yogurt tanpa gula secukupnya untuk seminggu; itu sahaja snek di rumah, dan snek bergula tak pernah dibawa pulang", "Gagal jika, dalam 14 hari, masih ada minggu anda beli makanan manis di luar lebih 3 kali", null),
    N5: node("D3", 2, 0, "Kurang separuh", "Terus makan snek masam manis kegemaran, cuma kurangkan: tukar ke pek sekali makan dan potong jumlah harian separuh, tanpa pengganti", "Gagal jika, dari minggu ke-2, anda makan lebih separuh jumlah lama lebih 2 hari seminggu", "Selalunya pek kedua dibuka sebaik habis yang pertama"),
    N6: node("D3", 1, 2, "Cuba minuman", "Untuk setiap perisa minuman tanpa gula yang baharu, beli pek paling kecil dan minum 3 hari berturut-turut; beli sekotak hanya jika suka, jangan borong sekali gus", "Gagal jika perisa yang dibeli sekotak selepas dicuba masih lebih separuh penuh 14 hari kemudian", null),
    N7: node("D3", 2, 1, "Tukar sos", "Macam tukar sarung telefon, bukan telefonnya: kekalkan bahan utama ayam atau ikan masam manis, tetapi buat sos sendiri daripada tomato, nanas dan cuka, dengan separuh gula biasa", "Gagal jika, selepas buat sos baharu 2 kali dalam 14 hari, semua orang di rumah kata tak sedap", "Anda tak boleh tukar sos di kedai makan atau bungkus",
      { lateral: { src: "Teknologi: tukar sarung telefon", dist: 2, drop: "Buang terus hidangan itu dari menu" } }),
    N8: node("D2", 1, 0, "Had 3 hidangan", "Macam had bagasi syarikat penerbangan: paling banyak 3 hidangan buah dan snek masam manis sehari, setiap satu sebesar penumbuk; lebihan tunggu esok, bukan bergantung pada kemahuan saat itu", "Gagal jika anda makan lebih 3 hidangan lebih 2 hari dalam seminggu", null,
      { lateral: { src: "Penerbangan: had berat bagasi", dist: 3, drop: "Makan bila-bila tanpa had" } }),
    N9: node("D4", 2, 0, "Stok air soda", "Tambah stok macam kedai serbaneka sebelum habis: sentiasa simpan sekotak air berkarbonat tanpa gula dan seplastik limau dalam peti sejuk, beli kotak baharu bila tinggal 3 tin, supaya keinginan tak hantar anda keluar beli teh ais atau air bergas manis", "Gagal jika, dalam 14 hari, anda masih beli lebih 3 minuman bergula dari luar", null,
      { lateral: { src: "Kedai: tambah barang sebelum habis", dist: 4, drop: "Beli minuman hanya bila mahu" } }),
    N10: node("D2", 2, 0, "Had kos ganti", "Jika snek pengganti seperti buah dan yogurt tanpa gula berharga lebih dua kali ganda belanja snek mingguan anda dulu, anda akan menyerah dalam sebulan dan kembali beli snek", "Berhenti jika, dalam 14 hari, snek pengganti melebihi dua kali bajet snek lama", "Harga buah naik turun ikut musim",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Pengganti terlalu mahal untuk dikekalkan" } }),
    N11: node("D4", 1, 0, "Elak borong", "Jika anda beli makanan dan minuman sekotak demi penghantaran percuma atau diskaun borong, makin banyak stok di rumah, makin banyak anda makan setiap hari", "Berhenti jika, dalam 14 hari, anda beli makanan atau minuman sekotak atau untuk capai minimum penghantaran percuma lebih sekali", "Anda tak dapat kawal buah tangan manis daripada kawan dan keluarga",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Diskaun buat anda beli makin banyak" } }),
    N12: node("D3", 0, 1, "Tak perlu alat", "Jika anda tunggu sehingga beli mesin soda, pemanis dan segala jenis pengganti sebelum bermula, duit yang dibelanjakan memaksa anda telan benda yang tak disukai, dan anda akan berhenti dalam 2 minggu", "Berhenti jika, dalam 14 hari, anda beli lebih 1 alat atau pengganti yang tak benar-benar digunakan", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Anda paksa telan supaya tak membazir" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Tiada snek bergula di rumah dan masih makan snek bergula biasa tak boleh berlaku serentak" },
    { type: "excludes", from: "N1", to: "N5", why: "Jika rasa manis hanya dari buah segar, anda tak boleh kekalkan snek bergula kegemaran" },
    { type: "excludes", from: "N4", to: "N11", why: "Buah di rumah bergantung pada beli sekotak setiap minggu; larang beli sekotak dan pelan stok itu runtuh" },
    { type: "excludes", from: "N2", to: "N7", why: "Laluan ini hanya tukar minuman dan biarkan hidangan, bercanggah dengan mengubah sos masam manis" },
    { type: "excludes", from: "N2", to: "N10", why: "Laluan ini hanya tukar minuman dan tak beli snek pengganti; jadi had belanja snek pengganti tidak berkaitan; pilih satu" },
    { type: "excludes", from: "N9", to: "N11", why: "Menyimpan stok air berkarbonat bermakna beli sekotak, terus bertembung dengan tidak membeli secara borong" },
    { type: "requires", from: "N1", to: "N8", why: "Buah pun ada gula; walaupun buah satu-satunya makanan manis, anda perlukan had harian, jika tidak makan berlebihan tetap memudaratkan" },
    { type: "requires", from: "N4", to: "N10", why: "Beli buah dan yogurt sekotak setiap minggu makin bertambah, jadi perlukan had belanja atau dompet anda yang menyerah dulu" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Satu kali beli barang dapur seminggu", v: "Lepaskan snek kegemaran", t: "Dua minggu pertama keinginan memang berat", l: "Paling banyak tiga hidangan buah sehari", x: "Tiada beli pencuci mulut ikut nafsu" },
      fatal: "N10", thesis: "Puaskan rasa manis hanya dengan buah segar, dalam jumlah terhad, dan jauhkan snek bergula dari rumah", title: "Tukar ke buah · tiada manisan di rumah",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Sentiasa ada stok air berkarbonat dalam peti sejuk", v: "Tunggu 15 minit sebelum layan keinginan", t: "Hanya ubah sedikit setiap minggu", l: "Gula dalam hidangan kekal sama", x: "Tiada lagi makan snek lama seperti biasa" },
      fatal: "N12", thesis: "Capai air berkarbonat tanpa gula bila keinginan datang, dan cuba perisa baharu sedikit dulu sebelum beli lebih", title: "Tukar minuman dulu · kurangkan perlahan",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Kira hidangan setiap kali", v: "Makanan manis di rumah masih menggoda", t: "Lama untuk nampak hasil", l: "Mengurangkan bergantung sepenuhnya pada disiplin diri", x: "Lepaskan peralihan penuh ke buah" },
      fatal: "N11", thesis: "Terus makan yang disukai, tetapi tukar ke pek kecil, hadkan hidangan dan buat semula sos masam manis", title: "Kekal kegemaran · had dan tukar sos",
    },
  },
  recommend: { key: "alpha", why: "Buah semula jadi manis dan masam, dan menjauhkan snek bergula dari rumah paling kurang memerlukan kemahuan" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Semua keinginan masam manis anda bergantung pada satu buah atau minuman sahaja", kill: "Jika benda itu habis dijual atau anda muak, seluruh pelan runtuh", label: "Satu pengganti" },
};
