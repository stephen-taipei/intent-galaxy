import "/galaxy/apps/web/galaxy-overlay.js";
import { DecisionView } from "/galaxy/apps/web/decision-view.js";
import { chooseLocale, ready as localeReady } from "/galaxy/apps/web/i18n.js";
import { HostedApi, ApiError, guestTurnstileOptions, randomKey } from "./api.js";
import { applyHostedAccountResponse, applyMandalaProposalIfCurrent, buildStudioRequest, buildWorkContract, captureHostedAccountScope, chartDto, chartMarkdown, chartProgress, clearHostedAccountState, compareDocuments, createEmptyChart, createMandalaOperationSnapshot, createStudioContinuation, documentHistory, documentSaveTarget, filenameFor, historyVersionPair, hostedAccountScopeMatches, LocalChartStore, mandalaOperationSnapshotMatches, parseChartJson, parseStudioContinuation, studioCanSubmit, studioSummaryMarkdown, studioSummarySections, studioTemplateSaveAccess, studioTemplateFromSearch, THEME_POSITIONS, validateChart } from "./model.js";

const COPY = {
  zh: {
    skip:"跳到主要內容", studio:"AI 工作室", mandala:"九宮格目標規劃", pricing:"方案與價格", privacy:"隱私", terms:"使用條款", language:"介面語言", theme:"切換明暗主題", close:"關閉", primaryNavigation:"主要導覽", legalNavigation:"法律資訊", signIn:"Google 登入", signOut:"登出", signedIn:"已登入", signedOut:"已登出。此帳戶的雲端資料已從此頁清除。", demoBanner:"示範模式：畫面中的分析與生成結果由伺服器提供合成資料，不代表真實模型輸出。",
    homeEyebrow:"從想法到可執行的工作", homeTitle:"先釐清真正要做的事，再交給 AI。", homeLead:"AI 工作室把決策整理成清楚的需求摘要；九宮格目標規劃把一個目標展開為 8 個主題與 64 個行動。", studioCard:"把複雜問題整理成可確認的需求摘要，再產生可編輯、可評估的成果。", mandalaCard:"免費手動整理 81 格目標地圖；你可以把目標存到雲端或請 AI 提出修改建議。", openStudio:"開啟 AI 工作室", openMandala:"開啟九宮格目標規劃", learnPricing:"查看方案", homeFoot:"AI 工作室與九宮格目標規劃各自計費、各自使用點數。", home:"首頁",
    guest:"訪客", free:"免費", pro:"Pro", credits:"點數", guestTrial:"訪客可體驗 1 次分析與 1 次生成。", guestTrialActive:"免費體驗已開始", guestTrialUsed:"此瀏覽器已無可用訪客額度，可能是已使用或逾期；服務試用名額也可能已滿。登入後可繼續使用免費方案。", guestTrialUsedShort:"訪客體驗已使用或逾期。", guestTrialUnavailable:"目前無法提供免費體驗。", guestStart:"開始免費體驗", guestClaim:"訪客工作會在 24 小時後到期；登入後必須明確選擇儲存才能認領。", signInFirst:"請登入或開始訪客體驗後再繼續。", authLoading:"正在讀取帳戶…", csrfError:"工作階段已過期，請重新載入頁面。", apiError:"無法連線到服務。請稍後再試。", appError:"操作失敗。", modeDisabled:"服務未開放 AI 操作。", noCredits:"目前點數不足，無法執行這項操作。",
    standard:"一般（1 點）", deep:"深度（10 點）", standardCost:"一般操作 1 點", deepCost:"深度操作 10 點", provider:"AI 服務商", providerOpenAI:"OpenAI", providerAnthropic:"Anthropic", operationMode:"操作模式", providerConsent:"我同意把此工作資料傳送給所選服務商，以完成分析與生成。", decisionsConsent:"我另外同意把此工作資料交給 OpenAI 做 AI 檢查。", decisionsConsentHelp:"不勾選仍可使用 Anthropic 分析與生成；AI 檢查會標示為「未知」，不會把資料送給 OpenAI。", consentNeeded:"執行 AI 操作前，請先同意把資料傳送給所選服務商。", privacyNote:"只有在你按下 AI 操作按鈕後才會送出資料。頁面不會自動送出，也不會從生成內容執行外部動作。", inputSavedLocally:"輸入不會自動存到伺服器文件。", inputRequired:"請先填寫目標與背景輸入。", guestStartHelp:"訪客工作會在 24 小時後到期；登入後必須明確選擇儲存才能認領。",
    studioTitle:"AI 工作室", stepInput:"輸入問題", stepSelect:"選擇方案", stepContract:"確認需求摘要", stepArtifact:"成果與評估", taskType:"工作類型", messageTask:"單次訊息", weeklyTask:"每週更新", compareTask:"方案比較", goal:"目標", inputText:"背景與輸入", requirements:"必須符合的要求", requirementsHelp:"每行一項。", example:"載入範例", resetForm:"清除輸入", exampleMessageGoal:"草擬客服回覆並保留事實", exampleMessageInput:"客戶反映新功能同步資料時卡住。已知情況：只在大型資料集發生；修復日期尚未確認。請協助寫一封回覆，先承認問題，再說明已知狀況。", exampleMessageRequirement:"不要承諾尚未確認的修復日期。", exampleWeeklyGoal:"整理本週產品進度並提出下週重點", exampleWeeklyInput:"本週：完成登入流程重構；匯入錯誤仍未定位；兩位測試者要求 CSV 匯出。下週可用工程時間約 3 人日。", exampleWeeklyRequirement:"分清已確認事實與尚未確認的資訊。", exampleCompareGoal:"比較維持現況與重做流程", exampleCompareInput:"選項 A：先修補現有匯入流程，約 2 天。選項 B：重寫匯入器，約 2 週。使用者等待時間是主要問題，團隊沒有專職 QA。", exampleCompareRequirement:"分開列出已知成本與尚未確認的條件。", analyze:"開始分析", analysisReturned:"伺服器已回傳分析。選擇方案卡後，可再檢視或編輯星系。", preflightTitle:"補充檢查", preflightPass:"目前輸入看起來足以繼續。", preflightNeedsDetail:"目前資料可能不足，請先檢查以下問題。", preflightUnknown:"無法判定輸入是否完整。", preflightQuestions:"可補充的問題", suggestedTask:"建議的工作類型", suggestedTaskNote:"這只是補充建議，不會自動更改你選擇的工作類型。", analysisOnly:"分析完成。尚未選擇方案。", openGalaxy:"選擇與調整方案", reanalyze:"重新分析", missingAnalysis:"工作完成，但回應沒有分析內容。", analysis:"分析", acceptRisk:"我了解 AI 結果仍需自行檢查。", weeklyTask:"每週更新", comparison:"比較方案",
    contractTitle:"需求摘要草稿", contractHelp:"確認目標、輸入內容、要求與已選方案。按下確認後才會生成。", taskTypeSummary:"工作類型", selectionSummary:"選擇摘要", noRequirements:"沒有額外要求。", noSelection:"尚無選擇摘要。", customSelection:"自訂方案", editInputs:"修改輸入並重新分析", confirmContract:"我已檢查這份需求摘要，並同意用它生成成果。", generate:"確認需求並生成", saveTemplate:"儲存為範本", templateLoginRequired:"登入後才能儲存雲端範本。", signInToSaveTemplate:"登入並儲存範本", restoreDraftTitle:"登入前的工作草稿", restoreDraftHelp:"這份草稿只暫存在此瀏覽器分頁 24 小時，不會自動保存到雲端。", restoreDraftButton:"恢復登入前草稿", restoreDraftDirty:"目前已有編輯內容，為避免覆寫，登入前草稿暫不載入。", restoreDraftLocalOnly:"草稿已恢復到 AI 工作室，尚未保存至雲端。檢查內容後，按「儲存工作」即可認領。", restoreDraftExpired:"登入前草稿已逾期，系統已清除暫存。", draftSaveFailed:"無法在此分頁暫存草稿。為避免遺失內容，登入已取消；請先複製或匯出成果後再試。", reuseTemplate:"套用已儲存範本", changesOnly:"只套用勾選欄位。", chooseTemplate:"選擇範本", taskField:"工作類型", goalField:"目標", inputField:"背景與輸入", requirementsField:"要求", applyTemplate:"套用所選欄位", noTemplates:"尚無範本。", templateDataError:"範本資料格式無效。", myWorks:"已儲存工作", noSaved:"目前沒有已儲存資料。", cloudWork:"雲端工作", open:"開啟", history:"版本紀錄", remove:"刪除", requestId:"工作識別碼", clearJob:"清除狀態提示",
    hostedDecisionPreviewTitle:"確認已選方案", hostedDecisionPreviewLead:"請檢查目前選擇。下一步會整理成需求摘要。", hostedDecisionPreviewBody:"已選方案摘要", hostedDecisionSendNote:"確認後會回到 AI 工作室。你可先檢查需求摘要，再決定是否生成成果。", hostedDecisionPreserve:"你仍可返回調整方案，或繼續檢查需求摘要。", hostedDecisionPreviewHint:"檢視選擇後，可前往需求摘要確認並生成。",
    statusQueued:"排入佇列", statusRunning:"正在執行", statusCompleted:"完成", statusFailed:"失敗", statusUnknown:"未知", working:"工作進行中…", jobAccepted:"伺服器已接受工作。", jobFailed:"工作失敗", jobUnknown:"工作狀態未知；伺服器沒有回報可確認的結果。", unknownOutcome:"工作結果尚未確認。請查詢同一工作狀態；不要重送相同操作。", jobRecoverable:"可查詢這筆工作的伺服器狀態；頁面不會自動重送。", checkStatus:"查詢工作狀態", stillChecking:"仍在查詢同一工作。", recovered:"已從伺服器查回工作結果。", noRetries:"未知結果不會自動重送。", callUnknown:"送出結果未知", eventError:"伺服器回報錯誤", malformedResponse:"伺服器回應格式不完整。", staleWrite:"雲端文件已被其他分頁更新。請重新載入後再儲存。", documentSaved:"已儲存雲端文件。", csrfError:"工作階段已過期，請重新載入頁面。",
    artifactTitle:"可編輯成果", artifactHelp:"手動修改成果後，先前評估會失效。需要時可明確要求重新評估。", artifactContent:"成果內容", forceNoHTML:"使用純文字編輯，輸入不會當成 HTML 執行。", workContextMissing:"這份舊工作沒有保存分析與選擇資料，因此不能重新評估或要求 AI 修改。你仍可編輯、複製與匯出成果。", saveWork:"儲存工作", copyArtifact:"複製成果", exportMarkdown:"匯出 Markdown", evaluateAgain:"重新評估（付費操作）", revise:"請 AI 修改", reviseInstruction:"修改要求", reviseNow:"送出修改要求", workTitle:"工作名稱", evaluation:"評估", evaluationPass:"通過", evaluationFail:"未通過", evaluationUnknown:"未知／無法判定", evaluationInvalidated:"成果已修改，先前評估已失效。", evaluationDemo:"示範模式不會執行真實語意評估。", evaluationConsent:"缺少所需的跨服務商同意，無法執行語意評估。", evaluationCheckUnavailable:"語意評估目前無法使用。", evaluationUnavailable:"語意評估目前無法使用。", evaluationModified:"成果已修改，請重新評估。", evaluationSourceRules:"規則檢查", evaluationSourceAI:"AI 評估", unknownReview:"未知不代表通過。", copied:"已複製。", copyFailed:"無法自動複製；請手動選取內容。",
    pricing:"方案與價格", pricingLead:"兩項產品獨立訂閱，不共用點數。", studioPro:"AI 工作室 Pro", mandalaPro:"九宮格目標規劃 Pro", freePlan:"免費", perMonth:"／月", works:"已儲存工作", templates:"範本", cloudGoals:"雲端目標", freeStudio:"每月 20 點、5 份工作、3 個範本。", proStudio:"每月 200 點、100 份工作、50 個範本。", freeMandala:"完整手動編輯與匯出；登入後可存 1 個雲端目標；不含 AI 點數。", proMandala:"每月 100 點，可存 20 個雲端目標。", checkoutUnavailable:"伺服器尚未啟用結帳。", checkoutOff:"結帳尚未由伺服器啟用。", checkout:"升級方案", monthly:"每月", invalidCheckout:"伺服器沒有回傳有效的 HTTPS 結帳網址。",
    privacyLead:"本頁說明託管版前端如何呼叫服務。資料處理與保留細節以部署者公布的政策為準。", termsLead:"此託管版目前是可供檢視的服務草稿。付款與正式營運依伺服器設定開啟後才會生效。", privacyPage:"隱私說明", termsPage:"使用條款草稿", privacyOne:"登入與工作狀態由同源服務 API 管理。此介面只會在你明確開始操作時送出內容。", privacyTwo:"你輸入的目標、背景、分析結果與成果可能送往你選擇的 AI 服務商。請勿輸入不適合傳送的機密資料。", privacyThree:"文件儲存、刪除、帳務與資料保留期限由伺服器執行；此頁不假設尚未公開的保留細節。", termsOne:"AI 分析與建議可能出錯。使用者需自行檢查輸入、候選與成果。", termsTwo:"九宮格目標規劃的本機檔案由使用者裝置管理；雲端功能受帳戶、方案與伺服器額度限制。", termsThree:"此介面不會自動下單、付款、部署或對外傳送生成內容。付款跳轉只會在服務設定啟用結帳後，由使用者明確操作。", unsupportedRoute:"找不到這個頁面。",
    mandalaTitle:"九宮格目標規劃", mandalaLead:"以一個中心目標展開 8 個主題與 64 個可追蹤行動。手動編輯、儲存與匯出不需要 AI。", standalone:"獨立的目標規劃工具", chartTitle:"目標名稱", chartLabel:"九宮格目標規劃", themeTitle:"主題", action:"行動", done:"已完成", dueDate:"到期日", notes:"備註", progress:"完成進度", weeklyReview:"每週回顧", reviewDate:"回顧日期", reviewNote:"本週觀察與下一步", reviewProgress:"本週進度", saveReview:"儲存每週回顧", gridView:"81 格檢視", groupView:"主題分組檢視", mirrored:"主題鏡像", themesHint:"中央的 8 個主題會鏡像到周圍 8 個 3×3 區塊。", actionHint:"可填行動、完成狀態、日期與備註。", newChart:"新目標", saveLocal:"儲存到此裝置", saveCloud:"儲存到雲端", exportJson:"匯出 JSON", exportMarkdown:"匯出 Markdown", printPdf:"列印／存成 PDF", importJson:"匯入有效 JSON", importFailed:"匯入失敗。請選擇 schemaVersion 1 且含 8 個主題、每個主題 8 個行動的 JSON。", localSaved:"此裝置的目標", cloudSaved:"雲端目標", noGoals:"尚無目標。", goalCount:"目標數", localOnly:"手動目標表可在此裝置使用，不需要登入。", cloudLimit:"雲端目標數量由伺服器依方案限制。", localHistory:"本機回顧不會建立雲端版本。", useAI:"AI 建議", expand:"展開行動", review:"檢視目標", aiInstruction:"給 AI 的補充要求（選填）", applyProposal:"套用完整候選圖", proposalTitle:"AI 候選圖（尚未套用）", proposalReview:"AI 回饋", staleProposal:"圖表在產生建議後有變更。這份候選已過期，請重新執行 AI 操作。", noFullChart:"服務回傳建議文字，沒有可套用的完整候選圖。請依建議自行修改。", candidateInvalid:"服務回傳的候選圖不符合 8×8 格式，沒有套用。", proposalApplied:"已套用候選圖，請檢查內容並手動保存。", applyProposalHint:"候選圖只會在你按下套用後取代目前圖表。", saveGoalFirst:"先儲存雲端目標，才能查看雲端版本。", cloudHistory:"雲端版本", selectCloudGoal:"選擇雲端目標", noCloudDocs:"尚無雲端目標。", noHistory:"沒有可讀取的版本紀錄。", noHistoryPro:"版本紀錄需要 Pro 方案。", chooseDecision:"選擇並調整方案", useSelection:"使用此方案", previewSelection:"檢視選擇", copyDecision:"複製決策", titleRequired:"請填寫文件名稱。", goalRequired:"請先填寫中心目標。", status:"狀態", source:"來源", none:"無", version:"版本", current:"目前版本", comparison:"方案比較", compareVersions:"比較版本", chooseVersion:"選擇版本", chartValid:"有效的 8×8 圖表", invalidChart:"圖表格式不正確。", chartTooLarge:"圖表資料太大，請縮短行動或備註內容後再試。", noResult:"沒有結果。", signInFirst:"請登入或開始訪客體驗後再繼續。", signIn:"Google 登入", signOut:"登出", signedIn:"已登入", authDisabled:"此環境未啟用登入。", language:"介面語言", privacy:"隱私", terms:"使用條款", home:"首頁",
    needsLogin:"登入後才可使用雲端保存。", aiMandalaNoCredits:"九宮格目標規劃免費方案不含 AI 點數；手動編輯與匯出仍可使用。", signInToCloud:"登入後可使用雲端保存。", saveError:"儲存失敗。", confirmRemove:"要刪除這份已儲存資料嗎？", confirmDelete:"要刪除這份文件嗎？", saved:"已儲存。", savedLocal:"已儲存到此裝置。", cloudGoalSaved:"雲端目標已保存。", exportHint:"匯出內容只包含此份圖表資料。", importHelp:"匯入會先完整驗證，不會合併不完整資料。", noTemplates:"尚無範本。", noSaved:"目前沒有已儲存資料。", selectProvider:"選擇服務商", ready:"準備就緒", active:"使用中", updated:"已更新。", signInGoogle:"使用 Google 登入", billing:"帳務", checkoutMessage:"結帳由服務端啟用後才可使用。", supportUnavailable:"支援資訊尚未設定。", noAIForFree:"免費方案不含 Mandala AI 點數。", providerOpenAI:"OpenAI", providerAnthropic:"Anthropic", error:"錯誤", close:"關閉", remove:"刪除", open:"開啟", retry:"重新載入", loading:"載入中…",
    requestId:"工作識別碼", eventError:"伺服器回報錯誤", inputRequired:"請先填寫目標與背景輸入。", privacyNote:"只有在你按下 AI 操作按鈕後才會送出資料。頁面不會自動送出，也不會從生成內容執行外部動作。", modeDisabled:"服務未開放 AI 操作。", consentNeeded:"執行 AI 操作前，請先勾選資料傳送同意。", noRetries:"未知結果不會自動重送。", checkStatus:"查詢工作狀態", stillChecking:"仍在查詢同一工作。", jobUnknown:"工作狀態未知；伺服器沒有回報可確認的結果。", jobRecoverable:"可查詢這筆工作的伺服器狀態；頁面不會自動重送。", clearJob:"清除狀態提示", callUnknown:"送出結果未知", working:"工作進行中…", jobAccepted:"伺服器已接受工作。", statusQueued:"排入佇列", statusRunning:"正在執行", statusCompleted:"完成", statusFailed:"失敗", statusUnknown:"未知", jobFailed:"工作失敗", recovered:"已從伺服器查回工作結果。", malformedResponse:"伺服器回應格式不完整。", actionNo:"行動", completed:"工作完成。", details:"詳細資料", docsError:"無法讀取雲端文件。", groupViewHint:"手機版以主題分組，資料與 81 格檢視相同。", missingArtifact:"工作完成，但回應沒有成果內容。", noTurnstile:"請完成頁面上的人機驗證後重試。", previous:"比較版本 A", roleGoal:"中心目標", runningJob:"正在查詢工作狀態。", sessionError:"無法讀取登入狀態。", siteDraft:"服務草稿", templateSaved:"範本已保存。", themeNo:"主題", titleHint:"最多 160 字。", versionCompare:"版本比較", workContract:"需求摘要", workSaved:"工作已保存。", noOverage:"不會自動加購，也不會超額扣款。", freePeriod:"免費點數每月依 Asia/Taipei 時區重設。"
  },
  en: {
    skip:"Skip to main content", studio:"Decision Studio", mandala:"Mandala planner", pricing:"Plans & pricing", privacy:"Privacy", terms:"Terms", language:"Language", theme:"Toggle light and dark theme", close:"Close", primaryNavigation:"Primary navigation", legalNavigation:"Legal information", signIn:"Sign in with Google", signOut:"Sign out", signedIn:"Signed in", signedOut:"Signed out. This account's cloud data has been cleared from this page.", demoBanner:"Demo mode: analysis and generation results are synthetic fixtures returned by the server, not real model output.",
    homeEyebrow:"From intent to work", homeTitle:"Clarify what you need before you hand it to AI.", homeLead:"AI Studio turns a decision into a clear request summary. The 81-cell goal planner expands one goal into 8 themes and 64 actions.", studioCard:"Turn a complex request into a confirmed summary and an editable, evaluated artifact.", mandalaCard:"Build an 81-cell goal map by hand for free. Save it to the cloud or ask AI for a proposal when useful.", openStudio:"Open Decision Studio", openMandala:"Open Mandala", learnPricing:"View plans", homeFoot:"Studio and Mandala are independent products with separate subscriptions and credits.", home:"Home",
    guest:"Guest", free:"Free", pro:"Pro", credits:"credits", guestTrial:"Guests can try one analysis and one generation.", guestTrialActive:"Free trial is active.", guestTrialUsed:"This browser has no guest credits left. It may have used or expired its trial, or the service may have reached its trial cap. Sign in to continue on the free plan.", guestTrialUsedShort:"Guest trial used or expired.", guestTrialUnavailable:"The free trial is not available right now.", guestStart:"Start free trial", guestClaim:"Guest work expires after 24 hours. After sign-in, you must explicitly save it to claim it.", signInFirst:"Sign in or start a guest trial to continue.", authLoading:"Loading account…", csrfError:"Your session expired. Reload this page.", apiError:"Could not reach the service. Try again later.", appError:"The action failed.", modeDisabled:"AI operations are disabled for this service.", noCredits:"There are not enough credits for this operation.",
    standard:"Standard (1 credit)", deep:"Deep (10 credits)", standardCost:"Standard operations cost 1 credit", deepCost:"Deep operations cost 10 credits", provider:"AI provider", providerOpenAI:"OpenAI", providerAnthropic:"Anthropic", operationMode:"Operation mode", providerConsent:"I agree to send this work data to the selected provider for analysis and generation.", decisionsConsent:"I separately agree to send this work data to OpenAI for an AI review.", decisionsConsentHelp:"You can use Anthropic for analysis and generation without this choice. The AI review will be marked unknown and no data will be sent to OpenAI.", consentNeeded:"Agree to send data to the selected provider before starting an AI operation.", privacyNote:"Data is sent only after you start an AI operation. The page does not submit automatically or run external actions from generated content.", inputSavedLocally:"Inputs are not automatically saved as server documents.", inputRequired:"Enter a goal and background first.", guestStartHelp:"Guest work expires after 24 hours. After sign-in, choose Save to claim it.",
    studioTitle:"Decision Studio", stepInput:"Describe the work", stepSelect:"Choose a plan", stepContract:"Review request summary", stepArtifact:"Artifact & evaluation", taskType:"Task type", messageTask:"One-time message", weeklyTask:"Weekly update", compareTask:"Compare options", goal:"Goal", inputText:"Background and input", requirements:"Requirements", requirementsHelp:"One item per line.", example:"Load example", resetForm:"Clear inputs", exampleMessageGoal:"Draft a customer reply while preserving the facts", exampleMessageInput:"A customer reports that the new feature gets stuck while syncing data. Known: it occurs only with large datasets; the fix date is unknown. Draft a reply that acknowledges the issue and explains what is known.", exampleMessageRequirement:"Do not promise an unconfirmed repair date.", exampleWeeklyGoal:"Summarize this week's product progress and next priorities", exampleWeeklyInput:"This week: completed the login refactor; import errors remain unresolved; two testers asked for CSV export. About three engineer-days are available next week.", exampleWeeklyRequirement:"Separate confirmed facts from unknown information.", exampleCompareGoal:"Compare keeping the current flow with rebuilding it", exampleCompareInput:"Option A: patch the existing import flow in about two days. Option B: rewrite the importer in about two weeks. User wait time is the main problem, and the team has no dedicated QA.", exampleCompareRequirement:"Separate known costs from unconfirmed conditions.", analyze:"Analyze", analysisReturned:"The server returned an analysis. Choose a plan, then inspect or edit the galaxy.", preflightTitle:"Input check", preflightPass:"The current input appears sufficient to continue.", preflightNeedsDetail:"Some information may be missing. Review these questions.", preflightUnknown:"The service could not determine whether the input is complete.", preflightQuestions:"Questions you could answer", suggestedTask:"Suggested task type", suggestedTaskNote:"This is only a suggestion. It will not change your selected task type.", analysisOnly:"Analysis is ready. No plan has been selected yet.", openGalaxy:"Choose and adjust a plan", reanalyze:"Analyze again", missingAnalysis:"The job completed without analysis content.", analysis:"Analysis", acceptRisk:"I understand that AI output still needs my review.", comparison:"Compare options",
    contractTitle:"Request summary draft", contractHelp:"Review the goal, input, requirements, and selected plan. Generation starts only after confirmation.", taskTypeSummary:"Work type", selectionSummary:"Selection summary", noRequirements:"No additional requirements.", noSelection:"No selection summary yet.", customSelection:"Custom plan", editInputs:"Edit inputs and analyze again", confirmContract:"I reviewed this request summary and agree to generate the artifact from it.", generate:"Confirm request and generate", saveTemplate:"Save as template", templateLoginRequired:"Sign in to save a cloud template.", signInToSaveTemplate:"Sign in to save a template", restoreDraftTitle:"Work saved before sign-in", restoreDraftHelp:"This draft is stored in this browser tab for 24 hours. It is not saved to the cloud automatically.", restoreDraftButton:"Restore pre-login draft", restoreDraftDirty:"There are already edits on this page. The saved draft was kept aside to avoid overwriting them.", restoreDraftLocalOnly:"The draft is back in AI Studio, but it is not saved to the cloud. Review it, then choose Save work to claim it.", restoreDraftExpired:"The pre-login draft expired and was cleared.", draftSaveFailed:"This tab could not store the draft. Sign-in was canceled to prevent losing it. Copy or export the artifact before trying again.", reuseTemplate:"Use a saved template", changesOnly:"Only apply checked fields.", chooseTemplate:"Choose a template", taskField:"Task type", goalField:"Goal", inputField:"Background and input", requirementsField:"Requirements", applyTemplate:"Apply selected fields", noTemplates:"No templates saved yet.", templateDataError:"The template data is invalid.", myWorks:"Saved work", noSaved:"Nothing saved yet.", cloudWork:"Cloud work", open:"Open", history:"History", remove:"Delete", requestId:"Job ID", clearJob:"Dismiss status",
    hostedDecisionPreviewTitle:"Confirm selected plan", hostedDecisionPreviewLead:"Review your selection. Next, you will see a readable request summary.", hostedDecisionPreviewBody:"Selected plan summary", hostedDecisionSendNote:"After confirmation, you will return to AI Studio. Review the request summary before deciding whether to generate the artifact.", hostedDecisionPreserve:"You can return to adjust the plan or continue to review the request summary.", hostedDecisionPreviewHint:"Review your selection, then continue to the request summary.",
    statusQueued:"Queued", statusRunning:"Running", statusCompleted:"Completed", statusFailed:"Failed", statusUnknown:"Unknown", working:"Work in progress…", jobAccepted:"The server accepted the job.", jobFailed:"Job failed", jobUnknown:"The job status is unknown. The server did not confirm a result.", unknownOutcome:"The result is not confirmed. Check the same job status; do not submit the operation again.", jobRecoverable:"You can check this job's server status. The page will not resubmit it automatically.", checkStatus:"Check job status", stillChecking:"Still checking the same job.", recovered:"Recovered the job result from the server.", noRetries:"Unknown outcomes are never retried automatically.", callUnknown:"Submission outcome is unknown", eventError:"The server reported an error", malformedResponse:"The server response was incomplete.", staleWrite:"This cloud document changed in another tab. Reload it before saving.", documentSaved:"Cloud document saved.",
    artifactTitle:"Editable artifact", artifactHelp:"Editing the artifact invalidates its earlier evaluation. You can explicitly run an evaluation again.", artifactContent:"Artifact content", forceNoHTML:"Plain-text editing. Input is never executed as HTML.", workContextMissing:"This saved work has no analysis and selection data, so it cannot be re-evaluated or revised with AI. You can still edit, copy, and export the artifact.", saveWork:"Save work", copyArtifact:"Copy artifact", exportMarkdown:"Export Markdown", evaluateAgain:"Evaluate again (paid operation)", revise:"Ask AI to revise", reviseInstruction:"Revision instruction", reviseNow:"Send revision request", workTitle:"Work title", evaluation:"Evaluation", evaluationPass:"Pass", evaluationFail:"Fail", evaluationUnknown:"Unknown / cannot determine", evaluationInvalidated:"The artifact changed; the earlier evaluation is invalidated.", evaluationDemo:"Demo mode does not run a real semantic evaluation.", evaluationConsent:"The required cross-provider consent is missing, so semantic evaluation could not run.", evaluationCheckUnavailable:"Semantic evaluation is currently unavailable.", evaluationUnavailable:"Semantic evaluation is currently unavailable.", evaluationModified:"The artifact changed. Run an evaluation again.", evaluationSourceRules:"Rule check", evaluationSourceAI:"AI evaluation", unknownReview:"Unknown does not mean pass.", copied:"Copied.", copyFailed:"Automatic copy failed. Select the text manually.",
    pricing:"Plans & pricing", pricingLead:"The two products have separate subscriptions and do not share credits.", studioPro:"Studio Pro", mandalaPro:"Mandala Pro", freePlan:"Free", perMonth:"/month", works:"saved works", templates:"templates", cloudGoals:"cloud goals", freeStudio:"20 credits/month, 5 works, and 3 templates.", proStudio:"200 credits/month, 100 works, and 50 templates.", freeMandala:"Full manual editing and export; one cloud goal after sign-in; no AI credits.", proMandala:"100 credits/month and up to 20 cloud goals.", checkoutUnavailable:"Checkout is not enabled by the server.", checkoutOff:"Checkout has not been enabled by the server.", checkout:"Upgrade", monthly:"Monthly", invalidCheckout:"The server did not return a valid HTTPS checkout URL.",
    privacyLead:"This page explains how the hosted frontend calls the service. Follow the operator's published policy for data handling and retention details.", termsLead:"This hosted frontend is a reviewable service draft. Payments and production operation depend on server settings.", privacyPage:"Privacy draft", termsPage:"Terms draft", privacyOne:"Sign-in and job state are managed by the same-origin service API. This interface submits content only after you explicitly start an operation.", privacyTwo:"Goals, background, analyses, and artifacts may be sent to the AI provider you choose. Do not enter confidential data that you should not share.", privacyThree:"The server controls document storage, deletion, billing, and retention. This page does not assume details that have not been published.", termsOne:"AI analysis and suggestions can be wrong. Review the input, proposals, and artifact yourself.", termsTwo:"Local Mandala files are managed on your device. Cloud features depend on your account, plan, and server limits.", termsThree:"This interface does not automatically buy, pay, deploy, or send generated content externally. Checkout redirects are available only when enabled by the service and initiated by you.", unsupportedRoute:"Page not found.",
    mandalaTitle:"Mandala goal planner", mandalaLead:"Expand one central goal into 8 themes and 64 trackable actions. Manual editing, saving, and export do not need AI.", standalone:"A standalone goal-planning tool", chartTitle:"Goal title", chartLabel:"Mandala chart", themeTitle:"Theme", action:"Action", done:"Done", dueDate:"Due date", notes:"Notes", progress:"Progress", weeklyReview:"Weekly review", reviewDate:"Review date", reviewNote:"Observations and next steps", reviewProgress:"Weekly progress", saveReview:"Save weekly review", gridView:"81-cell view", groupView:"Grouped by theme", mirrored:"Mirrored theme", themesHint:"The 8 inner themes mirror into the centers of the 8 surrounding 3×3 blocks.", actionHint:"Edit action text, completion, due date, and notes.", newChart:"New goal", saveLocal:"Save on this device", saveCloud:"Save to cloud", exportJson:"Export JSON", exportMarkdown:"Export Markdown", printPdf:"Print / save PDF", importJson:"Import valid JSON", importFailed:"Import failed. Choose schemaVersion 1 JSON with 8 themes and 8 actions per theme.", localSaved:"Goals on this device", cloudSaved:"Cloud goals", noGoals:"No goals yet.", goalCount:"goals", localOnly:"Manual planning works on this device without sign-in.", cloudLimit:"The server enforces your cloud goal limit.", localHistory:"Local reviews do not create cloud versions.", useAI:"AI proposals", expand:"Expand actions", review:"Review goal", aiInstruction:"Optional instruction for AI", applyProposal:"Apply complete proposal", proposalTitle:"AI proposal (not applied)", proposalReview:"AI feedback", staleProposal:"The chart changed after this proposal was created. Run the AI operation again.", noFullChart:"The service returned written suggestions without a complete chart. Apply changes by hand.", candidateInvalid:"The service returned an invalid 8×8 proposal. Nothing was applied.", proposalApplied:"Proposal applied. Review it and save manually.", applyProposalHint:"The current chart changes only after you click Apply.", saveGoalFirst:"Save the cloud goal before opening its versions.", cloudHistory:"Cloud versions", selectCloudGoal:"Choose a cloud goal", noCloudDocs:"No cloud goals saved yet.", noHistory:"No readable version history.", noHistoryPro:"Version history requires Pro.", chooseDecision:"Choose and adjust a plan", useSelection:"Use this plan", previewSelection:"Review selection", copyDecision:"Copy decision", titleRequired:"Enter a document title.", goalRequired:"Enter a central goal first.", status:"Status", source:"Source", none:"None", version:"Version", current:"Current version", compareVersions:"Compare versions", chooseVersion:"Choose a version", chartValid:"Valid 8×8 chart", invalidChart:"Invalid chart data.", chartTooLarge:"The chart is too large. Shorten action or note text and try again.", noResult:"No result.", needsLogin:"Sign in for cloud storage.", aiMandalaNoCredits:"The free Mandala plan has no AI credits. Manual editing and export remain available.", signInToCloud:"Sign in to use cloud storage.", saveError:"Save failed.", confirmRemove:"Delete this saved item?", confirmDelete:"Delete this document?", saved:"Saved.", savedLocal:"Saved on this device.", cloudGoalSaved:"Cloud goal saved.", exportHint:"Export contains only this chart's data.", importHelp:"The entire import is validated before it replaces the current chart.", ready:"Ready", active:"Active", updated:"Updated.", signInGoogle:"Sign in with Google", supportUnavailable:"Support information has not been configured.",
    notFound:"Page not found.", loading:"Loading…", retry:"Reload", close:"Close", error:"Error", privacyNote:"Data is sent only after you start an AI operation. The page will not submit automatically or run external actions from generated content.", demoBanner:"Demo mode: analysis and generation results are synthetic fixtures returned by the server, not real model output.", requestId:"Job ID", statusQueued:"Queued", statusRunning:"Running", statusCompleted:"Completed", statusFailed:"Failed", statusUnknown:"Unknown", actionNo:"Action", completed:"Job complete.", details:"Details", docsError:"Could not load cloud documents.", groupViewHint:"On phones, actions are grouped by theme. The same data powers the 81-cell view.", missingArtifact:"The job completed without artifact content.", noTurnstile:"Complete the human check on this page and try again.", previous:"Compare version A", roleGoal:"Central goal", runningJob:"Checking job status.", sessionError:"Could not read the sign-in state.", siteDraft:"Service draft", templateSaved:"Template saved.", themeNo:"Theme", titleHint:"Up to 160 characters.", versionCompare:"Version comparison", workContract:"Request summary", workSaved:"Work saved.", noOverage:"No automatic overage or additional purchases.", freePeriod:"Free credits reset monthly in the Asia/Taipei time zone."
  }
};

