// ==========================================
// main.js
// ==========================================

window.onload = function() {
    let versionDisplay = document.getElementById('version-display');
    if (versionDisplay && window.SYSTEM_VERSION && window.LAST_UPDATED) {
        versionDisplay.style.textAlign = "left";
        versionDisplay.style.height = "auto";
        versionDisplay.style.marginBottom = "20px";
        versionDisplay.innerHTML = `<h3>システムバージョン: v${window.SYSTEM_VERSION} <span style="font-size: 11px; color: #666; font-weight: normal; margin-left: 10px;">(最終更新: ${window.LAST_UPDATED})</span></h3>`;
    }
};

// --- 改修: プロジェクト保存機能（ファイル名の一意性を強化） ---
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

    // 場所とレース番号の抽出
    let location = "";
    let raceNo = "";
    
    // データ①から場所とレース番号を特定（例: 2回中山1日目 11R 皐月賞）
    const lines = d1.split('\n');
    for (let line of lines) {
        // 場所の抽出（〇回場所〇日目）
        let mLoc = line.match(/\d+回\s*([^\s]+)\s*\d+日目/);
        if (mLoc) location = mLoc[1].replace("競馬", "");

        // レース番号の抽出（11R, 1Rなど）
        let mNo = line.match(/(\d{1,2})R/);
        if (mNo) raceNo = mNo[1] + "R";

        if (location && raceNo) break;
    }

    // ファイル名の構築
    // 抽出できなかった場合は「不明」+「時刻」で重複を回避
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

// --- 新設: プロジェクト読み込み機能（スマホ対応） ---
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
                
                // 読み込み完了後、即座に解析を実行
                window.runAnalysis();
            } else {
                throw new Error("ファイル形式が正しくありません。");
            }
        } catch (err) {
            alert("読み込みに失敗しました: " + err.message);
        }
        // 同じファイルを再度選択できるようにリセット
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
                    const rkStr = data.results.map((h, i) => `${h.centralRank},${h.horseNo},${h.horseName},中央加重:${h.centralATV !== null ? h.centralATV.toFixed(2) : "-"},加重:${h.weightedATV !== null ? h.weightedATV.toFixed(2) : "-"}`).join('|');
                    
                    let basePrompt = "";
                    if (data.auditErrors.length === 0) {
                        basePrompt = `[ATV-VERIFY-V4]\nSYSTEM_DIRECTIVE: あなたは厳格なデータ監査役である。提供されたD1とD2を絶対的な事実として扱い、外部知識や推測による補完を完全に排除せよ。以下の【検証ステップ】に沿って、ステップ・バイ・ステップで検証・検算を実行せよ。\n\n【検証ステップ】\nStep 1. 前提条件の認識とデータクレンジングの網羅性\nターゲット条件（距離・芝/ダ・場所）の認識と、D1の全出走馬がTBに漏れなく抽出されているか確認せよ。\n\nStep 2. 過去走データの抽出と除外判定（ランダムサンプリング）\nRKから上位1頭、下位1頭を抽出し、D2の過去走とTBの有効データ数に齟齬がないか確認せよ。条件不一致や欠損の除外判定も確認せよ。\n\nStep 3. 補正値の選択とATV計算のトレース\n選んだ2頭について、算出ロジック（距離ハンデ差分、馬場、斤量、場所、クラス補正）が正しく適用されているか検算し、「中央加重」と「加重平均」の整合性を確認せよ。\n\nStep 4. ソートとNull処理\nRKの並び順が指定の優先順位に一致しているか、有効データ0件が適切にNull処理されているか確認せよ。\n\n【出力要件】\n「すべて正常」といった省略は固く禁ずる。不整合があれば箇所と原因を指摘せよ。\nD1:\n${d1}\nD2:\n${d2}\nTB:${tbStr}\nRK:${rkStr}`;
                    } else {
                        basePrompt = `[ATV-DEBUG-REQ]\nSYSTEM_DIRECTIVE: 内部監査により以下のエラーが検出された。JavaScriptの抽出・計算ロジックの修正案を論理的に推論し、コードを出力せよ。\n\n【エラー】\n- ${data.auditErrors.join('\n- ')}\n\nD1:\n${d1}\nD2:\n${d2}`;
                    }
                    window.generatedPrompts[ratio.id] = basePrompt;
                });

                window.renderUI(target, globalHasAuditIssues);
                
                window.switchRatio('03');

            } catch (e) {
                alert("エラーが発生しました: " + e.message);
                console.error(e);
            } finally {
                btn.disabled = false;
                btn.innerText = "解析実行";
            }
        }, 50);

    } catch (e) {
        alert("日付判定処理でエラーが発生しました: " + e.message);
        console.error(e);
        btn.disabled = false;
        btn.innerText = "解析実行";
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

    let promptOutput = document.getElementById('promptOutput');
    if (promptOutput) {
        promptOutput.value = window.generatedPrompts[id] || "";
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

window.copyPrompt = async function() {
    const promptText = document.getElementById('promptOutput').value;
    if (!promptText) {
        alert("コピーするプロンプトがありません。");
        return;
    }
    try {
        await navigator.clipboard.writeText(promptText);
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.innerText;
        btn.innerText = "✓ コピーしました！";
        btn.style.backgroundColor = "#27ae60";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "";
        }, 2000);
    } catch (err) {
        alert("クリップボードへのコピーに失敗しました。\nテキストエリアから手動でコピーしてください。");
        console.error("Failed to copy text: ", err);
    }
};

window.downloadPrompt = function(hasAuditIssues) {
    const promptText = document.getElementById('promptOutput').value;
    if (!promptText) {
        alert("保存するプロンプトがありません。");
        return;
    }
    
    const blob = new Blob([promptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}_${hh}${min}`;
    
    const purpose = hasAuditIssues ? "DebugReq" : "Verify";
    const fileName = `ATV_${purpose}_${dateStr}.txt`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};