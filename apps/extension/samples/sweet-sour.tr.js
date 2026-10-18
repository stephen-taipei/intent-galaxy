// 擴充功能內建生活題示範星系（土耳其文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Tatlıyı nereden aldığın", D2: "İsteği bastırma yolu", D3: "Değişimin büyüklüğü", D4: "Evde ne bulunduğu" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Karşıt görüş “${dims[dim]}” konusunu öbür uca götürür`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_TR = {
  schema_version: "1.0",
  core: {
    decision: "Her tatlı atıştırmalığı bütün meyveyle mi değiştirmeli, yoksa sevdiklerini yemeye devam edip sadece azaltmalı mı?",
    metric: "30 gün boyunca şekerli atıştırmalık ve içecekler toplamda haftada en fazla 3 kez (kontrol için telefona kaydedilir)",
  },
  quadrants: {
    Q1: { scar: "Sağlıklı sanıp bir paket kuru meyveyi bitirdi", sacred: "Tatlı yalnızca bütün meyveden gelir" },
    Q2: { scar: "Şekeri üç kez bıraktı, her seferinde ikinci haftada pes etti", sacred: "Ancak sürdürebildiğin şey sayılır" },
    Q3: { scar: "Bir düşük karbonhidrat listesini kopyaladı, üç günde bıktı", sacred: "Lezzeti değil, yöntemi değiştir" },
    Q4: { scar: "Şekeri bırakıp hemen geri dönen çok kişi gördü", sacred: "Kurallar iradeyi yener" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Bütün meyve ye", "Canın tatlı çektiğinde yalnızca taze bütün meyve ye; kivi, ananas, böğürtlen ya da portakal gibi. Meyve suyu, kuru meyve ve pestil sayılmaz", "14 gün içinde 3'ten fazla gün isteği bastırmak için tatlı alırsan başarısız", null),
    N2: node("D2", 0, 1, "Maden suyu iç", "İstek geldiğinde önce limonlu ya da narlı şekersiz bir bardak maden suyu iç; 15 dakika sonra hâlâ tatlı istiyorsan bir sonraki yemeğin sonrasına sakla. Yalnızca içecekler değişir: öğünler aynı kalır, yerine atıştırmalık alınmaz", "14 gün içinde 15 dakikalık beklemeden sonra vakitlerin yarısından fazlasında hâlâ tatlı istiyorsan başarısız", "Bir içecek bir şey çiğneme isteğini gidermez"),
    N3: node("D1", 1, 0, "Yemek sonrası", "Tatlı-ekşi atıştırmalıkları ve meyveyi yalnızca yemekten sonraki 1 saat içinde ye; aç karnına hiçbir şey yok, yatmadan önceki 3 saatte de hiçbir şey yok", "Bunu 14 gün uyguladıktan sonra hâlâ 3'ten fazla gece yatmadan önce atıştırmalık arıyorsan başarısız", null),
    N4: node("D4", 0, 2, "Evde tatlı yok", "Haftada bir kez alışverişe çık: mevsim meyvesini kasayla, haftaya yetecek kadar sade yoğurt al; evdeki tek atıştırmalıklar bunlar olsun, şekerli atıştırmalık eve hiç girmesin", "14 gün içinde dışarıdan 3'ten fazla kez tatlı aldığın bir hafta yine oluyorsa başarısız", null),
    N5: node("D3", 2, 0, "Yarı porsiyon", "Sevdiğin tatlı-ekşi atıştırmalıkları yemeye devam et ama daha az: tek porsiyonluk paketlere geç ve günlük miktarı yarıya indir, yerine başka bir şey koyma", "2. haftadan itibaren haftada 2'den fazla gün eski miktarının yarısından fazlasını yersen başarısız", "Birinci paketin hemen ardından çoğu zaman ikincisini açarsın"),
    N6: node("D3", 1, 2, "Az al, dene", "Her yeni şekersiz içecek aroması için en küçük paketi al ve 3 gün üst üste iç; ancak beğenirsen koli al, asla hepsini birden stoklama", "Denedikten sonra koli aldığın bir aromanın 14 gün sonra hâlâ yarısından fazlası duruyorsa başarısız", null),
    N7: node("D3", 2, 1, "Sosu değiştir", "Telefonu değil kılıfını değiştirmek gibi: tatlı-ekşi soslu tavuğun ya da balığın ana malzemesini koru, ama sosu domates, ananas ve sirkeyle kendin yap, şekeri her zamankinin yarısı olsun", "14 gün içinde yeni sosu 2 kez yaptıktan sonra evdeki herkes beğenmediyse başarısız", "Restoranda ya da paket serviste sosu değiştiremezsin",
      { lateral: { src: "Teknoloji: telefon kılıfını değiştir", dist: 2, drop: "Yemeği menüden tamamen çıkarmak" } }),
    N8: node("D2", 1, 0, "Günde en çok 3", "Havayolu bagaj limiti gibi: meyve ve tatlı-ekşi atıştırmalıklar toplamda günde en fazla 3 porsiyon, her biri yaklaşık bir yumruk büyüklüğünde; fazlası yarına kalır, o anki iradeye güvenilmez", "Bir haftada 2'den fazla gün 3 porsiyonu aşarsan başarısız", null,
      { lateral: { src: "Havayolu: bagaj ağırlık limiti", dist: 3, drop: "Sınırsız, canın istediğinde ye" } }),
    N9: node("D4", 2, 0, "Soda stoğu", "Bir bakkalın mal bitmeden stok yenilemesi gibi: buzdolabında hep bir koli şekersiz maden suyu ve bir file limon bulundur, 3 şişe kalınca yeni koli al; böylece istek geldiğinde kola ya da hazır buzlu çay almaya çıkmazsın", "14 gün içinde dışarıdan 3'ten fazla şekerli içecek alırsan başarısız", null,
      { lateral: { src: "Perakende: tükenmeden stok yenile", dist: 4, drop: "İçeceği yalnızca canın istediğinde almak" } }),
    N10: node("D2", 2, 0, "İkame bütçesi", "Meyve ve sade yoğurt gibi ikameler haftalık eski atıştırmalık harcamanın iki katından fazlasına mal olursa, bir ay içinde pes edip yine atıştırmalık almaya dönersin", "14 gün içinde ikamelerin maliyeti eski atıştırmalık bütçesinin iki katını aşarsa dur", "Meyve fiyatları mevsime göre çok oynar",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "İkameler sürdürülemeyecek kadar pahalı" } }),
    N11: node("D4", 1, 0, "Toplu alım yok", "Ücretsiz kargo ya da toplu indirim için yiyecek ve içeceği koliyle alırsan, evde ne kadar çok olursa her gün o kadar çok yersin", "14 gün içinde koliyle ya da ücretsiz kargo limitini tutturmak için birden fazla kez yiyecek-içecek alırsan dur", "Eşten dosttan gelen hediye tatlıları kontrol edemezsin",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "İndirimler gitgide daha çok aldırır" } }),
    N12: node("D3", 0, 1, "Alet alma", "Başlamak için soda makinesi, tatlandırıcı ve her türlü ikameyi almayı beklersen, harcadığın para seni sevmediğin şeyleri zorla yemeye iter ve 2 hafta içinde bırakırsın", "14 gün içinde aslında kullanmadığın 1'den fazla alet ya da ikame alırsan dur", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "İsraf olmasın diye zorla yersin" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Şekerli atıştırmalıkları evden uzak tutmak ile alıştığın şekerli atıştırmalıkları yemeye devam etmek bir arada olmaz" },
    { type: "excludes", from: "N1", to: "N5", why: "Tatlı yalnızca bütün meyveden geliyorsa, sevdiğin şekerli atıştırmalıkları tutamazsın" },
    { type: "excludes", from: "N4", to: "N11", why: "Evdeki meyve her hafta kasayla almaya dayanıyor; koliyle alımı yasaklarsan bu stok planı çöker" },
    { type: "excludes", from: "N2", to: "N7", why: "Bu yol yalnızca içecekleri değiştirir, öğünlere dokunmaz; tatlı-ekşi sosu yeniden yapmakla çelişir" },
    { type: "excludes", from: "N2", to: "N10", why: "Bu yol yalnızca içecekleri değiştirir ve ikame atıştırmalık almaz; ikame bütçesi başka bir yola ait, birini seç" },
    { type: "excludes", from: "N9", to: "N11", why: "Maden suyunu stokta tutmak koliyle almak demek; toplu alım yapmamakla doğrudan çatışır" },
    { type: "requires", from: "N1", to: "N8", why: "Meyvede de şeker var; tek tatlın meyve olsa bile günlük bir sınır gerekir, yoksa fazlası yine bedel ödetir" },
    { type: "requires", from: "N4", to: "N10", why: "Her hafta kasayla meyve ve yoğurt almak birikir; bir harcama sınırı gerekir, yoksa önce cüzdan pes eder" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Haftada bir sabit pazar alışverişi", v: "Sevdiğin atıştırmalıklardan vazgeç", t: "İlk iki haftanın istekleri zorlu", l: "Günde en fazla üç porsiyon meyve", x: "Ani tatlı alışverişi yok" },
      fatal: "N10", thesis: "Tatlı ihtiyacını yalnızca bütün meyveden, sınırlı miktarda karşıla ve şekerli atıştırmalıkları evden uzak tut", title: "Meyveye geç · evde tatlı yok",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Buzdolabında maden suyu stoğu tut", v: "İsteğe teslim olmadan 15 dakika bekle", t: "Her hafta sadece biraz değiştir", l: "Öğünlerdeki şeker aynı kalır", x: "Eski atıştırmalıkları her zamanki gibi yemek yok" },
      fatal: "N12", thesis: "İstek geldiğinde şekersiz maden suyuna uzan, yeni aromaları daha fazla almadan önce az miktarda dene", title: "Önce içeceği değiştir · yavaşça azalt",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Her seferinde porsiyon say", v: "Evdeki tatlılar hâlâ cezbeder", t: "Sonuç görmek uzun sürer", l: "Azaltmak tamamen öz denetime kalır", x: "Tamamen meyveye geçmekten vazgeç" },
      fatal: "N11", thesis: "Sevdiğini yemeye devam et, ama küçük paketlere geç, porsiyonu sınırla ve tatlı-ekşi sosu yeniden yap", title: "Sevdiğini koru · sınırla, sosu değiştir",
    },
  },
  recommend: { key: "alpha", why: "Meyve doğal olarak tatlı ve ekşidir; şekerli atıştırmalıkları evden uzak tutmak en az iradeyi gerektirir" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Bütün tatlı-ekşi ihtiyacın tek bir meyveye ya da içeceğe bağlı", kill: "O tek şey tükenirse ya da bıkarsan bütün plan çöker", label: "Tek ikame" },
};
