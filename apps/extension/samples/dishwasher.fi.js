// 擴充功能生活題示範星系（芬蘭文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Sijoitus", D2: "Valintatapa", D3: "Remontin laajuus", D4: "Tilavuus ja astiat" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Vastapuoli vie ulottuvuuden ”${dims[dim]}” vastakkaiseen ääripäähän`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_FI = {
  schema_version: "1.0",
  core: {
    decision: "Remontoidaanko keittiö astianpesukoneen ehdoilla, vai valitaanko kone, joka mahtuu nykyiseen keittiöön?",
    metric: "Ensimmäisten 30 päivän aikana kone on käynnissä vähintään 5 kertaa viikossa, eikä käsitiskiin kulu yli 5 minuuttia päivässä",
  },
  quadrants: {
    Q1: { scar: "Osti astianpesukoneen ja tiskaa silti käsin", sacred: "Laske astiasi ensin" },
    Q2: { scar: "Huomasi kesken asennuksen, että letku on liian lyhyt", sacred: "Mittaa ennen kuin ostat" },
    Q3: { scar: "Osti netin parhaat-listalta, eikä kone mahtunut", sacred: "Lainaa ideoita muilta aloilta" },
    Q4: { scar: "Näki kolmen astianpesukoneen muuttuvan astiakaapiksi", sacred: "Suunnittele epäonnistuminen ensin" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Integroitu", "Pura altaan vieressä oleva 45 tai 60 cm:n kaappi ja asenna kone integroituna, jolloin se ei vie työtasoa eikä tuki kulkua", "Ei sovi, jos kaapin leveys, korkeus tai syvyys on pienempi kuin koneen ilmoitetut asennusmitat", null),
    N2: node("D2", 0, 1, "Aterian jälkeen", "Valitse malli, jossa on alle tunnin pikaohjelma, ja käynnistä se jokaisen aterian jälkeen, ettei likaisia astioita jää altaaseen yön yli", "Ei sovi, jos astiat tuntuvat pikaohjelman jälkeen yhä rasvaisilta useammin kuin 2 kertaa 14 päivässä", "Pikaohjelmat jättävät yleensä kuivauksen väliin, joten astiat kuivuvat ilmassa"),
    N3: node("D1", 1, 0, "Altaan viereen", "Sijoita kone enintään metrin päähän altaasta ja vie poistoletku suoraan altaan viemäriin, ilman seinien porausta tai uusia putkitöitä", "Ei sovi, jos mukana tuleva poistoletku ei yllä altaaseen ja tarvitset jatkoletkun", null),
    N4: node("D4", 0, 2, "Perheen koko", "Kun kotona on 3 tai useampi henkilö, valitse vähintään 12 hengen kone, jotta kattilat ja astiat menevät yhdellä pesulla eivätkä kahdella", "Ei sovi, jos astiat ja kattilat eivät mahdu yhteen pesuun useampana kuin 2 päivänä 14:stä", null),
    N5: node("D3", 2, 0, "Pöytämalli", "Osta enintään 8 hengen pöytämalli: ei kaappien purkua, ei putkimuutoksia, ja se muuttaa mukanasi", "Ei sovi, jos kaiken puhdistamiseen tarvitaan 2 pesua useampana kuin 3 päivänä 14:stä", "Vie ison osan työtasosta"),
    N6: node("D3", 1, 2, "Ensin kokeilu", "Osta malli, joka toimii sekä vapaasti seisovana että integroituna, pidä sitä altaan vieressä täydet 30 päivää ja päätä vasta sitten kaapin purkamisesta, ennemmin kuin repisit sen heti ensimmäisenä päivänä", "Ei sovi, jos kone tukkii kulun tai laatikon 30 päivän kokeilun aikana", null),
    N7: node("D3", 2, 1, "Vesisäiliömalli", "Kuten matkailuauto omalla vesisäiliöllään, valitse käsin täytettävä pöytämalli: ei hanaliitäntää, ei putkimuutoksia", "Ei sovi, jos jonain viikkona jätät koneen käyttämättä ja tiskaat käsin 2 kertaa tai useammin, koska täyttäminen ei huvittanut", "Täyttäminen on työläämpää kuin luulisi",
      { lateral: { src: "Retkeily: sisäänrakennettu vesisäiliö", dist: 2, drop: "Pysyvä hanaliitäntä" } }),
    N8: node("D2", 1, 0, "Mittaa ensin", "Kuten lentäjän lentoa edeltävä tarkistuslista: mittaa leveys, syvyys ja korkeus ennen tilaamista ja tarkista sitten pistorasian ja viemärin paikka; jos yksikin viidestä puuttuu, älä tilaa", "Ei sovi, jos jokin ei täsmää tai konetta ei saa asennettua, kun se saapuu", null,
      { lateral: { src: "Ilmailu: lentoa edeltävä tarkistuslista", dist: 3, drop: "Tilaaminen mutu-tuntumalla" } }),
    N9: node("D4", 2, 0, "Konepestävät", "Kuten ravintola, joka käyttää vain konepestäviä astioita, vaihda jokainen kattila ja astia, jossa lukee ”ei konepesua”, niin käsin tiskattavaa ei jää", "Ei sovi, jos vaihdon jälkeisten 14 päivän aikana tiskaat yhä käsin yli 3 esinettä päivässä", null,
      { lateral: { src: "Ravintolat: ammattikäyttöön tehdyt astiat", dist: 4, drop: "Kodin sekalainen vanha astiasto" } }),
    N10: node("D2", 2, 0, "Ei puolikuormia", "Jos käytät konetta alle puolillaan, se kuluttaa lähes täyden pesun verran vettä ja sähköä, joten astiakohtainen hinta yli kaksinkertaistuu", "Kirjaa astiasi 7 päivän ajan ennen tilaamista; jos keskiarvo on alle 6 hengen astiat päivässä, vaihda pöytämalliin", "Astiat alkavat haista, kun odotat täyttä koneellista",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Ison koneen ajaminen puolityhjänä ei kannata" } }),
    N11: node("D4", 1, 0, "Kattilat käsin", "Jos ahdat paistinpannut ja isot kattilat koneeseen mukavuussyistä, pöytämalliin eivät astiat mahdu yhdellä pesulla ja palaat käsitiskiin", "Hylkää, jos kattilat pakottavat toiseen pesuun useammin kuin 2 kertaa 14 päivässä", "Kaikki kotona eivät noudata sääntöä",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Koneen ylitäyttö mukavuuden vuoksi" } }),
    N12: node("D3", 0, 1, "Ei remonttia", "Jos astianpesukoneen asennus paisuu koko keittiön remontiksi, olet työn alettua ja rahojen mentyä jumissa viemässä sen loppuun", "Älä aloita, jos ennen kaapin purkua saamasi tarjous on yli 2x koneen hinta", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Kun työ on alkanut, perääntyä ei voi" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Vähintään 12 hengen kone ei mahdu työtasolle, joten joko se tai pöytämalli" },
    { type: "excludes", from: "N1", to: "N5", why: "Kun kone on integroitu kaappiin, et osta lisäksi pöytämallia; vain toinen" },
    { type: "excludes", from: "N4", to: "N11", why: "Perheen kokoisen koneen idea on pestä myös kattilat, mikä on ristiriidassa kattiloiden pitämisen ulkona kanssa" },
    { type: "excludes", from: "N2", to: "N7", why: "Jokaisen aterian jälkeinen pesu tarkoittaa säiliön täyttämistä käsin kolmesti päivässä, mitä on vaikea jaksaa" },
    { type: "excludes", from: "N2", to: "N10", why: "Jokaisen aterian jälkeen kone on usein alle puolillaan, mikä on ristiriidassa ei puolikuormia -säännön kanssa" },
    { type: "excludes", from: "N9", to: "N11", why: "Konepestäviin kattiloihin ja astioihin vaihtamisen idea on laittaa ne koneeseen, mikä on ristiriidassa kattiloiden pitämisen ulkona kanssa" },
    { type: "requires", from: "N1", to: "N8", why: "Sentinkin heitto tarkoittaa, ettei kone liu'u kaappiin, joten kaikki on mitattava ennen tilaamista" },
    { type: "requires", from: "N4", to: "N10", why: "Puolityhjänä ajettu iso kone kuluttaa silti täyden pesun vedet ja sähköt, joten pidä kiinni ei puolikuormia -säännöstä" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Kaapin purku- ja asennustyö", v: "Yksi säilytyskaappi vähemmän", t: "Odota asentajaa mittaamaan ja asentamaan", l: "Odota puolikasta koneellista ennen pesua", x: "Luovu pöytämallista" },
      fatal: "N10", thesis: "Mittaa kaappi, integroi iso kone, pese vasta kun se on puolillaan", title: "Integroitu iso kone kerralla",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Uudet kattilat ja astiat, vesi ja sähkö joka aterialla", v: "Vie kulkutilaa kokeilun ajan", t: "Kaappi lähtee vasta 30 päivän jälkeen", l: "Astiat kuivuvat ilmassa pikaohjelman jälkeen", x: "Luovu pöytämallista" },
      fatal: "N12", thesis: "Pikapesu joka aterian jälkeen; pidä kone altaan vieressä, kunnes se toimii, ja integroi sitten", title: "Päivittäinen pikapesu, kokeilu ennen integrointia",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Vesi täytetään käsin joka pesulla", v: "Vie ison osan työtasosta", t: "Kattilat tiskataan käsin joka päivä", l: "Enintään 8 hengen astiat", x: "Luovu integroinnista ja isosta tilavuudesta" },
      fatal: "N11", thesis: "Itse täytettävä pöytämalli; kattilat tiskataan käsin", title: "Pöytämalli ilman putkitöitä",
    },
  },
  recommend: { key: "alpha", why: "Vähintään 3 hengen taloudessa yksi iso kone hoitaa koko päivän astiat yhdellä pesulla" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Koko perheen astiat ovat tämän yhden koneen varassa; jos se hajoaa, ainoa varasuunnitelma on käsitiski", kill: "Hylkää, jos korjaus kestää yli 7 päivää ja perhe palaa käsitiskiin", label: "Yksi kone" },
};
