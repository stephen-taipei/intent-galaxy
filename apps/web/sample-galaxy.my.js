// 內建示範星系（IntentAnalysisResponse v1.0，緬甸文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "အလွှာနယ်နိမိတ်", D2: "ကွာခြားချက်ကို ဖော်ပြပုံ", D3: "စိတ်ကြိုက်ပြင်ဆင်မှု အတိုင်းအတာ", D4: "Theme ဖွဲ့စည်းပုံ" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `ဆန့်ကျင်ဘက်အမြင်- ${dims[dim]} ကို အခြားအစွန်းသို့ တွန်းပို့သည်`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_MY = {
  schema_version: "1.0",
  core: {
    decision: "Brand တစ်ခုချင်းစီက ကိုယ်ပိုင် component များကို fork လုပ်သင့်သလား၊ ဒါမှမဟုတ် config ဖြင့် မောင်းနှင်သော မျှဝေ core တစ်ခုတည်းကို သုံးသင့်သလား?",
    metric: "ရက် 60 အတွင်း- theme အသစ်တစ်ခုကို ≤2 ရက်အတွင်း ထုတ်နိုင်ရမည်၊ theme တစ်ခုစီ၏ CSS သည် <50KB ဖြစ်ရမည်",
  },
  quadrants: {
    Q1: { scar: "မျှဝေ component များထဲ brand အလိုက် if တွေ ပြည့်နေခဲ့သည်", sacred: "Core ထဲတွင် branching လုံးဝမရှိရ" },
    Q2: { scar: "Theme 100 ကျော်ကို လက်ဖြင့် တစ်ခုချင်း patch လုပ်ခဲ့ရသည်", sacred: "အမှားကို type က ဖမ်းပေးရမည်" },
    Q3: { scar: "Design system တစ်ခုကို ကူးယူပြီး abstraction လွန်ကဲသွားခဲ့သည်", sacred: "ဖွဲ့စည်းပုံကို လဲလှယ်နိုင်ရမည်" },
    Q4: { scar: "စိတ်ကြိုက်ပြင်ဆင်မှု ထိန်းမရဖြစ်သွားတာ သုံးကြိမ် မြင်ဖူးသည်", sacred: "နယ်နိမိတ်များ မပြိုရ" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3 လွှာခွဲ", "Component များကို သန့်ရှင်းသော core၊ ညှိနှိုင်းပေးသော view နှင့် အဖျားဆုံးအလွှာဖြစ်သော theme ဟူ၍ ခွဲပါ။ Core သည် theme ID သို့မဟုတ် route ကို import မလုပ်ရ", "14 ရက်အတွင်း core ထဲတွင် theme စစ်ဆေးချက် ပေါ်လာပါက မှားသည်", null),
    N2: node("D2", 0, 1, "CSS vars သာ", "Theme တိုင်း၏ ကွာခြားချက်ကို CSS custom properties ဖြင့်သာ ဖော်ပြပါ။ Component သို့မဟုတ် layout ထဲတွင် branching လုံးဝမရှိရ", "တတိယ theme မှာပင် component ပြင်ရပါက မှားသည်", "Layout ကွာခြားချက်ကို အရောင်ဖြင့်သာ မဖော်ပြနိုင်"),
    N3: node("D1", 1, 0, "lazy-load theme", "Runtime တွင် အသုံးပြုနေသော theme ၏ stylesheet တစ်ဖိုင်တည်းကိုသာ load လုပ်ပါ။ Theme အားလုံးကို first paint ထဲ စုမထည့်ပါနှင့်", "14 ရက်အတွင်း theme တစ်ခုခု၏ CSS သည် 50KB ကျော်ပါက မှားသည်", null),
    N4: node("D4", 0, 2, "Typed config", "Theme တစ်ခုစီတွင် ပြည့်စုံသော TypeScript config object ပါရမည်။ Field တစ်ခု ကျန်ပါက build မအောင်ရ", "Theme အသစ်အတွက် မျှဝေ component များကို ပြင်ရဆဲဖြစ်ပါက မှားသည်", null),
    N5: node("D3", 2, 0, "Brand စီ fork", "Theme တစ်ခုစီသည် component folder ကို ကူးယူပြီး သီးခြားပြင်ဆင်သည်။ Brand များ အချင်းချင်း လုံးဝ မထိခိုက်", "10 ခုမြောက် theme နောက်ပိုင်း bug တစ်ခုပြင်ရန် နေရာ 10 ခုကျော် ထိရပါက မှားသည်", "Bug တစ်ခုပြင်ရင် မိတ္တူ N ခုလုံးကို လိုက် patch ရသည်"),
    N6: node("D3", 1, 2, "Canary theme", "Theme အသစ်ကို feature flag နောက်ကွယ်တွင် tenant 5% ထံ တစ်ပတ်ကြာ ထုတ်ပါ။ Error rate ပစ်မှတ်ပြည့်မှသာ 100% ဖွင့်ပါ", "Canary ၏ error rate 1% ကျော်ပါက မှားသည်", null),
    N7: node("D3", 2, 1, "အခွံလဲလှယ်", "[D2 ကားပလက်ဖောင်း] Layout သည် ကားကိုယ်ထည်နှင့်တူသည်- အခွံတစ်ခုလုံးကို လဲနိုင်ပြီး မျှဝေ chassis (view နှင့် core) မှာ နေရာမရွှေ့", "Layout လဲရာတွင် core ကို ပြင်ရပါက မှားသည်", "Layout တစ်ခုနှင့်တစ်ခုကြား interaction များ ကွဲလွဲလာသည်",
      { lateral: { src: "မော်တော်ကား- ပလက်ဖောင်း chassis", dist: 2, drop: "ကားမော်ဒယ်တိုင်းကို သုညမှ ပြန်ထုတ်လုပ်ခြင်း" } }),
    N8: node("D2", 1, 0, "Slot ပုံသေ", "[D3 LEGO အုတ်ခဲ] Layout က ပုံသေ slot များကို ကြေညာထားသည်။ Theme များသည် slot ထဲသို့ component ထိုးထည့်ရုံသာ လုပ်နိုင်ပြီး slot ပြင်ပ ဖွဲ့စည်းပုံကို မပြင်ရ", "Slot ပြင်ပ DOM ကို တစ်ကြိမ်တည်း ပြင်ခဲ့ပါကပင် မှားသည်", null,
      { lateral: { src: "ကစားစရာ- LEGO အုတ်ခဲ interface", dist: 3, drop: "DOM ကို စိတ်ကြိုက် လွတ်လပ်စွာ ပြင်ခြင်း" } }),
    N9: node("D4", 2, 0, "Diff သာ အမွေခံ", "[D4 ဖောင့်မိသားစု] Theme များသည် default နှင့် ကွာခြားချက်ကိုသာ ကြေညာသည်။ ကျန် field အားလုံးကို အလိုအလျောက် အမွေဆက်ခံသည်", "အမွေဆက်ခံမှု အဆင့် 3 ထက် နက်သွားပါက မှားသည်", null,
      { lateral: { src: "စာလုံးဒီဇိုင်း- ဖောင့်အထူအပါး မိသားစု", dist: 4, drop: "Theme တစ်ခုစီအတွက် အပြည့်ကူးယူခြင်း" } }),
    N10: node("D2", 2, 0, "Config ကန့်သတ်", "စိတ်ကြိုက်ပြင်ဆင်မှု တောင်းဆိုချက်တိုင်းက config field တစ်ခုစီ ထပ်တိုးနေပါက config ထိန်းသိမ်းစရိတ်သည် fork လုပ်တာထက် မလွဲမသွေ ပိုကုန်လာမည်", "Config interface တစ်ခုခုတွင် field 40 ကျော်သည်နှင့် field ထပ်မတိုးတော့ပါနှင့်", "Config ငရဲ",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Abstraction သည် ထပ်ကူးတာထက် ပိုကုန်ကျသည်" } }),
    N11: node("D4", 1, 0, "ဖြတ်လမ်း ပိတ်", "လုပ်ငန်းဘက်က မျှဝေ component ထဲသို့ brand စစ်ဆေးချက် တိုက်ရိုက်ထည့်ခိုင်းနိုင်ပါက နယ်နိမိတ်သည် တစ်လေးပုံတစ်ပုံ နှစ်အတွင်း ပြိုလိမ့်မည်", "14 ရက်အတွင်း မျှဝေ component ထဲ brand စစ်ဆေးချက် ထည့်ခဲ့ပါက ပျက်ပြယ်သည်", "နယ်နိမိတ်ကို deadline နှင့် လဲလှယ်ခြင်း",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Deadline ဖိအားက နယ်နိမိတ်ချိုးသူကို ဆုချသည်" } }),
    N12: node("D3", 0, 1, "အကုန်ပြန်မရေး", "Module 70 လုံးကို ပြောင်းပြီးမှသာ တစ်ခုခု ထုတ်နိုင်မည်ဆိုပါက sunk cost ကြောင့် refactor သည် လမ်းတစ်ဝက်တွင် ရပ်တန့်သွားမည်", "14 ရက်အတွင်း ပထမ module ကို မထုတ်နိုင်သေးပါက ရပ်ပါ", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Big-bang refactor က deadline ကို ဓားစာခံဖမ်းထားသည်" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "မျှဝေ typed config နှင့် brand အလိုက် component fork သည် တစ်ခုခုကိုသာ ရွေးရမည်" },
    { type: "excludes", from: "N1", to: "N5", why: "မျှဝေ core သုံးလွှာနှင့် brand အလိုက် component မိတ္တူများသည် အတူတကွ မဖြစ်နိုင်" },
    { type: "excludes", from: "N4", to: "N11", why: "Typed config က compile time မှာတင် ဖြတ်လမ်းကို ပိတ်ပြီးဖြစ်၍ လက်ဖြင့် နယ်နိမိတ်စစ်ဆေးခြင်းသည် ထပ်နေသော ဂိတ်ဖြစ်သွားသည်" },
    { type: "excludes", from: "N2", to: "N7", why: "Theme များက CSS variables ကိုသာ ပြောင်းပါက layout component တစ်ခုလုံး လဲလှယ်ခြင်း မရှိတော့" },
    { type: "excludes", from: "N2", to: "N10", why: "CSS variables သက်သက်တွင် ဖောင်းပွစရာ config field မရှိ၍ တစ်ခုကိုသာ ရွေးပါ" },
    { type: "excludes", from: "N9", to: "N11", why: "အမွေဆက်ခံမှုကွင်းဆက်က နေရာအလိုက် override ခွင့်ပြုသဖြင့် ဖြတ်လမ်းလုံးဝမရှိရသော ကာကွယ်ရေးစည်းနှင့် ဆန့်ကျင်သည်" },
    { type: "requires", from: "N1", to: "N8", why: "သုံးလွှာခွဲပြီးသည်နှင့် theme များသည် ပုံသေ slot များမှတစ်ဆင့်သာ ပြင်ဆင်ရမည်၊ မဟုတ်ပါက view အလွှာ ပေါက်သွားမည်" },
    { type: "requires", from: "N4", to: "N10", why: "Typed config တွင် field အရေအတွက် ကန့်သတ်ချက် လိုသည်၊ မဟုတ်ပါက config ငရဲအဖြစ် ဖောင်းပွသွားမည်" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "အစောပိုင်း refactor အားစိုက်ရမည်", v: "အမြန် fork လုပ်၍မရ", t: "အရိုးစုတည်ဆောက်ရန် ရက် 60", l: "Integrity test များ ရေးရမည်", x: "Brand သီးသန့် ဖြတ်လမ်း မရှိ" },
      fatal: "N10", thesis: "သုံးလွှာနယ်နိမိတ်နှင့် typed config က theme တစ်ခုစီကို အဖျားအလွှာ တစ်ခုတည်းအဖြစ် ကျုံ့စေသည်", title: "Config ဖြင့်မောင်း · 3 လွှာ",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Layout ကွာခြားမှု အကန့်အသတ်ရှိ", v: "ဒီဇိုင်းလွတ်လပ်ခွင့် နည်းသွားမည်", t: "အပတ်စဉ် ခြေလှမ်းငယ်များ", l: "ရှုပ်ထွေးသော layout များကို လက်လွှတ်ရမည်", x: "ဖွဲ့စည်းပုံကို စိတ်ကြိုက်ပြင်၍မရ" },
      fatal: "N12", thesis: "CSS variables နှင့် အမွေဆက်ခံမှုကိုသာ သုံးပြီး canary ဖြင့် theme များကို တဖြည်းဖြည်း ထုတ်ပါ", title: "Style သက်သက် · တဖြည်းဖြည်း",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Code ထပ်နေမည်", v: "Bug ပြင်ရင် နေရာများစွာ ထိရမည်", t: "အမြန်ဆုံး ထုတ်နိုင်သည်", l: "ထိန်းသိမ်းစရိတ် တိုက်ရိုက်အချိုးကျ တက်မည်", x: "Typed config ကို လက်လွှတ်ရမည်" },
      fatal: "N11", thesis: "Layout တစ်ခုလုံးကို လဲလှယ်ပြီး brand တစ်ခုစီကို ကိုယ်ပိုင်အခွံ fork လုပ်ခွင့်ပေးပါ", title: "Brand fork · မျှဝေ chassis",
    },
  },
  recommend: { key: "alpha", why: "Theme 100 ကျော်ရှိလာပါက config ဖြင့်မောင်းသော ဒီဇိုင်းကသာ ထိန်းသိမ်းစရိတ်ကို ထိန်းနိုင်သည်" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Theme အားလုံးသည် တူညီသော default theme တစ်ခုတည်းမှ အမွေဆက်ခံသည်", kill: "Default ပျက်သည်နှင့် theme တိုင်း၏ layout ပျက်မည်", label: "Default SPOF" },
};
