// 擴充功能生活題示範星系（芬蘭文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Sijoitus", D2: "Valintatapa", D3: "Remontin laajuus", D4: "Tilavuus ja astiat" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Toinen puoli vie kohdan ”${dims[dim]}” päinvastaiseen ääripäähän`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_FI = {
  schema_version: "1.0",
  core: {
    decision: "Remontoidaanko keittiö astianpesukoneen ehdoilla, vai valitaanko kone, joka mahtuu nykyiseen keittiöön?",
    metric: "Ensimmäisten 30 päivän aikana konetta käytetään vähintään 5 kertaa viikossa, ja käsin tiskaamiseen kuluu enintään 5 minuuttia päivässä",
  },
  quadrants: {
    Q1: { scar: "Ostettiin astianpesukone, ja tiskataan silti käsin", sacred: "Laske ensin astiasi" },
    Q2: { scar: "Asennuksen puolivälissä selvisi, että letku oli liian lyhyt", sacred: "Mittaa ennen kuin ostat" },
    Q3: { scar: "Ostettiin netin parhaat-listan perusteella, eikä kone mahtunut", sacred: "Lainaa ideoita muilta aloilta" },
    Q4: { scar: "Nähty kolmen astianpesukoneen päätyvän astiatelineiksi", sacred: "Mieti etukäteen, miten se voi epäonnistua" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Kaappiasennus", "Pura altaan vieressä oleva 45 tai 60 cm:n kaappi ja asenna kone sen tilalle integroituna, jolloin se ei vie työtasoa eikä tuki kulkureittiä", "Ei sovi, jos kaapin leveys, korkeus tai syvyys on pienempi kuin koneen ilmoitetut asennusmitat", null),
    N2: node("D2", 0, 1, "Aterian jälkeen", "Valitse malli, jossa on alle tunnin pikaohjelma, ja käytä sitä jokaisen aterian jälkeen, jotta likaiset astiat eivät koskaan jää altaaseen yön yli", "Ei sovi, jos astiat tuntuvat pikaohjelman jälkeen yhä rasvaisilta useammin kuin 2 kertaa 14 päivässä", "Pikaohjelmat jättävät yleensä kuivauksen väliin, joten astiat kuivuvat ilmassa"),
    N3: node("D1", 1, 0, "Altaan viereen", "Sijoita kone enintään metrin päähän altaasta ja vie poistoletku suoraan altaan viemäriin, ilman seinien porausta tai uusia putkitöitä", "Ei sovi, jos mukana tuleva poistoletku ei ylety altaalle ja tarvitaan jatko", null),
    N4: node("D4", 0, 2, "Perheen kokoon", "Jos kotona on 3 tai useampi henkilö, valitse vähintään 12 hengen kone, jotta kattilat ja astiat mahtuvat yhteen pesukertaan kahden sijaan", "Ei sovi, jos astiat ja kattilat eivät mahdu yhteen pesukertaan useampana kuin 2 päivänä 14:stä", null),
    N5: node("D3", 2, 0, "Pöytämalli", "Osta pieni pöytämalli enintään 8 hengen astioille: kaappia ei pureta, putkia ei muuteta, ja kone muuttaa mukanasi", "Ei sovi, jos kaiken puhdistamiseen tarvitaan 2 pesukertaa useampana kuin 3 päivänä 14:stä", "Vie ison osan työtasosta"),
    N6: node("D3", 1, 2, "Kokeile ensin", "Osta malli, joka toimii sekä vapaasti seisovana että integroituna, pidä sitä altaan vieressä täydet 30 päivää ja päätä vasta sitten, puretaanko kaappi, sen sijaan että se purettaisiin heti ensimmäisenä päivänä", "Ei sovi, jos kone tukkii kulkureitin tai laatikon 30 päivän kokeilun aikana", null),
    N7: node("D3", 2, 1, "Oma vesisäiliö", "Kuten matkailuauto, jossa on oma vesisäiliö: valitse pöytämalli, joka täytetään käsin, ilman hanaliitäntää ja putkimuutoksia", "Ei sovi, jos jonain viikkona jätät koneen käyttämättä ja tiskaat käsin 2 kertaa tai useammin, koska täyttäminen ei huvittanut", "Täyttäminen on työläämpää kuin luulisi",
      { lateral: { src: "Retkeily: oma vesisäiliö", dist: 2, drop: "Pysyvä hanaliitäntä" } }),
    N8: node("D2", 1, 0, "Mittaa ensin", "Kuten lentäjän tarkistuslista ennen lentoa: mittaa leveys, syvyys ja korkeus ennen tilaamista ja tarkista sitten pistorasian ja viemärin paikat; jos yksikin viidestä puuttuu, älä tilaa", "Ei sovi, jos jokin ei täsmää tai konetta ei voi asentaa, kun se saapuu", null,
      { lateral: { src: "Ilmailu: tarkistus ennen lentoa", dist: 3, drop: "Tilaaminen mutu-tuntumalla" } }),
    N9: node("D4", 2, 0, "Konepestävät", "Kuten ravintola, joka käyttää vain konepesun kestäviä astioita: vaihda jokainen kattila ja astia, jossa lukee, ettei se kestä konepesua, jotta käsin tiskattavaa ei jää", "Ei sovi, jos tiskaat vaihdon jälkeisten 14 päivän aikana yhä käsin yli 3 esinettä päivässä", null,
      { lateral: { src: "Ravintolat: ammattiastiat", dist: 4, drop: "Kodin vanhojen astioiden sekalainen kokoelma" } }),
    N10: node("D2", 2, 0, "Ei puolityhjänä", "Jos konetta käytetään alle puolillaan, se kuluttaa suunnilleen yhtä paljon vettä ja sähköä kuin täysi pesu, joten astiaa kohti pesu maksaa yli kaksi kertaa enemmän", "Kirjaa astiasi 7 päivän ajan ennen tilaamista; jos keskiarvo on alle 6 hengen astiat päivässä, vaihda pöytämalliin", "Astiat alkavat haista, kun odotetaan täyttä konetta",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Ison koneen ajaminen puolityhjänä ei kannata" } }),
    N11: node("D4", 1, 0, "Ei kattiloita", "Jos wokit ja isot kattilat ahdetaan koneeseen mukavuuden vuoksi, pieni kone ei saa astioita mahtumaan yhteen pesuun, ja päädyt taas tiskaamaan käsin", "Hylkää tämä suunnitelma, jos kattiloiden ahtaminen johtaa 14 päivän sisällä toiseen pesukertaan useammin kuin 2 kertaa", "Kaikki kotona eivät noudata sääntöä",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Kone ylitäytetään, koska se on helpompaa" } }),
    N12: node("D3", 0, 1, "Ei remonttia", "Jos astianpesukoneen asennus paisuu koko keittiön remontiksi, työn alettua ja rahojen mentyä olet jumissa ja joudut viemään sen loppuun", "Älä aloita, jos ennen kaapin purkamista saatu tarjous on yli 2 kertaa koneen hinta", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Kun työ on alkanut, ei ole paluuta" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Vähintään 12 hengen kone ei mahdu työtasolle, joten joko se tai pieni pöytämalli" },
    { type: "excludes", from: "N1", to: "N5", why: "Kun kone on asennettu kaappiin, et osta lisäksi pöytämallia; vain jompikumpi" },
    { type: "excludes", from: "N4", to: "N11", why: "Perheen koon mukaan mitoittamisen idea on pestä myös kattilat, mikä on ristiriidassa sen kanssa, että kattilat pidetään poissa" },
    { type: "excludes", from: "N2", to: "N7", why: "Käyttö jokaisen aterian jälkeen tarkoittaa säiliön täyttämistä käsin kolmesti päivässä, ja siinä on vaikea pysyä" },
    { type: "excludes", from: "N2", to: "N10", why: "Käyttö jokaisen aterian jälkeen tarkoittaa usein alle puolikasta konetta, mikä on ristiriidassa ei puolityhjänä -säännön kanssa" },
    { type: "excludes", from: "N9", to: "N11", why: "Konepestäviin kattiloihin ja astioihin vaihtamisen idea on laittaa ne koneeseen, mikä on ristiriidassa sen kanssa, että kattilat pidetään poissa" },
    { type: "requires", from: "N1", to: "N8", why: "Sentin heitto, eikä kone mene kaappiin, joten kaikki on mitattava ennen tilaamista" },
    { type: "requires", from: "N4", to: "N10", why: "Puolityhjänä ajettu iso kone kuluttaa yhä täyden pesun vedet ja sähköt, joten pidä kiinni ei puolityhjänä -säännöstä" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Kaapin purku ja asennustyö", v: "Yksi säilytyskaappi vähemmän", t: "Odota asentajaa mittaamaan ja asentamaan", l: "Odota puolikas kone ennen pesua", x: "Luovu pöytämallista" },
      fatal: "N10", thesis: "Mittaa kaappi, asenna iso kone integroituna ja käytä sitä vasta, kun se on vähintään puolillaan", title: "Iso kone kaappiin, kerralla valmista",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Uudet kattilat ja astiat sekä vesi ja sähkö joka aterialla", v: "Vie kulkureittiä kokeilun ajan", t: "Kaappi puretaan vasta 30 päivän jälkeen", l: "Astiat kuivataan ilmassa pikaohjelman jälkeen", x: "Luovu pöytämallista" },
      fatal: "N12", thesis: "Pikapesu jokaisen aterian jälkeen; pidä kone altaan vieressä, kunnes se toimii, ja asenna se vasta sitten kaappiin", title: "Pikapesu päivittäin, kokeilu ennen asennusta",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Vesi täytetään käsin joka pesulla", v: "Vie ison osan työtasosta", t: "Kattilat tiskataan käsin joka päivä", l: "Enintään 8 hengen astiat", x: "Luovu kaappiasennuksesta ja suuresta tilavuudesta" },
      fatal: "N11", thesis: "Itse täytettävä pöytämalli; kattilat tiskataan edelleen käsin", title: "Pöytämalli, ei putkitöitä",
    },
  },
  recommend: { key: "alpha", why: "Kolmen tai useamman hengen taloudessa yksi iso kone hoitaa koko päivän astiat yhdellä pesulla" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Koko perheen astiat ovat tämän yhden koneen varassa; jos se hajoaa, ainoa vara on käsin tiskaaminen", kill: "Hylkää tämä suunnitelma, jos korjaus kestää yli 7 päivää ja perhe palaa käsitiskiin", label: "Yksi kone" },
};
