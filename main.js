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
                
                // デフォルトの表示比率を 03 に変更
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

window.renderUI = function(target, hasAuditIssues) {
    let auditHtml = !hasAuditIssues 
        ? `<div style="border-left: 4px solid #27ae60; padding: 5px 10px; background: #f4fdf8; border-radius: 4px;"><span style="color: #27ae60; font-weight: bold; font-size: 13px;">✓ システム検証: 全項目正常</span></div>` 
        : `<div style="border-left: 4px solid #e74c3c; padding: 5px 10px; background: #fdf2e9; border-radius: 4px;"><details><summary style="color: #e74c3c; font-weight: bold; font-size: 13px; cursor: pointer;">⚠ システム検証: 問題あり (クリックで詳細を展開)</summary><ul style="font-size: 13px; color: #333; margin-top: 10px; padding-left: 20px; margin-bottom: 0;"><li style="color: #e74c3c; font-weight: bold; margin-bottom:4px;">抽出または計算処理に致命的なエラーが検出されました。</li></ul></details></div>`;

    let paceHtml = `<div class="pace-grid">`;
    if (!hasAuditIssues) {
        // ペース予想のベースを 03 データに変更
        let results03 = window.processedData['03'].results;
        let totalHorses = results03.length;
        const paceStyles = [
            {class: 1, name: "逃げ", border: "#d35400"},
            {class: 2, name: "先行", border: "#f1c40f"},
            {class: 3, name: "差し", border: "#6b8e23"},
            {class: 4, name: "追込", border: "#1b4f72"}
        ];

        paceStyles.forEach(s => {
            let horses = results03.filter(h => h.styleClass === s.class).sort((a,b) => (a.avgPosRatio || 0) - (b.avgPosRatio || 0));
            paceHtml += `<div style="border:1px solid ${s.border}; border-radius:6px; background:transparent; padding:10px; box-sizing:border-box;">
                <h4 style="margin:0 0 10px 0; color:${s.border}; text-align:center; border-bottom:1px solid ${s.border}; padding-bottom:5px;">${s.name}</h4>
                <ul style="list-style:none; padding:0; margin:0; font-size:12px;">`;
            if (horses.length === 0) {
                paceHtml += `<li style="color:#999; text-align:center;">不在</li>`;
            } else {
                horses.forEach(h => {
                    let pct = (h.avgPosRatio !== null) ? h.avgPosRatio * 100 : 50;
                    let rgb = window.getColorFromStops(window.paceStops, pct);
                    let hex = window.rgbToHex(rgb);
                    let textCol = window.getTextColor(rgb);
                    let borderCol = window.rgbToHex(window.darken(rgb));
                    let wColor = window.getWakuColor(h.horseNo, totalHorses);
                    let wakuBadge = `<span style="display:inline-block; width:16px; height:16px; line-height:16px; text-align:center; background-color:${wColor.bg}; color:${wColor.text}; border:1px solid ${wColor.border}; border-radius:3px; margin-right:4px; font-size:10px;">${h.horseNo}</span>`;
                    
                    paceHtml += `<li style="margin-bottom:6px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center;" title="${h.horseNo}. ${h.horseName}">
                        ${wakuBadge}
                        <span style="background-color:${hex}; color:${textCol}; border:1px solid ${borderCol}; padding: 2px 6px; border-radius: 4px; display:inline-block; width:100%; box-sizing:border-box;">${h.horseName}</span>
                    </li>`;
                });
            }
            paceHtml += `</ul></div>`;
        });
    }
    paceHtml += `</div>`;

    let resultHTML = `
        <div class="summary-block">
            <h3>レース条件 ＆ システム検証</h3>
            <p style="margin-top:10px;"><b>条件:</b> ${target.className} / ${target.distance}m / ${target.trackType} ｜ <b>基準斤量:</b> 各馬の今回出走斤量 / ${target.location}</p>
            <div id="auditArea">${auditHtml}</div>
        </div>
    `;

    if (!hasAuditIssues) {
        resultHTML += `
            <div class="pace-pattern-block">
                <h3 style="margin-top:0;">展開予想 (脚質グルーピング)</h3>
                ${paceHtml}
            </div>
            <div class="pattern-block">
                <div class="segmented-control style-pill" style="margin-bottom: 20px;">
                    <input type="radio" name="ratio" id="ratio-00" value="00" onchange="window.switchRatio('00')">
                    <label for="ratio-00">0:10</label>
                    <input type="radio" name="ratio" id="ratio-01" value="01" onchange="window.switchRatio('01')">
                    <label for="ratio-01">1:9</label>
                    <input type="radio" name="ratio" id="ratio-02" value="02" onchange="window.switchRatio('02')">
                    <label for="ratio-02">2:8</label>
                    <input type="radio" name="ratio" id="ratio-03" value="03" onchange="window.switchRatio('03')" checked>
                    <label for="ratio-03">3:7</label>
                    <input type="radio" name="ratio" id="ratio-04" value="04" onchange="window.switchRatio('04')">
                    <label for="ratio-04">4:6</label>
                    <input type="radio" name="ratio" id="ratio-05" value="05" onchange="window.switchRatio('05')">
                    <label for="ratio-05">5:5</label>
                </div>
                <h3 style="margin-top:0;">ATVランキング</h3>
                <div id="tableContainer" class="table-responsive"></div>
            </div>
            
            <div class="score-analysis-block">
                <h3 style="margin-top:0;">多角展開スコア分析</h3>
                <div class="score-controls">
                    <div class="score-control-group">
                        <label class="score-control-label">評価指標</label>
                        <select id="scoreMetric" class="score-input-select">
                            <option value="adjCentral">展開補正 (安定)</option>
                            <option value="adjWeighted">展開補正 (ベスト)</option>
                            <option value="centralATV" selected>中央加重 (安定)</option>
                            <option value="weightedATV">加重平均 (ベスト)</option>
                        </select>
                    </div>
                    <div class="score-control-group">
                        <label class="score-control-label">許容差分閾値 (Δ)</label>
                        <input type="number" id="scoreThreshold" value="0.50" step="0.01" min="0.01" class="score-input-number">
                    </div>
                    <div class="score-control-group score-checkbox-container">
                        <label class="score-control-label">評価対象比率</label>
                        <div class="score-checkbox-group">
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="00">0:10</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="01">1:9</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="02">2:8</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="03">3:7</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="04">4:6</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="05">5:5</label>
                        </div>
                    </div>
                    <div class="score-control-group score-btn-group">
                        <button onclick="window.runScoreAnalysis()" class="score-calc-btn">スコアを算出</button>
                    </div>
                </div>
                <div id="scoreResultContainer" class="table-responsive score-table-container">
                    <p style="text-align:center; color:#777; font-size:13px; padding:20px 0;">条件を設定し「スコアを算出」ボタンを押してください。</p>
                </div>
            </div>

            <div class="details-block">
                <details>
                    <summary style="cursor:pointer; padding: 5px 0;">
                        <h3 style="margin:0; display:inline; line-height:1.5;">詳細データ (計算プロセスログ)</h3>
                        <span style="font-size:12px; color:#666; margin-left:10px;">(クリックで展開)</span>
                    </summary>
                    <div style="margin-top:15px;" id="detailedLogContainer"></div>
                </details>
            </div>
        `;
    } else {
        resultHTML += `
            <div class="pattern-block">
                <div class="pattern-content">
                    <div style="text-align:center; padding: 30px 10px 10px 10px;">
                        <h3 style="color:#e74c3c; display:inline-block; border-left:4px solid #e74c3c; margin-bottom:10px; padding-left:8px;">⚠ 解析停止</h3>
                        <p style="color:#555; font-size:14px; font-weight:bold; margin:0;">システム検証で問題が検出されたため、解析結果の表示を停止しています。</p>
                        <p style="font-size:13px; color:#777; margin-top:5px;">下の検証用プロンプトをコピーし、AIに修正案をリクエストしてください。</p>
                    </div>
                </div>
            </div>
            <div class="details-block">
                <details>
                    <summary style="cursor:pointer; padding: 5px 0;">
                        <h3 style="margin:0; display:inline; line-height:1.5;">詳細データ (計算プロセスログ)</h3>
                        <span style="font-size:12px; color:#666; margin-left:10px;">(クリックで展開)</span>
                    </summary>
                    <div style="margin-top:15px; padding: 20px; text-align: center; color: #e74c3c; font-weight: bold;">
                        エラー発生のため、詳細ログの生成を中止しました。
                    </div>
                </details>
            </div>
        `;
    }

    resultHTML += `
        <div class="prompt-block">
            <button class="copy-btn" onclick="window.copyPrompt()">検証用プロンプトをコピー</button>
            <div class="prompt-content">
                <textarea id="promptOutput" class="prompt-output" readonly></textarea>
            </div>
        </div>
    `;

    document.getElementById('resultArea').innerHTML = resultHTML;
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

window.clearData = function() {
    if(confirm("入力されたデータと解析結果をすべてクリアしますか？")) {
        document.getElementById('data1').value = "";
        document.getElementById('data2').value = "";
        document.getElementById('resultArea').innerHTML = "";
        window.generatedPrompts = {};
        window.processedData = {};
        window.globalSortType = 'centralATV';
        window.globalCorrectionMode = 'centralATV';
        const btn = document.getElementById('runBtn');
        btn.disabled = false;
        btn.innerText = "解析実行";
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

// --- 多角展開スコア分析の算出処理 ---
window.runScoreAnalysis = function() {
    let metric = document.getElementById('scoreMetric').value;
    let threshold = parseFloat(document.getElementById('scoreThreshold').value);
    let selectedRatios = Array.from(document.querySelectorAll('.score-ratio-cb:checked')).map(cb => cb.value);

    if (selectedRatios.length === 0) {
        alert("評価対象の比率を1つ以上選択してください。");
        return;
    }
    if (isNaN(threshold) || threshold <= 0) {
        alert("正しい閾値(0より大きい数値)を入力してください。");
        return;
    }

    let horseScores = {};
    
    // ベースとなる出走馬リストを '03' のデータから取得
    let baseData = window.processedData['03'].results; 
    baseData.forEach(h => {
        horseScores[h.horseNo] = {
            horseNo: h.horseNo,
            horseName: h.horseName,
            totalScore: 0,
            scores: {}
        };
        selectedRatios.forEach(r => horseScores[h.horseNo].scores[r] = 0);
    });

    // 選択された比率ごとにスコアを計算
    selectedRatios.forEach(ratioId => {
        let data = window.processedData[ratioId].results;
        
        let minVal = Infinity;
        data.forEach(h => {
            if (h[metric] !== null && h[metric] < minVal) minVal = h[metric];
        });

        data.forEach(h => {
            let val = h[metric];
            let points = 0;
            if (val !== null && minVal !== Infinity) {
                let diff = val - minVal;
                if (diff <= threshold) {
                    points = 100 * (1 - (diff / threshold));
                    if (points < 0) points = 0;
                }
            }
            let hs = horseScores[h.horseNo];
            if (hs) {
                hs.scores[ratioId] = points;
                hs.totalScore += points;
            }
        });
    });

    // 変更: 合計スコアが0より大きい馬のみを抽出して降順ソート、同点なら馬番昇順
    let sortedScores = Object.values(horseScores)
        .filter(h => h.totalScore > 0)
        .sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return parseInt(a.horseNo) - parseInt(b.horseNo);
        });

    if (sortedScores.length === 0) {
        document.getElementById('scoreResultContainer').innerHTML = `<p style="text-align:center; color:#e74c3c; font-size:13px; font-weight:bold; padding:20px 0;">設定した閾値(${threshold})以内に該当する馬はいませんでした。</p>`;
        return;
    }

    // 描画処理を ui.js に委譲
    if (window.renderScoreResultTable) {
        window.renderScoreResultTable(sortedScores, selectedRatios, baseData.length);
    }
};