// Keep the UI copy surface small and explicit; shared DecisionView uses its own checked locale files.
const api = new HostedApi();
const localCharts = new LocalChartStore();
const main = document.getElementById("main");
const toast = document.getElementById("toast");
const account = document.getElementById("account");
const demoBanner = document.getElementById("demoBanner");
const languageSelect = document.getElementById("language");
const themeToggle = document.getElementById("themeToggle");
const decisionDialog = document.getElementById("decisionDialog");
const decisionGalaxy = document.getElementById("selectionGalaxy");
const decisionMount = document.getElementById("decisionMount");
let locale = localStorage.getItem("ig:hosted-locale") || ((navigator.language || "en").toLowerCase().startsWith("zh") ? "zh" : "en");
let decisionView = null;
let toastTimer = 0;
let state = {
  ready: false, config: null, session: null, accountEpoch: 0, accountTransition: false, route: location.pathname,
  notice: null, pending: null, jobBusy: false, jobStatus: "", studioContinuation: null, studioContinuationRestored: false,
  studio: { step: 1, preflight: null, form: { taskType: "message", goal: "", input: "", requirements: "", provider: "openai", mode: "standard", providerConsent: false, consentDecisions: false }, formDirty: false, analysis: null, selection: null, contract: null, artifact: null, evaluation: null, artifactDirty: false, currentDoc: null, history: null, templates: [], works: [] },
  mandala: { chart: createEmptyChart(), chartEpoch: 0, localId: null, cloudDoc: null, cloudHistory: null, cloudGoals: [], proposal: null, proposalSnapshot: null, proposalText: "", proposalStale: false, instruction: "", provider: "openai", mode: "standard", consent: false, reviewDate: new Date().toISOString().slice(0,10), reviewNote: "", reviewFor: null, view: "grid" },
};

