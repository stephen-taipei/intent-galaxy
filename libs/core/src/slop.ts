// R4 黑名單（只檢查 claim、只發警告）：繁中、簡中字形與英文。其他語系靠提示詞的 R4 規則，不做 regex（沒有母語者驗證，誤判風險高）。
export const SLOP_BLOCK: RegExp[] = [
  /提升|加[強强]|完善|打造|[賦赋]能|全面(?!屏)|推[動动]|深化|落[實实]|兼[顧顾]/u,
  /[優优]化(?!器)/u, /(?<!持續|持续)整合(?!測試|测试)/u, /有效(?!期|載荷|负载|負載|载荷)/u,
  /相[關关](?!係數|系数|性分析)/u, /[確确]保/u, /[強强]化(?![學学][習习])/u, /(?<![負负][載载])平衡(?!器)/u,
  /增[強强]|改善|改[進进]|提高|促[進进]|助力|擁抱|拥抱|把握|做好|做大|做[強强](?!化)/u,
  /[構构]建|建[構构](?!子)/u, /可能面[臨临]|需要注意|有一定[風风][險险]|需要[權权][衡]|建[議议]評估|建议评估|[視视]情[況况]而定|或[許许]/u,
  /[潛潜]在(?!客[戶户])/u, /挑[戰战](?![-–者])/u,
  /取[決决]於|取决于|也[許许]|大概|[適适][當当]|[適适]度|合理(?!化)|一定程度|某[種种]程度|[盡尽]量|儘量|酌情|必要[時时]|不排除/u,
  /更(?!新|換|换|改|正|迭|替)/u,
  /\b(?:improv(?:e[ds]?|ing|ements?)|enhanc\w*|optimi[sz](?!er)\w*|ensur(?:e[ds]?|ing)|leverag\w*|empower\w*|streamlin\w*|robust\w*|holistic\w*|seamless\w*|synerg\w*|might|perhaps|arguably|potential(?:ly)?(?! (?:customers?|clients?|buyers?))|depends on|it depends)\b/iu,
];
export function hasSlop(text: string): boolean { return SLOP_BLOCK.some((re) => re.test(text)); }
