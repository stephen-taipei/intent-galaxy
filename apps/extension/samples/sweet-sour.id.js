// 擴充功能內建生活題示範星系（印尼文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Sumber rasa manis", D2: "Pelampiasan ngidam", D3: "Besarnya perubahan", D4: "Stok di rumah" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Pandangan sebaliknya membawa ${dims[dim]} ke ekstrem lain`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_ID = {
  schema_version: "1.0",
  core: {
    decision: "Apakah semua camilan manis sebaiknya diganti buah segar utuh, atau tetap makan yang kamu suka tapi porsinya dikurangi?",
    metric: "Selama 30 hari, total camilan dan minuman manis tidak lebih dari 3 per minggu (dicatat di ponsel untuk dicek)",
  },
  quadrants: {
    Q1: { scar: "Menghabiskan sekantong buah kering karena kira camilan sehat", sacred: "Rasa manis hanya dari buah utuh" },
    Q2: { scar: "Tiga kali berhenti gula, selalu jebol di minggu kedua", sacred: "Hanya dihitung kalau benar-benar bisa dijalani" },
    Q3: { scar: "Meniru menu rendah karbo dan bosan dalam tiga hari", sacred: "Ganti caranya, bukan rasanya" },
    Q4: { scar: "Terlalu sering lihat orang berhenti gula lalu kembali lagi", sacred: "Aturan mengalahkan tekad" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Buah utuh", "Setiap ingin yang manis, makan hanya buah segar utuh seperti kiwi, nanas, beri, atau jeruk; jus, buah kering, dan manisan buah tidak dihitung", "Gagal jika, dalam 14 hari, kamu beli makanan penutup untuk memuaskan ngidam lebih dari 3 hari", null),
    N2: node("D2", 0, 1, "Minum soda", "Saat ngidam datang, minum dulu segelas air soda tanpa gula dengan lemon atau markisa; jika setelah 15 menit masih ingin yang manis, simpan untuk sesudah makan berikutnya. Hanya minumannya yang berubah: menu makan tetap dan tidak beli camilan pengganti", "Gagal jika, dalam 14 hari, kamu masih ingin yang manis setelah menunggu 15 menit lebih dari separuh waktu", "Minuman tidak bisa memuaskan keinginan mengunyah"),
    N3: node("D1", 1, 0, "Habis makan", "Makan camilan asam manis dan buah hanya dalam 1 jam setelah makan; tidak ada saat perut kosong dan tidak ada dalam 3 jam sebelum tidur", "Gagal jika, setelah 14 hari begini, kamu masih mencari camilan sebelum tidur lebih dari 3 malam", null),
    N4: node("D4", 0, 2, "Stop gula rumah", "Belanja seminggu sekali: buah musiman sekardus dan yogurt plain tanpa gula secukupnya untuk seminggu; hanya itu camilan di rumah, dan camilan manis tidak pernah dibawa pulang", "Gagal jika, dalam 14 hari, masih ada minggu kamu beli makanan manis di luar lebih dari 3 kali", null),
    N5: node("D3", 2, 0, "Separuh porsi", "Tetap makan camilan asam manis favorit, hanya lebih sedikit: ganti ke kemasan sekali makan dan potong porsi harian setengahnya, tanpa pengganti", "Gagal jika, mulai minggu ke-2, kamu makan lebih dari separuh porsi lama lebih dari 2 hari seminggu", "Sering kali bungkus kedua langsung dibuka setelah yang pertama"),
    N6: node("D3", 1, 2, "Uji minuman", "Untuk setiap rasa minuman tanpa gula yang baru, beli kemasan terkecil dan minum 3 hari berturut-turut; beli sekardus hanya jika suka, jangan borong sekaligus", "Gagal jika rasa yang dibeli sekardus setelah diuji masih lebih dari separuh penuh 14 hari kemudian", null),
    N7: node("D3", 2, 1, "Ganti saus", "Seperti ganti casing HP, bukan HP-nya: pertahankan bahan utama ayam atau ikan asam manis, tapi buat sausnya sendiri dari tomat, nanas, dan cuka, dengan setengah gula biasanya", "Gagal jika, setelah membuat saus baru 2 kali dalam 14 hari, semua orang di rumah bilang tidak enak", "Saus di warung atau pesan antar tidak bisa diubah",
      { lateral: { src: "Teknologi: ganti casing HP", dist: 2, drop: "Mencoret menu itu sama sekali" } }),
    N8: node("D2", 1, 0, "Maks 3 porsi", "Seperti batas bagasi maskapai: maksimal 3 porsi buah dan camilan asam manis sehari, masing-masing sebesar kepalan tangan; sisanya tunggu besok, bukan mengandalkan tekad sesaat", "Gagal jika kamu makan lebih dari 3 porsi lebih dari 2 hari dalam seminggu", null,
      { lateral: { src: "Maskapai: batas berat bagasi", dist: 3, drop: "Makan kapan saja tanpa batas" } }),
    N9: node("D4", 2, 0, "Stok air soda", "Isi stok seperti minimarket sebelum kehabisan: selalu sedia sekardus air soda tanpa gula dan sekantong lemon di kulkas, beli kardus baru saat tinggal 3 kaleng, supaya ngidam tidak membuatmu keluar beli boba atau minuman bersoda", "Gagal jika, dalam 14 hari, kamu masih beli lebih dari 3 minuman manis dari luar", null,
      { lateral: { src: "Ritel: isi stok sebelum habis", dist: 4, drop: "Beli minuman hanya saat ingin" } }),
    N10: node("D2", 2, 0, "Batasi biaya", "Jika camilan pengganti seperti buah dan yogurt tanpa gula harganya lebih dari dua kali uang camilan mingguanmu dulu, kamu akan menyerah dalam sebulan dan kembali beli camilan", "Berhenti jika, dalam 14 hari, camilan pengganti lebih dari dua kali anggaran camilan lama", "Harga buah naik turun mengikuti musim",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Pengganti terlalu mahal untuk dipertahankan" } }),
    N11: node("D4", 1, 0, "Hindari grosir", "Jika kamu beli makanan dan minuman sekardus demi gratis ongkir atau diskon grosir, makin banyak stok di rumah, makin banyak yang kamu makan setiap hari", "Berhenti jika, dalam 14 hari, kamu beli makanan atau minuman sekardus atau demi minimum gratis ongkir lebih dari sekali", "Oleh-oleh manis dari teman dan keluarga tidak bisa dikendalikan",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Diskon membuatmu beli makin banyak" } }),
    N12: node("D3", 0, 1, "Tanpa alat", "Jika kamu menunggu sampai beli mesin soda, pemanis, dan segala macam pengganti sebelum mulai, uang yang sudah keluar memaksamu menelan yang tidak kamu suka, dan kamu akan berhenti dalam 2 minggu", "Berhenti jika, dalam 14 hari, kamu beli lebih dari 1 alat atau pengganti yang tidak benar-benar dipakai", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Dipaksa habis supaya tidak mubazir" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Tidak ada camilan manis di rumah dan tetap makan camilan manis seperti biasa tidak bisa terjadi bersamaan" },
    { type: "excludes", from: "N1", to: "N5", why: "Jika rasa manis hanya dari buah utuh, camilan manis favorit tidak bisa dipertahankan" },
    { type: "excludes", from: "N4", to: "N11", why: "Buah di rumah bergantung pada beli sekardus tiap minggu; larang beli sekardus dan rencana stok itu runtuh" },
    { type: "excludes", from: "N2", to: "N7", why: "Jalur ini hanya mengganti minuman dan membiarkan menu makan, bertentangan dengan mengubah saus asam manis" },
    { type: "excludes", from: "N2", to: "N10", why: "Jalur ini hanya mengganti minuman dan tidak beli camilan pengganti; batas biaya camilan pengganti milik jalur lain, jadi pilih salah satu" },
    { type: "excludes", from: "N9", to: "N11", why: "Menjaga stok air soda berarti beli sekardus, langsung bentrok dengan tidak beli grosir" },
    { type: "requires", from: "N1", to: "N8", why: "Buah juga mengandung gula; meski buah satu-satunya camilan manis, tetap perlu batas harian, kalau tidak makan berlebihan tetap membebani" },
    { type: "requires", from: "N4", to: "N10", why: "Beli buah dan yogurt sekardus tiap minggu lama-lama terasa, jadi perlu batas biaya atau dompetmu yang menyerah duluan" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Belanja rutin seminggu sekali", v: "Melepas camilan favorit", t: "Dua minggu pertama ngidamnya berat", l: "Maksimal tiga porsi buah sehari", x: "Tidak ada jajan makanan penutup dadakan" },
      fatal: "N10", thesis: "Puaskan rasa manis hanya dari buah utuh, dalam jumlah terbatas, dan jauhkan camilan manis dari rumah", title: "Beralih ke buah · rumah tanpa manisan",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Selalu sedia air soda di kulkas", v: "Tunggu 15 menit sebelum menuruti ngidam", t: "Hanya berubah sedikit tiap minggu", l: "Gula dalam menu makan tetap sama", x: "Tidak lagi makan camilan lama seperti biasa" },
      fatal: "N12", thesis: "Ambil air soda tanpa gula saat ngidam datang, dan coba rasa baru sedikit dulu sebelum beli lebih banyak", title: "Ganti minuman dulu · kurangi perlahan",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Hitung porsi setiap kali", v: "Makanan manis di rumah tetap menggoda", t: "Butuh waktu lama untuk melihat hasil", l: "Mengurangi sepenuhnya bergantung pada kendali diri", x: "Melepas peralihan penuh ke buah" },
      fatal: "N11", thesis: "Tetap makan yang disukai, tapi ganti ke kemasan kecil, batasi porsi, dan buat ulang saus asam manis", title: "Tetap favorit · batasi dan ganti saus",
    },
  },
  recommend: { key: "alpha", why: "Buah alami sudah manis dan asam, dan menjauhkan camilan manis dari rumah paling sedikit menguras tekad" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Semua pelampiasan asam manismu bergantung pada satu buah atau minuman saja", kill: "Jika barang itu habis atau kamu bosan, seluruh rencana runtuh", label: "Satu pengganti" },
};