const langCopy = () => COPY[locale] ?? COPY.en;
function tr(key, vars = {}) {
  let value = langCopy()[key] ?? COPY.zh[key] ?? key;
  for (const [name, replacement] of Object.entries(vars)) value = value.replaceAll(`{${name}}`, String(replacement));
  return value;
}
const STUDIO_EXAMPLE_KEYS = Object.freeze({
  message: ["exampleMessageGoal", "exampleMessageInput", "exampleMessageRequirement"],
  weekly: ["exampleWeeklyGoal", "exampleWeeklyInput", "exampleWeeklyRequirement"],
  compare: ["exampleCompareGoal", "exampleCompareInput", "exampleCompareRequirement"],
});
function fillStudioExample(taskType) {
  if (!Object.hasOwn(STUDIO_EXAMPLE_KEYS, taskType)) return false;
  const keys = STUDIO_EXAMPLE_KEYS[taskType];
  const form = state.studio.form;
  form.taskType = taskType;
  form.goal = tr(keys[0]);
  form.input = tr(keys[1]);
  form.requirements = tr(keys[2]);
  form.providerConsent = false;
  form.consentDecisions = false;
  state.studio.formDirty = true;
  return true;
}
function applyStudioTemplateFromUrl() {
  if ((location.pathname.replace(/\/$/, "") || "/") !== "/studio") return false;
  if (state.studioContinuation) return false;
  const taskType = studioTemplateFromSearch(location.search);
  if (!taskType) return false;
  const studio = state.studio;
  const blank = !studio.form.goal.trim() && !studio.form.input.trim() && !studio.form.requirements.trim();
  if (!blank || studio.formDirty || studio.currentDoc || studio.analysis || studio.selection || studio.artifact) return false;
  return fillStudioExample(taskType);
}
function el(tag, className = "", value = "") {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (value !== undefined && value !== null) item.textContent = String(value);
  return item;
}
function btn(label, { cls = "button", action, disabled = false, title = "" } = {}) {
  const item = el("button", cls, label);
  item.type = "button";
  item.disabled = !!disabled;
  if (title) item.title = title;
  if (action) item.addEventListener("click", action);
  return item;
}
function link(label, href, cls = "button") {
  const item = el("a", cls, label);
  item.href = href;
  return item;
}
function field(label, control, help = "") {
  const wrap = el("label", "field");
  wrap.append(el("span", "", label), control);
  if (help) wrap.append(el("small", "", help));
  return wrap;
}
function input(value, { type = "text", placeholder = "", maxLength, onInput, className = "", checked = false } = {}) {
  const item = document.createElement("input");
  item.type = type;
  item.value = value ?? "";
  item.placeholder = placeholder;
  if (maxLength) item.maxLength = maxLength;
  if (type === "checkbox") item.checked = checked;
  if (className) item.className = className;
  if (onInput) item.addEventListener(type === "checkbox" ? "change" : "input", onInput);
  return item;
}
function textarea(value, { rows = 5, placeholder = "", maxLength, onInput, className = "" } = {}) {
  const item = document.createElement("textarea");
  item.rows = rows;
  item.value = value ?? "";
  item.placeholder = placeholder;
  if (maxLength) item.maxLength = maxLength;
  if (className) item.className = className;
  if (onInput) item.addEventListener("input", onInput);
  return item;
}
function select(value, options, onChange, className = "control") {
  const item = document.createElement("select");
  item.className = className;
  for (const [optionValue, label] of options) {
    const option = document.createElement("option"); option.value = optionValue; option.textContent = label; item.append(option);
  }
  item.value = value;
  if (onChange) item.addEventListener("change", onChange);
  return item;
}
function renderStudioConsent(form, onChange = () => {}) {
  const controls = el("div", "stack consent-controls");
  const primary = input("", { type: "checkbox", checked: form.providerConsent, onInput: (event) => { form.providerConsent = event.target.checked; onChange(); } });
  const primaryLabel = el("label", "check-line"); primaryLabel.append(primary, el("span", "", tr("providerConsent"))); controls.append(primaryLabel);
  if (form.provider === "anthropic") {
    const decisions = input("", { type: "checkbox", checked: form.consentDecisions, onInput: (event) => { form.consentDecisions = event.target.checked; onChange(); } });
    const decisionsLabel = el("label", "check-line"); decisionsLabel.append(decisions, el("span", "", tr("decisionsConsent"))); controls.append(decisionsLabel, el("small", "help", tr("decisionsConsentHelp")));
  }
  if (!studioCanSubmit(form)) controls.append(el("small", "help", tr("consentNeeded")));
  return controls;
}
function notify(message, kind = "") {
  toast.textContent = message;
  toast.className = `toast ${kind}`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6500);
}
function alertBox(message, kind = "") { return el("div", `alert ${kind}`, message); }
function infoBox(message, kind = "") { return el("div", `info-box ${kind}`, message); }
function heading(title, subtitle = "", eyebrow = "") {
  const box = el("div", "page-heading");
  if (eyebrow) box.append(el("p", "eyebrow", eyebrow));
  box.append(el("h1", "", title));
  if (subtitle) box.append(el("p", "lead", subtitle));
  return box;
}
function sectionTitle(title, subtitle = "") {
  const box = el("div", "panel-header");
  const left = el("div"); left.append(el("h2", "", title)); if (subtitle) left.append(el("p", "", subtitle));
  box.append(left); return box;
}
function newPage(className = "page-shell") { main.replaceChildren(); const page = el("div", className); main.append(page); if (state.notice) { page.prepend(alertBox(state.notice.message, state.notice.kind)); state.notice = null; } return page; }
function navigate(path) { history.pushState({}, "", path); state.route = path; applyStudioTemplateFromUrl(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); main.focus({ preventScroll: true }); }
function setNotice(message, kind = "") { state.notice = { message, kind }; }
function readStoredPending() { try { return JSON.parse(sessionStorage.getItem("ig:pending-job") ?? "null"); } catch { return null; } }
function savePending(value) {
  state.pending = value;
  try {
    if (value) { const { accountScope, ...recoverable } = value; sessionStorage.setItem("ig:pending-job", JSON.stringify(recoverable)); }
    else sessionStorage.removeItem("ig:pending-job");
  } catch { /* Recovery storage is optional. */ }
}
function getEntitlement(product) { return state.session?.entitlements?.[product] ?? { plan: "guest", credits: 0, limits: {} }; }
const GUEST_TRIAL_USED_KEY = "ig:guest-trial-used:v1";
const STUDIO_CONTINUATION_KEY = "ig:studio-login-continuation:v1";
function clearStudioContinuation() {
  state.studioContinuation = null;
  state.studioContinuationRestored = false;
  try { sessionStorage.removeItem(STUDIO_CONTINUATION_KEY); } catch { /* Optional recovery storage. */ }
}
function clearAccountScopedCaches() {
  clearStudioContinuation();
  savePending(null);
  state.jobBusy = false;
  state.jobStatus = "";
  clearHostedAccountState(state);
}
function accountContext() { return { epoch: state.accountEpoch, session: state.session, transitioning: state.accountTransition }; }
function captureAccountScope() { return captureHostedAccountScope(state.accountEpoch, state.session); }
function accountScopeCurrent(scope) { return hostedAccountScopeMatches(scope, accountContext()); }
function setSession(session) {
  const before = captureHostedAccountScope(state.accountEpoch, state.session).principal;
  const after = captureHostedAccountScope(state.accountEpoch, session).principal;
  if (before !== after) state.accountEpoch++;
  state.session = session;
}
function readStudioContinuation() {
  try {
    const raw = sessionStorage.getItem(STUDIO_CONTINUATION_KEY);
    if (!raw) return null;
    const continuation = parseStudioContinuation(raw);
    if (!continuation) sessionStorage.removeItem(STUDIO_CONTINUATION_KEY);
    return continuation;
  } catch { return null; }
}
function hasStudioDraftOnPage() {
  const studio = state.studio;
  return studio.formDirty || Boolean(studio.form.goal.trim() || studio.form.input.trim() || studio.form.requirements.trim() || studio.currentDoc || studio.analysis || studio.selection || studio.selectionDraft || studio.artifact);
}
function saveStudioContinuationBeforeLogin() {
  const studio = state.studio;
  if (!studio.form.goal.trim() && !studio.form.input.trim() && !studio.form.requirements.trim() && !studio.analysis && !studio.selection && !studio.selectionDraft && !studio.artifact) return true;
  const serialized = createStudioContinuation(studio);
  if (!serialized) return false;
  try {
    sessionStorage.setItem(STUDIO_CONTINUATION_KEY, serialized);
    state.studioContinuation = parseStudioContinuation(serialized);
    state.studioContinuationRestored = false;
    return true;
  } catch { return false; }
}
function renderStudioContinuationPrompt(target) {
  if (state.studioContinuation?.expiresAt <= Date.now()) { clearStudioContinuation(); return; }
  if (!state.studioContinuation || !isSignedIn() || state.studioContinuationRestored) return;
  const prompt = el("section", "panel continuation-prompt");
  prompt.append(sectionTitle(tr("restoreDraftTitle"), tr("restoreDraftHelp")));
  if (hasStudioDraftOnPage()) prompt.append(infoBox(tr("restoreDraftDirty"), "warning"));
  else prompt.append(btn(tr("restoreDraftButton"), { cls: "button primary", action: () => restoreStudioContinuation() }));
  target.append(prompt);
}
function restoreStudioContinuation() {
  const continuation = state.studioContinuation ?? readStudioContinuation();
  if (!continuation) return;
  if (continuation.expiresAt <= Date.now()) { clearStudioContinuation(); notify(tr("restoreDraftExpired"), "warning"); return; }
  if (!isSignedIn()) return;
  if (hasStudioDraftOnPage()) { notify(tr("restoreDraftDirty"), "error"); return; }
  const saved = continuation.studio;
  const form = { ...state.studio.form, ...saved.form, providerConsent: false, consentDecisions: false };
  const selection = saved.selection;
  let contract = null;
  if (saved.analysis && selection) {
    try { contract = buildWorkContract({ taskType: form.taskType, goal: form.goal, input: form.input, requirements: form.requirements.split(/\r?\n/).map((value) => value.trim()).filter(Boolean), selection }); }
    catch { contract = null; }
  }
  Object.assign(state.studio, {
    form, formDirty: true, analysis: saved.analysis, selection, selectionDraft: saved.selectionDraft ?? selection,
    selectionText: saved.selectionText, contract, artifact: saved.artifact, evaluation: saved.evaluation,
    artifactDirty: saved.artifactDirty, confirmedContract: false, currentDoc: null, workTitle: saved.workTitle,
    step: saved.artifact ? 4 : saved.analysis && selection ? 3 : saved.analysis ? 2 : 1,
  });
  state.studioContinuationRestored = true;
  setNotice(tr("restoreDraftLocalOnly"), "warning");
  if ((location.pathname.replace(/\/$/, "") || "/") !== "/studio") navigate("/studio");
  else render();
}
function guestTrialState() {
  const limits = getEntitlement("studio").limits ?? {};
  if (Number.isFinite(limits.analyses) || Number.isFinite(limits.generations)) {
    const expiresAt = Date.parse(limits.expiresAt ?? "");
    if (Number.isFinite(expiresAt) && expiresAt > Date.now() && ((limits.analyses ?? 0) > 0 || (limits.generations ?? 0) > 0)) return "active";
    return "used";
  }
  try { if (localStorage.getItem(GUEST_TRIAL_USED_KEY) === "true") return "used"; } catch { /* Optional local hint; the server remains authoritative. */ }
  return "available";
}
function rememberGuestTrialUsed() { try { localStorage.setItem(GUEST_TRIAL_USED_KEY, "true"); } catch { /* The server remains authoritative. */ } }
function isSignedIn() { return !!state.session?.user; }
function planText(plan) { return plan === "pro" ? tr("pro") : plan === "guest" ? tr("guest") : tr("free"); }
function refreshAccount() {
  account.replaceChildren();
  const session = state.session;
  if (!session) { account.append(el("span", "account", tr("authLoading"))); return; }
  const wrap = el("div", "account");
  if (session.user?.email) wrap.append(el("span", "", session.user.email));
  const studio = getEntitlement("studio");
  wrap.append(el("span", "badge", `${planText(studio.plan)} · ${studio.credits ?? 0} ${tr("credits")}`));
  if (session.user) wrap.append(btn(tr("signOut"), { cls: "text-button", disabled: state.accountTransition, action: async () => {
    if (state.accountTransition) return;
    const previousSession = state.session;
    state.accountEpoch++;
    const logoutEpoch = state.accountEpoch;
    state.accountTransition = true;
    state.session = null;
    clearAccountScopedCaches();
    refreshAccount(); render();
    try {
      await api.logout();
      if (state.accountEpoch !== logoutEpoch) return;
      setSession(api.session);
      state.accountTransition = false;
      refreshAccount(); render(); notify(tr("signedOut"));
    } catch (error) {
      if (state.accountEpoch !== logoutEpoch) return;
      setSession(api.session ?? previousSession);
      state.accountTransition = false;
      refreshAccount(); render(); notify(toMessage(error), "error");
    }
  } }));
  else if (state.config?.authEnabled) wrap.append(link(tr("signIn"), "/api/auth/login", "button small"));
  account.append(wrap);
}
function applyStaticCopy() {
  document.documentElement.lang = locale === "zh" ? "zh-Hant-TW" : "en";
  languageSelect.value = locale;
  languageSelect.setAttribute("aria-label", tr("language"));
  themeToggle.setAttribute("aria-label", tr("theme")); themeToggle.title = tr("theme");
  document.getElementById("closeDecision").setAttribute("aria-label", tr("close"));
  document.querySelector(".topnav")?.setAttribute("aria-label", tr("primaryNavigation"));
  document.querySelector(".site-footer nav")?.setAttribute("aria-label", tr("legalNavigation"));
  document.querySelectorAll("[data-i18n]").forEach((item) => { const key = item.dataset.i18n; item.textContent = tr(key); });
  demoBanner.hidden = state.config?.mode !== "demo";
  demoBanner.textContent = tr("demoBanner");
  refreshAccount();
}
function toMessage(error) {
  if (!(error instanceof ApiError)) return tr("appError");
  if (error.code === "network_error") return tr("apiError");
  if (error.code === "csrf_invalid" || error.code === "session_expired" || error.code === "session_required") return tr("csrfError");
  if (error.code === "insufficient_credits") return tr("noCredits");
  if (error.code === "guest_limit") return tr("guestTrialUsed");
  if (["trial_disabled", "turnstile_unavailable"].includes(error.code)) return tr("guestTrialUnavailable");
  if (["turnstile_required", "turnstile_rejected"].includes(error.code)) return tr("noTurnstile");
  if (error.code === "stale_revision" || error.status === 409) return tr("staleWrite");
  if (error.code === "billing_disabled") return tr("checkoutUnavailable");
  return error.message || tr("appError");
}
function chartError(error) {
  return error?.message === "Chart is too large" ? tr("chartTooLarge") : tr("invalidChart");
}
function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function copyText(value) {
  return navigator.clipboard?.writeText(value).then(() => notify(tr("copied"))).catch(() => { notify(tr("copyFailed"), "error"); });
}
function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function allowAi(product, mode) {
  if (!state.config || state.config.mode === "disabled") return false;
  const ent = getEntitlement(product);
  const cost = mode === "deep" ? 10 : 1;
  if ((ent.credits ?? 0) < cost) return false;
  if (!isSignedIn() && ent.plan !== "guest") return false;
  return true;
}
function creditsPanel(product) {
  const ent = getEntitlement(product);
  const box = el("div", "credit-badges");
  box.append(el("span", "badge", `${planText(ent.plan)} · ${ent.credits ?? 0} ${tr("credits")}`));
  if (product === "studio" && ent.plan === "guest") {
    const trial = guestTrialState();
    box.append(el("span", "badge", tr(trial === "available" ? "guestTrial" : trial === "active" ? "guestTrialActive" : "guestTrialUsedShort")));
  }
  return box;
}

