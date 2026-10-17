// 擴充功能生活題示範星系（羅馬尼亞文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Amplasare", D2: "Cum alegi", D3: "Cât renovezi", D4: "Capacitate și vase" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Tabăra cealaltă duce ${dims[dim]} la extrema opusă`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_RO = {
  schema_version: "1.0",
  core: {
    decision: "Îți refaci bucătăria ca să încapă o mașină de spălat vase, sau alegi una care intră în bucătăria pe care o ai deja?",
    metric: "În primele 30 de zile, s-o pornești de cel puțin 5 ori pe săptămână și să nu speli vase de mână mai mult de 5 minute pe zi",
  },
  quadrants: {
    Q1: { scar: "Și-a luat mașină de spălat vase și tot spală de mână", sacred: "Numără-ți întâi vasele" },
    Q2: { scar: "A aflat în mijlocul montajului că furtunul e prea scurt", sacred: "Măsori înainte să cumperi" },
    Q3: { scar: "A cumpărat-o pe prima dintr-un top online și n-a încăput", sacred: "Împrumută idei din alte domenii" },
    Q4: { scar: "A văzut trei mașini de spălat vase ajunse uscătoare de vase", sacred: "Plănuiește întâi eșecul" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Încorporată", "Scoate corpul de 45 sau 60 cm de lângă chiuvetă și încorporează mașina acolo, ca să nu ocupe blatul și să nu încurce trecerea", "Nu se potrivește dacă lățimea, înălțimea sau adâncimea corpului sunt mai mici decât cotele de încorporare ale mașinii", null),
    N2: node("D2", 0, 1, "După masă", "Alege un model cu program rapid sub 1 oră și pornește-l după fiecare masă, ca vasele murdare să nu mai stea niciodată peste noapte în chiuvetă", "Nu se potrivește dacă în 14 zile vasele rămân unsuroase după programul rapid de mai mult de 2 ori", "Programele rapide sar de obicei peste uscare, așa că vasele se usucă la aer"),
    N3: node("D1", 1, 0, "Lângă chiuvetă", "Pune mașina la cel mult 1 metru de chiuvetă și du furtunul de evacuare direct în scurgerea chiuvetei, fără să găurești pereți sau să refaci instalația", "Nu se potrivește dacă furtunul de evacuare din cutie nu ajunge la chiuvetă și trebuie prelungitor", null),
    N4: node("D4", 0, 2, "Pentru familie", "Cu 3 sau mai multe persoane în casă, mergi pe 12 seturi sau mai mult, ca oalele și farfuriile să intre într-o singură spălare, nu în două", "Nu se potrivește dacă, în mai mult de 2 zile din 14, vasele și oalele nu încap într-o spălare", null),
    N5: node("D3", 2, 0, "Mini de blat", "Ia o mașină mini de blat de cel mult 8 seturi: nu demontezi corpuri, nu modifici instalația și se mută cu tine", "Nu se potrivește dacă, în mai mult de 3 zile din 14, îți trebuie 2 spălări ca să fie totul curat", "Ocupă o bună bucată din blatul de lucru"),
    N6: node("D3", 1, 2, "Întâi testezi", "Cumpără un model care merge și liber, și încorporat, ține-l lângă chiuvetă 30 de zile întregi și abia apoi decide dacă scoți corpul, în loc să-l smulgi din prima zi", "Nu se potrivește dacă, în cele 30 de zile de probă, mașina blochează trecerea sau un sertar", null),
    N7: node("D3", 2, 1, "Cu rezervor", "Ca o rulotă cu rezervorul ei de apă, alege un model de blat pe care îl umpli de mână: fără racord la robinet, fără modificări la instalație", "Nu se potrivește dacă, într-o săptămână oarecare, o sari de 2 ori sau mai mult și speli de mână pentru că ți-e lene s-o umpli", "S-o umpli e mai bătător la cap decât crezi",
      { lateral: { src: "Camping: rezervor de apă integrat", dist: 2, drop: "Racord permanent la robinet" } }),
    N8: node("D2", 1, 0, "Măsori întâi", "Ca lista de verificare a unui pilot înainte de zbor: măsori lățimea, adâncimea și înălțimea înainte să comanzi, apoi verifici priza și scurgerea; dacă lipsește oricare din cele 5, nu comanzi", "Nu se potrivește dacă ceva nu corespunde sau nu se poate monta când ajunge", null,
      { lateral: { src: "Aviație: checklist înainte de zbor", dist: 3, drop: "Comandat după ureche" } }),
    N9: node("D4", 2, 0, "Vase potrivite", "Ca un restaurant care folosește doar vase rezistente la mașina de spălat, înlocuiește toate oalele și farfuriile marcate ca nepotrivite pentru mașină, ca să nu rămână nimic de spălat de mână", "Nu se potrivește dacă, în cele 14 zile de după înlocuire, tot speli de mână mai mult de 3 bucăți pe zi", null,
      { lateral: { src: "Restaurante: vase profesionale", dist: 4, drop: "Vase vechi desperecheate acasă" } }),
    N10: node("D2", 2, 0, "Nu pe jumătate", "Dacă o pornești pe mai puțin de jumătate plină, consumă cam la fel de multă apă și curent ca la o încărcare completă, deci fiecare farfurie costă de peste două ori mai mult", "Notează-ți vasele 7 zile înainte să comanzi; dacă media e sub 6 seturi pe zi, treci pe o mini", "Vasele încep să miroasă cât aștepți să se umple",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "O mașină mare pornită pe jumătate goală nu se merită" } }),
    N11: node("D4", 1, 0, "Fără oale", "Dacă îndesi wok-uri și oale mari de dragul comodității, o mini nu poate spăla totul dintr-o tură și ajungi iar să speli de mână", "Renunți dacă în 14 zile oalele forțează o a doua spălare de mai mult de 2 ori", "Nu toată lumea din casă va respecta regula",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Supraîncărcarea mașinii din comoditate" } }),
    N12: node("D3", 0, 1, "Fără renovare", "Dacă montarea unei mașini de spălat vase se transformă în renovarea întregii bucătării, odată pornite lucrările și dați banii, ești obligat să mergi până la capăt", "Nu începe dacă oferta primită înainte să scoți corpul depășește de 2 ori prețul mașinii", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Odată începute lucrările, nu mai ai cale de întoarcere" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "O mașină de 12 seturi sau mai mult nu încape pe blat, deci ori ea, ori mini de blat" },
    { type: "excludes", from: "N1", to: "N5", why: "Odată ce ai încorporat o mașină în corp, nu-ți mai iei și una mini de blat; ori una, ori alta" },
    { type: "excludes", from: "N4", to: "N11", why: "Rostul unei mașini pe măsura familiei e să speli și oalele, ceea ce contrazice ținerea oalelor afară" },
    { type: "excludes", from: "N2", to: "N7", why: "Pornită după fiecare masă înseamnă să umpli rezervorul de mână de trei ori pe zi, greu de ținut" },
    { type: "excludes", from: "N2", to: "N10", why: "Pornită după fiecare masă înseamnă des sub jumătate de încărcătură, ceea ce contrazice regula nu pe jumătate" },
    { type: "excludes", from: "N9", to: "N11", why: "Rostul trecerii la oale și farfurii potrivite pentru mașină e să le bagi înăuntru, ceea ce contrazice ținerea oalelor afară" },
    { type: "requires", from: "N1", to: "N8", why: "Dacă greșești cu 1 cm, nu mai intră în corp, așa că trebuie să măsori tot înainte să comanzi" },
    { type: "requires", from: "N4", to: "N10", why: "O mașină mare pornită pe jumătate goală consumă tot apa și curentul unei încărcări complete, deci ții de regula nu pe jumătate" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Demontarea corpului și manopera", v: "Un corp de depozitare în minus", t: "Aștepți un instalator să măsoare și să monteze", l: "Aștepți jumătate de încărcătură înainte s-o pornești", x: "Renunți la mini de blat" },
      fatal: "N10", thesis: "Măsori corpul, încorporezi o mașină mare și o pornești doar când e cel puțin pe jumătate plină", title: "Mașină mare încorporată, o dată pentru totdeauna",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Oale și farfurii noi, plus apă și curent la fiecare masă", v: "Ocupă trecerea în perioada de probă", t: "Corpul iese abia după 30 de zile", l: "Vasele se usucă la aer după programele rapide", x: "Renunți la mini de blat" },
      fatal: "N12", thesis: "Spălare rapidă după fiecare masă; o ții lângă chiuvetă până merge bine, apoi o încorporezi", title: "Rapid zilnic, probă înainte de încorporare",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Umpli apa de mână la fiecare spălare", v: "Ocupă o bună bucată din blatul de lucru", t: "Oalele de mână în fiecare zi", l: "Cel mult 8 seturi", x: "Renunți la încorporare și la capacitate mare" },
      fatal: "N11", thesis: "O mini de blat pe care o umpli singur; oalele rămân de spălat de mână", title: "Mini de blat, fără instalație",
    },
  },
  recommend: { key: "alpha", why: "Pentru o gospodărie de 3 persoane sau mai mult, o mașină mare duce vasele unei zile întregi într-o singură spălare" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Vasele întregii familii depind de această singură mașină; dacă se strică, singura rezervă e spălatul de mână", kill: "Renunți dacă o reparație durează peste 7 zile și familia se întoarce la spălatul de mână", label: "O singură mașină" },
};
