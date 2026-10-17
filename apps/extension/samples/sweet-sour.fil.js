// 擴充功能內建生活題示範星系（菲律賓文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Pinagmumulan ng tamis", D2: "Labasan ng cravings", D3: "Gaano kalaking pagbabago", D4: "Laman ng bahay" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Dinadala ng kabilang pananaw ang ${dims[dim]} sa kabilang dulo`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_FIL = {
  schema_version: "1.0",
  core: {
    decision: "Papalitan mo ba ng buong prutas ang lahat ng matamis, o kakainin mo pa rin ang gusto mo pero mas kaunti?",
    metric: "Sa loob ng 30 araw, hindi hihigit sa 3 matatamis na meryenda at inumin kada linggo kung pagsasamahin (itala sa phone para ma-check)",
  },
  quadrants: {
    Q1: { scar: "Inubos ang isang supot ng dried mango sa akalang healthy snack", sacred: "Sa buong prutas lang manggagaling ang tamis" },
    Q2: { scar: "Tatlong beses nag-quit sa asukal, laging bumigay sa ikalawang linggo", sacred: "Bilang lang kung kaya talagang panindigan" },
    Q3: { scar: "Ginaya ang low-carb na meal plan at nagsawa sa tatlong araw", sacred: "Palitan ang paraan, hindi ang lasa" },
    Q4: { scar: "Napakaraming nakitang nag-quit sa asukal at bumalik din", sacred: "Mas matibay ang patakaran kaysa willpower" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Buong prutas", "Tuwing gusto mo ng matamis, buong sariwang prutas lang ang kainin, gaya ng kiwi, pinya, berries o dalandan; hindi kasama ang juice, dried fruit at minatamis na prutas", "Bigo kung, sa loob ng 14 araw, bumili ka ng dessert para sa cravings nang higit 3 araw", null),
    N2: node("D2", 0, 1, "Sparkling water", "Kapag tumama ang cravings, uminom muna ng isang basong walang-asukal na sparkling water na may calamansi o passion fruit; kung gusto mo pa rin ng matamis pagkalipas ng 15 minuto, itabi ito para pagkatapos ng susunod na kain. Inumin lang ang nagbabago: pareho pa rin ang ulam at walang bibilhing pamalit na meryenda", "Bigo kung, sa loob ng 14 araw, gusto mo pa rin ng matamis pagkatapos ng 15 minutong paghihintay nang higit kalahati ng beses", "Hindi masasagot ng inumin ang gustong ngumuya"),
    N3: node("D1", 1, 0, "Pagkakain lang", "Kumain lang ng matamis-maasim na meryenda at prutas sa loob ng 1 oras pagkatapos kumain; wala kapag walang laman ang tiyan at wala sa 3 oras bago matulog", "Bigo kung, pagkatapos ng 14 araw nito, naghahanap ka pa rin ng meryenda bago matulog nang higit 3 gabi", null),
    N4: node("D4", 0, 2, "Bawal sa bahay", "Mamalengke minsan kada linggo: isang kahon ng prutas na napapanahon at sapat na plain na walang-asukal na yogurt para sa isang linggo; iyon lang ang meryenda sa bahay, at hindi kailanman iuuwi ang matatamis na meryenda", "Bigo kung, sa loob ng 14 araw, may linggo pa ring bumili ka ng matamis sa labas nang higit 3 beses", null),
    N5: node("D3", 2, 0, "Hatiin paborito", "Kainin pa rin ang paborito mong matamis-maasim na meryenda, mas kaunti lang: lumipat sa single-serve na pakete at hatiin sa kalahati ang dami kada araw, walang pamalit", "Bigo kung, mula ika-2 linggo, kumain ka ng higit kalahati ng dati mong dami nang higit 2 araw kada linggo", "Madalas binubuksan agad ang ikalawang pakete pagkaubos ng una"),
    N6: node("D3", 1, 2, "Subukan inumin", "Sa bawat bagong lasa ng walang-asukal na inumin, bilhin ang pinakamaliit na pakete at inumin ito 3 araw na sunod-sunod; bumili lang ng isang case kung nagustuhan mo, huwag mag-stock nang sabay-sabay", "Bigo kung ang lasang binili mo nang isang case pagkatapos subukan ay higit kalahati pa ang laman pagkalipas ng 14 araw", null),
    N7: node("D3", 2, 1, "Palitan sarsa", "Parang pagpapalit ng phone case sa halip na ng phone: panatilihin ang pangunahing sangkap ng sweet and sour na baboy o isda, pero ikaw ang gumawa ng sarsa mula sa kamatis, pinya at suka, na kalahati lang ng karaniwang asukal", "Bigo kung, pagkatapos gawin ang bagong sarsa nang 2 beses sa loob ng 14 araw, sabi ng lahat sa bahay ay hindi masarap", "Hindi mo mababago ang sarsa sa karinderya o takeout",
      { lateral: { src: "Tech: palitan ang phone case", dist: 2, drop: "Tanggalin nang tuluyan ang ulam sa menu" } }),
    N8: node("D2", 1, 0, "Max 3 serving", "Gaya ng baggage limit ng airline: hanggang 3 serving lang ng prutas at matamis-maasim na meryenda kada araw, bawat isa ay kasinlaki ng kamao; ang sobra ay bukas na, sa halip na umasa sa willpower sa sandaling iyon", "Bigo kung higit 3 serving ang kinain mo nang higit 2 araw sa isang linggo", null,
      { lateral: { src: "Airline: limit sa bigat ng bagahe", dist: 3, drop: "Kumain kahit kailan nang walang limit" } }),
    N9: node("D4", 2, 0, "Stock sparkling", "Mag-restock gaya ng convenience store bago maubusan: laging may isang case ng walang-asukal na sparkling water at isang supot ng calamansi sa ref, at bumili ng bagong case kapag 3 lata na lang, para hindi ka mapalabas ng cravings para bumili ng milk tea o softdrinks", "Bigo kung, sa loob ng 14 araw, bumili ka pa rin ng higit 3 matamis na inumin sa labas", null,
      { lateral: { src: "Retail: mag-restock bago maubos", dist: 4, drop: "Bumili lang ng inumin kapag gusto mo" } }),
    N10: node("D2", 2, 0, "Limit pamalit", "Kung ang pamalit na meryenda gaya ng prutas at walang-asukal na yogurt ay higit doble ng dating gastos mo sa meryenda kada linggo, susuko ka sa loob ng isang buwan at babalik sa pagbili ng meryenda", "Itigil kung, sa loob ng 14 araw, higit doble ng dating budget sa meryenda ang gastos sa pamalit", "Malaki ang galaw ng presyo ng prutas ayon sa panahon",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Sobrang mahal ng pamalit para panindigan" } }),
    N11: node("D4", 1, 0, "Iwas bultuhan", "Kung bumibili ka ng pagkain at inumin nang bultuhan para sa free shipping o bulk discount, mas marami ang nasa bahay, mas marami ang nakakain mo araw-araw", "Itigil kung, sa loob ng 14 araw, bumili ka ng pagkain o inumin nang bultuhan o para umabot sa free shipping nang higit isang beses", "Hindi mo makokontrol ang pasalubong na matamis mula sa kaibigan at kamag-anak",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Pinabibili ka ng discount nang pabili nang pabili" } }),
    N12: node("D3", 0, 1, "Walang gamit", "Kung maghihintay ka hanggang makabili ng soda maker, sweetener at lahat ng uri ng pamalit bago magsimula, ang perang nagastos ang magtutulak sa iyong lunukin ang ayaw mo, at susuko ka sa loob ng 2 linggo", "Itigil kung, sa loob ng 14 araw, bumili ka ng higit 1 gamit o pamalit na hindi mo naman talaga ginagamit", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Pinipilit mong ubusin para hindi masayang" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Hindi puwedeng sabay na walang matamis na meryenda sa bahay at kumakain pa rin ng karaniwan mong matamis na meryenda" },
    { type: "excludes", from: "N1", to: "N5", why: "Kung sa buong prutas lang ang tamis, hindi mo mapapanatili ang paborito mong matamis na meryenda" },
    { type: "excludes", from: "N4", to: "N11", why: "Nakasalalay ang prutas sa bahay sa pagbili ng isang kahon kada linggo; ipagbawal ang bultuhan at guguho ang planong iyon" },
    { type: "excludes", from: "N2", to: "N7", why: "Inumin lang ang binabago ng landas na ito at hindi ginagalaw ang ulam, salungat sa pagbago ng sweet and sour na sarsa" },
    { type: "excludes", from: "N2", to: "N10", why: "Inumin lang ang binabago ng landas na ito at walang binibiling pamalit na meryenda; ang limit sa gastos ng pamalit ay para sa ibang landas, kaya pumili ng isa" },
    { type: "excludes", from: "N9", to: "N11", why: "Ang laging may sparkling water ay nangangahulugang bumibili nang bultuhan, na direktang salungat sa hindi pagbili nang bultuhan" },
    { type: "requires", from: "N1", to: "N8", why: "May asukal din ang prutas; kahit prutas lang ang matamis mo, kailangan ng limit kada araw, kung hindi ay may epekto pa rin ang sobrang kain" },
    { type: "requires", from: "N4", to: "N10", why: "Ang pagbili ng prutas at yogurt nang tig-isang kahon kada linggo ay nadaragdag, kaya kailangan ng limit sa gastos o mauunang bumigay ang bulsa mo" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Isang takdang pamamalengke kada linggo", v: "Isuko ang paborito mong meryenda", t: "Mabigat ang cravings sa unang dalawang linggo", l: "Hanggang tatlong serving ng prutas kada araw", x: "Walang biglaang bili ng dessert" },
      fatal: "N10", thesis: "Sa buong prutas lang kunin ang tamis, sa limitadong dami, at ilayo sa bahay ang matatamis na meryenda", title: "Lipat sa prutas · walang matamis sa bahay",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Laging may sparkling water sa ref", v: "Maghintay ng 15 minuto bago pagbigyan ang cravings", t: "Kaunting pagbabago lang kada linggo", l: "Pareho pa rin ang asukal sa ulam", x: "Hindi na kakainin ang dating meryenda gaya ng dati" },
      fatal: "N12", thesis: "Uminom ng walang-asukal na sparkling water kapag tumama ang cravings, at subukan muna nang paunti-unti ang bagong lasa bago bumili ng marami", title: "Inumin muna · bawas nang dahan-dahan",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Bilangin ang serving tuwing kakain", v: "Tinutukso ka pa rin ng matamis sa bahay", t: "Matagal bago makita ang resulta", l: "Nakasalalay lahat ng pagbabawas sa disiplina", x: "Isuko ang buong paglipat sa prutas" },
      fatal: "N11", thesis: "Kainin pa rin ang gusto mo, pero lumipat sa maliit na pakete, limitahan ang serving at gawing muli ang sweet and sour na sarsa", title: "Paborito pa rin · limit at bagong sarsa",
    },
  },
  recommend: { key: "alpha", why: "Natural na matamis at maasim ang prutas, at ang paglayo ng matatamis na meryenda sa bahay ang pinakakaunting willpower ang kailangan" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Lahat ng matamis-maasim mong cravings ay nakaasa sa iisang prutas o inumin", kill: "Kapag naubos iyon o nagsawa ka, guguho ang buong plano", label: "Iisang pamalit" },
};
