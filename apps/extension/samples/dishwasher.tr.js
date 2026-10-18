// 擴充功能生活題示範星系（土耳其文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Yerleşim", D2: "Seçim yöntemi", D3: "Tadilatın boyutu", D4: "Kapasite ve bulaşık" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Karşı taraf “${dims[dim]}” konusunu öbür uca taşır`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_TR = {
  schema_version: "1.0",
  core: {
    decision: "Mutfağı bulaşık makinesine göre mi yeniden düzenlemeli, yoksa mevcut mutfağa sığan bir makine mi seçmeli?",
    metric: "İlk 30 günde makineyi haftada en az 5 kez çalıştırmak ve elde bulaşık yıkamaya günde en fazla 5 dakika harcamak",
  },
  quadrants: {
    Q1: { scar: "Bulaşık makinesi aldı, hâlâ elde yıkıyor", sacred: "Önce bulaşığını say" },
    Q2: { scar: "Kurulumun ortasında hortumun kısa olduğunu fark etti", sacred: "Almadan önce ölç" },
    Q3: { scar: "İnternetteki 'en iyiler' listesinden aldı, sığmadı", sacred: "Başka alanlardan fikir ödünç al" },
    Q4: { scar: "Üç bulaşık makinesinin tabak rafına dönüştüğünü gördü", sacred: "Önce başarısızlığı planla" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Dolaba gömme", "Eviyenin yanındaki 45 ya da 60 cm'lik dolabı söküp makineyi ankastre yerleştir; tezgâhta yer kaplamaz, geçişi kapatmaz", "Dolabın genişliği, yüksekliği ya da derinliği makinenin ankastre ölçülerinden küçükse uygun değil", null),
    N2: node("D2", 0, 1, "Yemekten sonra", "1 saatin altında hızlı programı olan bir model seç ve her yemekten sonra çalıştır; kirli bulaşık gece boyunca eviyede beklemesin", "14 günde 2'den fazla kez hızlı programdan sonra bulaşıklar hâlâ yağlıysa uygun değil", "Hızlı programlar genelde kurutmayı atlar; bulaşıkları kendin havada kurutursun"),
    N3: node("D1", 1, 0, "Eviye yanında", "Makineyi eviyeye 1 metre mesafeye koy ve tahliye hortumunu doğrudan eviye giderine bağla; duvar delmek ya da yeni tesisat yok", "Kutudan çıkan tahliye hortumu eviyeye yetişmiyor ve uzatma gerekiyorsa uygun değil", null),
    N4: node("D4", 0, 2, "Aileye göre", "Evde 3 ya da daha fazla kişi varsa 12+ kişilik makineye yönel; tencereler ve tabaklar iki seferde değil, tek yıkamada girsin", "14 günde 2'den fazla gün tabaklar ve tencereler tek yıkamaya sığmıyorsa uygun değil", null),
    N5: node("D3", 2, 0, "Tezgâh mini", "8 kişilik ya da daha küçük tezgâh üstü bir mini al: dolap sökmek yok, tesisat değişikliği yok ve taşınırken seninle gelir", "14 günde 3'ten fazla gün her şeyi temizlemek 2 çalıştırma gerektiriyorsa uygun değil", "Hazırlık tezgâhının önemli bir kısmını yer"),
    N6: node("D3", 1, 2, "Önce dene", "Hem solo hem ankastre kullanılabilen bir model al, 30 gün boyunca eviyenin yanında tut, dolabı sökmeye ancak sonra karar ver; ilk gün kırıp dökme", "30 günlük deneme sırasında makine geçişi ya da bir çekmeceyi kapatıyorsa uygun değil", null),
    N7: node("D3", 2, 1, "Su depolu", "Kendi su deposu olan bir karavan gibi, elle doldurulan tezgâh üstü bir model seç: musluk bağlantısı yok, tesisat değişikliği yok", "Herhangi bir haftada, doldurmaya üşendiğin için 2 ya da daha fazla kez elde yıkarsan uygun değil", "Doldurmak sandığından zahmetli",
      { lateral: { src: "Kamp: dahili su deposu", dist: 2, drop: "Kalıcı musluk bağlantısı" } }),
    N8: node("D2", 1, 0, "Önce ölç", "Pilotun uçuş öncesi kontrol listesi gibi: sipariş vermeden önce genişliği, derinliği ve yüksekliği ölç, sonra priz ve gider yerlerini kontrol et; 5'ten biri eksikse sipariş verme", "Bir şey uymuyorsa ya da makine gelince kurulamıyorsa uygun değil", null,
      { lateral: { src: "Havacılık: uçuş öncesi kontrol listesi", dist: 3, drop: "İçgüdüyle sipariş vermek" } }),
    N9: node("D4", 2, 0, "Makineye uygun", "Yalnızca makineye dayanıklı tabak kullanan bir lokanta gibi, 'makinede yıkanmaz' yazan her tencereyi ve tabağı değiştir; elde yıkanacak bir şey bırakma", "Değiştirdikten sonraki 14 günde hâlâ günde 3'ten fazla parçayı elde yıkıyorsan uygun değil", null,
      { lateral: { src: "Lokantalar: endüstriyel tabak takımı", dist: 4, drop: "Evdeki karışık eski tabaklar" } }),
    N10: node("D2", 2, 0, "Yarım yük yok", "Makineyi yarıdan az dolu çalıştırırsan neredeyse tam yük kadar su ve elektrik harcar; tabak başı maliyet iki katından fazlaya çıkar", "Sipariş vermeden önce 7 gün bulaşığını kaydet; günde ortalama 6 kişilikten azsa miniye geç", "Tam yük beklerken bulaşıklar kokmaya başlar",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Büyük makineyi yarı boş çalıştırmak kârlı değil" } }),
    N11: node("D4", 1, 0, "Tencere girmez", "Kolaylık olsun diye tavaları ve büyük tencereleri tıkıştırırsan, mini makine bulaşıkları tek yıkamaya sığdıramaz ve yine elde yıkamaya dönersin", "14 günde tencereler 2'den fazla kez ikinci yıkamaya zorlarsa iptal et", "Evdeki herkes kurala uymayabilir",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Kolaylık için makineyi aşırı doldurmak" } }),
    N12: node("D3", 0, 1, "Tadilat yok", "Bulaşık makinesi takmak tüm mutfağı yenilemeye dönüşürse, iş başlayıp para ödendiğinde sonuna kadar gitmek zorunda kalırsın", "Dolabı sökmeden önce aldığın teklif makine fiyatının 2 katından fazlaysa başlama", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "İş başladı mı geri dönüş yok" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "12+ kişilik bir makine tezgâha sığmaz; ya o ya tezgâh üstü mini" },
    { type: "excludes", from: "N1", to: "N5", why: "Makineyi dolaba gömdüysen bir de tezgâh üstü mini almazsın; ikisinden biri" },
    { type: "excludes", from: "N4", to: "N11", why: "Aileye göre büyük almanın amacı tencereleri de yıkamak; tencereleri dışarıda tutmakla çelişir" },
    { type: "excludes", from: "N2", to: "N7", why: "Her yemekten sonra çalıştırmak, depoyu günde üç kez elle doldurmak demek; sürdürmesi zor" },
    { type: "excludes", from: "N2", to: "N10", why: "Her yemekten sonra çalıştırmak çoğu zaman yarım yükün altında demek; yarım yük yok kuralıyla çelişir" },
    { type: "excludes", from: "N9", to: "N11", why: "Makineye uygun tencere ve tabağa geçmenin amacı onları makineye koymak; tencereleri dışarıda tutmakla çelişir" },
    { type: "requires", from: "N1", to: "N8", why: "1 cm'lik hata bile dolaba girmemesi demek; sipariş vermeden önce her şeyi ölçmelisin" },
    { type: "requires", from: "N4", to: "N10", why: "Yarı boş çalışan büyük makine yine tam yük kadar su ve elektrik harcar; yarım yük yok kuralına uy" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Dolap sökme ve kurulum işçiliği", v: "Eşya için bir dolap eksilir", t: "Ölçüm ve montaj için ustayı bekle", l: "Çalıştırmadan önce yarım yükü bekle", x: "Tezgâh üstü miniden vazgeç" },
      fatal: "N10", thesis: "Dolabı ölç, büyük makineyi göm, yalnızca yarısı dolunca çalıştır", title: "Ankastre büyük makine, tek seferde",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Yeni tencere-tabak, her öğün su ve elektrik", v: "Deneme süresince geçişi kapatır", t: "Dolap ancak 30 gün sonra sökülür", l: "Hızlı programdan sonra havada kurut", x: "Tezgâh üstü miniden vazgeç" },
      fatal: "N12", thesis: "Her yemekten sonra hızlı yıkama; işe yarayana kadar eviye yanında tut, sonra göm", title: "Her gün hızlı yıkama, gömmeden önce deneme",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Her çalıştırmada suyu elle doldur", v: "Hazırlık tezgâhının bir kısmını yer", t: "Tencereleri her gün elde yıka", l: "En fazla 8 kişilik", x: "Ankastre ve büyük kapasiteden vazgeç" },
      fatal: "N11", thesis: "Kendin doldurduğun tezgâh üstü bir mini; tencereler elde yıkanır", title: "Tezgâh üstü mini, tesisatsız",
    },
  },
  recommend: { key: "alpha", why: "3 ya da daha kalabalık bir hanede tek büyük makine bütün günün bulaşığını tek yıkamada halleder" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Bütün ailenin bulaşığı bu tek makineye bağlı; bozulursa tek yedek elde yıkamak", kill: "Tamir 7 günden uzun sürer ve aile elde yıkamaya dönerse iptal et", label: "Tek makine" },
};
