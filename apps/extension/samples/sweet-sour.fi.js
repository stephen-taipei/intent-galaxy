// 擴充功能內建生活題示範星系（芬蘭文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Mistä makeus tulee", D2: "Mitä teet himon iskiessä", D3: "Kuinka iso muutos", D4: "Mitä kotona on" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Vastakkainen näkemys vie kohdan ”${dims[dim]}” toiseen ääripäähän`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_FI = {
  schema_version: "1.0",
  core: {
    decision: "Vaihdatko kaikki makeat herkut kokonaisiin hedelmiin, vai syötkö edelleen sitä, mistä pidät, mutta vähemmän?",
    metric: "30 päivän aikana enintään 3 makeaa välipalaa ja makeutettua juomaa viikossa yhteensä (kirjataan puhelimeen seurantaa varten)",
  },
  quadrants: {
    Q1: { scar: "Söi kokonaisen pussin kuivattuja hedelmiä terveellisenä välipalana", sacred: "Makeus tulee vain kokonaisista hedelmistä" },
    Q2: { scar: "Lopetti sokerin kolmesti ja retkahti joka kerta toisella viikolla", sacred: "Vain se lasketaan, missä oikeasti pysyy" },
    Q3: { scar: "Kopioi vähähiilihydraattisen ruokavalion ja kyllästyi kolmessa päivässä", sacred: "Muuta tapaa, älä makua" },
    Q4: { scar: "Nähnyt liian monen lopettavan sokerin ja palaavan heti vanhaan", sacred: "Tee säännöt äläkä luota tahdonvoimaan" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Vain hedelmiä", "Aina kun tekee mieli makeaa, syö vain kokonaisia tuoreita hedelmiä, kuten kiiviä, ananasta, marjoja tai appelsiineja; mehu, kuivatut hedelmät ja sokeroidut hedelmät eivät käy", "Epäonnistuu, jos ostat 14 päivän aikana jälkiruokaa himoon useampana kuin 3 päivänä", null),
    N2: node("D2", 0, 1, "Ensin vettä", "Kun himo iskee, juo ensin lasillinen sokeritonta kivennäisvettä sitruunan tai passionhedelmän kanssa; jos sinun tekee yhä mieli herkkua 15 minuutin päästä, säästä se seuraavan aterian jälkeen. Vain juomat muuttuvat: ateriat pysyvät ennallaan, etkä osta korvaavia välipaloja", "Epäonnistuu, jos 14 päivän aikana sinun tekee yli puolet kerroista yhä mieli makeaa 15 minuutin odotuksen jälkeen", "Juoma ei vie halua pureskella jotain"),
    N3: node("D1", 1, 0, "Aterian jälkeen", "Syö hapanimeliä välipaloja ja hedelmiä vain tunnin sisällä aterian jälkeen; ei mitään tyhjään vatsaan eikä mitään 3 tuntia ennen nukkumaanmenoa", "Epäonnistuu, jos 14 päivän jälkeen etsit yhä välipalaa ennen nukkumaanmenoa useampana kuin 3 iltana", null),
    N4: node("D4", 0, 2, "Herkuton koti", "Käy kaupassa kerran viikossa: osta laatikko kauden hedelmiä ja viikoksi riittävästi maustamatonta sokeritonta jogurttia; ne ovat kodin ainoat välipalat, eikä makeita välipaloja tuoda kotiin koskaan", "Epäonnistuu, jos 14 päivän aikana on yhä viikko, jolloin ostat makeaa ulkoa yli 3 kertaa", null),
    N5: node("D3", 2, 0, "Puolikas määrä", "Syö edelleen hapanimeliä välipaloja, joista pidät, mutta vähemmän: siirry yksittäispakkauksiin ja puolita päivittäinen määräsi, ilman korvikkeita", "Epäonnistuu, jos toisesta viikosta alkaen syöt yli puolet entisestä määrästäsi useampana kuin 2 päivänä viikossa", "Toinen pakkaus avataan usein heti ensimmäisen perään"),
    N6: node("D3", 1, 2, "Maista ensin", "Osta jokaisesta uudesta sokerittoman juoman mausta pienin pakkaus ja juo sitä 3 päivää peräkkäin; osta koko laatikko vain, jos pidät siitä, äläkä koskaan hamstraa kaikkea kerralla", "Epäonnistuu, jos maistamisen jälkeen laatikoittain ostettu maku on 14 päivän päästä yhä yli puolillaan", null),
    N7: node("D3", 2, 1, "Vaihda kastike", "Kuin vaihtaisi puhelimen kuoret puhelimen sijaan: pidä hapanimelän kanan tai kalan pääraaka-aineet, mutta tee kastike itse tomaatista, ananaksesta ja etikasta puolella tavallisesta sokerimäärästä", "Epäonnistuu, jos uuden kastikkeen tekemisen jälkeen 2 kertaa 14 päivän sisällä kaikki kotona sanovat, ettei se ole hyvää", "Ravintoloissa ja noutoruoassa kastiketta ei voi vaihtaa",
      { lateral: { src: "Tekniikka: puhelimen kuoret", dist: 2, drop: "Ruoka pois ruokalistalta kokonaan" } }),
    N8: node("D2", 1, 0, "Vain 3 annosta", "Kuten lentoyhtiön matkatavararaja: enintään 3 annosta hedelmiä ja hapanimeliä välipaloja yhteensä päivässä, kukin noin nyrkin kokoinen; ylimääräinen odottaa huomiseen sen sijaan, että luottaisit hetken tahdonvoimaan", "Epäonnistuu, jos syöt yli 3 annosta useampana kuin 2 päivänä viikossa", null,
      { lateral: { src: "Ilmailu: matkatavararaja", dist: 3, drop: "Syö milloin haluat ilman rajaa" } }),
    N9: node("D4", 2, 0, "Vettä varastoon", "Täydennä varastoa kuin lähikauppa ennen kuin tuote loppuu: pidä jääkaapissa aina laatikko sokeritonta kivennäisvettä ja pussi sitruunoita, ja osta uusi laatikko, kun jäljellä on 3 tölkkiä, jottei himo aja sinua ostamaan kuplateetä tai limsaa", "Epäonnistuu, jos ostat 14 päivän aikana yhä yli 3 makeutettua juomaa ulkoa", null,
      { lateral: { src: "Kauppa: täydennä ennen loppumista", dist: 4, drop: "Osta juoma vain, kun tekee mieli" } }),
    N10: node("D2", 2, 0, "Kulukatto", "Jos korvaavat välipalat, kuten hedelmät ja sokeriton jogurtti, maksavat yli kaksi kertaa sen, mitä ennen käytit välipaloihin viikossa, luovutat kuukauden sisällä ja palaat ostamaan välipaloja", "Lopeta, jos korvaavat välipalat maksavat 14 päivän aikana yli kaksi kertaa entisen välipalabudjettisi", "Hedelmien hinnat heittelevät paljon kauden mukaan",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Korvikkeet ovat liian kalliita jatkaa" } }),
    N11: node("D4", 1, 0, "Ei suurostoja", "Jos ostat ruokaa ja juomia laatikoittain saadaksesi ilmaisen toimituksen tai paljousalennuksen, mitä enemmän kotona on, sitä enemmän syöt joka päivä", "Lopeta, jos ostat 14 päivän aikana ruokaa tai juomia laatikoittain tai ilmaisen toimituksen rajan takia useammin kuin kerran", "Ystävien ja sukulaisten tuomia herkkuja et voi hallita",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Alennukset saavat ostamaan yhä enemmän" } }),
    N12: node("D3", 0, 1, "Ei välineitä", "Jos odotat, kunnes olet ostanut hiilihapotuslaitteen, makeutusaineet ja kaikenlaiset korvikkeet ennen aloittamista, käytetyt rahat saavat sinut syömään väkisin asioita, joista et pidä, ja luovutat 2 viikossa", "Lopeta, jos ostat 14 päivän aikana useamman kuin 1 laitteen tai korvikkeen, jota et oikeasti käytä", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Syöt väkisin, ettei mene hukkaan" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Makeita välipaloja ei voi sekä pitää poissa kotoa että syödä tavalliseen tapaan" },
    { type: "excludes", from: "N1", to: "N5", why: "Jos makeus tulee vain kokonaisista hedelmistä, et voi pitää makeita välipaloja, joista pidät" },
    { type: "excludes", from: "N4", to: "N11", why: "Kodin hedelmät perustuvat laatikon ostamiseen joka viikko; jos laatikoittain ostaminen kielletään, tämä varastointisuunnitelma kaatuu" },
    { type: "excludes", from: "N2", to: "N7", why: "Tällä tiellä vain juomat muuttuvat ja ateriat pysyvät ennallaan, mikä on ristiriidassa hapanimeläkastikkeen uudistamisen kanssa" },
    { type: "excludes", from: "N2", to: "N10", why: "Tällä tiellä vain juomat muuttuvat eikä korvaavia välipaloja osteta, joten korvikkeiden kulukatto ei koske sitä; valitse toinen" },
    { type: "excludes", from: "N9", to: "N11", why: "Kivennäisveden pitäminen varastossa tarkoittaa sen ostamista laatikoittain, mikä on suoraan ristiriidassa paljousostojen välttämisen kanssa" },
    { type: "requires", from: "N1", to: "N8", why: "Hedelmissäkin on sokeria; vaikka hedelmät olisivat ainoa herkkusi, tarvitset päivärajan, tai liika syöminen kuormittaa silti" },
    { type: "requires", from: "N4", to: "N10", why: "Hedelmä- ja jogurttilaatikon ostaminen joka viikko kertyy, joten tarvitset kulukaton, tai lompakko pettää ensin" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Yksi kiinteä kauppareissu viikossa", v: "Luovu välipaloista, joista pidät", t: "Kahden ensimmäisen viikon himot ovat rankkoja", l: "Enintään kolme annosta hedelmiä päivässä", x: "Ei äkillisiä jälkiruokaostoksia" },
      fatal: "N10", thesis: "Hae makeus vain kokonaisista hedelmistä rajatusti ja pidä makeat välipalat poissa kotoa", title: "Hedelmiin · ei herkkuja kotona",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Pidä jääkaapissa aina kivennäisvettä", v: "Odota 15 minuuttia ennen kuin annat periksi himolle", t: "Muuta vain vähän joka viikko", l: "Aterioiden sokeri pysyy ennallaan", x: "Vanhoja välipaloja ei syödä entiseen tapaan" },
      fatal: "N12", thesis: "Tartu himon iskiessä sokerittomaan kivennäisveteen ja kokeile uusia makuja pieninä määrinä ennen kuin ostat lisää", title: "Ensin juomat · vähennä hitaasti",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Laske annokset joka kerta", v: "Kodin herkut houkuttelevat yhä", t: "Tulosten näkymiseen menee kauan", l: "Vähentäminen on täysin itsehillinnän varassa", x: "Luovu täydestä siirtymisestä hedelmiin" },
      fatal: "N11", thesis: "Syö edelleen sitä, mistä pidät, mutta siirry pieniin pakkauksiin, rajaa annokset ja tee hapanimeläkastike uudella tavalla", title: "Suosikit pysyvät · rajaa ja vaihda kastike",
    },
  },
  recommend: { key: "alpha", why: "Hedelmät ovat luonnostaan makeita ja kirpeitä, ja makeiden välipalojen pitäminen poissa kotoa vaatii vähiten tahdonvoimaa" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Kaikki hapanimelät herkkuhetkesi tulevat vain yhdestä hedelmästä tai juomasta", kill: "Jos se yksi tuote loppuu kaupasta tai siihen kyllästyy, koko suunnitelma kaatuu", label: "Yksi korvike" },
};
