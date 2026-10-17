// 擴充功能內建生活題示範星系（芬蘭文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Mistä makeus tulee", D2: "Mihin himo purkautuu", D3: "Muutoksen koko", D4: "Mitä kotona on" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Vastakkainen näkemys vie kysymyksen ”${dims[dim]}” toiseen ääripäähän`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_FI = {
  schema_version: "1.0",
  core: {
    decision: "Vaihdetaanko jokainen makea herkku kokonaisiin hedelmiin, vai syödäänkö edelleen sitä mistä pitää, mutta vähemmän?",
    metric: "30 päivän ajan enintään 3 makeaa välipalaa ja juomaa viikossa yhteensä (kirjataan puhelimeen seurantaa varten)",
  },
  quadrants: {
    Q1: { scar: "Söi kokonaisen pussin kuivattuja hedelmiä terveellisenä välipalana", sacred: "Makeus tulee vain kokonaisista hedelmistä" },
    Q2: { scar: "Lopetti sokerin kolmesti ja retkahti joka kerta toisella viikolla", sacred: "Vain se lasketaan, mitä oikeasti jaksaa jatkaa" },
    Q3: { scar: "Kopioi vähähiilihydraattisen ruokavalion ja kyllästyi kolmessa päivässä", sacred: "Muuta tapaa, älä makua" },
    Q4: { scar: "Nähnyt liian monen lopettavan sokerin ja lipsuvan heti takaisin", sacred: "Säännöt voittavat tahdonvoiman" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Vain hedelmiä", "Kun tekee mieli makeaa, syö vain tuoreita kokonaisia hedelmiä tai marjoja, kuten kiiviä, ananasta, mustikoita tai appelsiinia; mehu, kuivatut hedelmät ja sokeroidut hedelmät eivät käy", "Epäonnistuu, jos ostat 14 päivän sisällä jälkiruokaa himon taltuttamiseksi useampana kuin 3 päivänä", null),
    N2: node("D2", 0, 1, "Kivennäisvesi", "Kun himo iskee, juo ensin lasillinen sokeritonta kivennäisvettä sitruunalla tai limellä; jos makeaa tekee yhä mieli 15 minuutin päästä, säästä se seuraavan aterian jälkeen. Vain juomat muuttuvat: ateriat pysyvät ennallaan, eikä korvaavia välipaloja osteta", "Epäonnistuu, jos 14 päivän sisällä makeaa tekee yhä mieli 15 minuutin odotuksen jälkeen yli puolet kerroista", "Juoma ei vie halua pureskella jotain"),
    N3: node("D1", 1, 0, "Ruoan jälkeen", "Syö hapanimeliä välipaloja ja hedelmiä vain tunnin sisällä aterian jälkeen; ei mitään tyhjään vatsaan eikä mitään 3 tuntia ennen nukkumaanmenoa", "Epäonnistuu, jos 14 päivän jälkeen etsit yhä välipalaa ennen nukkumaanmenoa useampana kuin 3 iltana", null),
    N4: node("D4", 0, 2, "Koti herkuton", "Käy kaupassa kerran viikossa: osta sesongin hedelmiä laatikoittain ja maustamatonta jogurttia koko viikoksi; ne ovat kodin ainoat välipalat, eikä makeita herkkuja tuoda kotiin koskaan", "Epäonnistuu, jos 14 päivän sisällä on yhä viikko, jolloin ostat makeaa ulkoa yli 3 kertaa", null),
    N5: node("D3", 2, 0, "Puolita herkut", "Syö edelleen lempiherkkujasi hapanimeliä karkkeja, mutta vähemmän: vaihda yhden annoksen pakkauksiin ja puolita päivittäinen määrä, ilman korvikkeita", "Epäonnistuu, jos toisesta viikosta alkaen syöt yli puolet entisestä määrästä useampana kuin 2 päivänä viikossa", "Toinen pussi avataan usein heti ensimmäisen perään"),
    N6: node("D3", 1, 2, "Testaa juomat", "Osta jokaisesta uudesta sokerittoman juoman mausta pienin pakkaus ja juo sitä 3 päivää peräkkäin; osta kokonainen lava vain, jos pidät siitä, äläkä koskaan hamstraa kaikkea kerralla", "Epäonnistuu, jos testin jälkeen lavoittain ostettua makua on 14 päivän päästä yhä yli puolet jäljellä", null),
    N7: node("D3", 2, 1, "Vaihda kastike", "Kuin vaihtaisi puhelimen kuoret eikä puhelinta: pidä hapanimelän possun tai kalan pääraaka-aineet, mutta tee kastike itse tomaatista, ananaksesta ja etikasta puolella tavallisesta sokerimäärästä", "Epäonnistuu, jos kaikki kotona sanovat uuden kastikkeen olevan pahaa, kun olet tehnyt sen 2 kertaa 14 päivän sisällä", "Ravintolassa tai noutoruoassa kastiketta ei voi vaihtaa",
      { lateral: { src: "Teknologia: puhelimen kuorten vaihto", dist: 2, drop: "Ruokalajin poisto ruokalistalta kokonaan" } }),
    N8: node("D2", 1, 0, "Max 3 annosta", "Kuin lentoyhtiön matkatavararaja: enintään 3 annosta hedelmiä ja hapanimeliä välipaloja yhteensä päivässä, kukin suunnilleen nyrkin kokoinen; ylimenevä odottaa huomiseen sen sijaan, että luotettaisiin hetken tahdonvoimaan", "Epäonnistuu, jos syöt yli 3 annosta useampana kuin 2 päivänä viikossa", null,
      { lateral: { src: "Lentoyhtiöt: matkatavaroiden painoraja", dist: 3, drop: "Syöminen milloin vain ilman rajaa" } }),
    N9: node("D4", 2, 0, "Vesivarasto", "Täydennä varastoa kuin lähikauppa ennen kuin hyllystä loppuu: pidä jääkaapissa aina lava sokeritonta kivennäisvettä ja pussi sitruunoita, ja osta uusi lava, kun jäljellä on 3 tölkkiä, jottei himo koskaan aja sinua ostamaan limsaa tai energiajuomaa", "Epäonnistuu, jos ostat 14 päivän sisällä ulkoa yli 3 sokeroitua juomaa", null,
      { lateral: { src: "Vähittäiskauppa: täydennys ennen loppumista", dist: 4, drop: "Juoman osto vain kun tekee mieli" } }),
    N10: node("D2", 2, 0, "Korvikekatto", "Jos korvaavat välipalat kuten hedelmät ja maustamaton jogurtti maksavat yli kaksi kertaa sen, mitä ennen käytit herkkuihin viikossa, luovutat kuukaudessa ja palaat ostamaan herkkuja", "Lopeta, jos korvikkeet maksavat 14 päivän sisällä yli kaksinkertaisesti entisen herkkubudjetin", "Hedelmien hinnat heittelevät paljon sesongin mukaan",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Korvikkeet ovat liian kalliita jatkaa" } }),
    N11: node("D4", 1, 0, "Ei tukkuostoja", "Jos ostat ruokaa ja juomaa laatikoittain ilmaisen toimituksen tai paljousalennuksen takia, mitä enemmän kotona on, sitä enemmän päädyt syömään joka päivä", "Lopeta, jos ostat 14 päivän sisällä ruokaa tai juomaa laatikoittain tai ilmaisen toimituksen rajan takia useammin kuin kerran", "Ystävien ja sukulaisten tuliaisherkkuja et voi hallita",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Alennukset saavat ostamaan yhä enemmän" } }),
    N12: node("D3", 0, 1, "Ei välineitä", "Jos odotat, että olet ostanut hiilihapotuslaitteen, makeutusaineet ja kaikenlaiset korvikkeet ennen aloittamista, käytetyt rahat ajavat sinut pakottamaan alas asioita, joista et pidä, ja lopetat 2 viikossa", "Lopeta, jos ostat 14 päivän sisällä useamman kuin 1 laitteen tai korvikkeen, jota et oikeasti käytä", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Pakotat alas, ettei mene hukkaan" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Makeiden herkkujen pitäminen poissa kotoa ja tavallisten makeiden herkkujen syöminen eivät voi toteutua yhtä aikaa" },
    { type: "excludes", from: "N1", to: "N5", why: "Jos makeus tulee vain kokonaisista hedelmistä, et voi pitää lempiherkkujasi" },
    { type: "excludes", from: "N4", to: "N11", why: "Kodin hedelmät riippuvat viikoittaisesta laatikko-ostosta; kiellä laatikko-ostot, niin varastosuunnitelma kaatuu" },
    { type: "excludes", from: "N2", to: "N7", why: "Tämä polku muuttaa vain juomia eikä koske aterioihin, mikä on ristiriidassa hapanimelän kastikkeen uusimisen kanssa" },
    { type: "excludes", from: "N2", to: "N10", why: "Tämä polku muuttaa vain juomia eikä osta korvaavia välipaloja; korvikkeiden kulukatto kuuluu toiselle polulle, joten valitse toinen" },
    { type: "excludes", from: "N9", to: "N11", why: "Kivennäisvesivaraston ylläpito tarkoittaa lavaostoja, mikä törmää suoraan tukkuostojen välttämiseen" },
    { type: "requires", from: "N1", to: "N8", why: "Hedelmissäkin on sokeria; vaikka hedelmä olisi ainoa herkkusi, tarvitset päiväkaton, tai liika syöminen kuormittaa silti" },
    { type: "requires", from: "N4", to: "N10", why: "Viikoittaiset hedelmä- ja jogurttilaatikot kertyvät, joten tarvitset kulukaton, tai lompakko antaa periksi ensin" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Yksi kiinteä kauppareissu viikossa", v: "Luovu lempiherkuistasi", t: "Kaksi ensimmäistä viikkoa himoja on rankkoja", l: "Enintään kolme hedelmäannosta päivässä", x: "Ei äkillisiä herkkureissuja" },
      fatal: "N10", thesis: "Hae makeus vain kokonaisista hedelmistä rajatusti ja pidä makeat herkut poissa kotoa", title: "Hedelmiin · ei herkkuja kotona",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Kivennäisvettä jääkaapissa aina varastossa", v: "Odota 15 minuuttia ennen kuin annat himolle periksi", t: "Muuta vain vähän joka viikko", l: "Aterioiden sokeri pysyy ennallaan", x: "Vanhoja herkkuja ei syödä entiseen tapaan" },
      fatal: "N12", thesis: "Tartu sokerittomaan kivennäisveteen, kun himo iskee, ja kokeile uusia makuja pieninä erinä ennen kuin ostat lisää", title: "Ensin juomat · vähennä hitaasti",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Laske annokset joka kerta", v: "Kodin herkut houkuttavat yhä", t: "Tulosten näkyminen kestää kauan", l: "Vähentäminen on täysin itsekurin varassa", x: "Luovu täydestä siirtymästä hedelmiin" },
      fatal: "N11", thesis: "Syö edelleen mistä pidät, mutta vaihda pieniin pakkauksiin, rajaa annokset ja uusi hapanimelä kastike", title: "Lempiherkut · rajaa ja vaihda kastike",
    },
  },
  recommend: { key: "alpha", why: "Hedelmät ovat luonnostaan makeita ja kirpeitä, ja makeiden herkkujen pitäminen poissa kotoa vaatii vähiten tahdonvoimaa" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Kaikki hapanimelä nautinto tulee vain yhdestä hedelmästä tai juomasta", kill: "Jos se yksi loppuu kaupasta tai siihen kyllästyy, koko suunnitelma kaatuu", label: "Yksi korvike" },
};
