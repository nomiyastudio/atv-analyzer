window.generatedPrompts = {};
window.processedData = {};
window.globalSortType = 'centralATV'; 

window.runAnalysis = function() {
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

    setTimeout(() => {
        try {
            // 1. データのパースと構造化 (parser.js)
            const { validHorseNames, target, horseBlocks } = window.parseAllData(d1, d2);
            
            const ratios = [
                { f: 0.2, b: 0.8, id: '02' },
                { f: 0.3, b: 0.7, id: '03' },
                { f: 0.4, b: 0.6, id: '04' },
                { f: 0.5, b: 0.5, id: '05' }
            ];

            let globalHasAuditIssues = false;

            // 2. 各比率ごとのATV計算 (calculator.js)
            ratios.forEach(ratio => {
                const data = window.calculateATV(horseBlocks, validHorseNames, target, ratio);
                window.processedData[ratio.id] = { ...data, target };

                if (data.auditErrors.length > 0 || data.auditWarnings.length > 0) {
                    globalHasAuditIssues = true;
                }

                // 3. 検証用・デバッグ用プロンプトの生成
                const tbStr = data.results.map(h => `${h.horseNo},${h.horseName},${h.pastRaces.length},${h.validCount}`).join('|');
                const rkStr = data.results.map((h, i) => `${h.centralRank},${h.horseNo},${h.horseName},中央加重:${h.centralATV !== null ? h.centralATV.toFixed(2) : "-"},加重:${h.weightedATV !== null ? h.weightedATV.toFixed(2) : "-"}`).join('|');
                
                let basePrompt = "";
                if (data.auditErrors.length === 0) {
                    basePrompt = `[ATV-VERIFY-V3]\nSYSTEM_DIRECTIVE: あなたは厳格なデータ監査役である。提供されたD1とD2を絶対的な事実として扱い、外部知識や推測による補完を完全に排除せよ。以下の【検証ステップ】に沿って、ステップ・バイ・ステップで検証・検算を実行せよ。\n\n【検証ステップ】\nStep 1. 前提条件の認識とデータクレンジングの網羅性\nターゲット条件（クラス・距離・芝/ダ・場所）の認識と、D1の全出走馬がTBに漏れなく抽出されているか確認せよ。\n\nStep 2. 過去走データの抽出と除外判定（ランダムサンプリング）\nRKから上位1頭、下位1頭を抽出し、D2の過去走とTBの有効データ数に齟齬がないか確認せよ。条件不一致や欠損の除外判定も確認せよ。\n\nStep 3. 補正値の選択とATV計算のトレース\n選んだ2頭について、算出ロジック（距離差、馬場、斤量、場所の補正）が正しく適用されているか検算し、「中央加重」と「加重平均」の整合性を確認せよ。\n\nStep 4. ソートとNull処理\nRKの並び順が指定の優先順位に一致しているか、有効データ0件が適切にNull処理されているか確認せよ。\n\n【出力要件】\n「すべて正常」といった省略は固く禁ずる。不整合があれば箇所と原因を指摘せよ。\nD1:\n${d1}\nD2:\n${d2}\nTB:${tbStr}\nRK:${rkStr}`;
                } else {
                    basePrompt = `[ATV-DEBUG-REQ]\nSYSTEM_DIRECTIVE: 内部監査により以下のエラーが検出された。JavaScriptの抽出・計算ロジックの修正案を論理的に推論し、コードを出力せよ。\n\n【エラー】\n- ${data.auditErrors.join('\n- ')}\n\nD1:\n${d1}\nD2:\n${d2}`;
                }
                window.generatedPrompts[ratio.id] = basePrompt;
            });

            // 4. UIの枠組み生成と、データの流し込み
            window.renderUI(target, globalHasAuditIssues);
            window.switchRatio('04');

        } catch (e) {
            alert("エラーが発生しました: " + e.message);
            console.error(e);
        } finally {
            btn.disabled = false;
            btn.innerText = "解析実行";
        }
    }, 50);
};

window.renderUI = function(target, hasAuditIssues) {
    let auditHtml = !hasAuditIssues 
        ? `<div style="border-left: 4px solid #27ae60; padding: 5px 10px; background: #f4fdf8; border-radius: 4px;"><span style="color: #27ae60; font-weight: bold; font-size: 13px;">✓ システム検証: 全項目正常</span></div>` 
        : `<div style="border-left: 4px solid #e74c3c; padding: 5px 10px; background: #fdf2e9; border-radius: 4px;"><details><summary style="color: #e74c3c; font-weight: bold; font-size: 13px; cursor: pointer;">⚠ システム検証: 問題あり (クリックで詳細を展開)</summary><ul style="font-size: 13px; color: #333; margin-top: 10px; padding-left: 20px; margin-bottom: 0;"><li style="color: #e74c3c; font-weight: bold; margin-bottom:4px;">抽出または計算処理に致命的なエラーが検出されました。</li></ul></details></div>`;

    let paceHtml = `<div class="pace-grid">`;
    if (!hasAuditIssues) {
        let results04 = window.processedData['04'].results;
        let totalHorses = results04.length;
        const paceStyles = [
            {class: 1, name: "逃げ", border: "#d35400"},
            {class: 2, name: "先行", border: "#f1c40f"},
            {class: 3, name: "差し", border: "#6b8e23"},
            {class: 4, name: "追込", border: "#1b4f72"}
        ];

        paceStyles.forEach(s => {
            let horses = results04.filter(h => h.styleClass === s.class).sort((a,b) => (a.avgPosRatio || 0) - (b.avgPosRatio || 0));
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
                <div class="ratio-btn-group">
                    <button data-ratio="02" class="ratio-btn" onclick="window.switchRatio('02')">0.2 / 0.8</button>
                    <button data-ratio="03" class="ratio-btn" onclick="window.switchRatio('03')">0.3 / 0.7</button>
                    <button data-ratio="04" class="ratio-btn active" onclick="window.switchRatio('04')">0.4 / 0.6</button>
                    <button data-ratio="05" class="ratio-btn" onclick="window.switchRatio('05')">0.5 / 0.5</button>
                </div>
                <h3 style="margin-top:0;">平均ATVランキング</h3>
                <div id="tableContainer" class="table-responsive"></div>
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
    document.querySelectorAll('.ratio-btn').forEach(btn => {
        if(btn.getAttribute('data-ratio') === id) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

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

window.updateSort = function(sortType) {
    window.globalSortType = sortType;
    let activeBtn = document.querySelector('.ratio-btn.active');
    if (activeBtn) {
        window.switchRatio(activeBtn.getAttribute('data-ratio'));
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