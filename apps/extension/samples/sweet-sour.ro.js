// 擴充功能內建生活題示範星系（羅馬尼亞文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "De unde vine dulcele", D2: "Cum îți gestionezi pofta", D3: "Cât de mult schimbi", D4: "Ce ai în casă" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Viziunea opusă duce ${dims[dim]} la cealaltă extremă`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_RO = {
  schema_version: "1.0",
  core: {
    decision: "Înlocuiești toate dulciurile cu fructe întregi, sau mănânci în continuare ce-ți place, doar mai puțin?",
    metric: "Timp de 30 de zile, cel mult 3 gustări și băuturi dulci pe săptămână în total (notate în telefon ca să verifici)",
  },
  quadrants: {
    Q1: { scar: "A mâncat o pungă întreagă de fructe uscate crezând că e o gustare sănătoasă", sacred: "Dulcele vine doar din fructe întregi" },
    Q2: { scar: "S-a lăsat de zahăr de trei ori și a cedat de fiecare dată în a doua săptămână", sacred: "Contează doar dacă chiar poți să te ții" },
    Q3: { scar: "A copiat o dietă săracă în carbohidrați și s-a săturat de ea în trei zile", sacred: "Schimbi metoda, nu gustul" },
    Q4: { scar: "A văzut prea mulți lăsându-se de zahăr și revenind imediat", sacred: "Îți pui reguli în loc să te bazezi pe voință" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Fructe întregi", "Când ai poftă de ceva dulce, mănâncă doar fructe proaspete întregi, ca kiwi, ananas, fructe de pădure sau portocale; sucurile, fructele uscate și cele confiate nu se pun", "Eșuează dacă, în 14 zile, cumperi desert ca să-ți potolești pofta în mai mult de 3 zile", null),
    N2: node("D2", 0, 1, "Apă minerală", "Când te lovește pofta, bea întâi un pahar de apă minerală neîndulcită cu lămâie sau fructul pasiunii; dacă după 15 minute tot vrei ceva dulce, păstrează-l pentru după următoarea masă. Se schimbă doar băuturile: mesele rămân la fel și nu cumperi gustări de înlocuire", "Eșuează dacă, în 14 zile, după cele 15 minute de așteptare tot vrei ceva dulce în mai mult de jumătate din cazuri", "O băutură nu potolește nevoia de a mesteca ceva"),
    N3: node("D1", 1, 0, "Doar după masă", "Mănânci gustări dulci-acrișoare și fructe doar în prima oră după masă; nimic pe stomacul gol și nimic în ultimele 3 ore înainte de culcare", "Eșuează dacă, după 14 zile așa, tot cauți gustări înainte de culcare în mai mult de 3 seri", null),
    N4: node("D4", 0, 2, "Fără dulciuri", "Faci cumpărături o dată pe săptămână: fructe de sezon la ladă și iaurt simplu neîndulcit cât pentru o săptămână; sunt singurele gustări din casă, iar gustările dulci nu intră niciodată", "Eșuează dacă, în 14 zile, mai e o săptămână în care cumperi dulciuri de afară de mai mult de 3 ori", null),
    N5: node("D3", 2, 0, "Jumătate porție", "Mănânci în continuare gustările dulci-acrișoare care-ți plac, doar mai puțin: treci la porții individuale și înjumătățești cantitatea zilnică, fără înlocuitori", "Eșuează dacă, din săptămâna a 2-a, mănânci peste jumătate din cantitatea de dinainte în mai mult de 2 zile pe săptămână", "Deseori deschizi al doilea pachet imediat după primul"),
    N6: node("D3", 1, 2, "Testezi băuturi", "Pentru fiecare aromă nouă de băutură neîndulcită, cumperi cel mai mic ambalaj și o bei 3 zile la rând; iei bax întreg doar dacă îți place, nu faci stoc dintr-odată", "Eșuează dacă o aromă luată la bax după test e tot mai mult de jumătate plină după 14 zile", null),
    N7: node("D3", 2, 1, "Schimbi sosul", "Ca atunci când schimbi husa, nu telefonul: păstrezi ingredientele principale ale porcului sau peștelui dulce-acrișor, dar faci sosul singur din roșii, ananas și oțet, cu jumătate din zahărul obișnuit", "Eșuează dacă, după ce faci sosul nou de 2 ori în 14 zile, toată lumea din casă zice că nu e bun", "La restaurant sau la livrare nu poți schimba sosul",
      { lateral: { src: "Tech: schimbi husa telefonului", dist: 2, drop: "Scoți complet felul din meniu" } }),
    N8: node("D2", 1, 0, "Max. 3 porții", "Ca limita de bagaj la avion: cel mult 3 porții pe zi de fructe și gustări dulci-acrișoare la un loc, fiecare cam cât pumnul tău; ce e în plus așteaptă până mâine, în loc să te bazezi pe voința de moment", "Eșuează dacă depășești 3 porții în mai mult de 2 zile într-o săptămână", null,
      { lateral: { src: "Aviație: limita de greutate la bagaj", dist: 3, drop: "Mănânci oricând, fără limită" } }),
    N9: node("D4", 2, 0, "Stoc de apă", "Te aprovizionezi ca un magazin de cartier înainte să rămână fără marfă: ții mereu în frigider un bax de apă minerală neîndulcită și o plasă de lămâi, și iei bax nou când rămân 3 sticle, ca o poftă să nu te trimită niciodată după un suc acidulat sau un ice tea", "Eșuează dacă, în 14 zile, tot cumperi mai mult de 3 băuturi dulci la pachet", null,
      { lateral: { src: "Retail: refaci stocul înainte să se termine", dist: 4, drop: "Cumperi de băut doar când ai chef" } }),
    N10: node("D2", 2, 0, "Plafon de cost", "Dacă gustările de înlocuire, ca fructele și iaurtul neîndulcit, costă de peste două ori cât dădeai înainte pe gustări în fiecare săptămână, renunți într-o lună și te întorci la gustări", "Oprește-te dacă, în 14 zile, înlocuitorii costă de peste două ori vechiul tău buget de gustări", "Prețul fructelor variază mult de la un sezon la altul",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Înlocuitorii costă prea mult ca să-i poți ține" } }),
    N11: node("D4", 1, 0, "Fără oferte", "Dacă iei mâncare și băuturi la bax ca să prinzi livrarea gratuită sau o reducere de cantitate, cu cât ai mai multe în casă, cu atât mănânci mai mult în fiecare zi", "Oprește-te dacă, în 14 zile, cumperi mâncare sau băuturi la bax sau ca să atingi pragul de livrare gratuită de mai mult de o dată", "Nu poți controla dulciurile primite cadou de la prieteni și rude",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Reducerile te fac să cumperi tot mai mult" } }),
    N12: node("D3", 0, 1, "Fără gadgeturi", "Dacă aștepți să-ți cumperi un aparat de sifon, îndulcitori și tot felul de înlocuitori înainte să începi, banii dați te vor împinge să înghiți lucruri care nu-ți plac și vei renunța în 2 săptămâni", "Oprește-te dacă, în 14 zile, cumperi mai mult de 1 gadget sau înlocuitor pe care nu-l folosești de fapt", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Le înghiți cu forța ca să nu se strice" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Să nu ai gustări dulci în casă și să mănânci în continuare gustările dulci obișnuite nu merg împreună" },
    { type: "excludes", from: "N1", to: "N5", why: "Dacă dulcele vine doar din fructe întregi, nu poți păstra gustările dulci care-ți plac" },
    { type: "excludes", from: "N4", to: "N11", why: "Fructele din casă depind de cumpărarea unei lăzi pe săptămână; interzici cumpăratul la bax și planul de aprovizionare se prăbușește" },
    { type: "excludes", from: "N2", to: "N7", why: "Drumul ăsta schimbă doar băuturile și lasă mesele în pace, ceea ce contrazice refacerea sosului dulce-acrișor" },
    { type: "excludes", from: "N2", to: "N10", why: "Drumul ăsta schimbă doar băuturile și nu cumpără gustări de înlocuire, deci un plafon de cost pentru înlocuitori nu are rost; alegi unul" },
    { type: "excludes", from: "N9", to: "N11", why: "Să ai stoc de apă minerală înseamnă s-o cumperi la bax, ceea ce se bate direct cap în cap cu a nu cumpăra en-gros" },
    { type: "requires", from: "N1", to: "N8", why: "Și fructele au zahăr; chiar dacă sunt singurul tău dulce, ai nevoie de o limită zilnică, altfel prea multe tot se simt" },
    { type: "requires", from: "N4", to: "N10", why: "Fructe și iaurt luate la ladă în fiecare săptămână se adună, deci ai nevoie de un plafon de cost, altfel cedează întâi portofelul" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "O singură tură fixă de cumpărături pe săptămână", v: "Renunți la gustările care-ți plac", t: "Primele două săptămâni de poftă sunt grele", l: "Cel mult trei porții de fructe pe zi", x: "Fără deserturi luate din impuls" },
      fatal: "N10", thesis: "Dulcele îl iei doar din fructe întregi, în cantități limitate, iar gustările dulci rămân în afara casei", title: "Treci pe fructe · fără dulciuri în casă",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Ții stoc de apă minerală în frigider", v: "Aștepți 15 minute înainte să cedezi poftei", t: "Schimbi doar puțin în fiecare săptămână", l: "Zahărul din mese rămâne la fel", x: "Gata cu gustările vechi ca de obicei" },
      fatal: "N12", thesis: "Când vine pofta, iei apă minerală neîndulcită și încerci arome noi în cantități mici înainte să cumperi mai mult", title: "Întâi băuturile · reduci treptat",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Numeri porțiile de fiecare dată", v: "Dulciurile din casă încă te tentează", t: "Rezultatele se văd greu", l: "Reducerea depinde doar de autocontrol", x: "Renunți la trecerea completă pe fructe" },
      fatal: "N11", thesis: "Mănânci în continuare ce-ți place, dar în ambalaje mici, cu porții limitate și sos dulce-acrișor refăcut", title: "Păstrezi preferatele · limitezi și schimbi sosul",
    },
  },
  recommend: { key: "alpha", why: "Fructele sunt natural dulci și acrișoare, iar ținerea gustărilor dulci în afara casei cere cea mai puțină voință" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Toate poftele tale de dulce-acrișor depind de un singur fruct sau o singură băutură", kill: "Dacă acel lucru se termină sau te saturi de el, tot planul se prăbușește", label: "Un singur substitut" },
};