async function setLocale(value) {
  locale = value === "en" ? "en" : "zh";
  try { localStorage.setItem("ig:hosted-locale", locale); } catch { /* optional preference */ }
  await chooseLocale(locale === "zh" ? "zh-Hant-TW" : "en");
  applyStaticCopy(); render();
}
function setupDecisionView() {
  decisionView = new DecisionView(decisionGalaxy, {
    textOverrides: { preview: () => tr("previewSelection"), fill: () => tr("useSelection"), copy: () => tr("copyDecision") },
    contextOverrides: {
      previewTitle: () => tr("hostedDecisionPreviewTitle"), previewLead: () => tr("hostedDecisionPreviewLead"),
      previewBody: () => tr("hostedDecisionPreviewBody"), sendNote: () => tr("hostedDecisionSendNote"),
      preserve: () => tr("hostedDecisionPreserve"), previewHint: () => tr("hostedDecisionPreviewHint"),
    },
    locales: ["zh-Hant-TW", "en"], showAutoLocale: false, showLanguage: false,
    onDraft: (draft) => { state.studio.selectionDraft = draft; },
    onFill: async (output) => {
      state.studio.selection = { baseKey: output.baseKey, overrides: output.overrides ?? {}, notes: output.notes ?? "" };
      state.studio.selectionText = output.plain ?? "";
      state.studio.step = 3;
      decisionDialog.close();
      render();
      main.focus({ preventScroll: true });
    },
  });
}

async function runJob(request, onResult, { providerConsent = false, mandalaSnapshot = null } = {}) {
  if (state.jobBusy) return;
  if (state.accountTransition) return;
  if (!providerConsent) { notify(tr("consentNeeded"), "error"); return; }
  if (!allowAi(request.product, request.mode)) {
    if (!isSignedIn() && getEntitlement(request.product).plan !== "guest") notify(tr("signInFirst"), "error");
    else if (state.config?.mode === "disabled") notify(tr("modeDisabled"), "error");
    else notify(tr("noCredits"), "error");
    return;
  }
  const key = randomKey();
  const pending = { idempotencyKey: key, product: request.product, operation: request.operation, request, ...(mandalaSnapshot ? { mandalaSnapshot } : {}), accountScope: captureAccountScope(), startedAt: Date.now(), jobId: "" };
  savePending(pending);
  state.jobBusy = true;
  state.jobStatus = tr("jobAccepted");
  render();
  try {
    const accepted = await api.submitJob(request, key);
    if (!accountScopeCurrent(pending.accountScope)) return;
    const jobId = accepted.job?.id;
    if (typeof jobId !== "string" || !jobId) throw new ApiError("invalid_response", tr("malformedResponse"));
    pending.jobId = jobId;
    savePending(pending);
    await pollJob(pending, onResult);
  } catch (error) {
    if (!accountScopeCurrent(pending.accountScope)) return;
    state.jobBusy = false;
    if (!pending.jobId) {
      state.jobStatus = tr("unknownOutcome");
      setNotice(`${tr("callUnknown")} · ${tr("requestId")}: ${key} · ${tr("noRetries")}`, "warning");
      render();
    } else {
      state.jobStatus = toMessage(error);
      notify(toMessage(error), "error");
      render();
    }
  }
}
async function pollJob(pending, onResult) {
  if (!pending.accountScope) pending.accountScope = captureAccountScope();
  if (!accountScopeCurrent(pending.accountScope)) return;
  state.jobStatus = tr("working");
  let job = null;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (attempt) await wait(1400);
    if (!accountScopeCurrent(pending.accountScope)) return;
    try { job = (await api.jobStatus(pending.jobId)).job; }
    catch (error) {
      if (!accountScopeCurrent(pending.accountScope)) return;
      state.jobBusy = false; state.jobStatus = tr("unknownOutcome");
      setNotice(`${toMessage(error)} · ${tr("requestId")}: ${pending.jobId} · ${tr("jobRecoverable")}`, "warning");
      render(); return;
    }
    if (!accountScopeCurrent(pending.accountScope)) return;
    if (!job || !["queued", "running", "completed", "failed", "unknown"].includes(job.status)) {
      state.jobBusy = false; state.jobStatus = tr("jobUnknown"); render(); return;
    }
    state.jobStatus = job.status === "queued" ? tr("statusQueued") : job.status === "running" ? tr("statusRunning") : job.status === "completed" ? tr("statusCompleted") : job.status === "failed" ? tr("statusFailed") : tr("statusUnknown");
    const live = document.getElementById("jobStatus"); if (live) live.textContent = state.jobStatus;
    if (job.status === "unknown") {
      state.jobBusy = false; setNotice(`${tr("jobUnknown")} · ${tr("requestId")}: ${pending.jobId} · ${tr("noRetries")}`, "warning"); render(); return;
    }
    if (job.status === "failed") {
      state.jobBusy = false; savePending(null); setNotice(`${tr("jobFailed")}: ${job.error?.message ?? tr("eventError")}`, "error"); render(); return;
    }
    if (job.status === "completed") {
      state.jobBusy = false; savePending(null); state.pending = null;
      if (!accountScopeCurrent(pending.accountScope)) return;
      try { await onResult(job.result ?? {}, pending); }
      catch (error) { setNotice(error instanceof Error ? error.message : tr("malformedResponse"), "error"); }
      if (!accountScopeCurrent(pending.accountScope)) return;
      await api.refreshSession().catch(() => {});
      if (!accountScopeCurrent(pending.accountScope)) return;
      setSession(api.session);
      applyStaticCopy(); render(); return;
    }
  }
  state.jobBusy = false;
  state.jobStatus = tr("stillChecking");
  setNotice(`${tr("stillChecking")} · ${tr("requestId")}: ${pending.jobId}`, "warning");
  render();
}
async function recoverPending() {
  const pending = readStoredPending();
  if (!pending) return;
  pending.accountScope = captureAccountScope();
  if (!accountScopeCurrent(pending.accountScope)) return;
  state.pending = pending;
  if (!pending.jobId) {
    state.jobStatus = tr("unknownOutcome");
    return;
  }
  state.jobStatus = tr("jobRecoverable");
  try {
    const { job } = await api.jobStatus(pending.jobId);
    if (!accountScopeCurrent(pending.accountScope)) return;
    if (job?.status === "completed") {
      savePending(null); state.pending = null;
      await processJobResult(job.result ?? {}, pending);
      if (!accountScopeCurrent(pending.accountScope)) return;
      state.jobStatus = tr("recovered");
    } else if (job?.status === "failed") {
      savePending(null); state.pending = null; state.jobStatus = tr("jobFailed");
    } else if (job?.status === "unknown") state.jobStatus = tr("jobUnknown");
  } catch { /* Keep the id so the user can retry this GET later. */ }
}
async function checkPending() {
  const pending = state.pending ?? readStoredPending();
  if (!pending?.jobId) { notify(tr("unknownOutcome"), "error"); return; }
  if (!pending.accountScope) pending.accountScope = captureAccountScope();
  if (!accountScopeCurrent(pending.accountScope)) return;
  state.pending = pending; state.jobBusy = true; state.jobStatus = tr("runningJob"); render();
  await pollJob(pending, processJobResult);
}
function showJobStatus(container) {
  if (state.jobStatus) {
    const box = el("div", "status-box"); box.id = "jobStatus"; box.setAttribute("role", "status"); box.textContent = state.jobStatus;
    if (state.pending?.jobId && !state.jobBusy) box.append(btn(tr("checkStatus"), { cls: "button small", action: checkPending }));
    if (state.pending && !state.jobBusy) box.append(btn(tr("clearJob"), { cls: "text-button", action: () => { savePending(null); state.jobStatus = ""; state.pending = null; render(); } }));
    container.append(box);
  }
}

