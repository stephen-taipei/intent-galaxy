import "/galaxy/apps/web/galaxy-overlay.js";
import { DecisionView } from "/galaxy/apps/web/decision-view.js";
import { chooseLocale, ready as localeReady } from "/galaxy/apps/web/i18n.js";
import { HostedApi, ApiError, guestTurnstileOptions, randomKey } from "./api.js";
import { LEGAL } from "./legal.js";
import { visibleApps } from "./apps.js";
import { applyHostedAccountResponse, applyMandalaProposalIfCurrent, buildStudioRequest, buildWorkContract, captureHostedAccountScope, chartDto, chartMarkdown, chartProgress, clearHostedAccountState, compareDocuments, createEmptyChart, createMandalaOperationSnapshot, createStudioContinuation, documentHistory, documentSaveTarget, filenameFor, historyVersionPair, hostedAccountScopeMatches, LocalChartStore, mandalaOperationSnapshotMatches, parseChartJson, parseStudioContinuation, studioCanSubmit, studioSummaryMarkdown, studioSummarySections, studioTemplateSaveAccess, studioTemplateFromSearch, THEME_POSITIONS, validateChart } from "./model.js";

const COPY = {
  zh: {
    navGalaxy:"我的星系", navExplore:"探索", navTools:"工具", parkName:"Stephen 的工具園區", demoTag:"示範", quotaDaily:"每日 AI {n} 張", quotaGuest:"AI 要登入", menuLanguage:"語言", menuTheme:"深淺色", askTitle:"把一件事，想清楚。", askLabel:"你最近在想什麼事？", askPlaceholder:"例如：明年要不要轉職產品經理", askCreate:"建立主題", askStart:"開始", askLensHint:"先用哪個鏡頭看它？", lensMandala:"展開脈絡", lensStudio:"做出決定", lensMind:"收進記憶", lensMindSub:"Mind Galaxy · 僅限你", askNeedTitle:"先寫下你在想的事。", myTopics:"我的主題", topicsPrivate:"{n} 個 · 只有你看得到", viewList:"清單", viewMap:"星圖", viewMapSoon:"星圖是第二階段", mapHint:"每顆星是一個主題，越多產出越大顆；點星進主題。相鄰的星會連成線。", mapLegendMandala:"有九宮格", mapLegendStudio:"有決策", colTopic:"主題", colUpdated:"更新", countCharts:"{n} 張", countWorks:"{n} 份", notYet:"還沒有", notIn:"尚未收進", topicExplain:"同一個主題在九宮格、Intent Galaxy、Mind Galaxy 裡用同一顆星。點進主題，就能在鏡頭之間跳。", noTopicsYet:"還沒有主題。在上面寫下一件事，就會長出第一顆星。", exploreCardTitle:"大家公開的九宮格", exploreCardBody:"看別人怎麼拆一個目標，替他們加油，或複製一張改成你的。", mapCardEyebrow:"星圖 · 第二階段", mapCardTitle:"主題越多，星圖越亮", guestExampleTitle:"一張填好的九宮格長這樣", guestExampleBody:"中心是目標，周圍 8 個主題，每個主題再展開 8 個行動。不用登入就能手動編輯、匯出。", today:"今天", daysAgo:"{n} 天前", topicCreatedOn:"{d} 建立", topicLensCount:"3 個鏡頭 · 只有你看得到", nextStep:"下一步", nextExpand:"這個主題還沒有九宮格。先把它展開成 8 個主題、64 個行動，看清楚全貌。", nextDecide:"九宮格有了，但還沒做決定。用 Intent Galaxy 攤開選項和盲區，鎖定一個方向。", nextContinue:"九宮格和決策都有了。回九宮格把行動做完，完成的會留在歷程裡。", newChartInTopic:"在這個主題開一張九宮格", newDecisionInTopic:"用 Intent Galaxy 決策這個主題", mindAutoLead:"鎖定的決策與完成的行動會留在這個主題的歷程裡。", mindExportHere:"目前先匯出 JSON 到你本機的 Mind Galaxy。", mindLater:"Mind Galaxy 搬進園區排在第三階段。", noMemory:"還沒有記憶", topicHistory:"這個主題的歷程", historyCreated:"建立主題「{t}」", historyMandala:"九宮格「{t}」更新", historyStudio:"決策「{t}」更新", historyHint:"這條歷程就是未來 Mind Galaxy 的雛形：鎖定的決策、完成的行動、改過的想法都會留在這裡。", expandActions:"展開行動", markDone:"達成", markSkip:"略過", themeComplete:"這個主題的 8 個行動都處理完了", goalComplete:"64 個行動都處理完了", proposeThemesShort:"請 AI 提主題", moreActions:"更多：匯出、列印、匯入、版本", publicBtn:"公開", gridHint:"點任何一格直接打字。虛線格是還沒填的；按「展開行動」讓 AI 填空格，你改完再套用。", aiCardTitle:"AI 提案", consentFirst:"先在右側「AI 提案」勾選同意，才會送出資料。", sameTopicDecision:"同主題的決策", openTopic:"看主題", noTopicYet:"還沒歸到主題", libraryTitle:"已存的九宮格", toolsTitle:"工具", toolsLead:"一個帳號用所有工具。工具之間用「主題」串起來，所以通常從「我的星系」進來，不是從這裡。", groupLenses:"鏡頭 · 看同一件事的三種方式", groupPlaces:"場所", planTitle:"方案", planLead:"整個園區一套方案。測試期間全部免費，只有每日 AI 額度上限；不會自動加購，也不會超額扣款。", planCanDo:"每天可以", planAiCharts:"AI 九宮格", planAiCalls:"AI 呼叫", planInviteCodes:"分享碼", planManual:"手動編輯、匯出 PNG／PDF／Excel", planCloud:"雲端保存、版本", planTopics:"主題、跨工具跳轉", planExplore:"探索：看、加油、複製、公開", planStudio:"Intent Galaxy 決策", planPrice:"價格", planFreeShort:"免費", planCan:"可以", planNo:"—", planTierUp:"依用量分級提高", planMore:"更多", planGuestInvite:"0 · 朋友的分享碼可體驗 1 張", planLocalOnly:"只存在這台裝置", planCloudCount:"{n} 張，含版本", planShareOnly:"只能看分享連結", planGuest24h:"訪客工作 24 小時後到期", planSave:"可以保存", planPriceNote:"價格和額度依測試期實際用量決定，測試期間不收費", planFoot:"付費切法是「所有工具都能用，依 AI 用量分級」，不是依工具鎖。", nCharts:"{n} 張", nTimes:"{n} 次", nCodes:"{n} 組，7 天有效", lensMandalaDesc:"展開脈絡。一個目標拆成 8 個主題、64 個行動，AI 可以提主題、填空格，你改完再套用。", lensStudioDesc:"做出決定。60 秒攤開所有選項和盲區，鎖定一個決策，產出可執行的需求摘要。", lensMindDesc:"收進記憶。鎖定的決策和完成的行動會留在主題歷程裡。目前只有你的帳號看得到，第三階段搬進園區。", exploreDesc:"大家公開的九宮格。加油、複製、看範例。登入後使用。", fromTopicPage:"從主題頁匯出 JSON", windowLabelShort:"區間", myProfile:"我的公開檔案", feedMore:"往下捲會載入更多。範例和用戶作品用同一套排序，數字都從 0 開始。", open9x9:"看完整九宮格", skip:"跳到主要內容", studio:"決策工作室", mandala:"九宮格目標規劃", pricing:"方案與價格", privacy:"隱私", terms:"使用條款", language:"介面語言", theme:"切換明暗主題", close:"關閉", primaryNavigation:"主要導覽", legalNavigation:"法律資訊", signIn:"Google 登入", signOut:"登出", signedIn:"已登入", signedOut:"已登出。此帳戶的雲端資料已從此頁清除。", demoBanner:"示範模式：畫面中的分析與生成結果由伺服器提供合成資料，不代表真實模型輸出。",
    homeEyebrow:"從想法到可執行的工作", homeTitle:"先釐清真正要做的事，再交給 AI。", homeLead:"AI 工作室把決策整理成清楚的需求摘要；九宮格目標規劃把一個目標展開為 8 個主題與 64 個行動。", studioCard:"把複雜問題整理成可確認的需求摘要，再產生可編輯、可評估的成果。", mandalaCard:"免費手動整理 81 格目標地圖；你可以把目標存到雲端或請 AI 提出修改建議。", openStudio:"開啟 AI 工作室", openMandala:"開啟九宮格目標規劃", learnPricing:"查看方案", homeFoot:"AI 工作室與九宮格目標規劃各自計費、各自使用點數。", home:"首頁",
    guest:"訪客", free:"免費", pro:"Pro", credits:"點數", guestTrial:"訪客可體驗 1 次分析與 1 次生成。", guestTrialActive:"免費體驗已開始", guestTrialUsed:"此瀏覽器已無可用訪客額度，可能是已使用或逾期；服務試用名額也可能已滿。登入後可繼續使用免費方案。", guestTrialUsedShort:"訪客體驗已使用或逾期。", guestTrialUnavailable:"目前無法提供免費體驗。", guestStart:"開始免費體驗", guestClaim:"訪客工作會在 24 小時後到期；登入後必須明確選擇儲存才能認領。", signInFirst:"請登入或開始訪客體驗後再繼續。", authLoading:"正在讀取帳戶…", csrfError:"工作階段已過期，請重新載入頁面。", apiError:"無法連線到服務。請稍後再試。", appError:"操作失敗。", modeDisabled:"服務未開放 AI 操作。", noCredits:"目前點數不足，無法執行這項操作。",
    standard:"一般（1 點）", deep:"深度（10 點）", standardCost:"一般操作 1 點", deepCost:"深度操作 10 點", provider:"AI 服務商", providerOpenAI:"OpenAI", providerAnthropic:"Anthropic", operationMode:"操作模式", providerConsent:"我同意把此工作資料傳送給所選服務商，以完成分析與生成。", decisionsConsent:"我另外同意把此工作資料交給 OpenAI 做 AI 檢查。", decisionsConsentHelp:"不勾選仍可使用 Anthropic 分析與生成；AI 檢查會標示為「未知」，不會把資料送給 OpenAI。", consentNeeded:"執行 AI 操作前，請先同意把資料傳送給所選服務商。", privacyNote:"只有在你按下 AI 操作按鈕後才會送出資料。頁面不會自動送出，也不會從生成內容執行外部動作。", inputSavedLocally:"輸入不會自動存到伺服器文件。", inputRequired:"請先填寫目標與背景輸入。", guestStartHelp:"訪客工作會在 24 小時後到期；登入後必須明確選擇儲存才能認領。",
    studioTitle:"決策工作室", stepInput:"輸入問題", stepSelect:"選擇方案", stepContract:"確認需求摘要", stepArtifact:"成果與評估", taskType:"工作類型", messageTask:"單次訊息", weeklyTask:"每週更新", compareTask:"方案比較", goal:"目標", inputText:"背景與輸入", requirements:"必須符合的要求", requirementsHelp:"每行一項。", example:"載入範例", resetForm:"清除輸入", exampleMessageGoal:"草擬客服回覆並保留事實", exampleMessageInput:"客戶反映新功能同步資料時卡住。已知情況：只在大型資料集發生；修復日期尚未確認。請協助寫一封回覆，先承認問題，再說明已知狀況。", exampleMessageRequirement:"不要承諾尚未確認的修復日期。", exampleWeeklyGoal:"整理本週產品進度並提出下週重點", exampleWeeklyInput:"本週：完成登入流程重構；匯入錯誤仍未定位；兩位測試者要求 CSV 匯出。下週可用工程時間約 3 人日。", exampleWeeklyRequirement:"分清已確認事實與尚未確認的資訊。", exampleCompareGoal:"比較維持現況與重做流程", exampleCompareInput:"選項 A：先修補現有匯入流程，約 2 天。選項 B：重寫匯入器，約 2 週。使用者等待時間是主要問題，團隊沒有專職 QA。", exampleCompareRequirement:"分開列出已知成本與尚未確認的條件。", analyze:"開始分析", analysisReturned:"伺服器已回傳分析。選擇方案卡後，可再檢視或編輯星系。", preflightTitle:"補充檢查", preflightPass:"目前輸入看起來足以繼續。", preflightNeedsDetail:"目前資料可能不足，請先檢查以下問題。", preflightUnknown:"無法判定輸入是否完整。", preflightQuestions:"可補充的問題", suggestedTask:"建議的工作類型", suggestedTaskNote:"這只是補充建議，不會自動更改你選擇的工作類型。", analysisOnly:"分析完成。尚未選擇方案。", openGalaxy:"選擇與調整方案", reanalyze:"重新分析", missingAnalysis:"工作完成，但回應沒有分析內容。", analysis:"分析", acceptRisk:"我了解 AI 結果仍需自行檢查。", weeklyTask:"每週更新", comparison:"比較方案",
    contractTitle:"需求摘要草稿", contractHelp:"確認目標、輸入內容、要求與已選方案。按下確認後才會生成。", taskTypeSummary:"工作類型", selectionSummary:"選擇摘要", noRequirements:"沒有額外要求。", noSelection:"尚無選擇摘要。", customSelection:"自訂方案", editInputs:"修改輸入並重新分析", confirmContract:"我已檢查這份需求摘要，並同意用它生成成果。", generate:"確認需求並生成", saveTemplate:"儲存為範本", templateLoginRequired:"登入後才能儲存雲端範本。", signInToSaveTemplate:"登入並儲存範本", restoreDraftTitle:"登入前的工作草稿", restoreDraftHelp:"這份草稿只暫存在此瀏覽器分頁 24 小時，不會自動保存到雲端。", restoreDraftButton:"恢復登入前草稿", restoreDraftDirty:"目前已有編輯內容，為避免覆寫，登入前草稿暫不載入。", restoreDraftLocalOnly:"草稿已恢復到 AI 工作室，尚未保存至雲端。檢查內容後，按「儲存工作」即可認領。", restoreDraftExpired:"登入前草稿已逾期，系統已清除暫存。", draftSaveFailed:"無法在此分頁暫存草稿。為避免遺失內容，登入已取消；請先複製或匯出成果後再試。", reuseTemplate:"套用已儲存範本", changesOnly:"只套用勾選欄位。", chooseTemplate:"選擇範本", taskField:"工作類型", goalField:"目標", inputField:"背景與輸入", requirementsField:"要求", applyTemplate:"套用所選欄位", noTemplates:"尚無範本。", templateDataError:"範本資料格式無效。", myWorks:"已儲存工作", noSaved:"目前沒有已儲存資料。", cloudWork:"雲端工作", open:"開啟", history:"版本紀錄", remove:"刪除", requestId:"工作識別碼", clearJob:"清除狀態提示",
    hostedDecisionPreviewTitle:"確認已選方案", hostedDecisionPreviewLead:"請檢查目前選擇。下一步會整理成需求摘要。", hostedDecisionPreviewBody:"已選方案摘要", hostedDecisionSendNote:"確認後會回到 AI 工作室。你可先檢查需求摘要，再決定是否生成成果。", hostedDecisionPreserve:"你仍可返回調整方案，或繼續檢查需求摘要。", hostedDecisionPreviewHint:"檢視選擇後，可前往需求摘要確認並生成。",
    statusQueued:"排入佇列", statusRunning:"正在執行", statusCompleted:"完成", statusFailed:"失敗", statusUnknown:"未知", working:"工作進行中…", jobAccepted:"伺服器已接受工作。", jobFailed:"工作失敗", jobUnknown:"工作狀態未知；伺服器沒有回報可確認的結果。", unknownOutcome:"工作結果尚未確認。請查詢同一工作狀態；不要重送相同操作。", jobRecoverable:"可查詢這筆工作的伺服器狀態；頁面不會自動重送。", checkStatus:"查詢工作狀態", stillChecking:"仍在查詢同一工作。", recovered:"已從伺服器查回工作結果。", noRetries:"未知結果不會自動重送。", callUnknown:"送出結果未知", eventError:"伺服器回報錯誤", malformedResponse:"伺服器回應格式不完整。", staleWrite:"雲端文件已被其他分頁更新。請重新載入後再儲存。", documentSaved:"已儲存雲端文件。", csrfError:"工作階段已過期，請重新載入頁面。",
    artifactTitle:"可編輯成果", artifactHelp:"手動修改成果後，先前評估會失效。需要時可明確要求重新評估。", artifactContent:"成果內容", forceNoHTML:"使用純文字編輯，輸入不會當成 HTML 執行。", workContextMissing:"這份舊工作沒有保存分析與選擇資料，因此不能重新評估或要求 AI 修改。你仍可編輯、複製與匯出成果。", saveWork:"儲存工作", copyArtifact:"複製成果", exportMarkdown:"匯出 Markdown", evaluateAgain:"重新評估（付費操作）", revise:"請 AI 修改", reviseInstruction:"修改要求", reviseNow:"送出修改要求", workTitle:"工作名稱", evaluation:"評估", evaluationPass:"通過", evaluationFail:"未通過", evaluationUnknown:"未知／無法判定", evaluationInvalidated:"成果已修改，先前評估已失效。", evaluationDemo:"示範模式不會執行真實語意評估。", evaluationConsent:"缺少所需的跨服務商同意，無法執行語意評估。", evaluationCheckUnavailable:"語意評估目前無法使用。", evaluationUnavailable:"語意評估目前無法使用。", evaluationModified:"成果已修改，請重新評估。", evaluationSourceRules:"規則檢查", evaluationSourceAI:"AI 評估", unknownReview:"未知不代表通過。", copied:"已複製。", copyFailed:"無法自動複製；請手動選取內容。",
    pricing:"方案與價格", pricingLead:"兩項產品獨立訂閱，不共用點數。", studioPro:"AI 工作室 Pro", mandalaPro:"九宮格目標規劃 Pro", freePlan:"免費", perMonth:"／月", works:"已儲存工作", templates:"範本", cloudGoals:"雲端目標", freeStudio:"每月 20 點、5 份工作、3 個範本。", proStudio:"每月 200 點、100 份工作、50 個範本。", freeMandala:"完整手動編輯與匯出；登入後可存 1 個雲端目標；不含 AI 點數。", proMandala:"每月 100 點，可存 20 個雲端目標。", checkoutUnavailable:"伺服器尚未啟用結帳。", checkoutOff:"結帳尚未由伺服器啟用。", checkout:"升級方案", monthly:"每月", invalidCheckout:"伺服器沒有回傳有效的 HTTPS 結帳網址。",
    privacyLead:"本頁說明託管版前端如何呼叫服務。資料處理與保留細節以部署者公布的政策為準。", termsLead:"此託管版目前是可供檢視的服務草稿。付款與正式營運依伺服器設定開啟後才會生效。", privacyPage:"隱私說明", termsPage:"使用條款草稿", privacyOne:"登入與工作狀態由同源服務 API 管理。此介面只會在你明確開始操作時送出內容。", privacyTwo:"你輸入的目標、背景、分析結果與成果可能送往你選擇的 AI 服務商。請勿輸入不適合傳送的機密資料。", privacyThree:"文件儲存、刪除、帳務與資料保留期限由伺服器執行；此頁不假設尚未公開的保留細節。", termsOne:"AI 分析與建議可能出錯。使用者需自行檢查輸入、候選與成果。", termsTwo:"九宮格目標規劃的本機檔案由使用者裝置管理；雲端功能受帳戶、方案與伺服器額度限制。", termsThree:"此介面不會自動下單、付款、部署或對外傳送生成內容。付款跳轉只會在服務設定啟用結帳後，由使用者明確操作。", unsupportedRoute:"找不到這個頁面。",
    trialTitle:"免費 AI 體驗", trialLead:"先由 AI 提出 8 個主題，再逐格展開成行動。所有結果都要按「套用」才會寫入。", trialProvider:"使用 Anthropic Claude：主題由 Sonnet 產生，展開與多視角由 Haiku 產生。", trialUnavailable:"目前沒有開放免費 AI 體驗。", trialLimit:"今天的免費 AI 次數已用完，明天再試，或先手動編輯。", trialNeedsSession:"登入後每天可免費用 AI 產生 {charts} 張九宮格；收到朋友的兌換碼，也能免登入體驗一次。", trialInvite:"你正在使用朋友的兌換碼，可以免登入體驗 {charts} 張九宮格。登入後就能保存，並且每天免費使用。", trialDaily:"登入使用者每天可免費產生 {charts} 張九宮格。", trialLoginRequired:"登入後才能使用免費 AI，或請朋友分享兌換碼給你。", redeemTitle:"使用兌換碼", redeemLead:"朋友分享了九宮格 AI 體驗給你。完成驗證後，就能免登入體驗一次。", redeemCode:"兌換碼", redeemButton:"兌換並開始體驗", redeemed:"兌換成功，可以開始體驗了。", inviteInvalid:"兌換碼無效、已被使用或已過期。", inviteUsed:"這個瀏覽器已經用過兌換碼。登入後每天都能免費使用。", invitesTitle:"分享給朋友", invitesLead:"每天可產生 {n} 組兌換碼，朋友不用登入就能體驗一次。每組只能用一次，7 天內有效。", inviteCreate:"產生兌換碼", inviteCopy:"複製連結", inviteCopied:"已複製邀請連結。", inviteLimit:"今天的兌換碼已達上限，或還有太多組沒被使用。", inviteOpen:"未使用", inviteRedeemed:"已兌換", inviteJoined:"已加入", inviteExpired:"已過期", noInvites:"還沒有產生兌換碼。", examplesTitle:"範例九宮格", examplesLead:"不用登入也能看：這些範例由 AI 事先產生，打開後可以直接修改成你的版本。", examplesOpen:"開啟範例", examplesLoading:"正在載入範例…", examplesUnavailable:"目前無法載入範例。", exampleOpened:"已開啟範例。修改後記得儲存。", generateThemes:"AI 產生主題", expandTheme:"展開這個主題", expandEmpty:"展開所有空白主題", perspectives:"換個視角看看", perspectivesTitle:"其他視角的主題（點選後替換到指定格）", chooseTheme:"選擇主題", replaceSlot:"替換到", replace:"替換", lensQ1:"歸零者：從零重想", lensQ2:"老兵：前人做法", lensQ3:"越界者：跨領域借用", lensQ4:"驗屍官：先防失敗", skippedActions:"有 {n} 格與其他主題重複，已留白，可以再展開一次。", themeReplaced:"已替換主題，記得儲存。", noEmptyThemes:"8 個主題都已填寫。", 
    parkTitle:"Stephen 的工具園區", parkLead:"一個帳號用所有工具。工具之間用「主題」串起來：在九宮格展開脈絡，用 Intent Galaxy 做決策，同一個主題的成果都收在一起。", parkFoot:"測試期間全部免費，只有每日 AI 額度上限。", statusLive:"上線", statusBeta:"測試中", statusSoon:"即將推出", statusOwner:"僅限你", openApp:"開啟", signInToUse:"登入後使用", app_mandala_name:"九宮格目標規劃", app_mandala_desc:"把一個目標展開成 8 個主題與 64 個行動，AI 可以幫你提主題、展開行動。", app_galaxy_name:"Intent Galaxy 決策工作室", app_galaxy_desc:"先攤開所有選項與盲點，再鎖定決策，產出可執行的需求摘要。", app_feed_name:"動態牆", app_feed_desc:"看大家公開的九宮格，替他們加油，或複製一張改成你的。", app_topics_name:"我的主題", app_topics_desc:"同一件事在各個工具的成果，集中在一起、互相跳轉。", app_mind_name:"Mind Galaxy", app_mind_desc:"收納決策歷程與背景脈絡。目前只有你的帳號看得到。", topicsNav:"我的主題", topicsTitle:"我的主題", topicsLead:"主題只有你自己看得到。把九宮格和決策歸到同一個主題，就能互相跳轉。", topicNew:"新主題名稱", topicCreate:"建立主題", topicRename:"改名", topicDelete:"刪除主題", topicDeleteConfirm:"刪除主題不會刪除裡面的九宮格與決策，只會取消歸類。確定刪除？", topicEmpty:"這個主題還沒有內容。", noTopics:"還沒有主題。", topicNone:"未歸類", topicPanelTitle:"主題", topicPanelLead:"把這份成果歸到主題，同主題的九宮格與決策可以互相跳轉。", topicSaveFirst:"先存到雲端，才能歸到主題。", topicLinked:"已歸到主題。", topicUnlinked:"已取消歸類。", topicSiblings:"同主題的其他成果", topicLimit:"主題數量已達上限（200 個）。", topicTitleInvalid:"主題名稱需要 1 到 120 個字。", product_mandala:"九宮格", product_studio:"決策", decideInGalaxy:"用 Intent Galaxy 決策這個主題", expandToMandala:"展開成九宮格", newChartFromGoal:"已用這個目標開了一張新九宮格。存到雲端後會自動歸到同一個主題。", galaxyFromGoal:"已帶入目標。存檔後會自動歸到同一個主題。", mindTitle:"Mind Galaxy", mindLead:"目前只有你的帳號看得到。先在這裡把主題歷程匯出成 JSON，匯入你本機的 Mind Galaxy；Mind Galaxy 搬進園區排在第三階段。", mindExport:"匯出 JSON", mindExported:"已下載主題歷程。", parkPricingLead:"整個園區一個帳號、一套方案。測試期間全部免費，只有每日 AI 額度上限。", planGuestTitle:"未登入", planGuest:"可以用所有公開工具、看範例和分享頁、手動編輯與匯出。AI 要登入，或用朋友給的分享碼體驗一次。", planFreeTitle:"登入（免費）", planFree:"每天 {charts} 張 AI 九宮格、每天 {invites} 組分享碼；雲端保存、主題、動態牆。", planProTitle:"付費方案（規劃中）", planPro:"所有工具都能用，依 AI 用量分級提高每日額度。價格和額度會依測試期的實際用量決定，測試期間不收費。",
    feed:"動態牆", feedTitle:"大家的九宮格", feedLead:"看別人怎麼拆解目標，替他們加油，或複製一張改成你的。九宮格小編發布的範例也照同樣規則排名。", feedSignIn:"動態牆只開放登入的使用者瀏覽。登入後可以看大家公開的九宮格、加油和複製。", signInFeed:"登入看動態牆", sortNew:"最新", sortHot:"熱門", sortCopied:"最多複製", sortDone:"完成度", sortLabel:"排序", windowLabel:"時間範圍", window7d:"7 天", window30d:"30 天", windowAll:"全部", sourceLabel:"作者", sourceAll:"全部", sourceUsers:"只看用戶作品", sourceExamples:"只看範例", tagLabel:"分類", allTags:"全部分類", tag_health:"健康", tag_learning:"學習", tag_career:"職涯", tag_money:"理財", tag_sports:"運動", tag_creative:"創作", tag_family:"家庭", tag_life:"生活", brandName:"九宮格小編", exampleBadge:"範例", encourage:"加油", encouraged:"已加油", copyToMine:"複製到我的九宮格", copiedToMine:"已複製到編輯區，記得存檔。", share:"分享", shareSystem:"分享到…", shareCopyLink:"複製連結", shareLine:"LINE", shareFacebook:"Facebook", linkCopied:"已複製連結。", download:"下載", downloadPng:"圖片 PNG", downloadPdf:"PDF", downloadXlsx:"Excel", downloadFailed:"下載失敗，請再試一次。", report:"檢舉", reportConfirm:"確定要檢舉這張九宮格嗎？", reason_personal_data:"含個人資料", reason_harmful:"有害或冒犯", reason_spam:"廣告或垃圾訊息", reason_other:"其他", reported:"已收到檢舉，會由人工審查。", showActions:"看 64 個行動", feedEmpty:"這個條件下還沒有公開的九宮格。", feedEnd:"已經到底了。", feedLoading:"載入中…", loadMore:"載入更多", statEncourages:"{n} 個加油", statCopies:"{n} 次複製", statViews:"{n} 次瀏覽", profileTitle:"公開檔案", profileLead:"動態牆上顯示的暱稱與頭像，不會顯示你的 email。", nickname:"暱稱", avatar:"頭像", saveProfile:"儲存公開檔案", profileSaved:"已儲存公開檔案。", profileRequired:"請先設定暱稱與頭像。", publishTitle:"公開到動態牆", publishLead:"公開的是快照：標題、目標、主題、行動與完成狀態，備註和到期日不會公開。修改後要按「更新公開版本」才會同步。", publishNeedsCloud:"先把這張九宮格存到雲端，才能公開。", publishTags:"分類（最多 3 個）", publish:"公開", publishUpdate:"更新公開版本", unpublish:"取消公開", published:"已公開到動態牆。", unpublished:"已取消公開。", confirmUnpublish:"確定要取消公開嗎？收到的加油和複製紀錄會一起刪除。", publishedHidden:"這張九宮格因檢舉暫時隱藏，等待人工審查。", publicLink:"公開連結", tooManyTags:"最多選 3 個分類。", goalNeeded:"請先寫下中心目標。", sharedCta:"登入後可以替作者加油、複製這張九宮格，也能看更多人的目標。", makeOwn:"自己做一張", sharedMissing:"找不到這張九宮格，可能已取消公開或被隱藏。", backToFeed:"回到動態牆", downloadImage:"下載圖片", downloadPdfFile:"下載 PDF", downloadExcel:"下載 Excel", xlsxGrid:"九宮格", xlsxList:"行動清單", xlsxTheme:"主題", xlsxAction:"行動", xlsxDone:"完成",
    mandalaTitle:"九宮格目標規劃", mandalaLead:"以一個中心目標展開 8 個主題與 64 個可追蹤行動。手動編輯、儲存與匯出不需要 AI。", standalone:"獨立的目標規劃工具", chartTitle:"目標名稱", chartLabel:"九宮格目標規劃", themeTitle:"主題", action:"行動", done:"已完成", dueDate:"到期日", notes:"備註", progress:"完成進度", weeklyReview:"每週回顧", reviewDate:"回顧日期", reviewNote:"本週觀察與下一步", reviewProgress:"本週進度", saveReview:"儲存每週回顧", gridView:"81 格檢視", groupView:"主題分組檢視", mirrored:"主題鏡像", themesHint:"中央的 8 個主題會鏡像到周圍 8 個 3×3 區塊。", actionHint:"可填行動、完成狀態、日期與備註。", newChart:"新目標", saveLocal:"儲存到此裝置", saveCloud:"儲存到雲端", exportJson:"匯出 JSON", exportMarkdown:"匯出 Markdown", printPdf:"列印／存成 PDF", importJson:"匯入有效 JSON", importFailed:"匯入失敗。請選擇 schemaVersion 1 且含 8 個主題、每個主題 8 個行動的 JSON。", localSaved:"此裝置的目標", cloudSaved:"雲端目標", noGoals:"尚無目標。", goalCount:"目標數", localOnly:"手動目標表可在此裝置使用，不需要登入。", cloudLimit:"雲端目標數量由伺服器依方案限制。", localHistory:"本機回顧不會建立雲端版本。", useAI:"AI 建議", expand:"展開行動", review:"檢視目標", aiInstruction:"給 AI 的補充要求（選填）", applyProposal:"套用完整候選圖", proposalTitle:"AI 候選圖（尚未套用）", proposalReview:"AI 回饋", staleProposal:"圖表在產生建議後有變更。這份候選已過期，請重新執行 AI 操作。", noFullChart:"服務回傳建議文字，沒有可套用的完整候選圖。請依建議自行修改。", candidateInvalid:"服務回傳的候選圖不符合 8×8 格式，沒有套用。", proposalApplied:"已套用候選圖，請檢查內容並手動保存。", applyProposalHint:"候選圖只會在你按下套用後取代目前圖表。", saveGoalFirst:"先儲存雲端目標，才能查看雲端版本。", cloudHistory:"雲端版本", selectCloudGoal:"選擇雲端目標", noCloudDocs:"尚無雲端目標。", noHistory:"沒有可讀取的版本紀錄。", noHistoryPro:"版本紀錄需要 Pro 方案。", chooseDecision:"選擇並調整方案", useSelection:"使用此方案", previewSelection:"檢視選擇", copyDecision:"複製決策", titleRequired:"請填寫文件名稱。", goalRequired:"請先填寫中心目標。", status:"狀態", source:"來源", none:"無", version:"版本", current:"目前版本", comparison:"方案比較", compareVersions:"比較版本", chooseVersion:"選擇版本", chartValid:"有效的 8×8 圖表", invalidChart:"圖表格式不正確。", chartTooLarge:"圖表資料太大，請縮短行動或備註內容後再試。", noResult:"沒有結果。", signInFirst:"請登入或開始訪客體驗後再繼續。", signIn:"Google 登入", signOut:"登出", signedIn:"已登入", authDisabled:"此環境未啟用登入。", language:"介面語言", privacy:"隱私", terms:"使用條款", home:"首頁",
    needsLogin:"登入後才可使用雲端保存。", aiMandalaNoCredits:"九宮格目標規劃免費方案不含 AI 點數；手動編輯與匯出仍可使用。", signInToCloud:"登入後可使用雲端保存。", saveError:"儲存失敗。", confirmRemove:"要刪除這份已儲存資料嗎？", confirmDelete:"要刪除這份文件嗎？", saved:"已儲存。", savedLocal:"已儲存到此裝置。", cloudGoalSaved:"雲端目標已保存。", exportHint:"匯出內容只包含此份圖表資料。", importHelp:"匯入會先完整驗證，不會合併不完整資料。", noTemplates:"尚無範本。", noSaved:"目前沒有已儲存資料。", selectProvider:"選擇服務商", ready:"準備就緒", active:"使用中", updated:"已更新。", signInGoogle:"使用 Google 登入", billing:"帳務", checkoutMessage:"結帳由服務端啟用後才可使用。", supportUnavailable:"支援資訊尚未設定。", noAIForFree:"免費方案不含 Mandala AI 點數。", providerOpenAI:"OpenAI", providerAnthropic:"Anthropic", error:"錯誤", close:"關閉", remove:"刪除", open:"開啟", retry:"重新載入", loading:"載入中…",
    requestId:"工作識別碼", eventError:"伺服器回報錯誤", inputRequired:"請先填寫目標與背景輸入。", privacyNote:"只有在你按下 AI 操作按鈕後才會送出資料。頁面不會自動送出，也不會從生成內容執行外部動作。", modeDisabled:"服務未開放 AI 操作。", consentNeeded:"執行 AI 操作前，請先勾選資料傳送同意。", noRetries:"未知結果不會自動重送。", checkStatus:"查詢工作狀態", stillChecking:"仍在查詢同一工作。", jobUnknown:"工作狀態未知；伺服器沒有回報可確認的結果。", jobRecoverable:"可查詢這筆工作的伺服器狀態；頁面不會自動重送。", clearJob:"清除狀態提示", callUnknown:"送出結果未知", working:"工作進行中…", jobAccepted:"伺服器已接受工作。", statusQueued:"排入佇列", statusRunning:"正在執行", statusCompleted:"完成", statusFailed:"失敗", statusUnknown:"未知", jobFailed:"工作失敗", recovered:"已從伺服器查回工作結果。", malformedResponse:"伺服器回應格式不完整。", actionNo:"行動", completed:"工作完成。", details:"詳細資料", docsError:"無法讀取雲端文件。", groupViewHint:"手機版以主題分組，資料與 81 格檢視相同。", missingArtifact:"工作完成，但回應沒有成果內容。", noTurnstile:"請完成頁面上的人機驗證後重試。", previous:"比較版本 A", roleGoal:"中心目標", runningJob:"正在查詢工作狀態。", sessionError:"無法讀取登入狀態。", siteDraft:"服務草稿", templateSaved:"範本已保存。", themeNo:"主題", titleHint:"最多 160 字。", versionCompare:"版本比較", workContract:"需求摘要", workSaved:"工作已保存。", noOverage:"不會自動加購，也不會超額扣款。", freePeriod:"免費點數每月依 Asia/Taipei 時區重設。"
  },
  en: {
    navGalaxy:"My galaxy", navExplore:"Explore", navTools:"Tools", parkName:"Stephen's tool park", demoTag:"Demo", quotaDaily:"{n} AI charts a day", quotaGuest:"AI needs sign-in", menuLanguage:"Language", menuTheme:"Theme", askTitle:"Think one thing through.", askLabel:"What have you been thinking about?", askPlaceholder:"For example: should I move into product management next year", askCreate:"Create topic", askStart:"Start", askLensHint:"Which lens first?", lensMandala:"Map the context", lensStudio:"Make the decision", lensMind:"Keep the memory", lensMindSub:"Mind Galaxy · only you", askNeedTitle:"Write down what you are thinking about first.", myTopics:"My topics", topicsPrivate:"{n} · visible only to you", viewList:"List", viewMap:"Star map", viewMapSoon:"The star map is phase two", mapHint:"Each star is a topic; more work makes it bigger. Click a star to open it. Nearby stars are joined.", mapLegendMandala:"has a chart", mapLegendStudio:"has a decision", colTopic:"Topic", colUpdated:"Updated", countCharts:"{n} charts", countWorks:"{n} works", notYet:"None yet", notIn:"Not kept yet", topicExplain:"One topic keeps the same star across Mandala, Intent Galaxy and Mind Galaxy. Open a topic to jump between lenses.", noTopicsYet:"No topics yet. Write one thing above and the first star appears.", exploreCardTitle:"Charts people made public", exploreCardBody:"See how others break a goal down, cheer them on, or copy one and make it yours.", mapCardEyebrow:"Star map · phase two", mapCardTitle:"More topics, brighter map", guestExampleTitle:"A finished chart looks like this", guestExampleBody:"The goal in the middle, 8 themes around it, 8 actions per theme. Edit and export by hand without signing in.", today:"Today", daysAgo:"{n} days ago", topicCreatedOn:"Created {d}", topicLensCount:"3 lenses · visible only to you", nextStep:"Next step", nextExpand:"This topic has no chart yet. Expand it into 8 themes and 64 actions to see the whole picture.", nextDecide:"The chart exists but nothing is decided. Lay out the options and blind spots in Intent Galaxy and lock a direction.", nextContinue:"Chart and decision are both here. Go back to the chart and finish the actions; completed ones stay in the history.", newChartInTopic:"Start a chart in this topic", newDecisionInTopic:"Decide this topic with Intent Galaxy", mindAutoLead:"Locked decisions and completed actions stay in this topic's history.", mindExportHere:"For now, export JSON into your local Mind Galaxy.", mindLater:"Moving Mind Galaxy into the park is phase three.", noMemory:"No memory yet", topicHistory:"History of this topic", historyCreated:"Topic \"{t}\" created", historyMandala:"Chart \"{t}\" updated", historyStudio:"Decision \"{t}\" updated", historyHint:"This history is the seed of Mind Galaxy: locked decisions, completed actions and changed minds stay here.", expandActions:"Expand actions", markDone:"Done", markSkip:"Skip", themeComplete:"All 8 actions of this theme are handled", goalComplete:"All 64 actions are handled", proposeThemesShort:"Ask AI for themes", moreActions:"More: export, print, import, versions", publicBtn:"Publish", gridHint:"Click any cell and type. Dashed cells are empty; press Expand actions to let AI fill them, then apply after reviewing.", aiCardTitle:"AI proposal", consentFirst:"Tick the consent box in the AI proposal card first.", sameTopicDecision:"Decision in this topic", openTopic:"Open topic", noTopicYet:"Not in a topic yet", libraryTitle:"Saved charts", toolsTitle:"Tools", toolsLead:"One account for every tool. Tools connect through topics, so you usually arrive from My galaxy, not from here.", groupLenses:"Lenses · three ways to look at one thing", groupPlaces:"Places", planTitle:"Plan", planLead:"One plan for the whole park. Everything is free during the test period, with daily AI limits; no automatic purchases or overage.", planCanDo:"Per day", planAiCharts:"AI charts", planAiCalls:"AI calls", planInviteCodes:"Invite codes", planManual:"Manual editing, PNG/PDF/Excel export", planCloud:"Cloud saving, versions", planTopics:"Topics, cross-tool jumps", planExplore:"Explore: browse, cheer, copy, publish", planStudio:"Intent Galaxy decisions", planPrice:"Price", planFreeShort:"Free", planCan:"Yes", planNo:"—", planTierUp:"Higher by usage tier", planMore:"More", planGuestInvite:"0 · a friend's code gives 1 chart", planLocalOnly:"This device only", planCloudCount:"{n} charts with versions", planShareOnly:"Shared links only", planGuest24h:"Guest work expires after 24 hours", planSave:"Saved", planPriceNote:"Prices and limits follow real test-period usage; nothing is charged during the test", planFoot:"The paid split is every tool included with AI-usage tiers, not per-tool locks.", nCharts:"{n} charts", nTimes:"{n} calls", nCodes:"{n} codes, valid 7 days", lensMandalaDesc:"Map the context. One goal becomes 8 themes and 64 actions; AI can propose themes and fill blanks, you apply after reviewing.", lensStudioDesc:"Make the decision. Lay out every option and blind spot in 60 seconds, lock one, and get an actionable brief.", lensMindDesc:"Keep the memory. Locked decisions and completed actions stay in the topic history. Visible to your account only; moving in is phase three.", exploreDesc:"Charts people made public. Cheer, copy, browse examples. Sign in to use.", fromTopicPage:"Export JSON from a topic page", windowLabelShort:"Window", myProfile:"My public profile", feedMore:"Scroll for more. Examples and user charts share one ranking; every count starts at zero.", open9x9:"Open the full chart", skip:"Skip to main content", studio:"Decision Studio", mandala:"Mandala planner", pricing:"Plans & pricing", privacy:"Privacy", terms:"Terms", language:"Language", theme:"Toggle light and dark theme", close:"Close", primaryNavigation:"Primary navigation", legalNavigation:"Legal information", signIn:"Sign in with Google", signOut:"Sign out", signedIn:"Signed in", signedOut:"Signed out. This account's cloud data has been cleared from this page.", demoBanner:"Demo mode: analysis and generation results are synthetic fixtures returned by the server, not real model output.",
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
    trialTitle:"Free AI trial", trialLead:"AI proposes 8 themes, then expands each theme into actions. Nothing is written until you click Apply.", trialProvider:"Uses Anthropic Claude: Sonnet proposes the themes; Haiku expands them and offers other perspectives.", trialUnavailable:"The free AI trial is not available right now.", trialLimit:"Today’s free AI limit has been reached. Try again tomorrow or keep editing by hand.", trialNeedsSession:"Signed-in users get {charts} free AI charts per day. With a friend’s invite code you can try one without signing in.", trialInvite:"You are using a friend’s invite: try {charts} chart without signing in. Sign in to save charts and use the AI every day.", trialDaily:"Signed-in users get {charts} free AI charts per day.", trialLoginRequired:"Sign in to use the free AI, or ask a friend for an invite code.", redeemTitle:"Use an invite code", redeemLead:"A friend shared a free Mandala AI trial with you. Complete the check to try it once without signing in.", redeemCode:"Invite code", redeemButton:"Redeem and start", redeemed:"Invite redeemed. You can start now.", inviteInvalid:"This invite code is invalid, used or expired.", inviteUsed:"This browser has already used an invite. Sign in to use the AI every day.", invitesTitle:"Share with friends", invitesLead:"Create up to {n} invite codes per day. Friends can try one chart without signing in. Each code works once and expires in 7 days.", inviteCreate:"Create invite code", inviteCopy:"Copy link", inviteCopied:"Invite link copied.", inviteLimit:"You have reached today’s invite limit or have too many unused codes.", inviteOpen:"Unused", inviteRedeemed:"Redeemed", inviteJoined:"Joined", inviteExpired:"Expired", noInvites:"No invite codes yet.", examplesTitle:"Example charts", examplesLead:"No sign-in needed: these examples were generated in advance. Open one and edit it into your own.", examplesOpen:"Open example", examplesLoading:"Loading examples…", examplesUnavailable:"Examples could not be loaded.", exampleOpened:"Example opened. Remember to save your changes.", generateThemes:"Propose themes", expandTheme:"Expand this theme", expandEmpty:"Expand all empty themes", perspectives:"Try other perspectives", perspectivesTitle:"Themes from other perspectives (pick one, then replace a slot)", chooseTheme:"Choose a theme", replaceSlot:"Replace", replace:"Replace", lensQ1:"Zero-Resetter: start from zero", lensQ2:"Veteran: what worked before", lensQ3:"Border-Crosser: borrow from elsewhere", lensQ4:"Coroner: prevent failure first", skippedActions:"{n} cells duplicated another theme and were left empty. Expand again to fill them.", themeReplaced:"Theme replaced. Remember to save.", noEmptyThemes:"All 8 themes already have titles.", 
    parkTitle:"Stephen's tool park", parkLead:"One account for every tool. Tools connect through topics: map out the context in the Mandala, decide with Intent Galaxy, and keep everything about one subject together.", parkFoot:"Everything is free during the test period, with daily AI limits.", statusLive:"Live", statusBeta:"Beta", statusSoon:"Coming soon", statusOwner:"Only you", openApp:"Open", signInToUse:"Sign in to use", app_mandala_name:"Mandala goal planner", app_mandala_desc:"Expand one goal into 8 themes and 64 actions; AI can propose themes and actions.", app_galaxy_name:"Intent Galaxy decision studio", app_galaxy_desc:"Lay out every option and blind spot, lock a decision, and get an actionable brief.", app_feed_name:"Feed", app_feed_desc:"Browse public charts, cheer people on, or copy one and make it yours.", app_topics_name:"My topics", app_topics_desc:"Everything one subject produced across tools, in one place, linked both ways.", app_mind_name:"Mind Galaxy", app_mind_desc:"Keeps decision history and background context. Visible to your account only for now.", topicsNav:"My topics", topicsTitle:"My topics", topicsLead:"Topics are private. Put charts and decisions under the same topic to jump between them.", topicNew:"New topic name", topicCreate:"Create topic", topicRename:"Rename", topicDelete:"Delete topic", topicDeleteConfirm:"Deleting a topic keeps its charts and decisions and only removes the grouping. Delete it?", topicEmpty:"Nothing in this topic yet.", noTopics:"No topics yet.", topicNone:"No topic", topicPanelTitle:"Topic", topicPanelLead:"File this under a topic to jump between charts and decisions about the same subject.", topicSaveFirst:"Save to the cloud before filing under a topic.", topicLinked:"Filed under the topic.", topicUnlinked:"Removed from the topic.", topicSiblings:"More in this topic", topicLimit:"You have reached the topic limit (200).", topicTitleInvalid:"Use a topic name of 1 to 120 characters.", product_mandala:"Mandala", product_studio:"Decision", decideInGalaxy:"Decide this topic with Intent Galaxy", expandToMandala:"Expand into a Mandala", newChartFromGoal:"A new chart was started with this goal. It joins the same topic once saved to the cloud.", galaxyFromGoal:"Goal filled in. It joins the same topic once saved.", mindTitle:"Mind Galaxy", mindLead:"Visible to your account only. Export a topic's history as JSON here and import it into your local Mind Galaxy; moving Mind Galaxy into the park is phase three.", mindExport:"Export JSON", mindExported:"Topic history downloaded.", parkPricingLead:"One account and one plan for the whole park. Everything is free during the test period, with daily AI limits.", planGuestTitle:"Not signed in", planGuest:"Use every public tool, browse examples and shared charts, edit and export by hand. AI needs a sign-in or a friend's invite code.", planFreeTitle:"Signed in (free)", planFree:"{charts} AI charts and {invites} invite codes per day; cloud saving, topics and the feed.", planProTitle:"Paid plan (planned)", planPro:"Every tool included, with higher daily AI limits by usage tier. Prices and limits will follow real test-period usage; nothing is charged during the test period.",
    feed:"Feed", feedTitle:"Everyone's charts", feedLead:"See how others break down their goals, cheer them on, or copy one and make it yours. The team's examples are ranked by the same rules.", feedSignIn:"The feed is for signed-in users. Sign in to browse public charts, cheer and copy.", signInFeed:"Sign in to see the feed", sortNew:"Newest", sortHot:"Popular", sortCopied:"Most copied", sortDone:"Most done", sortLabel:"Sort", windowLabel:"Period", window7d:"7 days", window30d:"30 days", windowAll:"All time", sourceLabel:"Author", sourceAll:"Everyone", sourceUsers:"Users only", sourceExamples:"Examples only", tagLabel:"Category", allTags:"All categories", tag_health:"Health", tag_learning:"Learning", tag_career:"Career", tag_money:"Money", tag_sports:"Sports", tag_creative:"Creative", tag_family:"Family", tag_life:"Life", brandName:"Mandala Team", exampleBadge:"Example", encourage:"Cheer", encouraged:"Cheered", copyToMine:"Copy to my chart", copiedToMine:"Copied into the editor. Remember to save.", share:"Share", shareSystem:"Share to…", shareCopyLink:"Copy link", shareLine:"LINE", shareFacebook:"Facebook", linkCopied:"Link copied.", download:"Download", downloadPng:"Image (PNG)", downloadPdf:"PDF", downloadXlsx:"Excel", downloadFailed:"Download failed. Try again.", report:"Report", reportConfirm:"Report this chart?", reason_personal_data:"Personal data", reason_harmful:"Harmful or offensive", reason_spam:"Ads or spam", reason_other:"Other", reported:"Thanks. A person will review this report.", showActions:"Show the 64 actions", feedEmpty:"No public charts match these filters yet.", feedEnd:"You have reached the end.", feedLoading:"Loading…", loadMore:"Load more", statEncourages:"{n} cheers", statCopies:"{n} copies", statViews:"{n} views", profileTitle:"Public profile", profileLead:"The nickname and avatar shown in the feed. Your email is never shown.", nickname:"Nickname", avatar:"Avatar", saveProfile:"Save profile", profileSaved:"Profile saved.", profileRequired:"Choose a nickname and an avatar first.", publishTitle:"Publish to the feed", publishLead:"A snapshot is published: title, goal, themes, actions and done marks. Notes and due dates stay private. After editing, click Update to refresh it.", publishNeedsCloud:"Save this chart to the cloud before publishing it.", publishTags:"Categories (up to 3)", publish:"Publish", publishUpdate:"Update public version", unpublish:"Unpublish", published:"Published to the feed.", unpublished:"Unpublished.", confirmUnpublish:"Unpublish this chart? Its cheers and copy records are deleted.", publishedHidden:"This chart is hidden after reports and waits for review.", publicLink:"Public link", tooManyTags:"Choose up to 3 categories.", goalNeeded:"Write the central goal first.", sharedCta:"Sign in to cheer, copy this chart and see more people's goals.", makeOwn:"Make your own", sharedMissing:"This chart could not be found. It may have been unpublished or hidden.", backToFeed:"Back to the feed", downloadImage:"Download image", downloadPdfFile:"Download PDF", downloadExcel:"Download Excel", xlsxGrid:"Chart", xlsxList:"Actions", xlsxTheme:"Theme", xlsxAction:"Action", xlsxDone:"Done",
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
const quotaBox = document.getElementById("quota");
const languageSelect = document.createElement("select"); languageSelect.id = "language";
for (const [value, label] of [["zh", "繁體中文"], ["en", "English"]]) { const option = document.createElement("option"); option.value = value; option.textContent = label; languageSelect.append(option); }
const themeToggle = document.createElement("button"); themeToggle.type = "button"; themeToggle.id = "themeToggle"; themeToggle.className = "icon-button"; themeToggle.textContent = "◐";
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
  mandala: { invites: null, examples: null, examplesOpen: false, redeemCode: new URLSearchParams(location.search).get("invite") ?? "", perspectives: null, pickedTheme: null, replaceSlot: 0, trialThemeId: "", chart: createEmptyChart(), chartEpoch: 0, localId: null, cloudDoc: null, cloudHistory: null, cloudGoals: [], proposal: null, proposalSnapshot: null, proposalText: "", proposalStale: false, instruction: "", provider: "openai", mode: "standard", consent: false, reviewDate: new Date().toISOString().slice(0,10), reviewNote: "", reviewFor: null, view: "grid" },
};

const langCopy = () => COPY[locale] ?? COPY.en;
// Free Mandala trial operations; the server caps them per day, not by plan credits.
const MANDALA_TRIAL_OPERATIONS = ["themes", "expand_theme", "expand_empty", "perspectives"];
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
  state.mandala.invites = null;
  state.feed = emptyFeed();
  state.topics = null;
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
  renderQuota();
  if (!session) { account.append(el("span", "account", tr("authLoading"))); return; }
  if (!session.user) {
    const wrap = el("div", "account");
    if (state.config?.authEnabled) wrap.append(link(tr("signIn"), "/api/auth/login", "button small primary"));
    wrap.append(menuShell(el("span", "", "☰")));
    account.append(wrap); return;
  }
  const initial = (session.user.email ?? "?").trim().charAt(0).toUpperCase() || "?";
  account.append(menuShell(el("span", "", initial), session.user.email));
}
// The avatar menu holds everything that is not a page: language, theme,
// sign-out, and the owner-only Mind Galaxy link.
function menuShell(face, email = "") {
  const details = el("details", "account-menu"); const summary = el("summary"); summary.setAttribute("aria-label", tr("menuLanguage")); summary.append(face); details.append(summary);
  const list = el("div", "menu-list");
  if (email) list.append(el("div", "menu-email", email));
  const lang = el("label", "menu-row"); lang.append(el("span", "", tr("menuLanguage")), languageSelect); list.append(lang);
  const theme = el("div", "menu-row"); theme.append(el("span", "", tr("menuTheme")), themeToggle); list.append(theme);
  if (!state.session?.user && state.config?.authEnabled) list.append(link(tr("signIn"), "/api/auth/login", ""));
  if (state.session?.owner) list.append(link("Mind Galaxy", "/mind", ""));
  if (state.session?.user) list.append(btn(tr("signOut"), { cls: "text-button", disabled: state.accountTransition, action: async () => {
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
  details.append(list);
  document.addEventListener("click", (event) => { if (details.open && !details.contains(event.target)) details.open = false; });
  return details;
}
// The server does not expose today's usage, so the ring shows the daily allowance, never a made-up count.
function renderQuota() {
  quotaBox.replaceChildren();
  const limits = state.config?.mandalaLimits ?? {};
  if (!state.config?.mandalaTrial) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 26 26"); svg.setAttribute("width", "24"); svg.setAttribute("height", "24"); svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `<circle cx="13" cy="13" r="10" fill="none" stroke="var(--line)" stroke-width="3"/><circle cx="13" cy="13" r="10" fill="none" stroke="var(--gold)" stroke-width="3" stroke-dasharray="${isSignedIn() ? "62.8" : "0"} 62.8" stroke-linecap="round" transform="rotate(-90 13 13)"/>`;
  const text = el("span", "quota-text", isSignedIn() ? tr("quotaDaily", { n: limits.dailyCharts ?? 3 }) : tr("quotaGuest"));
  quotaBox.append(svg, text); quotaBox.title = text.textContent;
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
  demoBanner.textContent = tr("demoTag"); demoBanner.title = tr("demoBanner");
  const route = location.pathname.replace(/\/$/, "") || "/";
  const current = route === "/feed" || route.startsWith("/mandala/p/") ? "feed" : ["/tools", "/pricing"].includes(route) ? "tools" : ["/privacy", "/terms"].includes(route) ? "" : "home";
  document.querySelectorAll("[data-nav]").forEach((item) => { if (item.dataset.nav === current) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current"); });
  refreshAccount();
}
function toMessage(error) {
  if (!(error instanceof ApiError)) return tr("appError");
  if (error.code === "network_error") return tr("apiError");
  if (error.code === "csrf_invalid" || error.code === "session_expired" || error.code === "session_required") return tr("csrfError");
  if (error.code === "insufficient_credits") return tr("noCredits");
  if (error.code === "trial_limit") return tr("trialLimit");
  if (error.code === "trial_login_required") return tr("trialLoginRequired");
  if (error.code === "invite_invalid") return tr("inviteInvalid");
  if (error.code === "invite_used") return tr("inviteUsed");
  if (error.code === "invite_limit") return tr("inviteLimit");
  if (error.code === "profile_required") return tr("profileRequired");
  if (error.code === "topic_limit") return tr("topicLimit");
  if (error.code === "invalid_topic") return tr("topicTitleInvalid");
  if (error.code === "goal_required") return tr("goalNeeded");
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
  const trial = request.product === "mandala" && MANDALA_TRIAL_OPERATIONS.includes(request.operation);
  if (trial ? !(state.config?.mandalaTrial && (isSignedIn() || state.session?.guest?.invite === true)) : !allowAi(request.product, request.mode)) {
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
  if (!state.jobBusy && !state.pending && state.jobStatus === tr("statusCompleted")) return;
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
  if (route === "/studio") { applyStudioUrl(); renderStudio(); }
  else if (route === "/mandala") { applyMandalaUrl(); renderMandala(); }
  else if (route === "/topics") renderParkHome();
  else if (/^\/t\/[0-9a-f-]{36}$/.test(route)) renderTopic(route.split("/").at(-1));
  else if (route === "/mind") renderMind();
  else if (route === "/feed") renderFeed();
  else if (/^\/mandala\/p\/[0-9a-f-]{36}$/.test(route)) renderSharedChart(route.split("/").at(-1));
  else if (route === "/pricing" || route === "/tools") renderTools();
  else if (route === "/privacy") renderLegal("privacy");
  else if (route === "/terms") renderLegal("terms");
  else if (route === "/") renderParkHome();
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
  if (studio.openDocId && studio.docsLoaded && studio.works.length) {
    const wanted = studio.works.find((doc) => doc.id === studio.openDocId); studio.openDocId = null;
    if (wanted) { openStudioWork(wanted); return; }
  }
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
  // Built on first use: its icons use document-relative paths that only resolve on top-level routes.
  if (!decisionView) setupDecisionView();
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
  if (isSignedIn()) library.append(renderTopicPanel(state.studio.currentDoc, { fallbackTitle: state.studio.workTitle || state.studio.contract?.goal || "", actions: studioTopicActions() }));
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
  if (pending.product === "mandala" && result.perspectives) {
    state.mandala.perspectives = result.perspectives; state.mandala.pickedTheme = null;
    state.mandala.proposal = null; state.mandala.proposalText = ""; state.mandala.proposalSnapshot = null;
    setNotice(tr("perspectivesTitle"), "success");
    navigate("/mandala");
    return;
  }
  if (pending.product === "mandala") {
    const mandala = state.mandala;
    mandala.proposal = null;
    mandala.proposalSource = MANDALA_TRIAL_OPERATIONS.includes(pending.operation) ? "trial" : "paid";
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
    else if (result.skipped > 0) setNotice(tr("skippedActions", { n: result.skipped }), "warning");
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
    const wanted = state.studio.openDocId && state.studio.works.find((doc) => doc.id === state.studio.openDocId);
    state.studio.openDocId = null;
    if (wanted) { openStudioWork(wanted); return; }
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
    await linkPendingTopic(studio, response.document);
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
  const privacy = kind === "privacy"; const legal = LEGAL[locale] ?? LEGAL.en;
  page.append(heading(privacy ? tr("privacyPage") : tr("termsPage"), legal.updated, tr("siteDraft")));
  const card = el("article", "legal-card");
  for (const [title, body] of privacy ? legal.privacy : legal.terms) {
    card.append(el("h2", "", title));
    for (const line of body.split("\n")) card.append(el("p", "", line));
  }
  page.append(card);
  if (privacy && isSignedIn()) {
    const danger = el("section", "panel"); danger.append(sectionTitle(legal.deleteTitle, legal.deleteLead));
    danger.append(btn(legal.deleteButton, { cls: "button danger", disabled: state.accountTransition, action: () => deleteAccount(legal) }));
    page.append(danger);
  }
}
async function deleteAccount(legal) {
  if (!confirm(legal.deleteConfirm)) return;
  state.accountEpoch++; state.accountTransition = true;
  try {
    await api.deleteAccount();
    state.session = null; clearAccountScopedCaches();
    setSession(api.session); notify(legal.deleted, "success");
  } catch (error) { notify(toMessage(error), "error"); }
  finally { state.accountTransition = false; refreshAccount(); render(); }
}

function resetMandalaChart(chart = createEmptyChart()) {
  const mandala = state.mandala;
  mandala.chartEpoch++; mandala.chart = chart; mandala.localId = null; mandala.cloudDoc = null; mandala.reviewFor = null; mandala.reviewNote = "";
  mandala.proposal = null; mandala.proposalSnapshot = null; mandala.proposalText = ""; mandala.proposalStale = false; mandala.perspectives = null;
}
function mandalaTrialReady() { return !!state.config?.mandalaTrial && (isSignedIn() || (!isSignedIn() && state.session?.guest?.invite === true)); }
function progressMeter(chart) {
  const progress = chartProgress(chart);
  const meter = el("div", "mandala-progress"); meter.id = "mandalaProgress"; meter.append(el("span", "", `${tr("progress")}: ${progress.done}/64`));
  const track = el("span", "progress-track"); const fill = el("span"); fill.style.width = `${Math.round(progress.done / 64 * 100)}%`; track.append(fill); meter.append(track);
  return meter;
}
function renderMandala() {
  const mandala = state.mandala;
  if (mandala.openDocId && mandala.cloudLoaded) {
    const wanted = mandala.cloudGoals.find((doc) => doc.id === mandala.openDocId); mandala.openDocId = null;
    if (wanted) { openCloudGoal(wanted); return; }
  }
  const reviewFor = mandala.localId ?? mandala.cloudDoc?.id ?? "current";
  if (mandala.reviewFor !== reviewFor) { mandala.reviewFor = reviewFor; mandala.reviewDate = new Date().toISOString().slice(0,10); mandala.reviewNote = ""; loadReview(reviewFor); }
  if (isSignedIn() && state.topics === null) loadTopics();
  const page = newPage("page-shell wide mandala-page");
  const notices = [...page.children];
  page.append(renderMandalaHead(), ...notices);
  showJobStatus(page);
  const layout = el("div", "mandala-layout");
  const mainCol = el("div", "mandala-main stack mandala-section"); mainCol.dataset.view = mandala.view;
  const goal = textarea(mandala.chart.goal, { rows: 2, maxLength: 500, placeholder: tr("goal"), className: "compact", onInput: (event) => { mandala.chart.goal = event.target.value; touchChart(); } });
  const goalField = field(tr("roleGoal"), goal); goalField.classList.add("goal-field");
  mainCol.append(goalField, renderMandalaGrid(mandala.chart), renderMandalaGroups(mandala.chart), el("p", "grid-hint muted", tr("gridHint")));
  const aside = el("aside", "mandala-aside");
  const trial = renderMandalaTrial(); trial.classList.add("ai-card", "mandala-ai"); trial.id = "aiCard"; aside.append(trial);
  const topic = mandala.cloudDoc ? topicOf(mandala.cloudDoc.id) : null;
  if (isSignedIn()) {
    const decision = link("", `/studio?goal=${encodeURIComponent(mandala.chart.goal || mandala.chart.title)}${topic ? `&topic=${topic.id}` : ""}`, "night decision-card");
    const eyebrow = el("p", "eyebrow"); eyebrow.append(el("span", "dot studio"), document.createTextNode(tr("sameTopicDecision")));
    decision.append(eyebrow, el("strong", "", tr("newDecisionInTopic")), el("span", "muted", tr("lensStudioDesc")));
    aside.append(decision);
    aside.append(renderTopicPanel(mandala.cloudDoc, { fallbackTitle: mandala.chart.title || mandala.chart.goal, actions: mandalaTopicActions() }));
    const publish = renderPublishPanel(); publish.id = "publishPanel"; aside.append(publish);
  }
  const fold = (title, body, open = false) => { const d = el("details", "panel"); d.open = open; d.append(el("summary", "", title)); body.classList.remove("panel"); d.append(body); return d; };
  aside.append(fold(tr("examplesTitle"), renderMandalaExamples(), mandala.examplesOpen));
  aside.append(fold(tr("libraryTitle"), renderMandalaSaved()));
  aside.append(fold(tr("weeklyReview"), renderWeeklyReview()));
  if (isSignedIn() && state.config?.invites) aside.append(fold(tr("invitesTitle"), renderInvites()));
  if (state.config?.mode !== "disabled") aside.append(fold(tr("useAI"), renderMandalaAI(), mandala.proposalSource && mandala.proposalSource !== "trial"));
  layout.append(mainCol, aside); page.append(layout);
  if (!mandala.cloudLoaded && isSignedIn()) loadMandalaCloudGoals();
}
function renderMandalaHead() {
  const mandala = state.mandala;
  const head = el("div", "mandala-head");
  const topic = mandala.cloudDoc ? topicOf(mandala.cloudDoc.id) : null;
  const crumb = link("", topic ? `/t/${topic.id}` : "/", "crumb");
  if (topic) crumb.append(topicStar(topic.id, 18), el("span", "", topic.title)); else crumb.append(el("span", "", tr("navGalaxy")));
  head.append(crumb, el("span", "sep", "›"));
  const titleWrap = el("div", "chart-title"); titleWrap.append(el("span", "dot mandala"));
  const title = input(mandala.chart.title, { maxLength: 160, placeholder: tr("chartTitle"), onInput: (event) => { mandala.chart.title = event.target.value; touchChart(); } }); title.setAttribute("aria-label", tr("chartTitle"));
  titleWrap.append(title); head.append(titleWrap, progressMeter(mandala.chart));
  const actions = el("div", "head-actions");
  const emptyThemes = mandala.chart.themes.filter((t) => !t.title.trim()).length;
  const primaryOp = emptyThemes ? "themes" : "expand_empty";
  const primary = btn(tr(emptyThemes ? "proposeThemesShort" : "expandActions"), { cls: "button primary small", disabled: state.jobBusy, title: mandalaTrialReady() ? "" : tr("trialNeedsSession", { charts: state.config?.mandalaLimits?.dailyCharts ?? 3 }), action: () => {
    const card = document.getElementById("aiCard");
    if (!mandalaTrialReady()) { card?.scrollIntoView({ behavior: "smooth", block: "center" }); notify(tr("trialNeedsSession", { charts: state.config?.mandalaLimits?.dailyCharts ?? 3 }), "warning"); return; }
    if (!mandala.consent) { card?.scrollIntoView({ behavior: "smooth", block: "center" }); card?.querySelector("input[type=checkbox]")?.focus(); notify(tr("consentFirst"), "warning"); return; }
    runMandalaTrial(primaryOp);
  } });
  actions.append(primary);
  if (isSignedIn()) actions.append(btn(tr("publicBtn"), { cls: "button small", action: async () => {
    if (!mandala.cloudDoc) { await saveCloudChart(); }
    const panel = document.getElementById("publishPanel"); panel?.scrollIntoView({ behavior: "smooth", block: "center" });
  } }));
  const picker = input("", { type: "file" }); picker.accept = "application/json,.json"; picker.id = "mandalaImport"; picker.className = "sr-only"; picker.setAttribute("aria-label", tr("importJson")); picker.addEventListener("change", async () => {
    const file = picker.files?.[0]; if (!file) return;
    try { const imported = parseChartJson(await file.text()); resetMandalaChart(structuredClone(imported)); render(); notify(tr("chartValid"), "success"); }
    catch { notify(tr("importFailed"), "error"); }
    finally { picker.value = ""; }
  });
  const more = menu("⋯", [
    [tr("newChart"), () => { resetMandalaChart(); render(); }],
    [tr("saveLocal"), () => saveLocalChart()],
    ...(isSignedIn() ? [[tr("saveCloud"), () => saveCloudChart()]] : []),
    [tr("exportJson"), () => exportMandalaJson()],
    [tr("exportMarkdown"), () => exportMandalaMarkdown()],
    [tr("downloadPng"), () => downloadChart(mandala.chart, "png")],
    [tr("downloadPdf"), () => downloadChart(mandala.chart, "pdf")],
    [tr("downloadXlsx"), () => downloadChart(mandala.chart, "xlsx")],
    [tr("printPdf"), () => window.print()],
    [tr("importJson"), () => picker.click()],
    [tr(mandala.view === "grid" ? "groupView" : "gridView"), () => { mandala.view = mandala.view === "grid" ? "group" : "grid"; render(); }],
  ]);
  more.classList.add("right"); more.querySelector("summary").setAttribute("aria-label", tr("moreActions")); more.querySelector("summary").title = tr("moreActions");
  actions.append(more, picker);
  head.append(actions);
  return head;
}

function touchChart() {
  const mandala = state.mandala;
  mandala.chartEpoch++;
  if (mandala.proposalSnapshot && !mandalaOperationSnapshotMatches(mandala.proposalSnapshot, mandala)) mandala.proposalStale = true;
  document.querySelectorAll("[data-mirror]").forEach((mirror) => {
    const theme = mandala.chart.themes.find((item) => item.id === mirror.dataset.mirror);
    if (theme) { mirror.firstChild.nodeValue = theme.title || tr("themeTitle"); mirror.classList.toggle("empty", !theme.title.trim()); }
  });
  const progress = chartProgress(mandala.chart);
  const meter = document.getElementById("mandalaProgress");
  if (meter) { meter.firstChild.textContent = `${tr("progress")}: ${progress.done}/64`; const fill = meter.querySelector(".progress-track > span"); if (fill) fill.style.width = `${Math.round(progress.done / 64 * 100)}%`; }
}
function themeHandled(theme) { return theme.actions.every((a) => a.done || a.skipped); }
// Paint the theme cell (and its mirror in the centre block) when all 8 actions are done or skipped; the goal when all 8 themes are.
function themeCount(theme) { return theme.actions.filter((a) => a.done || a.skipped).length; }
function themeBadge(theme) { const n = themeCount(theme); const badge = el("span", "cell-count", n > 0 && n < 8 ? `${n}/8` : ""); badge.hidden = !(n > 0 && n < 8); return badge; }
function paintTheme(ti) {
  const chart = state.mandala.chart; const theme = chart.themes[ti]; const complete = themeHandled(theme); const n = themeCount(theme);
  document.querySelectorAll(`[data-theme-cell="${theme.id}"]`).forEach((cell) => {
    cell.classList.toggle("complete", complete); cell.title = complete ? tr("themeComplete") : "";
    const badge = cell.querySelector(".cell-count"); if (badge) { badge.textContent = n > 0 && n < 8 ? `${n}/8` : ""; badge.hidden = !(n > 0 && n < 8); }
  });
  const all = chart.themes.every(themeHandled);
  document.querySelectorAll('.mandala-cell[data-role="goal"]').forEach((cell) => { cell.classList.toggle("complete", all); cell.title = all ? tr("goalComplete") : ""; });
}
function makeActionEditor(action, ti, ai, { grouped = false } = {}) {
  const wrap = el(grouped ? "div" : "article", grouped ? "group-action" : "mandala-cell");
  if (!grouped) wrap.dataset.role = "action";
  const paint = () => { wrap.classList.toggle("empty", !action.text.trim()); wrap.classList.toggle("done", !!action.done); wrap.classList.toggle("skipped", !!action.skipped && !action.done); };
  paint();
  const body = textarea(action.text, { rows: 2, maxLength: 500, placeholder: `${tr("actionNo")} ${ai + 1}`, onInput: (event) => { state.mandala.chart.themes[ti].actions[ai].text = event.target.value; paint(); touchChart(); } });
  body.setAttribute("aria-label", `${tr("themeNo")} ${ti + 1}, ${tr("actionNo")} ${ai + 1}`);
  // Done and skipped exclude each other; pressing the active one again clears it.
  const setMark = (kind, on) => {
    const target = state.mandala.chart.themes[ti].actions[ai];
    if (kind === "done") { target.done = on; if (on) target.skipped = false; } else { target.skipped = on; if (on) target.done = false; }
    action.done = target.done; action.skipped = target.skipped;
    paint(); syncMarks(); paintTheme(ti); touchChart();
  };
  const doneBtn = btn(`✓ ${tr("markDone")}`, { cls: "cell-mark", action: () => setMark("done", !action.done) });
  const skipBtn = btn(tr("markSkip"), { cls: "cell-mark", action: () => setMark("skipped", !action.skipped) });
  const check = input("", { type: "checkbox", checked: action.done, onInput: (event) => setMark("done", event.target.checked) });
  const skipCheck = input("", { type: "checkbox", checked: !!action.skipped, onInput: (event) => setMark("skipped", event.target.checked) });
  function syncMarks() { doneBtn.setAttribute("aria-pressed", String(!!action.done)); skipBtn.setAttribute("aria-pressed", String(!!action.skipped)); check.checked = !!action.done; skipCheck.checked = !!action.skipped; }
  syncMarks();
  const meta = el("details"); meta.append(el("summary", "", tr("details")));
  const due = input(action.dueDate ?? "", { type: "date", onInput: (event) => { state.mandala.chart.themes[ti].actions[ai].dueDate = event.target.value; touchChart(); } }); due.setAttribute("aria-label", tr("dueDate"));
  const notes = textarea(action.notes ?? "", { rows: 2, maxLength: 1000, placeholder: tr("notes"), onInput: (event) => { state.mandala.chart.themes[ti].actions[ai].notes = event.target.value; touchChart(); } }); notes.setAttribute("aria-label", tr("notes"));
  meta.append(due, notes);
  if (grouped) {
    const doneLabel = el("label", "action-check"); doneLabel.append(check, document.createTextNode(tr("done")));
    const skipLabel = el("label", "action-check"); skipLabel.append(skipCheck, document.createTextNode(tr("markSkip")));
    const extra = el("div", "action-extra"); extra.append(doneLabel, skipLabel, due); wrap.append(body, extra, notes);
  } else {
    const marks = el("div", "cell-marks"); marks.append(doneBtn, skipBtn);
    wrap.append(el("span", "cell-index", `${tr("actionNo")} ${String(ti + 1)}.${String(ai + 1)}`), body, marks, el("span", "cell-tick", "✓"), meta);
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
        cell.dataset.role = "goal"; cell.classList.toggle("complete", chart.themes.every(themeHandled)); cell.append(el("span", "cell-index", tr("roleGoal")), el("span", "cell-tick", "✓"));
        const area = textarea(chart.goal, { rows: 4, maxLength: 500, placeholder: tr("goal"), className: "goal-input", onInput: (event) => { state.mandala.chart.goal = event.target.value; touchChart(); } }); area.setAttribute("aria-label", tr("roleGoal")); cell.append(area);
      } else {
        const ti = themeIndexByCell.get(`${innerRow},${innerCol}`); const theme = chart.themes[ti]; cell.dataset.role = "theme"; cell.dataset.themeCell = theme.id; cell.classList.toggle("empty", !theme.title.trim()); cell.classList.toggle("complete", themeHandled(theme)); cell.append(el("span", "cell-tick", "✓"), themeBadge(theme));
        cell.append(el("span", "cell-index", `${tr("themeNo")} ${ti + 1}`));
        const themeInput = input(theme.title, { maxLength: 200, placeholder: tr("themeTitle"), className: "theme-input", onInput: (event) => { state.mandala.chart.themes[ti].title = event.target.value; cell.classList.toggle("empty", !event.target.value.trim()); touchChart(); } }); themeInput.setAttribute("aria-label", `${tr("themeNo")} ${ti + 1}`); cell.append(themeInput);
      }
      table.append(cell); continue;
    }
    const themeIndex = blockThemeIndex.get(`${macroRow},${macroCol}`);
    const theme = chart.themes[themeIndex];
    if (innerRow === 1 && innerCol === 1) {
      const mirror = el("div", `mandala-cell${theme.title ? "" : " empty"}${themeHandled(theme) ? " complete" : ""}`, theme.title || tr("themeTitle")); mirror.dataset.role = "mirror"; mirror.dataset.themeCell = theme.id; mirror.append(el("span", "cell-tick", "✓"), themeBadge(theme)); mirror.dataset.mirror = theme.id; mirror.title = tr("mirrored"); table.append(mirror); continue;
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
    const wanted = state.mandala.openDocId && state.mandala.cloudGoals.find((doc) => doc.id === state.mandala.openDocId);
    state.mandala.openDocId = null;
    if (wanted) { openCloudGoal(wanted); return; }
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
    await linkPendingTopic(mandala, response.document);
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
// The free trial runs on fixed Anthropic models; the paid AI panel below
// keeps its own provider and mode choices.
function runMandalaTrial(operation, extra = {}) {
  const mandala = state.mandala;
  try { validateChart(mandala.chart); } catch (error) { notify(chartError(error), "error"); return; }
  if (!mandala.chart.goal.trim()) { notify(tr("goalRequired"), "error"); return; }
  const payload = { chart: chartDto(mandala.chart), ...extra }; if (mandala.instruction.trim()) payload.instruction = mandala.instruction.trim();
  const snapshot = createMandalaOperationSnapshot({ chart: payload.chart, localId: mandala.localId, cloudDoc: mandala.cloudDoc, epoch: mandala.chartEpoch });
  if (!snapshot) { notify(tr("candidateInvalid"), "error"); return; }
  runJob({ product: "mandala", operation, provider: "anthropic", mode: "standard", consentDecisions: false, payload }, processJobResult, { providerConsent: mandala.consent, mandalaSnapshot: snapshot });
}
function renderMandalaTrial() {
  const mandala = state.mandala;
  const box = el("section", "panel"); box.append(sectionTitle(tr("aiCardTitle"), tr("trialLead")), el("p", "help", tr("trialProvider")));
  if (!state.config?.mandalaTrial) { box.append(alertBox(tr("trialUnavailable"), "warning")); return box; }
  const charts = state.config?.mandalaLimits ?? {};
  const inviteGuest = !isSignedIn() && state.session?.guest?.invite === true;
  const ready = isSignedIn() || inviteGuest;
  if (!ready) {
    box.append(alertBox(tr("trialNeedsSession", { charts: charts.dailyCharts ?? 3 }), "warning"));
    const row = el("div", "action-row");
    if (state.config?.authEnabled) row.append(link(tr("signIn"), "/api/auth/login", "button small primary"));
    box.append(row, renderRedeem());
    return box;
  }
  box.append(el("p", "help", inviteGuest ? tr("trialInvite", { charts: charts.inviteCharts ?? 1 }) : tr("trialDaily", { charts: charts.dailyCharts ?? 3 })));
  const consent = input("", { type: "checkbox", checked: mandala.consent, onInput: (event) => { mandala.consent = event.target.checked; update(); } });
  const consentLine = el("label", "check-line"); consentLine.append(consent, el("span", "", tr("providerConsent"))); box.append(consentLine);
  const run = runMandalaTrial;
  const buttons = [];
  const add = (row, button) => { buttons.push(button); row.append(button); };
  const themeRow = el("div", "action-row");
  const emptyThemes = mandala.chart.themes.filter((t) => !t.title.trim()).length;
  const themesButton = btn(tr("generateThemes"), { cls: "button primary", title: emptyThemes ? "" : tr("noEmptyThemes"), action: () => run("themes") });
  add(themeRow, themesButton);
  add(themeRow, btn(tr("perspectives"), { cls: "button", action: () => run("perspectives") }));
  box.append(themeRow);
  const titled = mandala.chart.themes.filter((t) => t.title.trim());
  if (!titled.some((t) => t.id === mandala.trialThemeId)) mandala.trialThemeId = titled[0]?.id ?? "";
  const expandRow = el("div", "action-row");
  if (titled.length) {
    expandRow.append(field(tr("chooseTheme"), select(mandala.trialThemeId, titled.map((t) => [t.id, t.title]), (event) => { mandala.trialThemeId = event.target.value; })));
    add(expandRow, btn(tr("expandTheme"), { cls: "button", action: () => run("expand_theme", { themeId: mandala.trialThemeId }) }));
    add(expandRow, btn(tr("expandEmpty"), { cls: "button", action: () => run("expand_empty") }));
  }
  box.append(expandRow);
  function update() { for (const button of buttons) button.disabled = state.jobBusy || !mandala.consent || (button === themesButton && !emptyThemes); }
  update();
  if (mandala.proposalSource === "trial") renderMandalaProposal(box);
  if (mandala.perspectives?.length) box.append(renderPerspectives());
  return box;
}
function renderRedeem() {
  const mandala = state.mandala;
  const box = el("section", "proposal redeem"); box.append(el("h3", "", tr("redeemTitle")), el("p", "muted", tr("redeemLead")));
  const code = input(mandala.redeemCode, { maxLength: 10, placeholder: "ABCD2345EF", onInput: (event) => { mandala.redeemCode = event.target.value.trim(); } });
  box.append(field(tr("redeemCode"), code));
  box.append(btn(tr("redeemButton"), { cls: mandala.redeemCode ? "button primary" : "button", action: () => redeemInvite() }));
  return box;
}
async function redeemInvite() {
  const mandala = state.mandala;
  if (state.accountTransition || !/^[A-HJ-NP-Za-hj-np-z2-9]{10}$/.test(mandala.redeemCode)) { notify(tr("inviteInvalid"), "error"); return; }
  const scope = captureAccountScope();
  try {
    const token = state.config?.turnstileSiteKey ? await turnstileToken(state.config.turnstileSiteKey) : "";
    if (!accountScopeCurrent(scope)) return;
    await api.redeemInvite(mandala.redeemCode, token);
    if (!accountScopeCurrent(scope)) return;
    setSession(api.session); mandala.redeemCode = "";
    history.replaceState({}, "", "/mandala");
    notify(tr("redeemed"), "success"); render();
  } catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
function renderInvites() {
  const mandala = state.mandala;
  const box = el("section", "panel"); box.append(sectionTitle(tr("invitesTitle"), tr("invitesLead", { n: state.config?.mandalaLimits?.invitesPerDay ?? 3 })));
  if (mandala.invites === null) { mandala.invites = []; loadInvites(); }
  box.append(btn(tr("inviteCreate"), { cls: "button", action: () => createInvite() }));
  if (!mandala.invites.length) box.append(el("p", "muted", tr("noInvites")));
  const list = el("div", "saved-list");
  const label = { open: "inviteOpen", redeemed: "inviteRedeemed", joined: "inviteJoined", expired: "inviteExpired" };
  for (const invite of mandala.invites) {
    const row = el("div", "saved-item"); row.append(el("span", "item-title", invite.code), el("span", "badge", tr(label[invite.status] ?? "inviteOpen")));
    if (invite.status === "open") {
      const url = new URL("/mandala", location.origin); url.searchParams.set("invite", invite.code);
      const actions = el("span", "item-actions");
      actions.append(btn(tr("inviteCopy"), { cls: "text-button", action: async () => { await copyText(url.href); notify(tr("inviteCopied"), "success"); api.event("invite_link_copied", "mandala").catch(() => {}); } }));
      row.append(actions);
    }
    list.append(row);
  }
  box.append(list); return box;
}
async function loadInvites() {
  const scope = captureAccountScope();
  try { const response = await api.invites(); if (!accountScopeCurrent(scope)) return; state.mandala.invites = response.invites ?? []; if (state.route === "/mandala") render(); }
  catch (error) { if (accountScopeCurrent(scope) && error.status !== 401) notify(toMessage(error), "error"); }
}
async function createInvite() {
  const scope = captureAccountScope();
  try { const response = await api.createInvite(); if (!accountScopeCurrent(scope)) return; state.mandala.invites = [response.invite, ...(state.mandala.invites ?? [])]; render(); }
  catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
// Pre-generated examples cost no tokens and need no account.
function renderMandalaExamples() {
  const mandala = state.mandala;
  const box = el("section", "panel"); box.append(sectionTitle(tr("examplesTitle"), tr("examplesLead")));
  if (mandala.examples === null) { mandala.examples = "loading"; loadExamples(); }
  if (mandala.examples === "loading") { box.append(el("p", "muted", tr("examplesLoading"))); return box; }
  if (!Array.isArray(mandala.examples) || !mandala.examples.length) { box.append(el("p", "muted", tr("examplesUnavailable"))); return box; }
  const list = el("div", "saved-list");
  for (const example of mandala.examples) {
    const row = el("div", "saved-item"); row.append(el("span", "item-title", example.chart.title || example.chart.goal));
    const actions = el("span", "item-actions");
    actions.append(btn(tr("examplesOpen"), { cls: "text-button", action: () => openExample(example) }));
    row.append(actions); list.append(row);
  }
  box.append(list); return box;
}
async function loadExamples() {
  try {
    const response = await fetch("/mandala-examples.json", { cache: "no-cache" });
    const data = response.ok ? await response.json() : null;
    state.mandala.examples = (Array.isArray(data?.examples) ? data.examples : []).filter((item) => (item.locale ?? "zh") === locale || !data.examples.some((other) => (other.locale ?? "zh") === locale));
  } catch { state.mandala.examples = []; }
  if (state.route === "/mandala" || state.route === "/") render();
}
function openExample(example) {
  try {
    const chart = structuredClone(validateChart(example.chart));
    const mandala = state.mandala; mandala.chartEpoch++; mandala.chart = chart; mandala.localId = null; mandala.cloudDoc = null; mandala.proposal = null; mandala.proposalSnapshot = null; mandala.proposalStale = false; mandala.perspectives = null;
    api.event("mandala_example_opened", "mandala").catch(() => {});
    setNotice(tr("exampleOpened"), "success"); render(); window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) { notify(chartError(error), "error"); }
}
function renderPerspectives() {
  const mandala = state.mandala;
  const wrap = el("section", "proposal"); wrap.append(el("h3", "", tr("perspectivesTitle")));
  const grid = el("div", "form-grid");
  for (const lens of mandala.perspectives) {
    const column = el("div", "stack"); column.append(el("p", "eyebrow", tr(`lens${lens.lens}`)));
    const list = el("div", "action-row");
    for (const theme of lens.themes) {
      const picked = mandala.pickedTheme === theme;
      list.append(btn(theme, { cls: picked ? "button small primary" : "button small", action: () => { mandala.pickedTheme = theme; render(); } }));
    }
    column.append(list); grid.append(column);
  }
  wrap.append(grid);
  if (mandala.pickedTheme) {
    const row = el("div", "action-row");
    const slots = mandala.chart.themes.map((t, i) => [String(i), `${i + 1}. ${t.title || "—"}`]);
    row.append(el("span", "badge", mandala.pickedTheme), field(tr("replaceSlot"), select(String(mandala.replaceSlot), slots, (event) => { mandala.replaceSlot = Number(event.target.value); })));
    row.append(btn(tr("replace"), { cls: "button secondary", action: () => {
      mandala.chart.themes[mandala.replaceSlot].title = mandala.pickedTheme; mandala.pickedTheme = null;
      touchChart(); notify(tr("themeReplaced"), "success"); render();
    } }));
    wrap.append(row);
  }
  return wrap;
}
// Shared by the paid AI panel and the free trial panel; the proposal shows
// next to the controls that produced it.
function renderMandalaProposal(box) {
  const mandala = state.mandala;
  if (mandala.proposal) {
    const proposal = el("section", "proposal"); proposal.append(el("h3", "", tr("proposalTitle")), el("p", "muted", tr("applyProposalHint")));
    if (mandala.proposalStale) proposal.append(alertBox(tr("staleProposal"), "warning"));
    if (mandala.proposalSource === "trial") proposal.append(proposalChanges(mandala.chart, mandala.proposal));
    else { const preview = el("pre"); preview.textContent = mandala.proposalText || JSON.stringify(mandala.proposal, null, 2); proposal.append(preview); }
    proposal.append(btn(tr("applyProposal"), { cls: "button secondary", disabled: mandala.proposalStale, action: () => {
      const current = { chart: mandala.chart, localId: mandala.localId, cloudDoc: mandala.cloudDoc, epoch: mandala.chartEpoch };
      const outcome = applyMandalaProposalIfCurrent(current, mandala.proposalSnapshot, mandala.proposal);
      if (!outcome.applied) { mandala.proposalStale = true; setNotice(tr("staleProposal"), "warning"); render(); return; }
      try { state.mandala.chart = structuredClone(validateChart(outcome.chart)); state.mandala.chartEpoch++; state.mandala.proposal = null; state.mandala.proposalText = ""; state.mandala.proposalSnapshot = null; state.mandala.proposalStale = false; setNotice(tr("proposalApplied"), "success"); render(); }
      catch { notify(tr("candidateInvalid"), "error"); }
    } }));
    box.append(proposal);
  } else if (mandala.proposalText) {
    const proposal = el("section", "proposal"); proposal.append(el("h3", "", tr("proposalReview")));
    if (mandala.proposalStale) proposal.append(alertBox(tr("staleProposal"), "warning"));
    else proposal.append(el("p", "muted", tr("noFullChart")));
    const preview = el("pre"); preview.textContent = mandala.proposalText; proposal.append(preview); box.append(proposal);
  }
}
// Trial proposals only fill blanks, so list what would be added.
function proposalChanges(chart, proposal) {
  const list = el("ul", "help");
  proposal.themes.forEach((theme, t) => {
    const before = chart.themes[t];
    if (!before) return;
    if (theme.title && theme.title !== before.title) list.append(el("li", "", `${tr("themeTitle")} ${t + 1}：${theme.title}`));
    const added = theme.actions.filter((a, i) => a.text && a.text !== before.actions[i]?.text).map((a) => a.text);
    if (added.length) list.append(el("li", "", `${theme.title || before.title}：${added.join("、")}`));
  });
  return list;
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
  if (mandala.proposalSource !== "trial") renderMandalaProposal(box);
  return box;
}

// Tool park: the catalog home page, private topics that tie a user's outputs
// together across tools, and the owner-only Mind Galaxy export.
state.topics = null;
function topicsReady() { return Array.isArray(state.topics); }
async function loadTopics() {
  if (!isSignedIn() || state.topics === "loading") return;
  const scope = captureAccountScope(); state.topics = "loading";
  try { const { topics } = await api.topics(); if (!accountScopeCurrent(scope)) return; state.topics = topics ?? []; }
  catch (error) { if (accountScopeCurrent(scope)) { state.topics = []; if (error.status !== 401) notify(toMessage(error), "error"); } }
  if (["/", "/mandala", "/studio", "/topics", "/mind"].includes(state.route) || state.route.startsWith("/t/")) render();
}
function topicOf(docId) { return topicsReady() ? state.topics.find((t) => t.documents.some((d) => d.id === docId)) ?? null : null; }
function docHref(doc) { return doc.product === "mandala" ? `/mandala?doc=${doc.id}` : `/studio?doc=${doc.id}`; }
function rememberTopic(topic) {
  if (!topic || !topicsReady()) return;
  state.topics = [topic, ...state.topics.filter((t) => t.id !== topic.id)].map((t) => t.id === topic.id ? t : { ...t, documents: t.documents.filter((d) => !topic.documents.some((x) => x.id === d.id)) });
}
async function linkTopic(docId, topicId) {
  const scope = captureAccountScope();
  try {
    const { topic } = await api.setDocumentTopic(docId, topicId); if (!accountScopeCurrent(scope)) return;
    if (topic) rememberTopic(topic); else if (topicsReady()) state.topics = state.topics.map((t) => ({ ...t, documents: t.documents.filter((d) => d.id !== docId) }));
    notify(tr(topicId ? "topicLinked" : "topicUnlinked"), "success"); render();
  } catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
async function createTopic(title) {
  title = String(title ?? "").trim();
  if (!title || title.length > 120) { notify(tr("topicTitleInvalid"), "error"); return null; }
  const scope = captureAccountScope();
  try { const { topic } = await api.createTopic(title); if (!accountScopeCurrent(scope)) return null; if (topicsReady()) state.topics = [topic, ...state.topics]; return topic; }
  catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); return null; }
}
// Links a document saved after arriving with ?topic= from another tool.
async function linkPendingTopic(holder, doc) {
  const topicId = holder.pendingTopicId; if (!topicId || !doc?.id) return;
  holder.pendingTopicId = null;
  try { const { topic } = await api.setDocumentTopic(doc.id, topicId); if (topic) rememberTopic(topic); } catch { /* the user can still file it by hand */ }
}
// The topic box on a tool page: file the saved output, see and open the rest of the topic, jump to the other tool.
function renderTopicPanel(doc, { fallbackTitle = "", actions = [] } = {}) {
  const box = el("section", "panel topic-panel"); box.append(sectionTitle(tr("topicPanelTitle"), tr("topicPanelLead")));
  if (!doc) { box.append(el("p", "muted", tr("topicSaveFirst"))); if (actions.length) { const row = el("div", "button-row"); row.append(...actions); box.append(row); } return box; }
  if (state.topics === null) loadTopics();
  if (!topicsReady()) { box.append(el("p", "muted", tr("feedLoading"))); return box; }
  const current = topicOf(doc.id);
  const picker = select(current?.id ?? "", [["", tr("topicNone")], ...state.topics.map((t) => [t.id, t.title])], (event) => linkTopic(doc.id, event.target.value || null));
  picker.setAttribute("aria-label", tr("topicPanelTitle")); box.append(picker);
  if (!current) {
    const row = el("div", "button-row"); const name = input(fallbackTitle, { maxLength: 120, placeholder: tr("topicNew") }); name.setAttribute("aria-label", tr("topicNew"));
    row.append(name, btn(tr("topicCreate"), { cls: "button small", action: async () => { const topic = await createTopic(name.value); if (topic) await linkTopic(doc.id, topic.id); } }));
    box.append(row);
  } else {
    const others = current.documents.filter((d) => d.id !== doc.id);
    if (others.length) {
      box.append(el("p", "field-label", tr("topicSiblings")));
      const list = el("div", "saved-list");
      for (const other of others) { const row = el("div", "saved-item"); row.append(el("span", "badge", tr(`product_${other.product}`)), el("span", "item-title", other.title)); const open = el("span", "item-actions"); open.append(link(tr("open"), docHref(other), "text-button")); row.append(open); list.append(row); }
      box.append(list);
    }
  }
  if (actions.length) { const row = el("div", "button-row"); row.append(...actions); box.append(row); }
  return box;
}
// ?goal=&topic= starts a new chart from another tool; ?doc= opens a saved one.
function applyMandalaUrl() {
  const params = new URLSearchParams(location.search); if (![...params.keys()].some((k) => ["goal", "topic", "doc"].includes(k))) return;
  const mandala = state.mandala; const goal = (params.get("goal") ?? "").slice(0, 500); const topic = params.get("topic"); const doc = params.get("doc");
  history.replaceState({}, "", "/mandala" + (params.get("invite") ? `?invite=${encodeURIComponent(params.get("invite"))}` : ""));
  if (doc) { mandala.openDocId = doc; return; }
  if (goal) {
    mandala.chartEpoch++; mandala.chart = createEmptyChart({ title: goal.slice(0, 160), goal }); mandala.localId = null; mandala.cloudDoc = null; mandala.proposal = null; mandala.proposalSnapshot = null; mandala.proposalStale = false; mandala.perspectives = null;
    mandala.pendingTopicId = topic && /^[0-9a-f-]{36}$/.test(topic) ? topic : null; setNotice(tr("newChartFromGoal"), "success");
  }
}
function applyStudioUrl() {
  const params = new URLSearchParams(location.search); if (![...params.keys()].some((k) => ["goal", "topic", "doc"].includes(k))) return;
  const studio = state.studio; const goal = (params.get("goal") ?? "").slice(0, 500); const topic = params.get("topic"); const doc = params.get("doc");
  history.replaceState({}, "", "/studio");
  if (doc) { studio.openDocId = doc; return; }
  if (goal) {
    studio.form = { ...studio.form, goal }; studio.formDirty = true; studio.step = 1; studio.currentDoc = null; studio.analysis = null; studio.selection = null; studio.contract = null; studio.artifact = null; studio.evaluation = null;
    studio.pendingTopicId = topic && /^[0-9a-f-]{36}$/.test(topic) ? topic : null; setNotice(tr("galaxyFromGoal"), "success");
  }
}
function mandalaTopicActions() {
  const mandala = state.mandala; const goal = mandala.chart.goal.trim(); if (!goal) return [];
  const topic = mandala.cloudDoc ? topicOf(mandala.cloudDoc.id) : null;
  const params = new URLSearchParams({ goal }); if (topic) params.set("topic", topic.id);
  return [link(tr("decideInGalaxy"), `/studio?${params}`, "button small secondary")];
}
function studioTopicActions() {
  const studio = state.studio; const goal = (studio.contract?.goal || studio.form.goal || "").trim(); if (!goal) return [];
  const topic = studio.currentDoc ? topicOf(studio.currentDoc.id) : null;
  const params = new URLSearchParams({ goal }); if (topic) params.set("topic", topic.id);
  return [link(tr("expandToMandala"), `/mandala?${params}`, "button small secondary")];
}
// Visual identity of a topic: a star whose hue and point count come from its id,
// so the same topic looks the same on every page.
function topicStar(id, size = 36) {
  let h = 0; for (const ch of String(id || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360, points = 5 + (h >>> 8) % 4, inner = 0.42 + ((h >>> 12) % 10) / 50;
  const pts = []; for (let k = 0; k < points * 2; k++) { const r = k % 2 ? inner * 10 : 10; const a = -Math.PI / 2 + k * Math.PI / points; pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`); }
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("width", size); svg.setAttribute("height", size); svg.setAttribute("aria-hidden", "true"); svg.classList.add("star");
  svg.innerHTML = `<polygon points="${pts.join(" ")}" fill="hsl(${hue} 55% 88%)" stroke="hsl(${hue} 45% 42%)" stroke-width="1.1" stroke-linejoin="round"/>`;
  return svg;
}
function topicsView() { try { return localStorage.getItem("ig:topics-view") === "map" ? "map" : "list"; } catch { return "list"; } }
function setTopicsView(view) { try { localStorage.setItem("ig:topics-view", view); } catch { /* optional */ } }
function hashOf(id) { let h = 0; for (const ch of String(id || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
// Night-sky view of the topics: deterministic positions from the id, pushed apart so stars do not overlap,
// each star sized by how much work it holds and joined to its nearest neighbour.
function renderStarMap(topics) {
  const W = 100, pad = 9;
  const box = el("div", "star-map night"); box.setAttribute("role", "list");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("aria-hidden", "true"); box.append(svg);
  const nodes = topics.map((topic) => { const h = hashOf(topic.id); const a = link("", `/t/${topic.id}`, "star-node"); a.setAttribute("role", "listitem");
    a.append(topicStar(topic.id, Math.min(64, 26 + topic.documents.length * 10)));
    a.append(el("span", "star-label", topic.title.length > 16 ? `${topic.title.slice(0, 15)}…` : topic.title));
    const dots = el("span", "star-dots"); if (topicDocs(topic, "mandala").length) dots.append(el("i", "dot mandala")); if (topicDocs(topic, "studio").length) dots.append(el("i", "dot studio")); a.append(dots);
    a.title = `${topic.title} · ${whenText(topic.updatedAt)}`; box.append(a);
    return { topic, el: a, h, r: Math.min(5.5, 2.4 + topic.documents.length * 0.7) }; });
  // Lay the stars out for the box's real aspect ratio; re-run when it changes (phone vs desktop).
  const layout = (H, width = 1000) => {
    const ky = 1; // the viewBox matches the box aspect, so units are isotropic
    for (const n of nodes) { n.x = pad + (n.h % 1000) / 1000 * (W - 2 * pad); n.y = pad * ky + ((n.h >>> 10) % 1000) / 1000 * (H - 2 * pad * ky); }
    const minGap = Math.min(40, Math.max(topics.length > 12 ? 7 : 11, 14000 / width)); // ≈140px between star centres
    for (let pass = 0; pass < 80; pass++) {
      for (const a of nodes) for (const b of nodes) {
        if (a === b) continue; const dx = b.x - a.x, dy = (b.y - a.y) / ky, dist = Math.hypot(dx, dy) || 0.01, min = a.r + b.r + minGap;
        if (dist < min) { const push = (min - dist) / 2 / dist; a.x -= dx * push; a.y -= dy * push * ky; b.x += dx * push; b.y += dy * push * ky; }
      }
      for (const n of nodes) { n.x = Math.min(W - pad, Math.max(pad, n.x)); n.y = Math.min(H - pad * ky, Math.max(pad * ky, n.y)); }
    }
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    let lines = "";
    for (const a of nodes) {
      let best = null, bestD = Infinity;
      for (const b of nodes) { if (b === a) continue; const d = Math.hypot(b.x - a.x, (b.y - a.y) / ky); if (d < bestD) { bestD = d; best = b; } }
      if (best) lines += `<line x1="${a.x}" y1="${a.y}" x2="${best.x}" y2="${best.y}" stroke="#fff" stroke-opacity=".22" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
    }
    svg.innerHTML = lines;
    for (const n of nodes) { n.el.style.left = `${n.x}%`; n.el.style.top = `${n.y / H * 100}%`; }
  };
  layout(62);
  if ("ResizeObserver" in window) { let last = 0; new ResizeObserver(() => { const r = box.getBoundingClientRect(); if (!r.width) return; const H = Math.round(100 * r.height / r.width); if (H !== last) { last = H; layout(H, r.width); } }).observe(box); }
  const legend = el("div", "star-legend"); for (const [cls, key] of [["mandala", "mapLegendMandala"], ["studio", "mapLegendStudio"]]) { const item = el("span"); item.append(el("i", `dot ${cls}`), document.createTextNode(tr(key))); legend.append(item); } box.append(legend);
  return box;
}
function whenText(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (days <= 0) return tr("today"); if (days < 7) return tr("daysAgo", { n: days });
  return new Date(iso).toLocaleDateString(locale === "zh" ? "zh-TW" : "en", { month: "numeric", day: "numeric" });
}
function topicDocs(topic, product) { return topic.documents.filter((d) => d.product === product); }
// The ask box: the one entry point. Signed in it creates a topic; guests go straight to a tool.
function askBox({ compact = false } = {}) {
  const box = el("section", "ask");
  if (!compact) box.append(el("h1", "", tr("askTitle")));
  const form = el("form"); form.addEventListener("submit", (event) => { event.preventDefault(); go("topic"); });
  const label = el("label", "ask-label", tr("askLabel")); label.htmlFor = "ask"; form.append(label);
  const row = el("div", "ask-box"); row.append(topicStar("new", 26));
  const field = input("", { maxLength: 120, placeholder: tr("askPlaceholder") }); field.id = "ask"; row.append(field);
  const submit = btn(tr(isSignedIn() ? "askCreate" : "askStart"), { cls: "button primary" }); submit.type = "submit"; row.append(submit); form.append(row);
  const lenses = el("div", "lens-row"); lenses.append(el("span", "", tr("askLensHint")));
  const lens = (cls, label, sub, product) => { const a = el("a", "lens"); a.href = "#"; a.append(el("span", `dot ${cls}`), document.createTextNode(label), el("span", "muted", sub)); a.addEventListener("click", (event) => { event.preventDefault(); go(product); }); return a; };
  lenses.append(lens("mandala", tr("lensMandala"), tr("mandala"), "mandala"), lens("studio", tr("lensStudio"), "Intent Galaxy", "studio"));
  const mind = el("span", "lens disabled"); mind.append(el("span", "dot mind"), document.createTextNode(tr("lensMind")), el("span", "muted", tr("lensMindSub"))); lenses.append(mind);
  form.append(lenses); box.append(form);
  async function go(product) {
    const title = field.value.trim(); if (!title) { notify(tr("askNeedTitle"), "error"); field.focus(); return; }
    const goal = encodeURIComponent(title);
    if (!isSignedIn()) { navigate(product === "studio" ? `/studio?goal=${goal}` : `/mandala?goal=${goal}`); return; }
    const topic = await createTopic(title); if (!topic) return;
    if (product === "mandala") navigate(`/mandala?goal=${goal}&topic=${topic.id}`);
    else if (product === "studio") navigate(`/studio?goal=${goal}&topic=${topic.id}`);
    else navigate(`/t/${topic.id}`);
  }
  return box;
}
function renderParkHome() {
  const page = newPage(); page.classList.add("stack"); page.style.gap = "48px";
  page.append(askBox());
  renderStudioContinuationPrompt(page);
  if (isSignedIn()) { page.append(renderMyTopics()); }
  else page.append(renderGuestExample());
  const grid = el("section", "home-grid");
  const explore = el("a", "home-card"); explore.href = "/feed"; explore.append(el("p", "eyebrow", tr("navExplore")), el("strong", "", tr("exploreCardTitle")), el("span", "muted", tr("exploreCardBody"))); grid.append(explore);
  const map = el("div", "home-card night"); map.append(el("p", "eyebrow", tr("mapCardEyebrow")), el("strong", "", tr("mapCardTitle")));
  const sky = document.createElementNS("http://www.w3.org/2000/svg", "svg"); sky.setAttribute("viewBox", "0 0 360 80"); sky.setAttribute("height", "80"); sky.setAttribute("aria-hidden", "true"); sky.style.width = "100%";
  sky.innerHTML = '<line x1="70" y1="40" x2="180" y2="30" stroke="#2A3350"/><line x1="180" y1="30" x2="290" y2="46" stroke="#2A3350"/><circle cx="70" cy="40" r="7" fill="#F3E6C8"/><circle cx="56" cy="30" r="2.5" fill="#B8862B"/><circle cx="84" cy="30" r="2.5" fill="#1FB2C6"/><circle cx="180" cy="30" r="9" fill="#D9E8F5"/><circle cx="166" cy="20" r="2.5" fill="#B8862B"/><circle cx="290" cy="46" r="6" fill="#E6DDF5"/><circle cx="304" cy="36" r="2.5" fill="#1FB2C6"/><circle cx="278" cy="56" r="2.5" fill="#9B7FE8"/>';
  map.append(sky); grid.append(map); page.append(grid);
}
function renderGuestExample() {
  const box = el("section", "stack");
  const head = el("div", "section-head"); head.append(el("h2", "", tr("guestExampleTitle")), el("span", "muted", tr("guestExampleBody"))); box.append(head);
  const mandala = state.mandala;
  if (mandala.examples === null) { mandala.examples = "loading"; loadExamples(); }
  const example = Array.isArray(mandala.examples) ? mandala.examples[0] : null;
  if (!example) { box.append(el("p", "muted", tr("examplesLoading"))); return box; }
  const card = el("article", "panel poster"); card.append(chartView(example.chart));
  const row = el("div", "button-row"); row.append(btn(tr("examplesOpen"), { cls: "button primary", action: () => openExample(example) }), link(tr("navExplore"), "/feed", "button")); card.append(row);
  box.append(card); return box;
}
// Signed-in home: every topic as a row, with each lens's state.
function renderMyTopics() {
  const box = el("section", "stack");
  if (state.topics === null) loadTopics();
  const head = el("div", "section-head"); head.append(el("h2", "", tr("myTopics")));
  if (topicsReady()) head.append(el("span", "muted", tr("topicsPrivate", { n: state.topics.length })));
  const view = topicsView();
  const seg = el("div", "seg"); seg.setAttribute("role", "group");
  for (const [key, label] of [["list", tr("viewList")], ["map", tr("viewMap")]]) { const b = btn(label, { cls: "", action: () => { setTopicsView(key); render(); } }); b.setAttribute("aria-pressed", String(view === key)); seg.append(b); }
  head.append(seg); box.append(head);
  if (!topicsReady()) { box.append(el("p", "muted", tr("feedLoading"))); return box; }
  if (!state.topics.length) { box.append(el("p", "empty-state", tr("noTopicsYet"))); return box; }
  if (view === "map") { box.append(renderStarMap(state.topics), el("p", "muted", tr("mapHint"))); return box; }
  const table = el("div", "topic-table");
  const headRow = el("div", "topic-row head"); headRow.append(el("span"), el("span", "", tr("colTopic")), el("span", "", tr("mandala")), el("span", "t-studio", "Intent Galaxy"), el("span", "t-mind", "Mind Galaxy"), el("span", "t-when", tr("colUpdated"))); table.append(headRow);
  for (const topic of state.topics) {
    const row = el("a", "topic-row"); row.href = `/t/${topic.id}`; row.append(topicStar(topic.id, 36));
    const charts = topicDocs(topic, "mandala"), works = topicDocs(topic, "studio");
    const title = el("span", "t-title"); title.append(el("b", "", topic.title)); const latest = topic.documents[0]; if (latest) title.append(el("small", "", latest.title)); row.append(title);
    const m = el("span", `t-cell${charts.length ? " on" : ""}`); m.append(el("span", "dot mandala"), document.createTextNode(charts.length ? tr("countCharts", { n: charts.length }) : tr("notYet"))); row.append(m);
    const st = el("span", `t-cell t-studio${works.length ? " on" : ""}`); st.append(el("span", "dot studio"), document.createTextNode(works.length ? tr("countWorks", { n: works.length }) : tr("notYet"))); row.append(st);
    const mi = el("span", "t-cell t-mind"); mi.append(el("span", "dot mind"), document.createTextNode(tr("notIn"))); row.append(mi);
    row.append(el("span", "t-when", whenText(topic.updatedAt)));
    table.append(row);
  }
  box.append(table, el("p", "muted", tr("topicExplain")));
  return box;
}
// /t/:id: the topic page, where cross-tool navigation happens.
function renderTopic(id) {
  if (!isSignedIn()) { const page = newPage("page-shell narrow"); page.append(heading(tr("topicsTitle"), tr("topicsLead"))); if (state.config?.authEnabled) page.append(link(tr("signIn"), "/api/auth/login", "button primary")); return; }
  if (state.topics === null) loadTopics();
  const page = newPage(); page.classList.add("stack"); page.style.gap = "32px";
  if (!topicsReady()) { page.append(el("p", "muted", tr("feedLoading"))); return; }
  const topic = state.topics.find((t) => t.id === id);
  if (!topic) { renderNotFound(); return; }
  const crumb = el("nav", "muted"); crumb.style.fontSize = "13px"; crumb.append(link(tr("navGalaxy"), "/", ""), document.createTextNode(" › "), document.createTextNode(topic.title)); page.append(crumb);
  const head = el("section", "topic-head"); head.append(topicStar(topic.id, 64));
  const title = el("div", "topic-title"); title.append(el("h1", "", topic.title), el("p", "lead", `${tr("topicCreatedOn", { d: whenText(topic.createdAt ?? topic.updatedAt) })} · ${tr("topicLensCount")}`)); head.append(title);
  const actions = el("div", "button-row");
  actions.append(btn(tr("topicRename"), { cls: "button small", action: async () => {
    const next = prompt(tr("topicRename"), topic.title); if (next === null) return;
    if (!next.trim() || next.trim().length > 120) { notify(tr("topicTitleInvalid"), "error"); return; }
    try { const { topic: renamed } = await api.renameTopic(topic.id, next.trim()); state.topics = state.topics.map((t) => t.id === renamed.id ? renamed : t); render(); } catch (error) { notify(toMessage(error), "error"); }
  } }));
  actions.append(btn(tr("topicDelete"), { cls: "button small danger", action: async () => {
    if (!confirm(tr("topicDeleteConfirm"))) return;
    try { await api.deleteTopic(topic.id); state.topics = state.topics.filter((t) => t.id !== topic.id); navigate("/"); } catch (error) { notify(toMessage(error), "error"); }
  } }));
  head.append(actions); page.append(head);
  const charts = topicDocs(topic, "mandala"), works = topicDocs(topic, "studio");
  const goal = encodeURIComponent(topic.title);
  const mandalaHref = `/mandala?goal=${goal}&topic=${topic.id}`, studioHref = `/studio?goal=${goal}&topic=${topic.id}`;
  // Next step is a rule, not a model: which lens is still empty.
  const next = el("section", "next-step"); const text = el("div"); text.append(el("p", "eyebrow", tr("nextStep")));
  if (!charts.length) { text.append(el("span", "", tr("nextExpand"))); next.append(text, link(tr("newChartInTopic"), mandalaHref, "button primary")); }
  else if (!works.length) { text.append(el("span", "", tr("nextDecide"))); next.append(text, link(tr("newDecisionInTopic"), studioHref, "button primary")); }
  else { text.append(el("span", "", tr("nextContinue"))); next.append(text, link(tr("open"), docHref(charts[0]), "button primary")); }
  page.append(next);
  const lenses = el("section", "lens-cards");
  const docList = (docs) => { const list = el("div", "saved-list"); for (const doc of docs) { const row = el("div", "saved-item"); row.append(el("span", "item-title", doc.title), link(tr("open"), docHref(doc), "text-button")); list.append(row); } return list; };
  const mandalaCard = el("article", `lens-card${charts.length ? "" : " empty"}`); const mh = el("div", "lens-head"); mh.append(el("span", "dot mandala"), document.createTextNode(`${tr("mandala")} · ${tr("lensMandala")}`)); mandalaCard.append(mh);
  const mp = el("div", "lens-preview"); mp.append(charts.length ? mini9FromDoc(charts[0]) : document.createTextNode(tr("notYet"))); mandalaCard.append(mp);
  if (charts.length) mandalaCard.append(docList(charts));
  const mf = el("div", "lens-foot"); mf.append(link(charts.length ? tr("newChart") : tr("newChartInTopic"), mandalaHref, charts.length ? "button small" : "button small primary")); mandalaCard.append(mf); lenses.append(mandalaCard);
  const studioCard = el("article", `lens-card${works.length ? "" : " empty"}`); const sh = el("div", "lens-head"); sh.append(el("span", "dot studio"), document.createTextNode(`Intent Galaxy · ${tr("lensStudio")}`)); studioCard.append(sh);
  const sp = el("div", "lens-preview night"); const sky = document.createElementNS("http://www.w3.org/2000/svg", "svg"); sky.setAttribute("viewBox", "0 0 260 120"); sky.setAttribute("aria-hidden", "true"); sky.style.width = "100%";
  sky.innerHTML = works.length ? '<line x1="130" y1="60" x2="60" y2="26" stroke="#1FB2C6" stroke-width="1.5"/><line x1="130" y1="60" x2="70" y2="96" stroke="#1FB2C6" stroke-width="1.5"/><line x1="130" y1="60" x2="200" y2="26" stroke="#2A3350"/><line x1="130" y1="60" x2="196" y2="96" stroke="#2A3350"/><circle cx="130" cy="60" r="8" fill="#1FB2C6"/><circle cx="60" cy="26" r="5" fill="#1FB2C6"/><circle cx="70" cy="96" r="5" fill="#1FB2C6"/><circle cx="200" cy="26" r="4" fill="#4C5878"/><circle cx="196" cy="96" r="4" fill="#4C5878"/><circle cx="214" cy="110" r="3" fill="#E0725C"/>' : '<circle cx="130" cy="60" r="8" fill="#2A3350"/><circle cx="60" cy="26" r="4" fill="#2A3350"/><circle cx="70" cy="96" r="4" fill="#2A3350"/><circle cx="200" cy="26" r="4" fill="#2A3350"/><circle cx="196" cy="96" r="4" fill="#2A3350"/>';
  sp.append(sky); studioCard.append(sp);
  if (works.length) studioCard.append(docList(works));
  const sf = el("div", "lens-foot"); sf.append(link(tr("newDecisionInTopic"), studioHref, works.length ? "button small" : "button small primary")); studioCard.append(sf); lenses.append(studioCard);
  const mindCard = el("article", "lens-card empty"); const mih = el("div", "lens-head"); mih.append(el("span", "dot mind"), document.createTextNode(`Mind Galaxy · ${tr("lensMind")}`), el("span", "badge", tr("statusOwner"))); mindCard.append(mih);
  const mpv = el("div", "lens-preview", tr("noMemory")); mindCard.append(mpv, el("p", "muted", `${tr("mindAutoLead")} ${state.session?.owner ? tr("mindExportHere") : tr("mindLater")}`));
  const mif = el("div", "lens-foot"); if (state.session?.owner) mif.append(btn(tr("mindExport"), { cls: "button small", action: () => exportTopic(topic) })); mindCard.append(mif); lenses.append(mindCard);
  page.append(lenses);
  const hist = el("section", "stack"); hist.append(el("h2", "", tr("topicHistory")));
  const list = el("ol", "timeline");
  for (const doc of topic.documents) { const li = el("li", doc.product === "studio" ? "studio" : ""); li.append(el("time", "", whenText(doc.updatedAt)), el("span", "", tr(doc.product === "studio" ? "historyStudio" : "historyMandala", { t: doc.title }))); list.append(li); }
  const start = el("li", "start"); start.append(el("time", "", whenText(topic.createdAt ?? topic.updatedAt)), el("span", "", tr("historyCreated", { t: topic.title }))); list.append(start);
  hist.append(list, el("p", "muted", tr("historyHint"))); page.append(hist);
}
// A 9×9 thumbnail with no text: filled, theme, goal and empty cells only.
function mini9(chart) {
  const grid = el("div", "mini9"); grid.setAttribute("role", "img"); grid.setAttribute("aria-label", tr("chartLabel"));
  const at = new Map(THEME_POSITIONS.map(([r, c], i) => [`${r},${c}`, i]));
  const actionPositions = [[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[2,0],[1,0]];
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
    const mr = Math.floor(row / 3), mc = Math.floor(col / 3), ir = row % 3, ic = col % 3;
    if (mr === 1 && mc === 1) { grid.append(el("span", ir === 1 && ic === 1 ? "c" : (chart.themes?.[at.get(`${ir},${ic}`)]?.title ? "t" : "e"))); continue; }
    const theme = chart.themes?.[at.get(`${mr},${mc}`)] ?? { title: "", actions: [] };
    if (ir === 1 && ic === 1) { grid.append(el("span", theme.title ? "t" : "e")); continue; }
    const ai = actionPositions.findIndex(([r, c]) => r === ir && c === ic); const action = theme.actions?.[ai];
    grid.append(el("span", action?.done ? "d" : action?.text ? "" : "e"));
  }
  return grid;
}
const miniDocCache = new Map();
function mini9FromDoc(doc) {
  const holder = el("div"); const cached = miniDocCache.get(doc.id);
  if (cached) { holder.append(mini9(cached)); return holder; }
  holder.append(el("span", "muted", tr("feedLoading")));
  api.getDocument(doc.id).then((response) => { const data = response?.document?.data ?? response?.data; if (data?.themes) { miniDocCache.set(doc.id, data); holder.replaceChildren(mini9(data)); } }).catch(() => { holder.replaceChildren(); });
  return holder;
}
// The full read-only chart with text, used on share pages and for examples.
function chartView(chart) {
  const grid = el("div", "chart-view"); grid.setAttribute("role", "img"); grid.setAttribute("aria-label", chart.title || chart.goal || tr("chartLabel"));
  const at = new Map(THEME_POSITIONS.map(([r, c], i) => [`${r},${c}`, i]));
  const actionPositions = [[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[2,0],[1,0]];
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
    const mr = Math.floor(row / 3), mc = Math.floor(col / 3), ir = row % 3, ic = col % 3;
    if (mr === 1 && mc === 1) {
      if (ir === 1 && ic === 1) { grid.append(el("div", "v c", chart.goal || "")); continue; }
      const theme = chart.themes?.[at.get(`${ir},${ic}`)]; grid.append(el("div", theme?.title ? "v t" : "v e", theme?.title ?? "")); continue;
    }
    const theme = chart.themes?.[at.get(`${mr},${mc}`)] ?? { title: "", actions: [] };
    if (ir === 1 && ic === 1) { grid.append(el("div", theme.title ? "v t" : "v e", theme.title)); continue; }
    const ai = actionPositions.findIndex(([r, c]) => r === ir && c === ic); const action = theme.actions?.[ai];
    grid.append(el("div", action?.text ? `v${action.done ? " d" : action.skipped ? " s" : ""}` : "v e", action?.text ?? ""));
  }
  return grid;
}
function topicCard(topic, { exportable }) {
  const card = el("section", "panel topic-card"); card.dataset.topic = topic.id;
  const head = el("div", "panel-header"); head.append(el("h2", "", topic.title));
  const actions = el("div", "item-actions");
  if (exportable) actions.append(btn(tr("mindExport"), { cls: "button small primary", action: () => exportTopic(topic) }));
  else {
    actions.append(btn(tr("topicRename"), { cls: "text-button", action: async () => {
      const title = prompt(tr("topicRename"), topic.title); if (title === null) return;
      if (!title.trim() || title.trim().length > 120) { notify(tr("topicTitleInvalid"), "error"); return; }
      try { const { topic: renamed } = await api.renameTopic(topic.id, title.trim()); state.topics = state.topics.map((t) => t.id === renamed.id ? renamed : t); render(); } catch (error) { notify(toMessage(error), "error"); }
    } }));
    actions.append(btn(tr("topicDelete"), { cls: "text-button", action: async () => {
      if (!confirm(tr("topicDeleteConfirm"))) return;
      try { await api.deleteTopic(topic.id); state.topics = state.topics.filter((t) => t.id !== topic.id); render(); } catch (error) { notify(toMessage(error), "error"); }
    } }));
  }
  head.append(actions); card.append(head);
  if (!topic.documents.length) { card.append(el("p", "muted", tr("topicEmpty"))); return card; }
  const list = el("div", "saved-list");
  for (const doc of topic.documents) { const row = el("div", "saved-item"); row.append(el("span", "badge", tr(`product_${doc.product}`)), el("span", "item-title", doc.title)); const open = el("span", "item-actions"); open.append(link(tr("open"), docHref(doc), "text-button")); row.append(open); list.append(row); }
  card.append(list); return card;
}
// Mind Galaxy: owner only. The server answers 404 to everyone else as well.
function renderMind() {
  if (!state.session?.owner) { renderNotFound(); return; }
  const page = newPage("page-shell narrow"); page.append(heading(tr("mindTitle"), tr("mindLead"), tr("statusOwner")));
  if (state.topics === null) loadTopics();
  if (!topicsReady()) { page.append(el("p", "muted", tr("feedLoading"))); return; }
  if (!state.topics.length) { page.append(el("p", "empty-state", tr("noTopics")), link(tr("topicsTitle"), "/", "button")); return; }
  for (const topic of state.topics) page.append(topicCard(topic, { exportable: true }));
}
async function exportTopic(topic) {
  try {
    const data = await api.exportTopic(topic.id);
    downloadFile(`${filenameFor(topic.title, "topic")}.mind-galaxy.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
    notify(tr("mindExported"), "success");
  } catch (error) { notify(toMessage(error), "error"); }
}
function renderTools() {
  const page = newPage(); page.classList.add("stack"); page.style.gap = "40px";
  page.append(heading(tr("toolsTitle"), tr("toolsLead")));
  const apps = visibleApps(state.session);
  const lenses = el("section", "tool-group"); lenses.append(el("h2", "", tr("groupLenses")));
  const cards = el("div", "tool-cards");
  const thumbMandala = () => { const t = el("div", "tool-thumb"); for (let k = 0; k < 9; k++) t.append(el("span", k === 4 ? "c" : "")); return t; };
  const sky = (on) => { const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 72 72"); svg.setAttribute("width", "72"); svg.setAttribute("height", "72"); svg.setAttribute("aria-hidden", "true"); svg.style.cssText = `background:${on ? "#0E1220" : "var(--surface-2)"};border-radius:8px`; svg.innerHTML = on ? '<line x1="36" y1="36" x2="16" y2="18" stroke="#1FB2C6" stroke-width="1.5"/><line x1="36" y1="36" x2="18" y2="54" stroke="#1FB2C6" stroke-width="1.5"/><circle cx="36" cy="36" r="6" fill="#1FB2C6"/><circle cx="16" cy="18" r="3.5" fill="#1FB2C6"/><circle cx="18" cy="54" r="3.5" fill="#1FB2C6"/><circle cx="56" cy="18" r="3" fill="#4C5878"/><circle cx="54" cy="54" r="3" fill="#4C5878"/>' : '<line x1="12" y1="56" x2="60" y2="56" stroke="var(--line)" stroke-width="1.5"/><circle cx="20" cy="56" r="3" fill="#6B4FBB"/><circle cx="36" cy="56" r="3" fill="#6B4FBB"/><circle cx="52" cy="56" r="3" fill="#6B4FBB"/><line x1="36" y1="56" x2="36" y2="30" stroke="var(--line)"/><circle cx="36" cy="26" r="5" fill="#E6DDF5" stroke="#6B4FBB" stroke-width="1.2"/>'; return svg; };
  const statusKey = { live: "statusLive", beta: "statusBeta", soon: "statusSoon", owner: "statusOwner" };
  const card = (app, name, desc, art, dot) => {
    const node = el(app.status === "owner" ? "div" : "a", `tool-card${app.status === "owner" ? " owner" : ""}`); if (node.tagName === "A") node.href = app.path;
    const head = el("div", "tool-head"); head.append(el("span", `dot ${dot}`), el("strong", "", name), el("span", "badge", tr(statusKey[app.status]))); node.append(head, art, el("p", "", desc));
    node.append(el("span", "tool-open", app.status === "owner" ? tr("fromTopicPage") : `${tr("openApp")} →`)); return node;
  };
  for (const app of apps) {
    if (app.id === "mandala") cards.append(card(app, tr("mandala"), tr("lensMandalaDesc"), thumbMandala(), "mandala"));
    if (app.id === "galaxy") cards.append(card(app, "Intent Galaxy", tr("lensStudioDesc"), sky(true), "studio"));
    if (app.id === "mind") cards.append(card(app, "Mind Galaxy", tr("lensMindDesc"), sky(false), "mind"));
  }
  lenses.append(cards); page.append(lenses);
  const places = el("section", "tool-group"); places.append(el("h2", "", tr("groupPlaces")));
  const feedCard = el("a", "tool-card row"); feedCard.href = "/feed";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); icon.setAttribute("viewBox", "0 0 48 48"); icon.setAttribute("width", "44"); icon.setAttribute("height", "44"); icon.setAttribute("aria-hidden", "true"); icon.innerHTML = '<circle cx="22" cy="22" r="13" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 32l9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  const body = el("div"); body.append(el("strong", "", tr("navExplore")), el("p", "", tr("exploreDesc"))); feedCard.append(icon, body, el("span", "badge", tr("statusLive"))); places.append(feedCard); page.append(places);
  const limits = state.config?.mandalaLimits ?? {};
  const plan = el("section", "stack"); const ph = el("div", "section-head"); ph.append(el("h2", "", tr("planTitle")), el("span", "muted", tr("planLead"))); plan.append(ph);
  const wrap = el("div", "plan-table"); const table = el("table");
  const thead = el("thead"); const hr = el("tr"); for (const t of [tr("planCanDo"), tr("planGuestTitle"), tr("planFreeTitle"), tr("planProTitle")]) hr.append(el("th", "", t)); thead.append(hr); table.append(thead);
  const tbody = el("tbody");
  const rows = [
    [tr("planAiCharts"), tr("planGuestInvite"), tr("nCharts", { n: limits.dailyCharts ?? 3 }), tr("planTierUp")],
    [tr("planAiCalls"), "0", tr("nTimes", { n: 30 }), tr("planTierUp")],
    [tr("planInviteCodes"), tr("planNo"), tr("nCodes", { n: limits.invitesPerDay ?? 3 }), tr("planMore")],
    [tr("planManual"), tr("planCan"), tr("planCan"), tr("planCan")],
    [tr("planCloud"), tr("planLocalOnly"), tr("planCloudCount", { n: 10 }), tr("planMore")],
    [tr("planTopics"), tr("planNo"), tr("planCan"), tr("planCan")],
    [tr("planExplore"), tr("planShareOnly"), tr("planCan"), tr("planCan")],
    [tr("planStudio"), tr("planGuest24h"), tr("planSave"), tr("planCan")],
    [tr("planPrice"), tr("planFreeShort"), tr("planFreeShort"), tr("planPriceNote")],
  ];
  for (const [label, ...cells] of rows) { const trow = el("tr"); trow.append(el("th", "", label)); cells.forEach((c, k) => { const td = el("td"); if (k === 1 && /^\d/.test(c)) { td.append(el("strong", "", c.split(" ")[0]), document.createTextNode(" " + c.split(" ").slice(1).join(" "))); } else td.textContent = c; trow.append(td); }); tbody.append(trow); }
  table.append(tbody); wrap.append(table); plan.append(wrap, el("p", "muted", `${tr("planFoot")} ${tr("noOverage")}`)); page.append(plan);
}

// Public feed: signed-in users browse charts others chose to publish, cheer,
// copy, share, download or report them. Shared links open for anyone.
const FEED_TAGS = ["health", "learning", "career", "money", "sports", "creative", "family", "life"];
const AVATARS = Array.from({ length: 12 }, (_, i) => `a${String(i + 1).padStart(2, "0")}`);
const REPORT_REASONS = ["personal_data", "harmful", "spam", "other"];
function emptyFeed() { return { sort: "hot", window: "7d", source: "all", tag: "", items: null, loading: false, done: false, viewed: new Set(), profile: undefined, mine: null, shared: null, publishTags: null }; }
state.feed = emptyFeed();
let feedObserver = null;

function avatarImg(author, size = 40) {
  const img = el("img", "avatar"); img.width = size; img.height = size; img.alt = "";
  const name = author?.brand ? "brand" : AVATARS.includes(author?.avatar) ? author.avatar : "a01";
  img.src = `/avatars/${name}.svg`; return img;
}
function authorName(author) { return author?.brand ? tr("brandName") : author?.nickname ?? ""; }
function publicUrl(id) { return new URL(`/mandala/p/${id}`, location.origin).href; }
function chartFromPublic(item) {
  const chart = createEmptyChart({ title: String(item.title ?? "").slice(0, 160), goal: String(item.goal ?? "").slice(0, 500) });
  chart.themes.forEach((theme, ti) => {
    theme.title = item.themes?.[ti]?.title ?? "";
    theme.actions.forEach((action, ai) => { action.text = item.themes?.[ti]?.actions?.[ai]?.text ?? ""; });
  });
  return validateChart(chart);
}
// A small disclosure menu; the summary is the button.
function menu(label, items) {
  const box = el("details", "menu"); const summary = el("summary", "button small", label); box.append(summary);
  const list = el("div", "menu-list");
  for (const [text, action] of items) list.append(btn(text, { cls: "text-button", action: (event) => { box.open = false; action(event); } }));
  box.append(list); return box;
}
function shareMenu(item) {
  const url = publicUrl(item.id); const title = item.title || item.goal;
  const shared = () => api.event("chart_shared", "mandala").catch(() => {});
  const items = [];
  if (navigator.share) items.push([tr("shareSystem"), () => navigator.share({ title, url }).then(shared).catch(() => {})]);
  items.push([tr("shareCopyLink"), async () => { await navigator.clipboard?.writeText(url).then(() => notify(tr("linkCopied"), "success")).catch(() => notify(tr("copyFailed"), "error")); shared(); }]);
  items.push([tr("shareLine"), () => { window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, "_blank", "noopener"); shared(); }]);
  items.push([tr("shareFacebook"), () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener"); shared(); }]);
  return menu(tr("share"), items);
}
// Image, PDF and Excel downloads share one renderer; the canvas is built only on demand.
async function downloadChart(chart, format, author = "") {
  try {
    const { renderChartCanvas, canvasBlob, chartPdf, chartXlsx } = await import("./export.js");
    const name = filenameFor(chart.title || chart.goal, "mandala");
    let blob;
    if (format === "xlsx") blob = chartXlsx(chart, { gridName: tr("xlsxGrid"), listName: tr("xlsxList"), headers: [tr("xlsxTheme"), tr("xlsxAction"), tr("xlsxDone")] });
    else {
      await document.fonts?.ready;
      const canvas = renderChartCanvas(chart, { author, footer: `${location.host}/mandala` });
      blob = format === "pdf" ? await chartPdf(canvas) : await canvasBlob(canvas);
    }
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${name}.${format}`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    api.event("chart_exported", "mandala").catch(() => {});
  } catch { notify(tr("downloadFailed"), "error"); }
}
function downloadMenu(chart, author = "") {
  return menu(tr("download"), [[tr("downloadPng"), () => downloadChart(chart, "png", author)], [tr("downloadPdf"), () => downloadChart(chart, "pdf", author)], [tr("downloadXlsx"), () => downloadChart(chart, "xlsx", author)]]);
}
// The 3×3 overview: goal in the middle, the 8 themes around it.
function replaceCard(item) {
  if (Array.isArray(state.feed.items)) state.feed.items = state.feed.items.map((other) => other.id === item.id ? { ...other, ...item } : other);
  if (state.feed.shared?.id === item.id) state.feed.shared = { ...state.feed.shared, ...item };
  document.querySelectorAll(`[data-chart="${item.id}"]`).forEach((card) => card.replaceWith(publicCard(item)));
}
function countView(item) {
  if (isSignedIn() && !item.mine && !state.feed.viewed.has(item.id)) { state.feed.viewed.add(item.id); api.publicChart(item.id).catch(() => {}); }
}
function publicCard(item, { open = false } = {}) {
  const card = el("article", `panel feed-card${open ? " poster" : ""}`); card.dataset.chart = item.id;
  const head = el("header", "feed-head"); const who = el("div", "feed-author");
  who.append(avatarImg(item.author, open ? 40 : 28), el("strong", "", authorName(item.author)));
  if (item.example) who.append(el("span", "badge", tr("exampleBadge")));
  head.append(who, el("time", "muted", new Date(item.publishedAt).toLocaleDateString(locale === "zh" ? "zh-TW" : "en")));
  card.append(head);
  const title = el(open ? "h1" : "h2", "feed-title"); if (open) title.textContent = item.title || item.goal; else title.append(link(item.title || item.goal, `/mandala/p/${item.id}`, "")); card.append(title);
  if (open && item.title && item.goal && item.goal !== item.title) card.append(el("p", "lead", item.goal));
  if (item.tags?.length) { const tags = el("div", "tag-row"); for (const tag of item.tags) tags.append(el("span", "tag", tr(`tag_${tag}`))); card.append(tags); }
  if (open) { card.append(chartView(chartFromPublic(item))); countView(item); }
  else { const thumb = link("", `/mandala/p/${item.id}`, "mini-link"); thumb.setAttribute("aria-label", tr("open9x9")); thumb.append(mini9(item)); card.append(thumb); }
  const meter = el("div", "mandala-progress"); meter.append(el("span", "", `${tr("progress")}: ${item.progress}/64`));
  const track = el("span", "progress-track"); const fill = el("span"); fill.style.width = `${Math.round(item.progress / 64 * 100)}%`; track.append(fill); meter.append(track); card.append(meter);
  const stats = el("p", "feed-stats muted", [tr("statEncourages", { n: item.encourages }), tr("statCopies", { n: item.copies }), ...(item.views ? [tr("statViews", { n: item.views })] : [])].join(" · "));
  card.append(stats);
  const actions = el("div", "button-row feed-buttons");
  if (isSignedIn()) {
    actions.append(btn(`${item.encouraged ? "♥" : "♡"} ${tr(item.encouraged ? "encouraged" : "encourage")}`, { cls: `button small${item.encouraged ? " secondary" : ""}`, disabled: item.mine, action: () => toggleEncourage(item) }));
    actions.append(btn(tr("copyToMine"), { cls: "button small", action: () => copyPublic(item) }));
  }
  if (open) {
    actions.append(shareMenu(item), downloadMenu(chartFromPublic(item), authorName(item.author)));
    if (isSignedIn() && !item.mine) actions.append(menu(tr("report"), REPORT_REASONS.map((reason) => [tr(`reason_${reason}`), () => reportPublic(item, reason)])));
  } else actions.append(link(tr("open9x9"), `/mandala/p/${item.id}`, "button small"));
  card.append(actions);
  return card;
}
async function toggleEncourage(item) {
  const scope = captureAccountScope();
  try { const { chart } = await api.encourage(item.id, !item.encouraged); if (accountScopeCurrent(scope)) replaceCard(chart); }
  catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
async function copyPublic(item) {
  const scope = captureAccountScope();
  try {
    const { chart } = await api.copyPublic(item.id); if (!accountScopeCurrent(scope)) return;
    const mandala = state.mandala; mandala.chartEpoch++; mandala.chart = chartFromPublic(chart); mandala.localId = null; mandala.cloudDoc = null; mandala.proposal = null; mandala.proposalSnapshot = null; mandala.proposalStale = false; mandala.perspectives = null;
    setNotice(tr("copiedToMine"), "success"); navigate("/mandala");
  } catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
async function reportPublic(item, reason) {
  if (!confirm(tr("reportConfirm"))) return;
  try { await api.report(item.id, reason); notify(tr("reported"), "success"); }
  catch (error) { notify(toMessage(error), "error"); }
}
async function loadFeed() {
  const feed = state.feed; if (feed.loading || feed.done) return;
  const scope = captureAccountScope(); const key = feedKey(feed); feed.loading = key;
  const query = { sort: feed.sort, window: feed.window, source: feed.source, tag: feed.tag || undefined, lang: locale, offset: feed.items?.length ?? 0 };
  try {
    const { items } = await api.feed(query);
    // A filter change while this page was loading makes the answer stale.
    if (!accountScopeCurrent(scope) || state.feed !== feed || feedKey(feed) !== key) return;
    const known = new Set((feed.items ?? []).map((item) => item.id));
    feed.items = [...(feed.items ?? []), ...items.filter((item) => !known.has(item.id))];
    feed.done = items.length < 20 || feed.items.length >= 500;
    if (query.offset === 0) api.event("feed_viewed", "mandala").catch(() => {});
  } catch (error) { if (feedKey(feed) === key) { feed.done = true; feed.items ??= []; } if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
  finally { if (feed.loading === key) feed.loading = false; }
  if (state.route === "/feed" && state.feed === feed) render();
}
function feedKey(feed) { return `${feed.sort}|${feed.window}|${feed.source}|${feed.tag}`; }
function setFeedFilter(key, value) {
  const feed = state.feed; if (feed[key] === value) return;
  Object.assign(feed, { [key]: value, items: null, done: false, loading: false }); render();
}
function segRow(label, key, options) {
  const row = el("div", "seg"); row.setAttribute("role", "group"); row.setAttribute("aria-label", label);
  for (const [value, text] of options) {
    const b = btn(text, { cls: "", action: () => setFeedFilter(key, value) }); b.setAttribute("aria-pressed", String(state.feed[key] === value)); row.append(b);
  }
  return row;
}
function filterRow(label, key, options) {
  const row = el("div", "filter-row"); row.setAttribute("role", "group"); row.setAttribute("aria-label", label);
  for (const [value, text] of options) {
    const chip = btn(text, { cls: `chip${state.feed[key] === value ? " active" : ""}`, action: () => setFeedFilter(key, value) });
    chip.setAttribute("aria-pressed", String(state.feed[key] === value)); row.append(chip);
  }
  return row;
}
function renderFeed() {
  const page = newPage("page-shell feed-page");
  page.append(heading(tr("feedTitle"), tr("feedLead")));
  feedObserver?.disconnect(); feedObserver = null;
  if (!isSignedIn()) {
    page.append(infoBox(tr("feedSignIn")));
    const row = el("div", "button-row"); if (state.config?.authEnabled) row.append(link(tr("signInFeed"), "/api/auth/login", "button primary")); row.append(link(tr("openMandala"), "/mandala", "button")); page.append(row);
    return;
  }
  const toolbar = el("div", "feed-toolbar");
  toolbar.append(segRow(tr("sortLabel"), "sort", [["hot", tr("sortHot")], ["new", tr("sortNew")], ["copied", tr("sortCopied")], ["done", tr("sortDone")]]));
  if (["hot", "copied"].includes(state.feed.sort)) { const win = select(state.feed.window, [["7d", tr("window7d")], ["30d", tr("window30d")], ["all", tr("windowAll")]], (event) => setFeedFilter("window", event.target.value), ""); win.setAttribute("aria-label", tr("windowLabelShort")); toolbar.append(win); }
  const source = segRow(tr("sourceLabel"), "source", [["all", tr("sourceAll")], ["users", tr("sourceUsers")], ["examples", tr("sourceExamples")]]); source.classList.add("right"); toolbar.append(source);
  page.append(toolbar);
  const tags = filterRow(tr("tagLabel"), "tag", [["", tr("allTags")], ...FEED_TAGS.map((tag) => [tag, tr(`tag_${tag}`)])]); tags.classList.add("scroll"); page.append(tags);
  const profile = renderProfileEditor(); profile.querySelector("summary strong").textContent = state.feed.profile && state.feed.profile !== "loading" ? state.feed.profile.nickname : tr("myProfile"); page.append(profile);
  const feed = state.feed;
  if (feed.items === null) { page.append(el("p", "muted", tr("feedLoading"))); loadFeed(); return; }
  if (!feed.items.length) { page.append(el("p", "empty-state", tr("feedEmpty"))); return; }
  const list = el("div", "feed-list"); for (const item of feed.items) list.append(publicCard(item)); page.append(list);
  if (feed.done) { page.append(el("p", "empty-state", tr("feedEnd"))); return; }
  page.append(el("p", "muted", tr("feedMore")));
  const more = btn(tr(feed.loading ? "feedLoading" : "loadMore"), { cls: "button", action: () => loadFeed() }); page.append(more);
  if ("IntersectionObserver" in window) { feedObserver = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) loadFeed(); }, { rootMargin: "600px" }); feedObserver.observe(more); }
}
function renderProfileEditor({ open = false } = {}) {
  const feed = state.feed;
  if (feed.profile === undefined) { feed.profile = "loading"; loadProfile(); }
  const box = el("details", "panel profile-editor"); box.open = open;
  const summary = el("summary", "profile-summary");
  const current = feed.profile && feed.profile !== "loading" ? feed.profile : null;
  summary.append(avatarImg(current ?? { avatar: "a01" }, 32), el("strong", "", current?.nickname ?? tr("profileTitle")));
  box.append(summary, el("p", "muted", tr("profileLead")));
  const draft = { nickname: current?.nickname ?? "", avatar: current?.avatar ?? "" };
  box.append(field(tr("nickname"), input(draft.nickname, { maxLength: 24, onInput: (event) => { draft.nickname = event.target.value; } })));
  const picker = el("div", "avatar-picker"); picker.setAttribute("role", "radiogroup"); picker.setAttribute("aria-label", tr("avatar"));
  for (const id of AVATARS) {
    const option = el("button", `avatar-option${draft.avatar === id ? " active" : ""}`); option.type = "button"; option.setAttribute("role", "radio"); option.setAttribute("aria-checked", String(draft.avatar === id)); option.setAttribute("aria-label", `${tr("avatar")} ${id.slice(1)}`);
    option.append(avatarImg({ avatar: id }, 48));
    option.addEventListener("click", () => { draft.avatar = id; picker.querySelectorAll(".avatar-option").forEach((b) => { const on = b === option; b.classList.toggle("active", on); b.setAttribute("aria-checked", String(on)); }); });
    picker.append(option);
  }
  box.append(el("span", "field-label", tr("avatar")), picker, btn(tr("saveProfile"), { cls: "button primary small", action: () => saveProfile(draft) }));
  return box;
}
async function loadProfile() {
  const scope = captureAccountScope();
  try { const { profile } = await api.profile(); if (!accountScopeCurrent(scope)) return; state.feed.profile = profile ?? null; }
  catch { if (accountScopeCurrent(scope)) state.feed.profile = null; }
  if (["/feed", "/mandala"].includes(state.route)) render();
}
async function saveProfile(draft) {
  if (!draft.nickname.trim() || !AVATARS.includes(draft.avatar)) { notify(tr("profileRequired"), "error"); return; }
  const scope = captureAccountScope();
  try {
    const { profile } = await api.saveProfile({ nickname: draft.nickname.trim(), avatar: draft.avatar }); if (!accountScopeCurrent(scope)) return;
    state.feed.profile = profile; state.feed.items = null; state.feed.done = false; state.feed.mine = null; notify(tr("profileSaved"), "success"); render();
  } catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
// Publishing from the Mandala page: needs a cloud copy and a profile.
function renderPublishPanel() {
  const mandala = state.mandala; const feed = state.feed;
  const box = el("section", "panel mandala-publish"); box.append(sectionTitle(tr("publishTitle"), tr("publishLead")));
  if (!mandala.cloudDoc) { box.append(el("p", "muted", tr("publishNeedsCloud"))); return box; }
  if (feed.mine === null) { feed.mine = "loading"; loadMine(); }
  if (feed.profile === undefined) { feed.profile = "loading"; loadProfile(); }
  if (feed.profile === null) box.append(renderProfileEditor({ open: true }));
  const current = Array.isArray(feed.mine) ? feed.mine.find((item) => item.documentId === mandala.cloudDoc.id) : null;
  if (!feed.publishTags || feed.publishTags.doc !== mandala.cloudDoc.id) feed.publishTags = { doc: mandala.cloudDoc.id, tags: [...(current?.tags ?? [])] };
  const tags = el("div", "filter-row"); tags.setAttribute("role", "group"); tags.setAttribute("aria-label", tr("publishTags"));
  for (const tag of FEED_TAGS) {
    const on = feed.publishTags.tags.includes(tag);
    const chip = btn(tr(`tag_${tag}`), { cls: `chip${on ? " active" : ""}`, action: () => {
      const list = feed.publishTags.tags;
      if (on) list.splice(list.indexOf(tag), 1); else if (list.length >= 3) { notify(tr("tooManyTags"), "error"); return; } else list.push(tag);
      render();
    } });
    chip.setAttribute("aria-pressed", String(on)); tags.append(chip);
  }
  box.append(el("span", "field-label", tr("publishTags")), tags);
  if (current?.hidden) box.append(alertBox(tr("publishedHidden"), "warning"));
  const row = el("div", "button-row");
  row.append(btn(tr(current ? "publishUpdate" : "publish"), { cls: "button primary", disabled: !feed.profile || feed.profile === "loading", action: () => publishChart() }));
  if (current) {
    row.append(link(tr("publicLink"), `/mandala/p/${current.id}`, "button small"), shareMenu(current));
    row.append(btn(tr("unpublish"), { cls: "button small danger", action: () => unpublishChart(current) }));
  }
  box.append(row); return box;
}
async function loadMine() {
  const scope = captureAccountScope();
  try { const { charts } = await api.myPublicCharts(); if (!accountScopeCurrent(scope)) return; state.feed.mine = charts ?? []; }
  catch { if (accountScopeCurrent(scope)) state.feed.mine = []; }
  if (state.route === "/mandala") render();
}
async function publishChart() {
  const mandala = state.mandala; const scope = captureAccountScope();
  if (!mandala.chart.goal.trim()) { notify(tr("goalNeeded"), "error"); return; }
  try {
    // Publish what is on screen: save first when the editor has changes.
    if (JSON.stringify(chartDto(mandala.chart)) !== JSON.stringify(chartDto(mandala.cloudDoc.data))) await saveCloudChart();
    if (!accountScopeCurrent(scope) || !mandala.cloudDoc) return;
    const { chart } = await api.publish(mandala.cloudDoc.id, state.feed.publishTags?.tags ?? []); if (!accountScopeCurrent(scope)) return;
    const mine = Array.isArray(state.feed.mine) ? state.feed.mine.filter((item) => item.id !== chart.id) : [];
    state.feed.mine = [{ ...chart, hidden: false }, ...mine]; state.feed.items = null; state.feed.done = false;
    notify(tr("published"), "success"); render();
  } catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
async function unpublishChart(item) {
  if (!confirm(tr("confirmUnpublish"))) return;
  const scope = captureAccountScope();
  try { await api.unpublish(item.id); if (!accountScopeCurrent(scope)) return; state.feed.mine = (state.feed.mine ?? []).filter((other) => other.id !== item.id); state.feed.items = null; state.feed.done = false; notify(tr("unpublished")); render(); }
  catch (error) { if (accountScopeCurrent(scope)) notify(toMessage(error), "error"); }
}
// /mandala/p/:id: the shared chart, readable without an account.
function renderSharedChart(id) {
  const page = newPage("page-shell narrow feed-page"); const feed = state.feed;
  if (!feed.shared || feed.shared.id !== id) {
    if (feed.shared?.loading !== id) { feed.shared = { loading: id }; api.publicChart(id).then(({ chart }) => { feed.shared = chart; }).catch(() => { feed.shared = { missing: id }; }).finally(() => { if (state.route === `/mandala/p/${id}`) render(); }); }
    if (feed.shared?.missing === id) { page.append(heading(tr("sharedMissing")), link(tr("makeOwn"), "/mandala", "button primary")); return; }
    page.append(el("p", "muted", tr("feedLoading"))); return;
  }
  document.title = `${feed.shared.title || feed.shared.goal}｜${tr("mandala")}`;
  page.append(publicCard(feed.shared, { open: true }));
  const row = el("div", "button-row");
  if (isSignedIn()) row.append(btn(tr("makeOwn"), { cls: "button primary", action: () => copyPublic(feed.shared) }), link(tr("backToFeed"), "/feed", "button"));
  else { page.append(infoBox(tr("sharedCta"))); row.append(link(tr("makeOwn"), "/mandala", "button primary")); if (state.config?.authEnabled) row.append(link(tr("signIn"), "/api/auth/login", "button")); }
  page.append(row);
}

async function init() {
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
