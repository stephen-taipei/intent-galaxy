// 內建示範星系（IntentAnalysisResponse v1.0，芬蘭文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Miten koodi jaetaan kerroksiin", D2: "Missä teemat eroavat", D3: "Kuinka syvälle muokkaus menee", D4: "Miten teeman asetukset rakennetaan" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Toinen puoli: viedään ”${dims[dim]}” päinvastaiseen suuntaan`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_FI = {
  schema_version: "1.0",
  core: {
    decision: "Tekeekö jokainen brändi komponenteista oman kopionsa, vai jakavatko kaikki brändit yhden ytimen, jossa erot säädetään asetustiedostoilla?",
    metric: "60 päivän sisällä: uusi teema julkaistaan enintään 2 päivässä, ja jokaisen teeman CSS on alle 50KB",
  },
  quadrants: {
    Q1: { scar: "Jaetut komponentit täynnä brändikohtaisia ehtoja", sacred: "Ytimessä ei brändien tarkistuksia" },
    Q2: { scar: "Yli 100 teeman asettelut korjattiin käsin yksi kerrallaan", sacred: "Anna tyyppitarkistuksen löytää virheet" },
    Q3: { scar: "Kopioitiin jonkun toisen design system ja yleistettiin liikaa", sacred: "Osat, jotka voi vaihtaa kokonaan" },
    Q4: { scar: "Nähty kolmesti, kun muokkaukset karkasivat käsistä", sacred: "Kerrosten rajat pitävät" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3 kerrosta", "Jaa komponentit kolmeen kerrokseen: ydin, jossa on vain logiikka, näkymä, joka liittää osat yhteen, ja teemakohtainen tyylikerros; ydin ei saa tuoda teemojen tunnuksia eikä reittejä", "Epäonnistuu, jos ytimeen ilmestyy 14 päivän sisällä koodia, joka tarkistaa teeman", null),
    N2: node("D2", 0, 1, "CSS-muuttujat", "Kirjoita kaikki teemojen väliset erot CSS-muuttujiksi, eikä komponenteissa tai asetteluissa ole lainkaan teematarkistuksia", "Epäonnistuu, jos jo kolmas teema vaatii muutoksia komponentteihin", "Asetteluiden eroja ei ratkaista pelkillä väreillä"),
    N3: node("D1", 1, 0, "Vain oma teema", "Lataa käytön aikana vain nykyisen teeman tyylitiedosto sen sijaan, että kaikki teemat paketoitaisiin sivun ensimmäiseen latauskertaan", "Epäonnistuu, jos jonkin teeman CSS ylittää 50KB 14 päivän sisällä", null),
    N4: node("D4", 0, 2, "Asetustarkistus", "Jokaisella teemalla on täydellinen TypeScript-asetusolio; jos yksikin kenttä puuttuu, käännös epäonnistuu", "Epäonnistuu, jos uusi teema vaatii yhä muutoksia jaettuihin komponentteihin", null),
    N5: node("D3", 2, 0, "Kopio brändille", "Jokainen teema kopioi komponenttikansion ja muokkaa sitä itse, joten brändit eivät koskaan vaikuta toisiinsa", "Epäonnistuu, jos 10. teeman jälkeen yhden bugin korjaaminen vaatii muutoksia yli 10 paikkaan", "Yksi bugikorjaus pitää paikata jokaiseen kopioon"),
    N6: node("D3", 1, 2, "Ensin harvoille", "Näytä jokainen uusi teema viikon ajan 5 %:lle asiakkaista; avaa se kaikille vain, jos virheiden määrä pysyy tavoitteessa", "Epäonnistuu, jos virheiden osuus nousee yli 1 %:n sen viikon aikana", null),
    N7: node("D3", 2, 1, "Vaihda kuori", "Kuten autot, joilla on yhteinen alusta ja vain kori vaihtuu: vaihda koko asettelu, ja sen alla oleva yhteinen näkymä ja ydin pysyvät ennallaan", "Epäonnistuu, jos asettelun vaihtaminen vaatii muutoksia ytimeen", "Ohjaimet voivat toimia eri tavalla eri asetteluissa",
      { lateral: { src: "Autot: yhteinen alusta", dist: 2, drop: "Uusi muotti joka mallille" } }),
    N8: node("D2", 1, 0, "Kiinteät paikat", "Kuten LEGO-palikat, jotka kiinnittyvät vain nystyihin: asettelu määrittää kiinteät paikat, teema voi vain sijoittaa komponentteja niihin, eikä mikään niiden ulkopuolella saa muuttua", "Epäonnistuu, jos paikkojen ulkopuolista DOMia muutetaan kertaakaan", null,
      { lateral: { src: "Lelut: LEGO-palikat", dist: 3, drop: "DOMin vapaa muokkaus" } }),
    N9: node("D4", 2, 0, "Vain erot", "Kuten lihavointi ja ohut leikkaus, jotka tehdään samasta kirjaintyypistä: teema luettelee vain sen, mikä eroaa oletusteemasta, ja kaikki muut kentät periytyvät automaattisesti", "Epäonnistuu, jos periytyminen menee yli 3 tason syvyyteen", null,
      { lateral: { src: "Typografia: fonttipainot", dist: 4, drop: "Täysi kopio joka teemalle" } }),
    N10: node("D2", 2, 0, "Kenttäkatto", "Jos jokainen muokkaustoive lisää asetuksiin kentän, asetusten ylläpito tulee ennemmin tai myöhemmin kalliimmaksi kuin pelkkä kopiointi", "Lopeta kenttien lisääminen, kun missä tahansa asetusrajapinnassa on yli 40 kenttää", "Niin paljon asetuksia, ettei kukaan ymmärrä niitä",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Yleistäminen tulee kalliimmaksi kuin kopioitu koodi" } }),
    N11: node("D4", 1, 0, "Ei oikoteitä", "Jos liiketoiminta voi vaatia brändien tarkistuksia suoraan jaettuihin komponentteihin, kerrosten rajat hajoavat vuosineljänneksessä", "Hylkää tämä suunnitelma, jos jaettuihin komponentteihin lisätään 14 päivän sisällä yksikin brändin tarkistus", "Kerroksista luovutaan aikataulun takia",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Aikataulussa pysymisestä kehutaan, kerrosten rikkomisesta ei rangaista" } }),
    N12: node("D3", 0, 1, "Vaiheittain", "Jos kaikki 70 moduulia pitää siirtää ennen kuin mitään julkaistaan, mitä enemmän on jo panostettu, sitä vaikeampi on lopettaa, ja uudelleenkirjoitus jää helposti puolitiehen", "Lopeta, jos ensimmäistä moduulia ei ole julkaistu 14 päivän sisällä", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Kaiken kirjoittaminen kerralla uusiksi sotkee aikataulun" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Yksi yhteinen tarkistettu asetus tai oma kopio joka brändille: voit valita vain toisen" },
    { type: "excludes", from: "N1", to: "N5", why: "Yhteinen kolmikerroksinen ydin tai komponenttien kopio joka brändille: voit valita vain toisen" },
    { type: "excludes", from: "N4", to: "N11", why: "Tarkistetut asetukset estävät oikotiet jo käännösvaiheessa, joten kerrosten käsin tarkistaminen vain tarkistaa saman asian kahdesti" },
    { type: "excludes", from: "N2", to: "N7", why: "Jos teemat muuttavat vain CSS-muuttujia, kukaan ei vaihda kokonaisia asettelukomponentteja" },
    { type: "excludes", from: "N2", to: "N10", why: "Pelkillä CSS-muuttujilla ei synny kasautuvia asetuskenttiä; valitse toinen" },
    { type: "excludes", from: "N9", to: "N11", why: "Periytyminen antaa teeman muuttaa yksityiskohtia paikallisesti, mikä on ristiriidassa suojakaiteen kanssa, ettei kerroksia koskaan ohiteta" },
    { type: "requires", from: "N1", to: "N8", why: "Kun kerroksia on kolme, teemojen on muokattava kiinteiden paikkojen kautta, tai näkymäkerros hajoaa" },
    { type: "requires", from: "N4", to: "N10", why: "Tarkistetut asetukset tarvitsevat kenttäkaton, tai ne kasvavat, kunnes kukaan ei ymmärrä niitä" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Uudelleenkirjoitustyö etukäteen", v: "Ei nopeita kopioita", t: "60 päivää rakenteen tekemiseen", l: "Kattavat testit on kirjoitettava", x: "Ei erityisiä oikoteitä brändeille" },
      fatal: "N10", thesis: "Kolme kerrosta komponenteille ja tarkistettu asetustiedosto jokaiselle teemalle, joten jokainen teema on vain yksi asetustiedosto", title: "Asetusten varassa · 3 kerrosta",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Vähemmän vaihtelua asetteluissa", v: "Vähemmän suunnitteluvapautta", t: "Pieni muutos joka viikko", l: "Monimutkaiset asettelut eivät onnistu", x: "Sivun rakenteeseen ei muutoksia" },
      fatal: "N12", thesis: "Vain CSS-muuttujat ja periytyminen; näytä uudet teemat ensin harvoille käyttäjille ja laajenna sitten", title: "Vain tyylit · vähitellen käyttöön",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Päällekkäistä koodia", v: "Bugikorjaukset koskevat monia paikkoja", t: "Nopein julkaista", l: "Mitä enemmän teemoja, sitä enemmän ylläpitoa", x: "Luovutaan tarkistetuista asetuksista" },
      fatal: "N11", thesis: "Vaihda kokonaisia asetteluja ja anna jokaisen brändin tehdä oma kopio kuoresta", title: "Brändikopiot · yhteinen alusta",
    },
  },
  recommend: { key: "alpha", why: "Kun teemoja on yli 100, vain asetuksiin perustuva rakenne pitää ylläpitokulut kurissa" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Kaikki teemat periytyvät samasta oletusteemasta", kill: "Jos oletusteema rikkoutuu, jokaisen teeman asettelu rikkoutuu sen mukana", label: "Yksi pohjateema" },
};