function render() {
  applyStaticCopy();
  if (!state.ready) return;
  const route = location.pathname.replace(/\/$/, "") || "/";
  state.route = route;
  if (route === "/studio") renderStudio();
  else if (route === "/mandala") renderMandala();
  else if (route === "/pricing") renderPricing();
  else if (route === "/privacy") renderLegal("privacy");
  else if (route === "/terms") renderLegal("terms");
  else if (route === "/") renderHome();
  else renderNotFound();
}
function renderHome() {
  const page = newPage();
  const hero = el("section", "hero");
  hero.append(el("p", "eyebrow", tr("homeEyebrow")), el("h1", "", tr("homeTitle")), el("p", "lead", tr("homeLead")));
  const actions = el("div", "hero-actions"); actions.append(link(tr("openStudio"), "/studio", "button primary"), link(tr("openMandala"), "/mandala", "button secondary"), link(tr("learnPricing"), "/pricing", "button")); hero.append(actions);
  page.append(hero);
  renderStudioContinuationPrompt(page);
  const cards = el("section", "cards-3");
  for (const [icon, title, body, href, label] of [["✧",tr("studio"),tr("studioCard"),"/studio",tr("openStudio")],["▦",tr("mandala"),tr("mandalaCard"),"/mandala",tr("openMandala")],["◇",tr("pricing"),tr("homeFoot"),"/pricing",tr("learnPricing")]]) {
    const card = el("article", "product-card"); card.append(el("div", "icon", icon), el("h2", "", title), el("p", "", body), link(label, href, "button small")); cards.append(card);
  }
  page.append(cards, infoBox(tr("homeFoot")));
}
function renderNotFound() { const page = newPage("page-shell narrow"); page.append(heading(tr("unsupportedRoute")), link(tr("home"), "/", "button primary")); }

function renderStudio() {
  const studio = state.studio;
  const page = newPage();
  page.append(heading(tr("studioTitle"), tr("homeLead"), "INTENT GALAXY"));
  renderStudioContinuationPrompt(page);
  const top = el("div", "label-row"); top.append(creditsPanel("studio"));
  if (!isSignedIn()) {
    if (state.config?.authEnabled) top.append(link(tr("signIn"), "/api/auth/login", "button small"));
    const trial = guestTrialState();
    if (trial === "available" && (state.config?.mode !== "live" || state.config?.turnstileSiteKey)) {
      top.append(btn(tr("guestStart"), { cls: "button small secondary", action: () => startGuest() }));
    }
    else if (trial === "available") top.append(el("span", "help", tr("guestTrialUnavailable")));
  }
  page.append(top);
  showJobStatus(page);
  const steps = el("nav", "step-list"); steps.setAttribute("aria-label", tr("studioTitle"));
  for (const [number, key] of [[1,"stepInput"],[2,"stepSelect"],[3,"stepContract"],[4,"stepArtifact"]]) {
    const pill = el("span", `step-pill ${studio.step === number ? "active" : studio.step > number ? "done" : ""}`);
    pill.append(el("b", "", String(number)), document.createTextNode(tr(key))); steps.append(pill);
  }
  page.append(steps);
  const layout = el("div", "split");
  const primary = el("section", "stack");
  if (studio.step <= 1) renderStudioInput(primary);
  else if (studio.step === 2) renderStudioSelection(primary);
  else if (studio.step === 3) renderStudioContract(primary);
  else renderStudioArtifact(primary);
  layout.append(primary, renderStudioLibrary());
  page.append(layout, infoBox(tr("privacyNote")));
  if (!studio.docsLoaded && (isSignedIn() || getEntitlement("studio").plan === "guest")) loadStudioDocuments();
}
function renderStudioInput(target) {
  const studio = state.studio;
  const box = el("section", "step-card"); box.append(sectionTitle(tr("stepInput"), tr("inputSavedLocally")));
  const form = studio.form;
  const taskSelect = select(form.taskType, [["message",tr("messageTask")],["weekly",tr("weeklyTask")],["compare",tr("compareTask")]], (event) => { form.taskType = event.target.value; studio.formDirty = true; });
  box.append(field(tr("taskType"), taskSelect));
  const goalInput = input(form.goal, { maxLength: 2000, placeholder: tr("goal"), onInput: (event) => { form.goal = event.target.value; studio.formDirty = true; } });
  box.append(field(tr("goal"), goalInput));
  const background = textarea(form.input, { rows: 7, maxLength: 20000, placeholder: tr("inputText"), onInput: (event) => { form.input = event.target.value; studio.formDirty = true; } });
  box.append(field(tr("inputText"), background));
  const requirements = textarea(form.requirements, { rows: 4, maxLength: 8000, placeholder: tr("requirementsHelp"), onInput: (event) => { form.requirements = event.target.value; studio.formDirty = true; } });
  box.append(field(tr("requirements"), requirements, tr("requirementsHelp")));
  const example = btn(tr("example"), { cls: "button small", action: () => {
    fillStudioExample(form.taskType); render();
  } });
  const reset = btn(tr("resetForm"), { cls: "text-button", action: () => { form.goal = ""; form.input = ""; form.requirements = ""; form.providerConsent = false; form.consentDecisions = false; studio.formDirty = true; render(); } });
  const sampleRow = el("div", "action-row"); sampleRow.append(example, reset); box.append(sampleRow);
  const controls = el("div", "form-grid");
  controls.append(field(tr("provider"), select(form.provider, [["openai",tr("providerOpenAI")],["anthropic",tr("providerAnthropic")]], (event) => {
    if (form.provider !== event.target.value) { form.provider = event.target.value; form.providerConsent = false; form.consentDecisions = false; render(); }
  })));
  const modeControl = select(form.mode, [["standard",tr("standard")],["deep",tr("deep")]], (event) => { form.mode = event.target.value; updateAvailability(); });
  controls.append(field(tr("operationMode"), modeControl));
  box.append(controls);
  box.append(renderStudioConsent(form, updateAvailability));
  const actionRow = el("div", "action-row");
  const analyzeButton = btn(tr("analyze"), { cls: "button primary", disabled: state.jobBusy || !allowAi("studio", form.mode) || !studioCanSubmit(form), action: async () => {
    if (!form.goal.trim() || !form.input.trim()) { notify(tr("inputRequired"), "error"); return; }
    const request = buildStudioRequest({ operation: "analyze", taskType: form.taskType, goal: form.goal.trim(), input: form.input, requirements: form.requirements.split(/\r?\n/).map((x) => x.trim()).filter(Boolean), provider: form.provider, mode: form.mode, providerConsent: form.providerConsent, consentDecisions: form.consentDecisions });
    await runJob(request, processJobResult, { providerConsent: form.providerConsent });
  } });
  const costLabel = el("span", "help");
  function updateAvailability() {
    analyzeButton.disabled = state.jobBusy || !allowAi("studio", form.mode) || !studioCanSubmit(form);
    costLabel.textContent = `${form.mode === "deep" ? 10 : 1} ${tr("credits")} · ${tr("standardCost")} · ${tr("deepCost")}`;
  }
  actionRow.append(analyzeButton, costLabel); updateAvailability();
  box.append(actionRow);
  if (!allowAi("studio", form.mode)) box.append(alertBox(state.config?.mode === "disabled" ? tr("modeDisabled") : !isSignedIn() && getEntitlement("studio").plan !== "guest" ? tr("signInFirst") : tr("noCredits"), "warning"));
  target.append(box);
}
function renderStudioSelection(target) {
  const box = el("section", "step-card");
  box.append(sectionTitle(tr("stepSelect"), tr("analysisReturned")), infoBox(tr("analysisOnly")));
  if (state.studio.preflight) box.append(renderPreflight(state.studio.preflight));
  const summary = el("div", "contract-preview"); summary.textContent = `${state.studio.form.goal}\n\n${state.studio.form.input}`; box.append(summary);
  box.append(btn(tr("openGalaxy"), { cls: "button primary", action: () => openDecision() }), btn(tr("reanalyze"), { cls: "button", action: () => { state.studio.step = 1; state.studio.analysis = null; render(); } }));
  target.append(box);
}
function renderPreflight(preflight) {
  const panel = el("section", "preflight");
  panel.append(el("h3", "", tr("preflightTitle")));
  const status = preflight.status === "pass" ? tr("preflightPass") : preflight.status === "fail" ? tr("preflightNeedsDetail") : tr("preflightUnknown");
  panel.append(el("p", "muted", status));
  if (Array.isArray(preflight.questions) && preflight.questions.length) {
    panel.append(el("p", "field-label", tr("preflightQuestions")));
    const list = el("ul");
    preflight.questions.slice(0, 3).forEach((question) => list.append(el("li", "", question)));
    panel.append(list);
  }
  const taskKeys = { message: "messageTask", weekly: "weeklyTask", compare: "compareTask" };
  if (taskKeys[preflight.suggestedTask]) {
    const task = tr(taskKeys[preflight.suggestedTask]);
    panel.append(el("p", "", `${tr("suggestedTask")}: ${task}`), el("small", "muted", tr("suggestedTaskNote")));
  }
  return panel;
}
function openDecision() {
  if (!state.studio.analysis) { notify(tr("missingAnalysis"), "error"); return; }
  if (!decisionGalaxy.setGalaxy(state.studio.analysis, { goal: state.studio.form.goal })) { decisionGalaxy.showMessage(tr("missingAnalysis")); return; }
  if (state.studio.selectionDraft ?? state.studio.selection) decisionView.restoreDraft(state.studio.selectionDraft ?? state.studio.selection);
  decisionView.show(state.config?.mode === "demo" ? "demo" : "chat");
  decisionDialog.showModal();
}
function renderStudioContract(target) {
  const studio = state.studio;
  if (!studio.analysis || !studio.selection) { studio.step = 1; return renderStudioInput(target); }
  const contract = buildWorkContract({ ...studio.form, requirements: studio.form.requirements.split(/\r?\n/).map((x) => x.trim()).filter(Boolean), selection: studio.selection });
  studio.contract = contract;
  const box = el("section", "step-card"); box.append(sectionTitle(tr("contractTitle"), tr("contractHelp")));
  const sections = readableStudioSummary(studio);
  const summary = el("div", "request-summary");
  for (const section of sections) {
    const item = el("section", "request-summary-field"); item.append(el("h3", "", section.label));
    if (section.items) {
      if (section.items.length) { const list = el("ul", "request-summary-list"); section.items.forEach((value) => list.append(el("li", "", value))); item.append(list); }
      else item.append(el("p", "request-summary-content muted", section.emptyValue));
    } else item.append(el("p", "request-summary-content", section.value));
    summary.append(item);
  }
  box.append(summary);
  const edit = btn(tr("editInputs"), { cls: "button", action: () => { studio.step = 1; studio.analysis = null; studio.selection = null; render(); } });
  const templateAccess = studioTemplateSaveAccess(isSignedIn(), state.config?.authEnabled === true);
  const tmpl = btn(tr("saveTemplate"), { cls: "button", disabled: templateAccess.disabled, action: () => saveStudioTemplate() });
  const check = input("", { type: "checkbox", checked: studio.confirmedContract, onInput: (event) => { studio.confirmedContract = event.target.checked; updateGenerateAvailability(); } });
  const label = el("label", "check-line"); label.append(check, el("span", "", tr("confirmContract"))); box.append(label);
  const gen = btn(tr("generate"), { cls: "button primary", disabled: !studio.confirmedContract || state.jobBusy || !allowAi("studio", studio.form.mode) || !studioCanSubmit(studio.form), action: async () => {
    if (!studio.confirmedContract) return;
    await runJob(buildStudioRequest({ operation: "generate", provider: studio.form.provider, mode: studio.form.mode, providerConsent: studio.form.providerConsent, consentDecisions: studio.form.consentDecisions, contract, analysis: studio.analysis, selection: studio.selection }), processJobResult, { providerConsent: studio.form.providerConsent });
  } });
  function updateGenerateAvailability() { gen.disabled = !studio.confirmedContract || state.jobBusy || !allowAi("studio", studio.form.mode) || !studioCanSubmit(studio.form); }
  box.append(renderStudioConsent(studio.form, updateGenerateAvailability));
  updateGenerateAvailability();
  const actions = el("div", "action-row"); actions.append(edit, tmpl);
  if (templateAccess.showLoginHint) {
    actions.append(el("small", "help", tr("templateLoginRequired")));
    if (templateAccess.showSignIn) actions.append(link(tr("signInToSaveTemplate"), "/api/auth/login", "button small secondary"));
  }
  actions.append(gen); box.append(actions);
  target.append(box);
}

function selectionSummaryText(studio) {
  if (typeof studio.selectionText === "string" && studio.selectionText.trim()) return studio.selectionText;
  const selectedTitle = studio.selection?.baseKey ? studio.analysis?.archetypes?.[studio.selection.baseKey]?.title : tr("customSelection");
  return [selectedTitle, studio.selection?.notes].filter((value) => typeof value === "string" && value.trim()).join("\n");
}
function readableStudioSummary(studio) {
  return studioSummarySections(studio.contract ?? {}, selectionSummaryText(studio), {
    taskType: tr("taskTypeSummary"), taskTypes: { message: tr("messageTask"), weekly: tr("weeklyTask"), compare: tr("compareTask") },
    goal: tr("goalField"), background: tr("inputField"), requirements: tr("requirementsField"), selection: tr("selectionSummary"),
    noRequirements: tr("noRequirements"), noSelection: tr("noSelection"),
  });
}

function renderStudioLibrary() {
  const library = el("aside", "stack");
  const templates = el("section", "panel"); templates.append(sectionTitle(tr("reuseTemplate"), tr("changesOnly")));
  if (!state.studio.templates.length) templates.append(el("p", "muted", tr("noTemplates")));
  else {
    const selectTemplate = select("", [["",tr("chooseTemplate")], ...state.studio.templates.map((doc) => [doc.id,doc.title])]);
    const checks = el("div", "form-grid");
    const selectedFields = { taskType: true, goal: true, input: true, requirements: true };
    const checkDefs = [["taskType",tr("taskField")],["goal",tr("goalField")],["input",tr("inputField")],["requirements",tr("requirementsField")]];
    const items = [];
    for (const [key, labelText] of checkDefs) { const c = input("", { type: "checkbox", checked: true }); c.addEventListener("change", () => { selectedFields[key] = c.checked; }); const l = el("label", "check-line"); l.append(c, el("span", "", labelText)); items.push(l); checks.append(l); }
    templates.append(field(tr("chooseTemplate"), selectTemplate), checks, btn(tr("applyTemplate"), { cls: "button small", action: () => {
      const doc = state.studio.templates.find((item) => item.id === selectTemplate.value);
      if (!doc) { notify(tr("noTemplates"), "error"); return; }
      const data = doc.data?.contract ?? doc.data;
      if (!data || typeof data !== "object") { notify(tr("templateDataError"), "error"); return; }
      for (const key of Object.keys(selectedFields)) if (selectedFields[key] && key in data) state.studio.form[key] = key === "requirements" && Array.isArray(data[key]) ? data[key].join("\n") : data[key];
      state.studio.form.providerConsent = false; state.studio.form.consentDecisions = false;
      state.studio.formDirty = true;
      state.studio.analysis = null; state.studio.selection = null; state.studio.step = 1; render();
    } }));
  }
  library.append(templates);
  const works = el("section", "panel"); works.append(sectionTitle(tr("myWorks"), tr("guestClaim")));
  if (!state.studio.works.length) works.append(el("p", "muted", tr("noSaved")));
  for (const doc of state.studio.works) {
    const row = el("div", "saved-item"); row.append(el("span", "item-title", doc.title || tr("cloudWork")));
    const actions = el("span", "item-actions");
    actions.append(btn(tr("open"), { cls: "text-button", action: () => openStudioWork(doc) }));
    actions.append(btn(tr("history"), { cls: "text-button", action: () => loadStudioHistory(doc) }));
    actions.append(btn(tr("remove"), { cls: "text-button", action: () => deleteStudioDoc(doc) }));
    row.append(actions); works.append(row);
  }
  if (state.studio.history) works.append(renderStudioVersionCompare(state.studio.history.document, state.studio.history.versions));
  library.append(works);
  if (state.session?.user && (state.session.entitlements?.studio?.plan === "guest")) library.append(infoBox(tr("guestClaim")));
  return library;
}

