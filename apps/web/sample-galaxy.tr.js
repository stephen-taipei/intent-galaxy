// 內建示範星系（IntentAnalysisResponse v1.0，土耳其文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Katman sınırları", D2: "Farkların ifade biçimi", D3: "Özelleştirme kapsamı", D4: "Tema kompozisyonu" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Karşı görüş: “${dims[dim]}” ekseni öbür uca itilir`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_TR = {
  schema_version: "1.0",
  core: {
    decision: "Her marka kendi bileşenlerini fork'lamalı mı, yoksa tek bir ortak core konfigürasyonla mı yönetilmeli?",
    metric: "60 gün içinde: yeni bir tema ≤2 günde yayına çıkar ve her temanın CSS'i <50KB olur",
  },
  quadrants: {
    Q1: { scar: "Ortak bileşenler marka if'leriyle doldu taştı", sacred: "Core'da sıfır dallanma" },
    Q2: { scar: "100+ tema tek tek elle yamandı", sacred: "Hataları tipler yakalar" },
    Q3: { scar: "Bir design system kopyalandı, aşırı soyutlandı", sacred: "Değiştirilebilir yapı" },
    Q4: { scar: "Özelleştirmenin üç kez kontrolden çıktığını gördü", sacred: "Sınırlar korunur" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3 katmanlı yapı", "Bileşenleri saf bir core, koordine eden bir view ve bir theme yaprağı olarak ayır; core tema ID'lerini veya route'ları import edemez", "14 gün içinde core'da tema kontrolü görülürse yanlış", null),
    N2: node("D2", 0, 1, "Yalnız CSS var", "Tüm tema farklarını yalnızca CSS custom property'leriyle ifade et; bileşenlerde ve layout'larda sıfır dallanma", "3. tema bile bileşen değişikliği gerektirirse yanlış", "Layout farkları sadece renklerle ifade edilemez"),
    N3: node("D1", 1, 0, "Tembel tema CSS", "Tüm temaları ilk boyamaya paketlemek yerine, çalışma anında yalnızca aktif temanın tek stil dosyasını yükle", "14 gün içinde herhangi bir temanın CSS'i 50KB'ı aşarsa yanlış", null),
    N4: node("D4", 0, 2, "Tipli config", "Her tema eksiksiz bir TypeScript config nesnesiyle gelir; eksik alan varsa build kırılır", "Yeni bir tema hâlâ ortak bileşen değişikliği gerektiriyorsa yanlış", null),
    N5: node("D3", 2, 0, "Marka başı fork", "Her tema bileşen dizinini kopyalayıp bağımsız değiştirir; markalar birbirini asla etkilemez", "10. temadan sonra bir bug düzeltmek >10 yere dokunuyorsa yanlış", "Tek bir bug düzeltmesi N kopyayı yamamak demek"),
    N6: node("D3", 1, 2, "Kanarya tema", "Her yeni temayı bir hafta boyunca feature flag arkasında kiracıların %5'ine aç; hata oranları hedefi tutarsa %100'e çık", "Kanarya hata oranı %1'i aşarsa yanlış", null),
    N7: node("D3", 2, 1, "Kabuk değiştir", "[D2 otomobil platformu] Layout'lar araba kasası gibidir: ortak şasi (view ve core) yerinde kalırken bütün kabuğu değiştir", "Layout değiştirmek core değişikliği gerektiriyorsa yanlış", "Layout'lar arasında etkileşimler kayar",
      { lateral: { src: "Otomotiv: ortak platform şasisi", dist: 2, drop: "Her modeli sıfırdan yeniden üretmek" } }),
    N8: node("D2", 1, 0, "Sabit slotlar", "[D3 LEGO parçaları] Layout'lar sabit slotlar tanımlar; temalar yalnızca slotlara bileşen takabilir, slot dışındaki yapıya dokunamaz", "Slot dışındaki DOM bir kez bile değiştirilirse yanlış", null,
      { lateral: { src: "Oyuncak: LEGO parça arayüzü", dist: 3, drop: "Serbest DOM özelleştirmesi" } }),
    N9: node("D4", 2, 0, "Farkı miras al", "[D4 font ailesi] Temalar yalnızca varsayılandan farklarını bildirir; diğer tüm alanlar otomatik olarak miras alınır", "Miras zinciri 3 seviyeden derine inerse yanlış", null,
      { lateral: { src: "Tipografi: ağırlık aileleri", dist: 4, drop: "Her temaya tam kopya" } }),
    N10: node("D2", 2, 0, "Config sınırı", "Her özelleştirme talebi yeni bir config alanı eklerse, config'i sürdürmek kaçınılmaz olarak fork'lamaktan pahalıya gelir", "Tek bir config arayüzü 40 alanı geçtiğinde alan eklemeyi durdur", "Config cehennemi",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Soyutlama, kopyalamadan pahalıya patlar" } }),
    N11: node("D4", 1, 0, "Bypass yasak", "İş tarafı ortak bileşenlere doğrudan marka kontrolü ekletebiliyorsa, sınır bir çeyrek içinde çöker", "14 gün içinde ortak bileşenlere herhangi bir marka kontrolü eklenirse geçersiz", "Sınırları teslim tarihine satmak",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Teslim baskısı sınır ihlalini ödüllendirir" } }),
    N12: node("D3", 0, 1, "Big-bang yok", "Bir şey yayına çıkmadan önce 70 modülün hepsinin taşınması gerekirse, batık maliyet refactor'ı yarı yolda durdurur", "İlk modül 14 gün içinde yayına çıkmadıysa dur", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big-bang refactor teslim tarihlerini rehin alır" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Ortak tipli config ile marka başına bileşen fork'u ya o ya bu seçimidir" },
    { type: "excludes", from: "N1", to: "N5", why: "Ortak üç katmanlı core ile marka başına bileşen kopyaları birbirini dışlar" },
    { type: "excludes", from: "N4", to: "N11", why: "Tipli config bypass'ları zaten derleme anında engeller; elle sınır incelemesi gereksiz bir kapı olur" },
    { type: "excludes", from: "N2", to: "N7", why: "Temalar yalnızca CSS değişkenlerini değiştiriyorsa, bütün layout bileşenlerini değiştirmek söz konusu olmaz" },
    { type: "excludes", from: "N2", to: "N10", why: "Saf CSS değişkenlerinde şişecek config alanı yoktur; birini seç" },
    { type: "excludes", from: "N9", to: "N11", why: "Miras zincirleri yerel override'lara izin verir; bu da sıfır bypass güvenlik bariyeriyle çelişir" },
    { type: "requires", from: "N1", to: "N8", why: "Üç katmana ayrıldıktan sonra temalar sabit slotlar üzerinden özelleştirmeli, yoksa view katmanı delinir" },
    { type: "requires", from: "N4", to: "N10", why: "Tipli config'lerin bir alan sınırı olmalı, yoksa config cehennemine dönüşür" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Baştan refactor emeği", v: "Hızlı fork yok", t: "İskeleti kurmak 60 gün", l: "Bütünlük testleri yazmak şart", x: "Markaya özel kestirme yok" },
      fatal: "N10", thesis: "Üç katmanlı sınırlar ve tipli config her temayı tek bir yaprağa indirger", title: "Config güdümlü · 3 katman",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Sınırlı layout çeşitliliği", v: "Daha az tasarım özgürlüğü", t: "Haftalık küçük adımlar", l: "Karmaşık layout'lar masadan kalkar", x: "Yapısal özelleştirme yok" },
      fatal: "N12", thesis: "Yalnızca CSS değişkenleri ve miras kullan, temaları kanarya arkasında kademeli yay", title: "Saf stil · kademeli",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Tekrarlanan kod", v: "Bug düzeltmeleri birçok yere dokunur", t: "Yayına en hızlı çıkan", l: "Bakım maliyeti doğrusal büyür", x: "Tipli config'den vazgeç" },
      fatal: "N11", thesis: "Bütün layout'ları değiştir ve her markanın kendi kabuğunu fork'lamasına izin ver", title: "Marka fork'u · ortak şasi",
    },
  },
  recommend: { key: "alpha", why: "100+ temada bakım maliyetini yalnızca config güdümlü tasarım kontrol altında tutar" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Her tema aynı varsayılan temadan miras alır", kill: "Varsayılan bozulursa her temanın layout'u bozulur", label: "default SPOF" },
};
