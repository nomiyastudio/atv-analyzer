// ==========================================
// main.js
// ==========================================

window.onload = function() {
    let versionDisplay = document.getElementById('version-display');
    if (versionDisplay && window.SYSTEM_VERSION && window.LAST_UPDATED) {
        versionDisplay.style.textAlign = "left";
        versionDisplay.style.height = "auto";
        // 余白を他のブロック要素（20px）と統一
        versionDisplay.style.marginBottom = "20px";
        // <h3>タグの二重ネストを解消し、テキストとspanのみを代入
        versionDisplay.innerHTML = `システムバージョン: v${window.SYSTEM_VERSION} <span style="font-size: 11px; color: #666; font-weight: normal; margin-left: 10px;">(最終更新: ${window.LAST_UPDATED})</span>`;
    }
};

// --- プロジェクト保存機能 ---
window.saveProject = function() {
    const d1 = document.getElementById('data1').value;
    const d2 = document.getElementById('data2').value;

    if (!d1 || !d2) {
        alert("保存するデータ（入力欄）が不足しています。");
        return;
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    let location = "";
    let raceNo = "";
    
    const lines = d1.split('\n');
    for (let line of lines) {
        let mLoc = line.match(/\d+回\s*([^\s]+)\s*\d+日目/);
        if (mLoc) location = mLoc[1].replace("競馬", "");

        let mNo = line.match(/(\d{1,2})R/);
        if (mNo) raceNo = mNo[1] + "R";

        if (location && raceNo) break;
    }

    let fileId = "";
    if (location || raceNo) {
        fileId = `_${location}_${raceNo}`;
    } else {
        fileId = `_不明_${hh}${min}`;
    }

    const projectData = {
        d1_raw: d1,
        d2_raw: d2,
        race_info: `${location}${raceNo}`,
        timestamp: now.toISOString(),
        version: window.SYSTEM_VERSION
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATV_${dateStr}${fileId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- プロジェクト読み込み機能 ---
window.loadProject = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.textContent || e.target.result);
            if (data.d1_raw && data.d2_raw) {
                document.getElementById('data1').value = data.d1_raw;
                document.getElementById('data2').value = data.d2_raw;
                window.runAnalysis();
            } else {
                throw new Error("ファイル形式が正しくありません。");
            }
        } catch (err) {
            alert("読み込みに失敗しました: " + err.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
};

window.runAnalysis = async function() {
    const d1 = document.getElementById('data1').value;
    const d2 = document.getElementById('data2').value;
    const btn = document.getElementById('runBtn');
    const resultArea = document.getElementById('resultArea');

    if (!d1 || !d2) {
        alert("データ①とデータ②の両方を入力してください。");
        return;
    }

    btn.disabled = true;
    btn.innerText = "解析中...";
    resultArea.innerHTML = "";
    window.generatedPrompts = {};
    window.processedData = {};
    window.globalSortType = 'centralATV'; 
    window.globalCorrectionMode = 'centralATV';

    try {
        const monthData = await window.detectRaceMonth(d1);

        setTimeout(() => {
            try {
                const { validHorseNames, target, horseBlocks } = window.parseAllData(d1, d2);
                
                target.is2yo = monthData.is2yo;
                target.raceMonth = monthData.month;

                const ratios = [
                    { f: 0.0, b: 1.0, id: '00' },
                    { f: 0.1, b: 0.9, id: '01' },
                    { f: 0.2, b: 0.8, id: '02' },
                    { f: 0.3, b: 0.7, id: '03' },
                    { f: 0.4, b: 0.6, id: '04' },
                    { f: 0.5, b: 0.5, id: '05' }
                ];

                let globalHasAuditIssues = false;

                ratios.forEach(ratio => {
                    const data = window.calculateATV(horseBlocks, validHorseNames, target, ratio);
                    window.processedData[ratio.id] = { ...data, target };

                    if (data.auditErrors.length > 0 || data.auditWarnings.length > 0) {
                        globalHasAuditIssues = true;
                    }

                    const tbStr = data.results.map(h => `${h.horseNo},${h.horseName},${h.pastRaces.length},${h.validCount}`).join('|');
                    const rkStr = data.results.map((h, i) => `${h.centralRank},${h.horseNo},${h.horseName},中央加重:${h.centralATV !== null ? h.centralATV.toFixed(2) : "-"},展開補正(安定):${h.adjCentral !== null ? h.adjCentral.toFixed(2) : "-"},加重:${h.weightedATV !== null ? h.weightedATV.toFixed(2) : "-"},展開補正(ベスト):${h.adjWeighted !== null ? h.adjWeighted.toFixed(2) : "-"}`).join('|');
                    
                    let promptObj = { hasErrors: false, debugPrompt: "", macroPrompt: "", microPrompts: [], fullText: "" };

                    if (data.auditErrors.length > 0) {
                        promptObj.hasErrors = true;
                        promptObj.debugPrompt = `[ATV-DEBUG-REQ]\nSYSTEM_DIRECTIVE: 内部監査により以下のエラーが検出された。JavaScriptの抽出・計算ロジックの修正案を論理的に推論し、コードを出力せよ。\n\n【エラー】\n- ${data.auditErrors.join('\n- ')}\n\nD1:\n${d1}\nD2:\n${d2}`;
                        promptObj.fullText = promptObj.debugPrompt;
                    } else {
                        // マクロ検証プロンプトの生成
                        promptObj.macroPrompt = `[ATV-VERIFY-MACRO]\nSYSTEM_DIRECTIVE: あなたは厳格なデータ監査役である。提供されたD1、TB、RKを絶対的な事実として扱い、以下の【検証ステップ】を実行せよ。過去走データ（D2）は本ステップでは不要なため提供していない。途中式の省略を禁ずる。\n\n【検証ステップ】\nStep 1. 抽出の網羅性チェック\nD1に記載されている全出走馬をリストアップし、それがTB（内部データ）に漏れなく存在するか確認せよ。「〇番: 馬名 - 抽出OK」の形式で全頭分出力せよ。「以下略」は固く禁ずる。\n\nStep 2. ソートとNull処理の確認\nRKの順位が正しいか確認せ位。1位から最下位まで、隣り合う馬の数値（展開補正または中央加重など）を「1位(100.5) ＞ 2位(98.2) : 正常」の形式で全順位分比較して証明せよ。\n\n【データ】\nD1:\n${d1}\nTB:${tbStr}\nRK:${rkStr}`;

                        // ミクロ検証プロンプトの生成（3頭ずつ分割）
                        let sortedForMicro = [...data.results].sort((a,b) => (parseInt(a.horseNo)||999) - (parseInt(b.horseNo)||999));
                        let targetConditions = d1.split('\n').slice(0, 5).join('\n');

                        for (let i = 0; i < sortedForMicro.length; i += 3) {
                            let batch = sortedForMicro.slice(i, i + 3);
                            let targetHorseNumbers = batch.map(h => `${h.horseNo}番`).join('、');
                            let batchNames = batch.map(h => h.horseName);
                            
                            let d2Filtered = horseBlocks.filter(block => {
                                let cleanBlock = block.replace(/[\r\n\s\t\u200B-\u200D\uFEFF]/g, '');
                                return batchNames.some(name => cleanBlock.includes(name));
                            }).join('\n\n');
                            
                            let tbFiltered = batch.map(h => `${h.horseNo},${h.horseName},${h.pastRaces.length},${h.validCount}`).join('|');
                            let rkFiltered = batch.map((h, idx) => `${h.centralRank},${h.horseNo},${h.horseName},中央加重:${h.centralATV !== null ? h.centralATV.toFixed(2) : "-"},展開補正(安定):${h.adjCentral !== null ? h.adjCentral.toFixed(2) : "-"},加重:${h.weightedATV !== null ? h.weightedATV.toFixed(2) : "-"},展開補正(ベスト):${h.adjWeighted !== null ? h.adjWeighted.toFixed(2) : "-"}`).join('|');

                            let microText = `[ATV-VERIFY-MICRO: 対象馬 ${targetHorseNumbers}]\nSYSTEM_DIRECTIVE: あなたは厳格なデータ監査役である。提供されたデータを絶対的な事実とし、対象となる馬（${targetHorseNumbers}）についてのみ、以下の【検証ステップ】を実行せよ。ハルシネーションを防ぐため、途中式を絶対に省略せず、ステップ・バイ・ステップで検算せよ。\n\n【検証ステップ】\nStep 3. 過去走データの抽出と除外判定\n対象馬について、D2の過去走数とTBの有効データ数に齟齬がないか確認し、除外されたレースがあればその理由（馬場不一致やタイム欠損など）を明記せよ。\n\nStep 4. 補正値とATV計算のトレース\n対象馬について、ベース算出ロジック（距離ハンデ差分、馬場、斤量、場所、クラス補正）を検算せよ。さらに、脚質とコース係数（C値）による「展開補正（安定・ベスト）」のペナルティ乗算が正確に行われているか確認し、最終的な「中央加重」「加重平均」との整合性を検証せよ。\n\n【出力要件】\n「すべて正常」といった省略、および「以下略」「同様に」といった手抜きは固く禁ずる。必ず対象馬すべての計算過程を出力せよ。\n\n【データ】\n対象レース条件（D1より抽出）:\n${targetConditions}\n\n対象馬の過去走データ（D2抽出分）:\n${d2Filtered}\n\n対象馬のTBデータ:\n${tbFiltered}\n\n対象馬のRKデータ:\n${rkFiltered}`;

                            promptObj.microPrompts.push({
                                title: `${batch[0].horseNo}番〜${batch[batch.length-1].horseNo}番`,
                                text: microText
                            });
                        }
                        promptObj.fullText = promptObj.macroPrompt + "\n\n====================\n\n" + promptObj.microPrompts.map(m => m.text).join("\n\n====================\n\n");
                    }
                    window.generatedPrompts[ratio.id] = promptObj;
                });

                window.renderUI(target, globalHasAuditIssues);
                window.switchRatio('03');

            } catch (e) {
                alert("エラーが発生しました: " + e.message);
                console.error(e);
            } finally {
                btn.disabled = false;
                // 解析実行ボタンのテキスト復元時、spanタグ構造を復元するように修正
                btn.innerHTML = `<span class="btn-text-pc">▶ 解析実行</span><span class="btn-text-sp">▶ 解析</span>`;
            }
        }, 50);

    } catch (e) {
        alert("日付判定処理でエラーが発生しました: " + e.message);
        console.error(e);
        btn.disabled = false;
        // エラー時のテキスト復元
        btn.innerHTML = `<span class="btn-text-pc">▶ 解析実行</span><span class="btn-text-sp">▶ 解析</span>`;
    }
};

window.switchRatio = function(id) {
    let radio = document.getElementById('ratio-' + id);
    if (radio) {
        radio.checked = true;
    }

    let tableContainer = document.getElementById('tableContainer');
    if (tableContainer) {
        tableContainer.innerHTML = window.renderAvgRanking(id);
    }

    let logContainer = document.getElementById('detailedLogContainer');
    if (logContainer) {
        logContainer.innerHTML = window.renderDetailedLog(id);
    }

    if (window.renderPromptArea) {
        window.renderPromptArea(id);
    }
};

window.handleHeaderClick = function(clickedSortType) {
    if (clickedSortType === 'centralATV') {
        window.globalSortType = 'centralATV';
        window.globalCorrectionMode = 'centralATV';
    } else if (clickedSortType === 'weightedATV') {
        window.globalSortType = 'weightedATV';
        window.globalCorrectionMode = 'weightedATV';
    } else if (clickedSortType === 'adjustedATV') {
        if (window.globalSortType === 'adjustedATV') {
            window.globalCorrectionMode = (window.globalCorrectionMode === 'centralATV') ? 'weightedATV' : 'centralATV';
        } else {
            window.globalSortType = 'adjustedATV';
        }
    } else {
        window.globalSortType = clickedSortType;
    }

    let activeRadio = document.querySelector('input[name="ratio"]:checked');
    if (activeRadio) {
        window.switchRatio(activeRadio.value);
    }
};

window.pasteFromClipboard = async function(targetId) {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(targetId).value = text;
    } catch (err) {
        alert("クリップボードの読み取りに失敗しました。\n手動で貼り付けてください。");
    }
};

window.copyPrompt = async function(type, index, btnElement) {
    let activeRadio = document.querySelector('input[name="ratio"]:checked')?.value || '03';
    let prompts = window.generatedPrompts[activeRadio];
    if (!prompts) return;

    let promptText = "";
    if (prompts.hasErrors) {
        promptText = prompts.debugPrompt;
    } else if (type === 'macro') {
        promptText = prompts.macroPrompt;
    } else if (type === 'micro') {
        promptText = prompts.microPrompts[index].text;
    }

    if (!promptText) return;

    try {
        await navigator.clipboard.writeText(promptText);
        if (btnElement) {
            const originalText = btnElement.innerHTML; // spanタグ構造を保持するためinnerHTMLを使用
            btnElement.innerText = "✓ OK";
            btnElement.style.backgroundColor = "#27ae60";
            setTimeout(() => {
                btnElement.innerHTML = originalText;
                btnElement.style.backgroundColor = "";
            }, 2000);
        }
    } catch (err) {
        alert("コピーに失敗しました。");
    }
};

window.downloadPrompt = function(type, index) {
    let activeRadio = document.querySelector('input[name="ratio"]:checked')?.value || '03';
    let prompts = window.generatedPrompts[activeRadio];
    if (!prompts) return;

    let promptText = "";
    let prefix = "Verify";

    if (prompts.hasErrors) {
        promptText = prompts.debugPrompt;
        prefix = "DebugReq";
    } else if (type === 'macro') {
        promptText = prompts.macroPrompt;
        prefix = "Macro";
    } else if (type === 'micro') {
        promptText = prompts.microPrompts[index].text;
        prefix = `Micro_${prompts.microPrompts[index].title.replace(/番/g, '')}`;
    }

    if (!promptText) return;

    const blob = new Blob([promptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATV_${prefix}_${dateStr}_${timeStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};