function renderStudioArtifact(target) {
  const studio = state.studio;
  if (!studio.artifact) { studio.step = 1; return renderStudioInput(target); }
  const artifactCard = el("section", "step-card");
  artifactCard.append(sectionTitle(tr("artifactTitle"), tr("artifactHelp")));
  if (!studio.analysis || !studio.selection || !studio.contract) artifactCard.append(infoBox(tr("workContextMissing")));
  const workTitle = input(studio.currentDoc?.title ?? studio.contract?.goal ?? studio.form.goal, { maxLength: 200, placeholder: tr("workTitle"), onInput: (event) => { studio.workTitle = event.target.value; } });
  artifactCard.append(field(tr("workTitle"), workTitle));
  const content = textarea(studio.artifact.content, { rows: 18, maxLength: 100000, className: "artifact-editor", onInput: (event) => {
    studio.artifact.content = event.target.value; studio.artifactDirty = true;
    studio.evaluation = { ...(studio.evaluation ?? {}), status: "unknown", unavailableReason: "artifact_modified", checks: [] };
    const status = document.getElementById("evaluationStatus"); if (status) status.textContent = tr("evaluationUnknown");
    const evaluationBox = document.querySelector(".evaluation");
    evaluationBox?.querySelector("ul")?.remove();
    let reason = document.getElementById("evaluationReason");
    if (!reason && status) { reason = el("p", "muted"); reason.id = "evaluationReason"; status.after(reason); }
    if (reason) reason.textContent = tr("evaluationModified");
  } });
  artifactCard.append(field(tr("artifactContent"), content, tr("forceNoHTML")));
  const actions = el("div", "action-row");
  const aiActionButtons = [];
  function updateArtifactAiAvailability() { for (const button of aiActionButtons) button.disabled = state.jobBusy || !studioCanSubmit(studio.form) || !allowAi("studio", studio.form.mode) || !studio.analysis || !studio.selection; }
  actions.append(btn(tr("saveWork"), { cls: "button primary", action: () => saveStudioWork() }));
  actions.append(btn(tr("copyArtifact"), { cls: "button", action: () => copyText(studio.artifact.content) }));
  actions.append(btn(tr("exportMarkdown"), { cls: "button", action: () => exportStudioMarkdown() }));
  const evaluateButton = btn(tr("evaluateAgain"), { cls: "button secondary", disabled: state.jobBusy || !studioCanSubmit(studio.form) || !allowAi("studio", studio.form.mode) || !studio.analysis || !studio.selection, action: () => runJob(buildStudioRequest({ operation: "evaluate", provider: studio.form.provider, mode: studio.form.mode, providerConsent: studio.form.providerConsent, consentDecisions: studio.form.consentDecisions, contract: studio.contract, analysis: studio.analysis, selection: studio.selection, artifact: studio.artifact }), processJobResult, { providerConsent: studio.form.providerConsent }) });
  aiActionButtons.push(evaluateButton); actions.append(evaluateButton);
  artifactCard.append(actions);
  const revise = el("details", "panel"); revise.append(el("summary", "", tr("revise")));
  const instruction = textarea("", { rows: 3, placeholder: tr("reviseInstruction") }); revise.append(field(tr("reviseInstruction"), instruction));
  const reviseButton = btn(tr("reviseNow"), { cls: "button", disabled: state.jobBusy || !studioCanSubmit(studio.form) || !allowAi("studio", studio.form.mode) || !studio.analysis || !studio.selection, action: () => {
    const value = instruction.value.trim(); if (!value) { notify(tr("inputRequired"), "error"); return; }
    runJob(buildStudioRequest({ operation: "revise", provider: studio.form.provider, mode: studio.form.mode, providerConsent: studio.form.providerConsent, consentDecisions: studio.form.consentDecisions, contract: studio.contract, analysis: studio.analysis, selection: studio.selection, artifact: studio.artifact, instruction: value }), processJobResult, { providerConsent: studio.form.providerConsent });
  } });
  aiActionButtons.push(reviseButton); revise.append(reviseButton);
  artifactCard.append(renderStudioConsent(studio.form, updateArtifactAiAvailability));
  updateArtifactAiAvailability();
  target.append(artifactCard, renderEvaluation(studio.evaluation), revise);
}
function renderEvaluation(evaluation) {
  const box = el("section", "evaluation"); box.append(el("h3", "", tr("evaluation")));
  const status = evaluation?.status ?? "unknown";
  const statusLabel = status === "pass" ? tr("evaluationPass") : status === "fail" ? tr("evaluationFail") : tr("evaluationUnknown");
  const line = el("p", `evaluation-status ${["pass","fail"].includes(status) ? status : "unknown"}`, statusLabel); line.id = "evaluationStatus"; box.append(line);
  if (evaluation?.unavailableReason) {
    const reason = evaluation.unavailableReason;
    const reasonKey = { synthetic_demo: "evaluationDemo", cross_provider_consent_required: "evaluationConsent", check_unavailable: "evaluationCheckUnavailable", artifact_modified: "evaluationModified" }[reason];
    const reasonLine = el("p", "muted", reasonKey ? tr(reasonKey) : tr("evaluationUnavailable"));
    reasonLine.id = "evaluationReason";
    box.append(reasonLine);
  }
  if (status === "unknown") box.append(el("p", "muted", tr("unknownReview")));
  if (Array.isArray(evaluation?.checks)) {
    const list = el("ul");
    for (const check of evaluation.checks) {
      const item = el("li");
      const checkStatus = check.status === "pass" ? tr("evaluationPass") : check.status === "fail" ? tr("evaluationFail") : tr("evaluationUnknown");
      item.append(el("span", `check-status ${check.status === "pass" || check.status === "fail" ? check.status : "unknown"}`, `${checkStatus} · ${check.label ?? check.id ?? ""}`));
      if (check.source) item.append(document.createTextNode(` · ${tr(check.source === "deterministic" ? "evaluationSourceRules" : "evaluationSourceAI")}`));
      list.append(item);
    }
    box.append(list);
  }
  return box;
}

async function processJobResult(result, pending) {
  if (!accountScopeCurrent(pending?.accountScope)) return;
  if (pending.product === "studio") {
    const studio = state.studio;
    const payload = pending.request?.payload ?? {};
    if (pending.operation === "analyze") {
      if (!result.analysis) throw new Error(tr("missingAnalysis"));
      studio.form = { ...studio.form, taskType: payload.taskType ?? studio.form.taskType, goal: payload.goal ?? studio.form.goal, input: payload.input ?? studio.form.input, requirements: Array.isArray(payload.requirements) ? payload.requirements.join("\n") : studio.form.requirements };
      studio.analysis = result.analysis;
      studio.preflight = result.preflight ?? null;
      studio.selection = null;
      studio.step = 2;
      setNotice(tr("analysisReturned"), "success");
      navigate("/studio");
      return;
    }
    if (["generate", "revise", "evaluate"].includes(pending.operation)) {
      if (result.artifact) {
        studio.artifact = { ...result.artifact };
        if (typeof studio.artifact.content !== "string") throw new Error(tr("missingArtifact"));
        studio.artifactDirty = false;
      } else if (pending.operation !== "evaluate") throw new Error(tr("missingArtifact"));
      studio.contract = payload.contract ?? studio.contract;
      studio.analysis = payload.analysis ?? studio.analysis;
      studio.selection = payload.selection ?? studio.selection;
      studio.evaluation = result.evaluation ?? (pending.operation === "evaluate" ? studio.evaluation : { status: "unknown", checks: [], unavailableReason: tr("unknownReview") });
      studio.step = 4;
      if (studio.form.goal === "" && studio.contract?.goal) studio.form.goal = studio.contract.goal;
      setNotice(tr("completed"), "success");
      navigate("/studio");
      return;
    }
  }
  if (pending.product === "mandala") {
    const mandala = state.mandala;
    mandala.proposal = null;
    mandala.proposalSnapshot = pending.mandalaSnapshot ?? null;
    mandala.proposalStale = !mandalaOperationSnapshotMatches(mandala.proposalSnapshot, mandala);
    if (result.chart) {
      try { mandala.proposal = validateChart(result.chart); }
      catch { mandala.proposal = null; setNotice(tr("candidateInvalid"), "warning"); }
    }
    const written = result.suggestions ?? result.review ?? result;
    const proposalView = result.chart ? { chart: result.chart, ...(result.suggestions ? { suggestions: result.suggestions } : {}) } : written;
    try { mandala.proposalText = JSON.stringify(proposalView, null, 2); } catch { mandala.proposalText = String(proposalView); }
    if (!mandala.proposal && result.chart) setNotice(tr("candidateInvalid"), "warning");
    else if (mandala.proposalStale) setNotice(tr("staleProposal"), "warning");
    else if (!mandala.proposal && pending.operation === "review") setNotice(tr("noFullChart"), "warning");
    else setNotice(tr("proposalTitle"), "success");
    navigate("/mandala");
  }
}

async function startGuest() {
  if (state.accountTransition) return;
  const scope = captureAccountScope();
  try {
    let token = "";
    const key = state.config?.turnstileSiteKey;
    if (key) token = await turnstileToken(key);
    if (!accountScopeCurrent(scope)) return;
    await api.createGuest(token);
    if (!accountScopeCurrent(scope)) return;
    rememberGuestTrialUsed();
    setSession(api.session);
    applyStaticCopy();
    notify(tr("guestStart"));
    render();
  } catch (error) {
    if (!accountScopeCurrent(scope)) return;
    if (error.code === "guest_limit") rememberGuestTrialUsed();
    notify(toMessage(error), "error");
    if (error.code === "guest_limit") render();
  }
}
let turnstileScriptPromise = null;
async function turnstileToken(siteKey) {
  if (!siteKey) return "";
  if (!globalThis.turnstile) {
    turnstileScriptPromise ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true; script.defer = true;
      script.onload = resolve; script.onerror = () => reject(new Error(tr("noTurnstile")));
      document.head.append(script);
    });
    await turnstileScriptPromise;
  }
  return new Promise((resolve, reject) => {
    const host = document.getElementById("turnstile"); host.replaceChildren();
    try {
      const onError = () => reject(new Error(tr("noTurnstile")));
      globalThis.turnstile.render(host, guestTurnstileOptions(siteKey, { onToken: resolve, onError }));
    } catch { reject(new Error(tr("noTurnstile"))); }
  });
}

