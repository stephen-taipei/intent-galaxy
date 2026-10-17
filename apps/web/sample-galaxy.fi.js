// 內建示範星系（IntentAnalysisResponse v1.0，芬蘭文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Kerrosrajat", D2: "Erojen ilmaisutapa", D3: "Räätälöinnin laajuus", D4: "Teeman koostumus" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Vastakanta: viedään ulottuvuus ”${dims[dim]}” vastakkaiseen ääripäähän`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_FI = {
  schema_version: "1.0",
  core: {
    decision: "Pitäisikö jokaisen brändin forkata omat komponenttinsa, vai ohjataanko yhtä yhteistä corea konfiguraatiolla?",
    metric: "60 päivän sisällä: uusi teema julkaistaan ≤2 päivässä, ja jokaisen teeman CSS on <50KB",
  },
  quadrants: {
    Q1: { scar: "Yhteiset komponentit täynnä brändikohtaisia if-lauseita", sacred: "Nolla haarautumaa coressa" },
    Q2: { scar: "Yli 100 teemaa paikattu käsin yksi kerrallaan", sacred: "Tyypit nappaavat virheet" },
    Q3: { scar: "Kopioi design systemin ja abstrahoi liikaa", sacred: "Vaihdettava rakenne" },
    Q4: { scar: "Näki räätälöinnin karkaavan käsistä kolme kertaa", sacred: "Rajat pitävät" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3-kerrosjako", "Jaa komponentit puhtaaseen coreen, koordinoivaan viewiin ja theme-lehteen; core ei saa importata teema-ID:itä eikä reittejä", "Väärin, jos coreen ilmestyy teematarkistuksia 14 päivän sisällä", null),
    N2: node("D2", 0, 1, "Vain CSS-arvot", "Ilmaise kaikki teemojen erot pelkillä CSS custom propertyillä, ilman yhtään haarautumaa komponenteissa tai layouteissa", "Väärin, jos jo kolmas teema vaatii komponenttimuutoksia", "Layout-eroja ei voi ilmaista pelkillä väreillä"),
    N3: node("D1", 1, 0, "Laiska CSS", "Lataa ajonaikaisesti vain aktiivisen teeman ainoa tyylitiedosto sen sijaan, että kaikki teemat paketoitaisiin ensimmäiseen piirtoon", "Väärin, jos minkä tahansa teeman CSS ylittää 50KB 14 päivän sisällä", null),
    N4: node("D4", 0, 2, "TS-config", "Jokainen teema toimittaa täydellisen TypeScript-config-olion; puuttuva kenttä kaataa buildin", "Väärin, jos uusi teema vaatii yhä muutoksia yhteisiin komponentteihin", null),
    N5: node("D3", 2, 0, "Brändin fork", "Jokainen teema kopioi komponenttihakemiston ja muokkaa sitä itsenäisesti, joten brändit eivät koskaan vaikuta toisiinsa", "Väärin, jos 10. teeman jälkeen bugikorjaus koskee yli 10 paikkaa", "Yksi bugikorjaus tarkoittaa N kopion paikkaamista"),
    N6: node("D3", 1, 2, "Kanariateemat", "Julkaise jokainen uusi teema feature flagin takana 5 %:lle asiakkaista viikoksi; nosta 100 %:iin vain, jos virhetasot pysyvät tavoitteessa", "Väärin, jos kanarian virheprosentti ylittää 1 %", null),
    N7: node("D3", 2, 1, "Vaihda kori", "[D2 autoalusta] Layoutit ovat kuin auton kori: vaihda koko kuori, kun yhteinen alusta (view ja core) pysyy paikallaan", "Väärin, jos layoutin vaihto vaatii muutoksia coreen", "Vuorovaikutus ajautuu eri suuntiin layoutien välillä",
      { lateral: { src: "Autoteollisuus: yhteinen alusta", dist: 2, drop: "Jokaisen automallin rakentaminen alusta asti" } }),
    N8: node("D2", 1, 0, "Kiinteät slotit", "[D3 LEGO-palikat] Layoutit määrittelevät kiinteät slotit; teemat saavat vain kytkeä komponentteja slotteihin eivätkä saa muuttaa rakennetta niiden ulkopuolella", "Väärin, jos slottien ulkopuolista DOMia muutetaan edes kerran", null,
      { lateral: { src: "Lelut: LEGO-palikoiden liitäntä", dist: 3, drop: "Vapaamuotoinen DOM-räätälöinti" } }),
    N9: node("D4", 2, 0, "Peri erot", "[D4 fonttiperhe] Teemat ilmoittavat vain eronsa oletukseen; kaikki muut kentät periytyvät automaattisesti", "Väärin, jos periytymisketju on yli 3 tasoa syvä", null,
      { lateral: { src: "Kirjaintyypit: painoperheet", dist: 4, drop: "Täysi kopio joka teemalle" } }),
    N10: node("D2", 2, 0, "Kenttäkatto", "Jos jokainen räätälöintipyyntö lisää config-kentän, konfiguraation ylläpito tulee väistämättä kalliimmaksi kuin pelkkä forkkaaminen", "Lopeta kenttien lisääminen, kun yksikin config-rajapinta ylittää 40 kenttää", "Konfiguraatiohelvetti",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraktio maksaa enemmän kuin kopiointi" } }),
    N11: node("D4", 1, 0, "Estä ohitukset", "Jos liiketoiminta voi vaatia brändikohtaisia tarkistuksia suoraan yhteisiin komponentteihin, raja kaatuu vuosineljänneksessä", "Mitätön, jos yhteisiin komponentteihin lisätään yksikin brändikohtainen tarkistus 14 päivän sisällä", "Rajat vaihdetaan aikatauluihin",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Aikataulupaine palkitsee rajojen rikkomisen" } }),
    N12: node("D3", 0, 1, "Ei big bangia", "Jos kaikki 70 moduulia on siirrettävä ennen kuin mitään julkaistaan, uponneet kustannukset jumittavat refaktoroinnin puoliväliin", "Pysähdy, jos ensimmäistä moduulia ei ole julkaistu 14 päivän sisällä", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big bang -refaktorointi pitää aikatauluja panttivankina" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Yhteinen tyypitetty config ja brändikohtaiset komponenttiforkit ovat joko–tai-valinta" },
    { type: "excludes", from: "N1", to: "N5", why: "Yhteinen kolmikerroksinen core ja brändikohtaiset komponenttikopiot sulkevat toisensa pois" },
    { type: "excludes", from: "N4", to: "N11", why: "Tyypitetty config estää ohitukset jo käännösaikana, joten manuaalinen rajatarkastus on turha portti" },
    { type: "excludes", from: "N2", to: "N7", why: "Jos teemat muuttavat vain CSS-muuttujia, kokonaisia layout-komponentteja ei vaihdeta" },
    { type: "excludes", from: "N2", to: "N10", why: "Pelkissä CSS-muuttujissa ei ole config-kenttiä, jotka voisivat paisua; valitse toinen" },
    { type: "excludes", from: "N9", to: "N11", why: "Periytymisketjut sallivat paikalliset ylikirjoitukset, mikä on ristiriidassa nollan ohituksen suojakaiteen kanssa" },
    { type: "requires", from: "N1", to: "N8", why: "Kolmeen kerrokseen jaon jälkeen teemojen on räätälöitävä kiinteiden slottien kautta, tai view-kerros puhkeaa" },
    { type: "requires", from: "N4", to: "N10", why: "Tyypitetyt configit tarvitsevat kenttäkaton, tai ne paisuvat konfiguraatiohelvetiksi" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Refaktorointityö etupainotteisesti", v: "Ei nopeita forkkeja", t: "60 päivää rungon rakentamiseen", l: "Eheystestit on kirjoitettava", x: "Ei brändikohtaisia oikoteitä" },
      fatal: "N10", thesis: "Kolmen kerroksen rajat ja tyypitetty config kutistavat jokaisen teeman yhdeksi lehdeksi", title: "Config-ohjattu · 3 kerrosta",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Rajattu layout-vaihtelu", v: "Vähemmän suunnitteluvapautta", t: "Pieniä viikoittaisia askelia", l: "Monimutkaiset layoutit eivät tule kyseeseen", x: "Ei rakenteellista räätälöintiä" },
      fatal: "N12", thesis: "Käytä vain CSS-muuttujia ja periytymistä, ja julkaise teemat vaiheittain kanarian takana", title: "Pelkkä tyylitys · vaiheittain",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Toisteista koodia", v: "Bugikorjaukset koskevat monia paikkoja", t: "Nopein julkaista", l: "Ylläpitokulut kasvavat lineaarisesti", x: "Luovu tyypitetystä configista" },
      fatal: "N11", thesis: "Vaihda kokonaisia layouteja ja anna jokaisen brändin forkata oma kuorensa", title: "Brändiforkit · yhteinen alusta",
    },
  },
  recommend: { key: "alpha", why: "Yli 100 teemalla vain config-ohjattu malli pitää ylläpitokulut kurissa" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Jokainen teema perii saman oletusteeman", kill: "Riko oletus, niin jokaisen teeman layout hajoaa", label: "default SPOF" },
};
