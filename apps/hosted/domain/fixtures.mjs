export function demoAnalysis(goal, taskType = 'message') {
  const zh = /[\u3400-\u9fff]/u.test(goal);
  const names = zh ? ['只處理一件事', '比較三個選項', '列出已知事實', '對齊讀者用語', '保留查核欄位', '先交短版草稿', '使用檢查清單', '套用固定版型', '寫出下一步', '不增加未授權承諾', '不捏造進度', '缺少資料先確認'] :
    ['One clear objective', 'Compare three options', 'List supplied facts', 'Match the reader', 'Keep verification fields', 'Start with a short draft', 'Use a checklist', 'Use a repeatable format', 'Write next actions', 'No unauthorized promises', 'No invented progress', 'Confirm missing facts'];
  const nodes = Object.fromEntries(names.map((label, i) => [`N${i + 1}`, {
    dim: `D${Math.floor(i / 3) + 1}`, cell: i % 3, inverse_cell: (i + 1) % 3,
    inverse_pos: zh ? '改用另一種呈現方式，需要重新確認。' : 'An alternative format requires confirmation.',
    label, claim: label, kill: zh ? '資料與原始輸入不符時，先停下來確認。' : 'Stop when a claim is unsupported by the input.', blind: null,
    scores: { i: 1, v: 1, r: 0 },
    ...(i >= 6 && i < 9 ? { lateral: { src: zh ? '清單：逐項確認' : 'Checklists: verify each requirement', dist: i - 4, drop: zh ? '不逐項確認' : 'Skipping checks' } } : {}),
    ...(i >= 9 ? { falsifier: { attack: ['unit_economics', 'dark_incentive', 'single_point_failure'][i - 9], hits: `A${i - 8}`, wound: zh ? '結果失去可用性' : 'The result is unusable' } } : {}),
  }]));
  const arch = (title, include, exclude, fatal) => ({ title, include, exclude, fatal, thesis: title,
    sacrifice: { nodes: exclude, p: zh ? '需要人工確認' : 'Human review required', v: '', t: '', l: '', x: '' } });
  return { schema_version: '1.0', core: { decision: goal, metric: zh ? '完成一份可由你審核的草稿（示例）' : 'Finish one reviewable draft (demo)' },
    quadrants: Object.fromEntries(['Q1', 'Q2', 'Q3', 'Q4'].map(q => [q, { scar: zh ? '省略資料造成誤解' : 'Missing context causes errors', sacred: zh ? '以已知資料為準' : 'Use supplied evidence' }])),
    nodes, edges: [{ type: 'excludes', from: 'N1', to: 'N2', why: zh ? '單一目標與多方案比較需先選定重點' : 'Choose one objective or an options comparison' }],
    archetypes: {
      alpha: arch(zh ? '先完成清楚短版' : 'A clear concise draft', ['N1', 'N3', 'N4', 'N7', 'N10'], ['N2'], 'N10'),
      beta: arch(zh ? '列選項再選方向' : 'Compare options first', ['N2', 'N3', 'N6', 'N8', 'N11'], ['N1'], 'N11'),
      gamma: arch(zh ? '先驗證再列行動' : 'Verify, then act', ['N1', 'N3', 'N5', 'N9', 'N12'], ['N2'], 'N12'),
    }, recommend: { key: taskType === 'compare' ? 'beta' : 'alpha', why: zh ? '示例選項，請自行選擇' : 'Demo suggestion; you choose' } };
}

export function demoArtifact(contract) {
  const zh = /[\u3400-\u9fff]/u.test(contract.goal);
  const body = zh ? {
    message: `主旨：${contract.goal}\n\n你好，以下是目前確認的資訊：\n${contract.input}\n\n請協助確認仍缺少的資料。謝謝。`,
    weekly: `## 本週已知紀錄\n${contract.input}\n\n## 阻礙與待確認\n請逐項核對原始紀錄，補上尚未確認的負責人與期限。\n\n## 下一步\n依確認後的優先順序安排工作。`,
    compare: `## 目標\n${contract.goal}\n\n## 比較依據\n${contract.input}\n\n## 選定方向\n已記錄你的選擇；仍缺少的成本與限制請先補齊。\n\n## 下一步\n確認條件後再採取行動。`,
  } : {
    message: `Subject: ${contract.goal}\n\nHello, here is the information currently available:\n${contract.input}\n\nPlease confirm any missing details. Thank you.`,
    weekly: `## Available records\n${contract.input}\n\n## Blockers and unknowns\nVerify owners and dates against the source.\n\n## Next actions\nPrioritize after confirming the remaining details.`,
    compare: `## Objective\n${contract.goal}\n\n## Evidence\n${contract.input}\n\n## Selected direction\nYour selection is recorded. Confirm missing costs and constraints before acting.`,
  };
  return `${zh ? '【合成示例：未呼叫 AI】' : '[Synthetic demo: no AI was called]'}\n\n${body[contract.taskType]}`;
}

export function demoExpandedChart(chart) {
  const c = structuredClone(chart), zh = /[\u3400-\u9fff]/u.test(c.goal);
  const labels = zh ? ['時間安排', '技能練習', '資料整理', '資源準備', '回饋查核', '習慣建立', '協作支持', '進度回顧'] : ['Time', 'Practice', 'Information', 'Resources', 'Feedback', 'Habits', 'Support', 'Review'];
  c.themes.forEach((theme, t) => { theme.title ||= labels[t]; theme.actions.forEach((a, i) => { a.text ||= zh ? `【示例】${theme.title}：第 ${i + 1} 項待你改寫的具體行動` : `[Demo] ${theme.title}: replace action ${i + 1} with a concrete step`; }); });
  return c;
}