async function loadStudioDocuments() {
  const scope = captureAccountScope();
  state.studio.docsLoaded = true;
  try {
    const current = await applyHostedAccountResponse(Promise.all([api.documents("studio", "template"), api.documents("studio", "work")]), scope, accountContext, ([templates, works]) => {
      state.studio.templates = Array.isArray(templates.documents) ? templates.documents : [];
      state.studio.works = Array.isArray(works.documents) ? works.documents : [];
    });
    if (!current) return;
    if (state.route === "/studio") render();
  } catch (error) {
    if (!accountScopeCurrent(scope)) return;
    if (error.status !== 401 && error.status !== 403) notify(tr("docsError"), "error");
  }
}
async function saveStudioTemplate() {
  const studio = state.studio;
  if (!isSignedIn()) { notify(tr("templateLoginRequired"), "error"); return; }
  const scope = captureAccountScope();
  if (!studio.contract) { notify(tr("contractHelp"), "error"); return; }
  const title = (studio.workTitle || studio.form.goal).trim();
  if (!title) { notify(tr("titleRequired"), "error"); return; }
  try {
    const data = { taskType: studio.form.taskType, goal: studio.form.goal, input: studio.form.input, requirements: studio.contract.requirements };
    const saved = await api.saveDocument({ product: "studio", kind: "template", title, data });
    if (!accountScopeCurrent(scope)) return;
    studio.templates.unshift(saved.document);
    notify(tr("templateSaved")); render();
  } catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
async function saveStudioWork() {
  const studio = state.studio;
  const scope = captureAccountScope();
  const title = (studio.workTitle || studio.contract?.goal || "").trim();
  if (!title) { notify(tr("titleRequired"), "error"); return; }
  const data = { contract: studio.contract, analysis: studio.analysis, selection: studio.selection, selectionText: studio.selectionText, artifact: studio.artifact, evaluation: studio.evaluation };
  try {
    const response = await api.saveDocument({ product: "studio", kind: "work", title, data, ...documentSaveTarget(studio.currentDoc) });
    if (!accountScopeCurrent(scope)) return;
    studio.currentDoc = response.document;
    const at = studio.works.findIndex((item) => item.id === response.document.id);
    if (at >= 0) studio.works[at] = response.document; else studio.works.unshift(response.document);
    studio.docsLoaded = true; clearStudioContinuation(); await api.refreshSession().catch(() => {});
    if (!accountScopeCurrent(scope)) return;
    setSession(api.session);
    notify(tr("workSaved")); render();
  } catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
function openStudioWork(doc) {
  if (!isSignedIn() || !state.studio.works.some((item) => item.id === doc.id)) return;
  const data = doc.data ?? {};
  const contract = data.contract ?? {};
  const studio = state.studio;
  studio.currentDoc = doc;
  studio.history = null;
  studio.contract = contract;
  studio.analysis = data.analysis ?? null;
  studio.selection = data.selection ?? contract.selection ?? null;
  studio.selectionText = data.selectionText ?? "";
  studio.artifact = data.artifact ? { ...data.artifact } : null;
  studio.evaluation = data.evaluation ?? null;
  studio.artifactDirty = false;
  studio.workTitle = doc.title;
    studio.form = { ...studio.form, taskType: contract.taskType ?? "message", goal: contract.goal ?? "", input: contract.input ?? "", requirements: Array.isArray(contract.requirements) ? contract.requirements.join("\n") : "", providerConsent: false, consentDecisions: false };
  studio.formDirty = true;
  studio.step = studio.artifact ? 4 : 1;
  navigate("/studio");
}
async function loadStudioHistory(doc) {
  if (!isSignedIn() || !state.studio.works.some((item) => item.id === doc.id)) return;
  const scope = captureAccountScope();
  try {
    const current = await applyHostedAccountResponse(api.versions(doc.id), scope, accountContext, (response) => {
      if (state.studio.works.some((item) => item.id === doc.id)) state.studio.history = documentHistory(doc, response.versions);
    });
    if (!current || !state.studio.history) return;
    render();
  } catch (error) { if (accountScopeCurrent(scope)) notify(error.status === 403 ? tr("noHistoryPro") : toMessage(error), "error"); }
}
async function deleteStudioDoc(doc) {
  if (!confirm(tr("confirmDelete"))) return;
  const scope = captureAccountScope();
  try {
    await api.deleteDocument(doc.id);
    if (!accountScopeCurrent(scope)) return;
    state.studio.works = state.studio.works.filter((item) => item.id !== doc.id);
    state.studio.templates = state.studio.templates.filter((item) => item.id !== doc.id);
    if (state.studio.currentDoc?.id === doc.id) state.studio.currentDoc = null;
    if (state.studio.history?.document?.id === doc.id) state.studio.history = null;
    notify(tr("remove")); render();
  } catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
function renderStudioVersionCompare(doc, versions) {
  const box = el("section", "info-box"); box.append(el("h3", "", tr("versionCompare")));
  if (!versions.length) { box.append(el("p", "muted", tr("noHistory"))); return box; }
  const choices = versions.map((v, i) => [String(i), `${tr("version")} ${v.revision ?? i + 1}`]);
  const leftPick = select(choices[0][0], choices, () => showDiff());
  const rightPick = select(choices.at(-1)[0], choices, () => showDiff());
  const diff = el("div", "diff");
  function showDiff() {
    const { left, right } = historyVersionPair(documentHistory(doc, versions), Number(leftPick.value), Number(rightPick.value));
    const before = el("pre"); before.textContent = JSON.stringify(left, null, 2);
    const after = el("pre"); after.textContent = JSON.stringify(right, null, 2);
    diff.replaceChildren(before, after);
  }
  showDiff();
  box.append(field(tr("previous"), leftPick), field(tr("current"), rightPick), diff);
  return box;
}
function exportStudioMarkdown() {
  const studio = state.studio;
  const content = `# ${studio.currentDoc?.title || studio.contract?.goal || tr("cloudWork")}\n\n## ${tr("workContract")}\n\n${studioSummaryMarkdown(readableStudioSummary(studio))}\n\n## ${tr("artifactContent")}\n\n${studio.artifact?.content ?? ""}\n`;
  downloadFile(`${filenameFor(studio.currentDoc?.title || studio.contract?.goal,"studio-work")}.md`, content, "text/markdown;charset=utf-8");
}

function renderPricing() {
  const page = newPage("page-shell narrow");
  page.append(heading(tr("pricing"), tr("pricingLead"), "INTENT GALAXY"));
  const grid = el("div", "pricing-grid");
  const entStudio = getEntitlement("studio");
  const entMandala = getEntitlement("mandala");
  const studio = el("article", "pricing-card");
  studio.append(el("p", "eyebrow", tr("studio")), el("h2", "", tr("studioPro")), el("p", "price", `TWD 399 ${tr("perMonth")}`), el("p", "muted", tr("proStudio")), el("p", "muted", tr("standardCost")), el("p", "muted", tr("deepCost")));
  studio.append(el("p", "badge", `${planText(entStudio.plan)} · ${entStudio.credits ?? 0} ${tr("credits")}`));
  studio.append(btn(state.config?.billingEnabled ? tr("checkout") : tr("checkoutUnavailable"), { cls: "button primary", disabled: !state.config?.billingEnabled, action: () => startCheckout("studio") }));
  const mandala = el("article", "pricing-card");
  mandala.append(el("p", "eyebrow", tr("mandala")), el("h2", "", tr("mandalaPro")), el("p", "price", `TWD 199 ${tr("perMonth")}`), el("p", "muted", tr("proMandala")), el("p", "muted", tr("freeMandala")));
  mandala.append(el("p", "badge", `${planText(entMandala.plan)} · ${entMandala.credits ?? 0} ${tr("credits")}`));
  mandala.append(btn(state.config?.billingEnabled ? tr("checkout") : tr("checkoutUnavailable"), { cls: "button primary", disabled: !state.config?.billingEnabled, action: () => startCheckout("mandala") }));
  grid.append(studio, mandala); page.append(grid);
  page.append(infoBox(tr("guestTrial")), infoBox(tr("homeFoot")), infoBox(tr("freePeriod")), infoBox(tr("noOverage")));
}
async function startCheckout(product) {
  if (!state.config?.billingEnabled) { notify(tr("checkoutUnavailable"), "error"); return; }
  if (state.accountTransition) return;
  const scope = captureAccountScope();
  try {
    const { url } = await api.checkout(product);
    if (!accountScopeCurrent(scope)) return;
    const target = new URL(url);
    if (target.protocol !== "https:") throw new Error(tr("invalidCheckout"));
    location.assign(target.href);
  } catch (error) { if (accountScopeCurrent(scope)) notify(error instanceof Error ? error.message : toMessage(error), "error"); }
}
function renderLegal(kind) {
  const page = newPage("page-shell narrow");
  const privacy = kind === "privacy";
  page.append(heading(privacy ? tr("privacyPage") : tr("termsPage"), privacy ? tr("privacyLead") : tr("termsLead"), tr("siteDraft")));
  const card = el("article", "legal-card");
  const keys = privacy ? ["privacyOne","privacyTwo","privacyThree"] : ["termsOne","termsTwo","termsThree"];
  for (const key of keys) card.append(el("p", "", tr(key)));
  card.append(infoBox(tr("supportUnavailable")));
  page.append(card);
}

function renderMandala() {
  const mandala = state.mandala;
  const reviewFor = mandala.localId ?? mandala.cloudDoc?.id ?? "current";
  if (mandala.reviewFor !== reviewFor) { mandala.reviewFor = reviewFor; mandala.reviewDate = new Date().toISOString().slice(0,10); mandala.reviewNote = ""; loadReview(reviewFor); }
  const page = newPage();
  const head = heading(tr("mandalaTitle"), tr("mandalaLead"), tr("standalone"));
  page.append(head, creditsPanel("mandala"));
  if (!isSignedIn() && state.config?.authEnabled) page.append(link(tr("signIn"), "/api/auth/login", "button small"));
  showJobStatus(page);
  const section = el("section", "stack mandala-section"); section.dataset.view = mandala.view;
  section.append(renderMandalaControls());
  const chartCard = el("section", "panel"); chartCard.append(sectionTitle(tr("chartLabel"), tr("themesHint")));
  const title = input(mandala.chart.title, { maxLength: 160, placeholder: tr("chartTitle"), onInput: (event) => { mandala.chart.title = event.target.value; touchChart(); } });
  chartCard.append(field(tr("chartTitle"), title, tr("titleHint")));
  const goal = textarea(mandala.chart.goal, { rows: 2, maxLength: 500, placeholder: tr("goal"), className: "compact", onInput: (event) => { mandala.chart.goal = event.target.value; touchChart(); } });
  chartCard.append(field(tr("roleGoal"), goal));
  chartCard.append(renderMandalaGrid(mandala.chart), renderMandalaGroups(mandala.chart));
  const progress = chartProgress(mandala.chart);
  const meter = el("div", "mandala-progress"); meter.id = "mandalaProgress"; meter.append(el("span", "", `${tr("progress")}: ${progress.done}/64`));
  const track = el("span", "progress-track"); const fill = el("span"); fill.style.width = `${Math.round(progress.done / 64 * 100)}%`; track.append(fill); meter.append(track); chartCard.append(meter);
  const review = renderWeeklyReview();
  const saved = renderMandalaSaved(); saved.classList.add("mandala-saved");
  const ai = renderMandalaAI(); ai.classList.add("mandala-ai");
  section.append(chartCard, review, saved, ai);
  page.append(section);
  if (!mandala.cloudLoaded && isSignedIn()) loadMandalaCloudGoals();
}

function renderMandalaControls() {
  const mandala = state.mandala;
  const toolbar = el("section", "panel mandala-toolbar");
  const left = el("div", "button-row");
  left.append(btn(tr("newChart"), { cls: "button", action: () => { state.mandala.chartEpoch++; state.mandala.chart = createEmptyChart(); state.mandala.localId = null; state.mandala.cloudDoc = null; state.mandala.proposal = null; state.mandala.proposalSnapshot = null; state.mandala.proposalText = ""; state.mandala.proposalStale = false; state.mandala.reviewNote = ""; render(); } }));
  left.append(btn(tr("saveLocal"), { cls: "button primary", action: () => saveLocalChart() }));
  left.append(btn(tr("saveCloud"), { cls: "button", disabled: !isSignedIn(), action: () => saveCloudChart() }));
  left.append(btn(tr("exportJson"), { cls: "button small", action: () => exportMandalaJson() }));
  left.append(btn(tr("exportMarkdown"), { cls: "button small", action: () => exportMandalaMarkdown() }));
  left.append(btn(tr("printPdf"), { cls: "button small", action: () => window.print() }));
  const picker = input("", { type: "file" }); picker.accept = "application/json,.json"; picker.id = "mandalaImport"; picker.className = "sr-only"; picker.setAttribute("aria-label", tr("importJson")); picker.addEventListener("change", async () => {
    const file = picker.files?.[0]; if (!file) return;
    try { const imported = parseChartJson(await file.text()); state.mandala.chartEpoch++; state.mandala.chart = structuredClone(imported); state.mandala.localId = null; state.mandala.cloudDoc = null; state.mandala.reviewFor = null; state.mandala.reviewNote = ""; state.mandala.proposal = null; state.mandala.proposalSnapshot = null; state.mandala.proposalStale = false; render(); notify(tr("chartValid"), "success"); }
    catch { notify(tr("importFailed"), "error"); }
    finally { picker.value = ""; }
  });
  const importLabel = el("label", "button small", tr("importJson")); importLabel.htmlFor = picker.id; importLabel.append(picker); left.append(importLabel);
  const right = el("div", "button-row");
  right.append(btn(tr(mandala.view === "grid" ? "groupView" : "gridView"), { cls: "button small view-toggle", action: () => { mandala.view = mandala.view === "grid" ? "group" : "grid"; render(); } }));
  toolbar.append(left, right); return toolbar;
}
function touchChart() {
  const mandala = state.mandala;
  mandala.chartEpoch++;
  if (mandala.proposalSnapshot && !mandalaOperationSnapshotMatches(mandala.proposalSnapshot, mandala)) mandala.proposalStale = true;
  document.querySelectorAll("[data-mirror]").forEach((mirror) => {
    const theme = mandala.chart.themes.find((item) => item.id === mirror.dataset.mirror);
    if (theme) mirror.textContent = theme.title || tr("themeTitle");
  });
  const progress = chartProgress(mandala.chart);
  const meter = document.getElementById("mandalaProgress");
  if (meter) { meter.firstChild.textContent = `${tr("progress")}: ${progress.done}/64`; const fill = meter.querySelector(".progress-track > span"); if (fill) fill.style.width = `${Math.round(progress.done / 64 * 100)}%`; }
}
function makeActionEditor(action, ti, ai, { grouped = false } = {}) {
  const wrap = el(grouped ? "div" : "article", grouped ? "group-action" : "mandala-cell");
  if (!grouped) wrap.dataset.role = "action";
  const body = textarea(action.text, { rows: 2, maxLength: 500, placeholder: `${tr("actionNo")} ${ai + 1}`, onInput: (event) => { state.mandala.chart.themes[ti].actions[ai].text = event.target.value; touchChart(); } });
  body.setAttribute("aria-label", `${tr("themeNo")} ${ti + 1}, ${tr("actionNo")} ${ai + 1}`);
  const check = input("", { type: "checkbox", checked: action.done, onInput: (event) => { state.mandala.chart.themes[ti].actions[ai].done = event.target.checked; touchChart(); } });
  const label = el("label", "action-check"); label.append(check, document.createTextNode(tr("done")));
  const meta = el("details"); meta.append(el("summary", "", tr("details")));
  const due = input(action.dueDate ?? "", { type: "date", onInput: (event) => { state.mandala.chart.themes[ti].actions[ai].dueDate = event.target.value; touchChart(); } }); due.setAttribute("aria-label", tr("dueDate"));
  const notes = textarea(action.notes ?? "", { rows: 2, maxLength: 1000, placeholder: tr("notes"), onInput: (event) => { state.mandala.chart.themes[ti].actions[ai].notes = event.target.value; touchChart(); } }); notes.setAttribute("aria-label", tr("notes"));
  meta.append(due, notes);
  if (grouped) {
    const extra = el("div", "action-extra"); extra.append(label, due); wrap.append(body, label, extra, notes);
  } else {
    wrap.append(el("span", "cell-index", `${tr("actionNo")} ${String(ti + 1)}.${String(ai + 1)}`), body, label, meta);
  }
  return wrap;
}
function renderMandalaGrid(chart) {
  const grid = el("div", "mandala-grid-scroll");
  const table = el("div", "mandala-grid"); table.setAttribute("role", "group"); table.setAttribute("aria-label", tr("chartLabel"));
  const themeIndexByCell = new Map(THEME_POSITIONS.map(([r,c],i) => [`${r},${c}`,i]));
  const blockThemeIndex = new Map(THEME_POSITIONS.map(([r,c],i) => [`${r},${c}`,i]));
  const actionPositions = [[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[2,0],[1,0]];
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
    const macroRow = Math.floor(row / 3), macroCol = Math.floor(col / 3), innerRow = row % 3, innerCol = col % 3;
    if (macroRow === 1 && macroCol === 1) {
      const cell = el("div", "mandala-cell");
      if (innerRow === 1 && innerCol === 1) {
        cell.dataset.role = "goal"; cell.append(el("span", "cell-index", tr("roleGoal")));
        const area = textarea(chart.goal, { rows: 4, maxLength: 500, placeholder: tr("goal"), className: "goal-input", onInput: (event) => { state.mandala.chart.goal = event.target.value; touchChart(); } }); area.setAttribute("aria-label", tr("roleGoal")); cell.append(area);
      } else {
        const ti = themeIndexByCell.get(`${innerRow},${innerCol}`); const theme = chart.themes[ti]; cell.dataset.role = "theme";
        cell.append(el("span", "cell-index", `${tr("themeNo")} ${ti + 1}`));
        const themeInput = input(theme.title, { maxLength: 200, placeholder: tr("themeTitle"), className: "theme-input", onInput: (event) => { state.mandala.chart.themes[ti].title = event.target.value; touchChart(); } }); themeInput.setAttribute("aria-label", `${tr("themeNo")} ${ti + 1}`); cell.append(themeInput);
      }
      table.append(cell); continue;
    }
    const themeIndex = blockThemeIndex.get(`${macroRow},${macroCol}`);
    const theme = chart.themes[themeIndex];
    if (innerRow === 1 && innerCol === 1) {
      const mirror = el("div", "mandala-cell", theme.title || tr("themeTitle")); mirror.dataset.role = "mirror"; mirror.dataset.mirror = theme.id; mirror.title = tr("mirrored"); table.append(mirror); continue;
    }
    const ai = actionPositions.findIndex(([r,c]) => r === innerRow && c === innerCol);
    table.append(makeActionEditor(theme.actions[ai], themeIndex, ai));
  }
  grid.append(table); return grid;
}
function renderMandalaGroups(chart) {
  const groups = el("div", "mandala-groups"); groups.append(el("p", "muted", tr("groupViewHint")));
  chart.themes.forEach((theme, ti) => {
    const group = el("section", "theme-group"); const header = el("header"); header.append(el("b", "", `${tr("themeNo")} ${ti + 1}`));
    const title = input(theme.title, { maxLength: 200, placeholder: tr("themeTitle"), onInput: (event) => { state.mandala.chart.themes[ti].title = event.target.value; touchChart(); } }); title.setAttribute("aria-label", `${tr("themeNo")} ${ti + 1}`); header.append(title);
    group.append(header); const list = el("ol"); theme.actions.forEach((action, ai) => { const li = el("li"); li.append(makeActionEditor(action, ti, ai, { grouped: true })); list.append(li); }); group.append(list); groups.append(group);
  });
  return groups;
}
function renderWeeklyReview() {
  const mandala = state.mandala; const box = el("section", "panel"); box.append(sectionTitle(tr("weeklyReview"), tr("localHistory")));
  const fields = el("div", "review-grid");
  const date = input(mandala.reviewDate, { type: "date", onInput: (event) => { mandala.reviewDate = event.target.value; } }); date.setAttribute("aria-label", tr("reviewDate"));
  const note = textarea(mandala.reviewNote, { rows: 3, maxLength: 4000, placeholder: tr("reviewNote"), onInput: (event) => { mandala.reviewNote = event.target.value; } }); note.setAttribute("aria-label", tr("reviewNote"));
  fields.append(field(tr("reviewDate"), date), field(tr("reviewNote"), note));
  const progress = chartProgress(mandala.chart); box.append(fields, el("p", "muted", `${tr("reviewProgress")}: ${progress.done}/64`));
  box.append(btn(tr("saveReview"), { cls: "button small", action: () => saveReview() })); return box;
}
function reviewKey(id) { return `ig:mandala:review:${id || "current"}`; }
function saveReview() {
  try { localStorage.setItem(reviewKey(state.mandala.localId ?? state.mandala.cloudDoc?.id), JSON.stringify({ date: state.mandala.reviewDate, note: state.mandala.reviewNote, done: chartProgress(state.mandala.chart).done })); notify(tr("savedLocal"), "success"); }
  catch { notify(tr("saveError"), "error"); }
}

function renderMandalaSaved() {
  const box = el("section", "panel"); box.append(sectionTitle(tr("localSaved"), tr("localOnly")));
  const records = localCharts.list();
  if (!records.length) box.append(el("p", "muted", tr("noGoals")));
  const list = el("div", "saved-list");
  for (const record of records) {
    const row = el("div", "saved-item"); row.append(el("span", "item-title", record.data.title || record.data.goal || tr("chartTitle")));
    const actions = el("span", "item-actions");
    actions.append(btn(tr("open"), { cls: "text-button", action: () => { state.mandala.chartEpoch++; state.mandala.chart = structuredClone(record.data); state.mandala.localId = record.id; state.mandala.cloudDoc = null; state.mandala.proposal = null; state.mandala.proposalSnapshot = null; state.mandala.proposalStale = false; loadReview(record.id); render(); } }));
    actions.append(btn(tr("remove"), { cls: "text-button", action: () => removeLocalChart(record) })); row.append(actions); list.append(row);
  }
  box.append(list, el("p", "help", tr("exportHint")));
  if (isSignedIn()) {
    const cloud = el("section", "panel"); cloud.append(sectionTitle(tr("cloudSaved"), tr("cloudLimit")));
    if (!state.mandala.cloudGoals.length) cloud.append(el("p", "muted", tr("noCloudDocs")));
    const cloudList = el("div", "saved-list");
    for (const doc of state.mandala.cloudGoals) {
      const row = el("div", "saved-item"); row.append(el("span", "item-title", doc.title || tr("chartTitle")));
      const actions = el("span", "item-actions");
      actions.append(btn(tr("open"), { cls: "text-button", action: () => openCloudGoal(doc) }));
      actions.append(btn(tr("history"), { cls: "text-button", action: () => loadMandalaHistory(doc) }));
      actions.append(btn(tr("remove"), { cls: "text-button", action: () => deleteCloudGoal(doc) })); row.append(actions); cloudList.append(row);
    }
    cloud.append(cloudList);
    if (state.mandala.cloudHistory) cloud.append(renderMandalaVersionCompare(state.mandala.cloudHistory.document, state.mandala.cloudHistory.versions));
    box.append(cloud);
  }
  return box;
}
function loadReview(id) {
  try { const review = JSON.parse(localStorage.getItem(reviewKey(id)) ?? "null"); if (review) { state.mandala.reviewDate = review.date ?? state.mandala.reviewDate; state.mandala.reviewNote = review.note ?? ""; } }
  catch { /* invalid local review is ignored */ }
}
async function removeLocalChart(record) {
  if (!confirm(tr("confirmRemove"))) return;
  localCharts.remove(record.id);
  if (state.mandala.localId === record.id) { state.mandala.chartEpoch++; state.mandala.localId = null; state.mandala.chart = createEmptyChart(); state.mandala.proposal = null; state.mandala.proposalSnapshot = null; state.mandala.proposalStale = false; }
  render(); notify(tr("remove"));
}
function saveLocalChart() {
  try {
    validateChart(state.mandala.chart);
    const record = localCharts.save(state.mandala.chart, state.mandala.localId || undefined);
    state.mandala.localId = record.id; notify(tr("savedLocal"), "success"); render();
  } catch (error) { notify(chartError(error), "error"); }
}
function exportMandalaJson() {
  try {
    validateChart(state.mandala.chart);
    downloadFile(`${filenameFor(state.mandala.chart.title || state.mandala.chart.goal,"mandala")}.json`, JSON.stringify(state.mandala.chart, null, 2), "application/json;charset=utf-8");
  } catch (error) { notify(chartError(error), "error"); }
}
function exportMandalaMarkdown() {
  try { downloadFile(`${filenameFor(state.mandala.chart.title || state.mandala.chart.goal,"mandala")}.md`, chartMarkdown(state.mandala.chart), "text/markdown;charset=utf-8"); }
  catch (error) { notify(chartError(error), "error"); }
}
async function loadMandalaCloudGoals() {
  const scope = captureAccountScope();
  state.mandala.cloudLoaded = true;
  try {
    const current = await applyHostedAccountResponse(api.documents("mandala", "goal"), scope, accountContext, (response) => { state.mandala.cloudGoals = Array.isArray(response.documents) ? response.documents : []; });
    if (!current) return;
    if (state.route === "/mandala") render();
  }
  catch (error) { if (accountScopeCurrent(scope) && error.status !== 401 && error.status !== 403) notify(toMessage(error), "error"); }
}
async function saveCloudChart() {
  if (!isSignedIn()) { notify(tr("signInToCloud"), "error"); return; }
  const mandala = state.mandala;
  const scope = captureAccountScope();
  try {
    validateChart(mandala.chart);
    const title = (mandala.chart.title || mandala.chart.goal).trim();
    if (!title) { notify(tr("titleRequired"), "error"); return; }
    const response = await api.saveDocument({ product: "mandala", kind: "goal", title, data: chartDto(mandala.chart), ...documentSaveTarget(mandala.cloudDoc) });
    if (!accountScopeCurrent(scope)) return;
    mandala.cloudDoc = response.document;
    const at = mandala.cloudGoals.findIndex((doc) => doc.id === response.document.id);
    if (at >= 0) mandala.cloudGoals[at] = response.document; else mandala.cloudGoals.unshift(response.document);
    await api.refreshSession().catch(() => {});
    if (!accountScopeCurrent(scope)) return;
    setSession(api.session);
    notify(tr("cloudGoalSaved"), "success"); render();
  } catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
function openCloudGoal(doc) {
  if (!isSignedIn() || !state.mandala.cloudGoals.some((item) => item.id === doc.id)) return;
  try {
    state.mandala.chartEpoch++; state.mandala.chart = structuredClone(validateChart(doc.data)); state.mandala.cloudDoc = doc; state.mandala.localId = null; state.mandala.proposal = null; state.mandala.proposalSnapshot = null; state.mandala.proposalStale = false; state.mandala.cloudHistory = null; render();
  } catch (error) { notify(chartError(error), "error"); }
}
async function deleteCloudGoal(doc) {
  if (!confirm(tr("confirmDelete"))) return;
  const scope = captureAccountScope();
  try { await api.deleteDocument(doc.id); if (!accountScopeCurrent(scope)) return; state.mandala.cloudGoals = state.mandala.cloudGoals.filter((item) => item.id !== doc.id); if (state.mandala.cloudDoc?.id === doc.id) state.mandala.cloudDoc = null; if (state.mandala.cloudHistory?.document?.id === doc.id) state.mandala.cloudHistory = null; render(); notify(tr("remove")); }
  catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
async function loadMandalaHistory(doc) {
  const scope = captureAccountScope();
  try {
    const current = await applyHostedAccountResponse(api.versions(doc.id), scope, accountContext, (response) => {
      if (state.mandala.cloudGoals.some((item) => item.id === doc.id)) state.mandala.cloudHistory = documentHistory(doc, response.versions);
    });
    if (current && state.mandala.cloudHistory?.document?.id === doc.id) render();
  }
  catch (error) { if (accountScopeCurrent(scope)) notify(error.status === 403 ? tr("noHistoryPro") : toMessage(error), "error"); }
}
function renderMandalaVersionCompare(doc, versions) {
  const box = el("section", "info-box"); box.append(el("h3", "", `${tr("cloudHistory")} · ${doc.title}`));
  if (versions.length < 2) { box.append(el("p", "muted", tr("noHistory"))); return box; }
  const choices = versions.map((v,i) => [String(i), `${tr("version")} ${v.revision ?? i + 1}`]);
  const beforePick = select("0", choices, update); const afterPick = select(String(versions.length - 1), choices, update);
  const diff = el("div", "diff");
  function update() {
    const { left, right } = historyVersionPair(documentHistory(doc, versions), Number(beforePick.value), Number(afterPick.value));
    const a = el("pre"); a.textContent = JSON.stringify(left, null, 2); const b = el("pre"); b.textContent = JSON.stringify(right, null, 2); diff.replaceChildren(a,b);
  }
  update(); box.append(field(tr("previous"), beforePick), field(tr("current"), afterPick), diff); return box;
}
function renderMandalaAI() {
  const mandala = state.mandala;
  const box = el("section", "panel"); box.append(sectionTitle(tr("useAI"), tr("applyProposalHint")), creditsPanel("mandala"));
  if (!allowAi("mandala", mandala.mode)) {
    const entitlement = getEntitlement("mandala");
    const message = state.config?.mode === "disabled" ? tr("modeDisabled") : entitlement.plan !== "pro" ? tr("aiMandalaNoCredits") : !isSignedIn() ? tr("signInFirst") : tr("noCredits");
    box.append(alertBox(message, "warning"));
  }
  const controls = el("div", "form-grid");
  controls.append(field(tr("provider"), select(mandala.provider, [["openai",tr("providerOpenAI")],["anthropic",tr("providerAnthropic")]], (event) => {
    if (mandala.provider !== event.target.value) { mandala.provider = event.target.value; mandala.consent = false; render(); }
  })));
  const modeControl = select(mandala.mode, [["standard",tr("standard")],["deep",tr("deep")]], (event) => { mandala.mode = event.target.value; updateAiButtons(); });
  controls.append(field(tr("operationMode"), modeControl));
  box.append(controls);
  const instruction = textarea(mandala.instruction, { rows: 3, maxLength: 4000, placeholder: tr("aiInstruction"), onInput: (event) => { mandala.instruction = event.target.value; } }); box.append(field(tr("aiInstruction"), instruction));
  const c = input("", { type: "checkbox", checked: mandala.consent, onInput: (event) => { mandala.consent = event.target.checked; } }); const label = el("label", "check-line"); label.append(c, el("span", "", tr("providerConsent"))); box.append(label);
  c.addEventListener("change", updateAiButtons);
  const actions = el("div", "action-row");
  const aiButtons = [];
  for (const [op,key] of [["expand","expand"],["review","review"]]) {
    const actionButton = btn(tr(key), { cls: op === "expand" ? "button primary" : "button", disabled: state.jobBusy || !mandala.consent || !allowAi("mandala", mandala.mode), action: () => {
    try { validateChart(mandala.chart); } catch (error) { notify(chartError(error), "error"); return; }
    if (!mandala.chart.goal.trim()) { notify(tr("goalRequired"), "error"); return; }
    const payload = { chart: chartDto(mandala.chart) }; if (mandala.instruction.trim()) payload.instruction = mandala.instruction.trim();
    const snapshot = createMandalaOperationSnapshot({ chart: payload.chart, localId: mandala.localId, cloudDoc: mandala.cloudDoc, epoch: mandala.chartEpoch });
    if (!snapshot) { notify(tr("candidateInvalid"), "error"); return; }
    runJob({ product: "mandala", operation: op, provider: mandala.provider, mode: mandala.mode, consentDecisions: false, payload }, processJobResult, { providerConsent: mandala.consent, mandalaSnapshot: snapshot });
    } });
    aiButtons.push(actionButton); actions.append(actionButton);
  }
  function updateAiButtons() { for (const button of aiButtons) button.disabled = state.jobBusy || !mandala.consent || !allowAi("mandala", mandala.mode); }
  box.append(actions);
  if (mandala.proposal) {
    const proposal = el("section", "proposal"); proposal.append(el("h3", "", tr("proposalTitle")), el("p", "muted", tr("applyProposalHint")));
    if (mandala.proposalStale) proposal.append(alertBox(tr("staleProposal"), "warning"));
    const preview = el("pre"); preview.textContent = mandala.proposalText || JSON.stringify(mandala.proposal, null, 2); proposal.append(preview);
    proposal.append(btn(tr("applyProposal"), { cls: "button secondary", disabled: mandala.proposalStale, action: () => {
      const current = { chart: mandala.chart, localId: mandala.localId, cloudDoc: mandala.cloudDoc, epoch: mandala.chartEpoch };
      const outcome = applyMandalaProposalIfCurrent(current, mandala.proposalSnapshot, mandala.proposal);
      if (!outcome.applied) { mandala.proposalStale = true; setNotice(tr("staleProposal"), "warning"); render(); return; }
      try { state.mandala.chart = structuredClone(validateChart(outcome.chart)); state.mandala.chartEpoch++; state.mandala.proposal = null; state.mandala.proposalSnapshot = null; state.mandala.proposalStale = false; setNotice(tr("proposalApplied"), "success"); render(); }
      catch { notify(tr("candidateInvalid"), "error"); }
    } }));
    box.append(proposal);
  } else if (mandala.proposalText) {
    const proposal = el("section", "proposal"); proposal.append(el("h3", "", tr("proposalReview")));
    if (mandala.proposalStale) proposal.append(alertBox(tr("staleProposal"), "warning"));
    else proposal.append(el("p", "muted", tr("noFullChart")));
    const preview = el("pre"); preview.textContent = mandala.proposalText; proposal.append(preview); box.append(proposal);
  }
  return box;
}

async function init() {
  languageSelect.value = locale;
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("ig:theme", next); } catch { /* optional */ }
  });
  languageSelect.addEventListener("change", (event) => setLocale(event.target.value));
  document.getElementById("closeDecision").addEventListener("click", () => decisionDialog.close());
  decisionDialog.addEventListener("click", (event) => { if (event.target === decisionDialog) decisionDialog.close(); });
  document.body.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href^='/']");
    if (!anchor || anchor.target) return;
    const targetUrl = new URL(anchor.href, location.origin);
    if (targetUrl.origin === location.origin && targetUrl.pathname === "/api/auth/login") {
      if (!saveStudioContinuationBeforeLogin()) { event.preventDefault(); notify(tr("draftSaveFailed"), "error"); }
      return;
    }
    if (anchor.href.includes("/api/")) return;
    event.preventDefault(); navigate(anchor.getAttribute("href"));
  });
  window.addEventListener("popstate", () => { state.route = location.pathname; render(); });
  try {
    await localeReady;
    await chooseLocale(locale === "zh" ? "zh-Hant-TW" : "en");
    setupDecisionView();
    const storedTheme = localStorage.getItem("ig:theme"); if (storedTheme === "dark" || storedTheme === "light") document.documentElement.dataset.theme = storedTheme;
    const bootstrap = await api.bootstrap();
    state.config = bootstrap.config; setSession(bootstrap.session); state.studioContinuation = readStudioContinuation(); state.pending = readStoredPending(); state.ready = true;
    if (!state.pending) applyStudioTemplateFromUrl();
    await recoverPending();
    applyStaticCopy(); render();
  } catch (error) {
    state.ready = true;
    const page = newPage("page-shell narrow"); page.append(heading(tr("sessionError"), toMessage(error)), btn(tr("retry"), { cls: "button primary", action: () => location.reload() }));
  }
}
init();
