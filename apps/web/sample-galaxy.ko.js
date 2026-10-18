// 內建示範星系（IntentAnalysisResponse v1.0，韓文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "레이어 경계", D2: "차이 표현 방식", D3: "커스터마이징 범위", D4: "테마 구성" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `반대 입장: ${dims[dim]}을(를) 정반대 극단으로 민다`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_KO = {
  schema_version: "1.0",
  core: {
    decision: "브랜드마다 컴포넌트를 fork할 것인가, 아니면 설정으로 구동되는 공용 core 하나로 갈 것인가?",
    metric: "60일 안에 새 테마 출시 ≤2일, 테마별 CSS <50KB",
  },
  quadrants: {
    Q1: { scar: "공용 컴포넌트가 브랜드 if로 가득", sacred: "core는 분기 0" },
    Q2: { scar: "100+ 테마를 하나하나 수작업으로 맞춤", sacred: "타입으로 실수 차단" },
    Q3: { scar: "디자인 시스템을 베꼈다가 과도하게 추상화", sacred: "교체 가능한 구조" },
    Q4: { scar: "커스터마이징이 통제 불능이 되는 걸 세 번 봄", sacred: "경계는 무너지지 않는다" },
  },
  nodes: {
    N1: node("D1", 0, 2, "3계층 분리", "컴포넌트를 순수 core, 조율 담당 view, 테마 leaf의 3계층으로 나누고, core에서는 테마 ID와 라우트 import를 금지한다", "14일 안에 core에 테마 분기가 생기면 틀림", null),
    N2: node("D2", 0, 1, "CSS 변수로만 차이", "모든 테마 차이를 CSS custom properties만으로 표현하고, 컴포넌트와 레이아웃에는 분기를 전혀 두지 않는다", "3번째 테마에서 벌써 컴포넌트를 고쳐야 하면 틀림", "레이아웃 차이는 색만으로 표현할 수 없음"),
    N3: node("D1", 1, 0, "테마 CSS 지연 로드", "런타임에는 현재 테마의 stylesheet 하나만 불러오고, 모든 테마를 첫 화면 번들에 넣지 않는다", "14일 안에 테마 하나의 CSS가 50KB를 넘으면 틀림", null),
    N4: node("D4", 0, 2, "타입 있는 테마 설정", "테마마다 완전한 TypeScript 설정 객체를 제공하고, 필드가 하나라도 빠지면 빌드가 실패한다", "새 테마인데도 공용 컴포넌트를 고쳐야 하면 틀림", null),
    N5: node("D3", 2, 0, "브랜드별 fork", "테마마다 컴포넌트 디렉터리를 복사해 따로 수정하고, 브랜드끼리 서로 영향을 주지 않게 한다", "10번째 테마 이후 버그 하나에 10곳 넘게 고치면 틀림", "버그 하나에 N벌을 고쳐야 함"),
    N6: node("D3", 1, 2, "플래그로 점진 배포", "새 테마는 먼저 feature flag로 테넌트 5%에 1주일 공개하고, 오류율이 목표 안이면 전체 배포한다", "점진 배포 중 오류율이 1%를 넘으면 틀림", null),
    N7: node("D3", 2, 1, "외피째 교체", "[D2 자동차 플랫폼화] 레이아웃은 차체처럼 통째로 교체하고, 공용 섀시인 view와 core는 그대로 둔다", "레이아웃 교체에 core 수정이 필요하면 틀림", "레이아웃마다 인터랙션이 달라짐",
      { lateral: { src: "자동차: 공용 플랫폼 섀시", dist: 2, drop: "차종마다 금형부터 새로 제작" } }),
    N8: node("D2", 1, 0, "고정 슬롯에 꽂기", "[D3 레고 블록] 레이아웃이 고정 슬롯을 선언하고, 테마는 슬롯에 컴포넌트를 꽂기만 할 뿐 슬롯 밖 구조는 바꿀 수 없다", "슬롯 밖 DOM이 한 번이라도 바뀌면 틀림", null,
      { lateral: { src: "장난감: 레고 블록 규격", dist: 3, drop: "자유로운 DOM 커스터마이징" } }),
    N9: node("D4", 2, 0, "차이만 상속", "[D4 폰트 패밀리] 테마는 default와의 차이만 선언하고, 나머지 필드는 자동으로 상속한다", "상속이 3단계를 넘으면 틀림", null,
      { lateral: { src: "서체 디자인: 웨이트 패밀리", dist: 4, drop: "테마마다 통째로 복사" } }),
    N10: node("D2", 2, 0, "설정 필드 팽창 금지", "커스터마이징 요청마다 설정 필드를 하나씩 추가하면, 설정 유지보수 비용이 그냥 fork하는 것보다 반드시 커진다", "설정 인터페이스 하나가 40개 필드를 넘으면 필드 추가 중단", "설정 지옥",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "공통화 비용이 복사 비용보다 큼" } }),
    N11: node("D4", 1, 0, "경계 우회 금지", "사업 부서가 공용 컴포넌트에 브랜드 분기를 직접 요구할 수 있다면, 경계는 한 분기 안에 반드시 무너진다", "14일 안에 공용 컴포넌트에 브랜드 분기가 1건이라도 추가되면 실패", "마감 때문에 경계를 내줌",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "마감에 쫓기면 경계를 깨는 쪽이 이득" } }),
    N12: node("D3", 0, 1, "한 번에 갈아엎기 금지", "70개 모듈을 모두 이전한 뒤에야 출시한다면, 매몰 비용 때문에 리팩터링이 중간에 멈춘다", "14일 안에 첫 모듈이 출시되지 않으면 중단", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "한꺼번에 갈아엎다가 마감이 볼모로 잡힘" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "공용 타입 설정과 브랜드별 컴포넌트 fork는 둘 중 하나만 고를 수 있다" },
    { type: "excludes", from: "N1", to: "N5", why: "3계층 공용 core와 브랜드별 컴포넌트 복사는 양립할 수 없다" },
    { type: "excludes", from: "N4", to: "N11", why: "타입 설정이 이미 빌드 시점에 우회를 막으므로, 사람이 하는 경계 검토는 중복 관문이 된다" },
    { type: "excludes", from: "N2", to: "N7", why: "CSS 변수만 바꾼다면 레이아웃 컴포넌트를 통째로 교체할 일이 없다" },
    { type: "excludes", from: "N2", to: "N10", why: "순수 CSS 변수에는 팽창할 설정 필드가 없으니 둘 중 하나를 고른다" },
    { type: "excludes", from: "N9", to: "N11", why: "상속 체인은 부분 덮어쓰기를 허용하므로 우회 0 가드레일과 충돌한다" },
    { type: "requires", from: "N1", to: "N8", why: "3계층으로 나누면 테마는 고정 슬롯으로만 커스터마이징해야 한다. 그렇지 않으면 view 계층이 뚫린다" },
    { type: "requires", from: "N4", to: "N10", why: "타입 설정에는 필드 상한이 필요하다. 없으면 설정 지옥으로 불어난다" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "초기 리팩터링 공수", v: "빠른 fork 포기", t: "뼈대 구축에 60일", l: "무결성 테스트 작성 필요", x: "브랜드 예외 지름길 없음" },
      fatal: "N10", thesis: "3계층 경계와 타입 설정으로 테마를 잎 하나로 줄인다", title: "설정 구동 · 3계층 경계",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "레이아웃 차이 제한", v: "디자인 자유도 낮음", t: "매주 조금씩", l: "복잡한 레이아웃 불가", x: "구조 커스터마이징 없음" },
      fatal: "N12", thesis: "CSS 변수와 상속만으로, 점진 배포하며 테마를 늘린다", title: "순수 스타일 · 점진 상속",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "중복 코드", v: "버그 수정이 여러 곳", t: "가장 빠른 출시", l: "유지보수 비용이 선형 증가", x: "타입 설정 포기" },
      fatal: "N11", thesis: "레이아웃을 통째로 교체하고 브랜드마다 외피를 fork한다", title: "브랜드 분기 · 섀시 공용",
    },
  },
  recommend: { key: "alpha", why: "테마가 100개를 넘으면 유지보수 비용을 붙잡을 수 있는 건 설정 구동뿐이다" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "모든 테마가 같은 default 테마를 상속한다", kill: "default가 망가지면 모든 테마의 레이아웃이 깨진다", label: "default 하나에 의존" },
};
