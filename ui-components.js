// ==========================================
// ui-components.js
// ==========================================

window.renderDetailedLog = function(ratioId) {
    let data = window.processedData[ratioId];
    if (!data || data.auditErrors.length > 0) return "";
    let originalResults = [...data.results].sort((a, b) => (parseInt(a.horseNo) || 999) - (parseInt(b.horseNo) || 999));
    
    let logHtml = `<div class="table-responsive"><table class="log-table"><tr><th>走</th><th>日付</th><th>判定</th><th>前3F</th><th>後3F</th><th>距離補正<br>(distMod)</th><th>馬場補正<br>(surfMod)</th><th>斤量補正<br>(wghtMod)</th><th>場所補正<br>(locMod)</th><th>クラス補正<br>(classMod)</th><th>条件補正<br>(condMod)</th><th style="background:#eaf2f8;">ATV(0.0)</th><th style="background:#eaf2f8;">ATV(0.1)</th><th style="background:#eaf2f8;">ATV(0.2)</th><th style="background:#eaf2f8;">ATV(0.3)</th><th style="background:#eaf2f8;">ATV(0.4)</th><th style="background:#eaf2f8;">ATV(0.5)</th></tr>`;
    
    originalResults.forEach(h => {
        logHtml += `<tr><td colspan="17" class="align-left" style="background:#f4f6f7; font-weight:bold; color:var(--primary-color);">(${h.horseNo}) ${h.horseName}</td></tr>`;
        h.pastRaces.forEach(r => {
            if (r.valid) {
                let getAtv = (id) => { 
                    let res = window.processedData[id].results.find(res => res.horseNo === h.horseNo); 
                    return res ? res.pastRaces.find(pr => pr.idx === r.idx).atv.toFixed(2) : "-"; 
                };
                
                logHtml += `<tr>
                    <td>${r.idx}走</td>
                    <td>${r.date}</td>
                    <td class="success">✓</td>
                    <td>${parseFloat(r.f3f).toFixed(1)}</td>
                    <td>${parseFloat(r.f3b).toFixed(1)}</td>
                    <td>${r.distMod.toFixed(3)}</td>
                    <td>${r.surfMod.toFixed(3)}</td>
                    <td>${r.wghtMod.toFixed(3)}</td>
                    <td>${r.locMod.toFixed(2)}</td>
                    <td>${r.classMod.toFixed(2)}</td>
                    <td>${r.condMod.toFixed(3)}</td>
                    <td style="font-weight:bold;">${getAtv('00')}</td>
                    <td style="font-weight:bold;">${getAtv('01')}</td>
                    <td style="font-weight:bold;">${getAtv('02')}</td>
                    <td style="font-weight:bold;">${getAtv('03')}</td>
                    <td style="font-weight:bold;">${getAtv('04')}</td>
                    <td style="font-weight:bold;">${getAtv('05')}</td>
                </tr>`;
            } else {
                logHtml += `<tr><td>${r.idx}走</td><td>${r.date}</td><td class="error">×</td><td colspan="14" class="align-left">スキップ: ${r.reason}</td></tr>`;
            }
        });
    });
    return logHtml + `</table></div>`;
};

// プロンプトエリアのレンダリング (スマホ対応・左寄せマクロボタン)
window.renderPromptArea = function(ratioId) {
    let pData = window.generatedPrompts[ratioId];
    let container = document.getElementById('promptControlArea');
    if (!container || !pData) return;

    let html = "";
    if (pData.hasErrors) {
        html = `
            <div style="margin-bottom:10px; display:flex; gap:5px; justify-content:flex-start;">
                <button class="copy-btn" onclick="window.copyPrompt('debug', 0, this)" style="background:#c0392b; flex:none; padding:10px 20px;">📋 デバッグ要求プロンプトをコピー</button>
                <button class="action-btn btn-save" onclick="window.downloadPrompt('debug', 0)" style="width:45px; height:45px; flex:none;">💾</button>
            </div>`;
    } else {
        html += `
            <div style="margin-bottom:12px;">
                <label style="font-size:12px; color:#2c3e50; margin-bottom:5px; display:block;">▼ ステップ1: 全体検証（抽出・ソート）</label>
                <div style="display:flex; gap:5px; justify-content:flex-start;">
                    <button class="copy-btn" onclick="window.copyPrompt('macro', 0, this)" style="background:#2980b9; padding:12px 20px; flex:none; font-size:13px; min-width:max-content;">📋 全体検証（抽出・ソート）</button>
                    <button class="action-btn btn-save" onclick="window.downloadPrompt('macro', 0)" style="width:45px; height:45px; flex:none;">💾</button>
                </div>
            </div>`;
        
        html += `
            <label style="font-size:12px; color:#2c3e50; margin-bottom:5px; display:block;">▼ ステップ2: 個別検算（3頭ずつ分割）</label>
            <div style="display:flex; flex-wrap:wrap; gap:8px; width:100%;">`;
        
        pData.microPrompts.forEach((m, idx) => {
            html += `
                <div style="display:flex; gap:3px; flex: 0 1 auto; min-width:max-content;">
                    <button class="copy-btn" onclick="window.copyPrompt('micro', ${idx}, this)" style="font-size:12px; padding:10px 12px; flex:none;">📋 ${m.title}</button>
                    <button class="action-btn btn-save" onclick="window.downloadPrompt('micro', ${idx})" style="width:38px; height:38px; flex:none; font-size:12px;">💾</button>
                </div>`;
        });
        html += `</div>`;
    }
    container.innerHTML = html;
};

window.renderUI = function(target, hasAuditIssues) {
    let auditHtml = "";
    let auditBadge = "";
    if (!hasAuditIssues) {
        // 正常時のシンプルバッジ表示 (右上固定用インラインスタイル付与)
        auditBadge = `<span style="position: absolute; top: 20px; right: 20px; color: #27ae60; font-weight: bold; background: #f4fdf8; padding: 2px 6px; border-radius: 4px; border: 1px solid #27ae60; font-size: 13px;">✓</span>`;
    } else {
        // 異常時の詳細エラーブロック表示
        auditHtml = `<div style="border-left: 4px solid #e74c3c; padding: 5px 10px; background: #fdf2e9; border-radius: 4px;"><details><summary style="color: #e74c3c; font-weight: bold; font-size: 13px; cursor: pointer;">⚠ システム検証: 問題あり (クリックで詳細を展開)</summary><ul style="font-size: 13px; color: #333; margin-top: 10px; padding-left: 20px; margin-bottom: 0;"><li style="color: #e74c3c; font-weight: bold; margin-bottom:4px;">抽出または計算処理に致命的なエラーが検出されました。</li></ul></details></div>`;
    }

    let paceHtml = `<div class="pace-grid">`;
    let weightText = "計算中...";

    if (!hasAuditIssues) {
        let results03 = window.processedData['03']?.results || [];
        let totalHorses = results03.length;

        let weightAnalysis = window.analyzeWeightRule(results03, target);
        if (weightAnalysis.isFlatRace) {
            weightText = `定量 (ベース ${weightAnalysis.flatBaseWeight.toFixed(1)}kg)`;
        } else {
            weightText = "別定/ハンデ";
        }

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
        <div class="summary-block" style="width:100%; box-sizing:border-box;">
            <h3 style="margin: 0;">レース条件 ＆ システム検証</h3>
            <p style="margin-top:10px;"><b>条件:</b> ${target.distance}m / ${target.trackType} ｜ <b>基準斤量:</b> ${weightText} / ${target.location}</p>
            ${auditBadge}
            <div id="auditArea">${auditHtml}</div>
        </div>
    `;

    if (!hasAuditIssues) {
        resultHTML += `
            <div class="pace-pattern-block" style="width:100%; box-sizing:border-box;">
                <h3 style="margin-top:0;">展開予想 (脚質グルーピング)</h3>
                ${paceHtml}
            </div>
            <div class="pattern-block" style="width:100%; box-sizing:border-box;">
                <h3 style="margin-top:0;">ATVランキング</h3>
                <div class="segmented-control style-pill" style="margin-bottom: 20px;">
                    <input type="radio" name="radio" id="ratio-00" value="00" onchange="window.switchRatio('00')">
                    <label for="ratio-00">0:10</label>
                    <input type="radio" name="radio" id="ratio-01" value="01" onchange="window.switchRatio('01')">
                    <label for="ratio-01">1:9</label>
                    <input type="radio" name="radio" id="ratio-02" value="02" onchange="window.switchRatio('02')">
                    <label for="ratio-02">2:8</label>
                    <input type="radio" name="radio" id="ratio-03" value="03" onchange="window.switchRatio('03')" checked>
                    <label for="ratio-03">3:7</label>
                    <input type="radio" name="radio" id="ratio-04" value="04" onchange="window.switchRatio('04')">
                    <label for="ratio-04">4:6</label>
                    <input type="radio" name="radio" id="ratio-05" value="05" onchange="window.switchRatio('05')">
                    <label for="ratio-05">5:5</label>
                </div>
                <div id="tableContainer" class="table-responsive"></div>
            </div>
            
            <div class="score-analysis-block" style="width:100%; box-sizing:border-box;">
                <h3 style="margin-top:0;">多角展開スコア分析</h3>
                <div class="score-controls">
                    <div class="score-control-group">
                        <label class="score-control-label">評価指標</label>
                        <select id="scoreMetric" class="score-input-select" onchange="window.runScoreAnalysis()">
                            <option value="adjCentral" selected>展開補正 (安定)</option>
                            <option value="adjWeighted">展開補正 (ベスト)</option>
                            <option value="centralATV">中央加重 (安定)</option>
                            <option value="weightedATV">加重平均 (ベスト)</option>
                        </select>
                    </div>
                    <div class="score-control-group">
                        <label class="score-control-label">許容差分閾値 (Δ)</label>
                        <input type="number" id="scoreThreshold" value="0.50" step="0.01" min="0.01" class="score-input-number">
                        <button onclick="window.runScoreAnalysis()" style="padding: 4px 10px; background: #3498db; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; margin-left: 5px;">確定</button>
                    </div>
                    <div class="score-control-group score-checkbox-container">
                        <label class="score-control-label">評価対象比率</label>
                        <div class="score-checkbox-group">
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="00" onchange="window.runScoreAnalysis()">0:10</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="01" onchange="window.runScoreAnalysis()">1:9</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="02" onchange="window.runScoreAnalysis()">2:8</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="03" onchange="window.runScoreAnalysis()">3:7</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="04" onchange="window.runScoreAnalysis()">4:6</label>
                            <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="05" onchange="window.runScoreAnalysis()">5:5</label>
                        </div>
                    </div>
                </div>
                <div id="scoreResultContainer" class="table-responsive score-table-container"></div>
            </div>

            <div class="details-block" style="width:100%; box-sizing:border-box;">
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
            <div class="pattern-block" style="width:100%; box-sizing:border-box;">
                <div class="pattern-content">
                    <div style="text-align:center; padding: 30px 10px 10px 10px;">
                        <h3 style="color:#e74c3c; display:inline-block; border-left:4px solid #e74c3c; margin-bottom:10px; padding-left:8px;">⚠ 解析停止</h3>
                        <p style="color:#555; font-size:14px; font-weight:bold; margin:0;">システム検証で問題が検出されたため、解析結果の表示を停止しています。</p>
                        <p style="font-size:13px; color:#777; margin-top:5px;">下の検証用プロンプトをコピーし、AIに修正案をリクエストしてください。</p>
                    </div>
                </div>
            </div>
        `;
    }

    resultHTML += `
        <div class="prompt-block" style="width:100%; box-sizing:border-box;">
            <details>
                <summary style="cursor:pointer; padding: 5px 0;">
                    <h3 style="margin:0; display:inline; line-height:1.5;">検証用プロンプト (AI監査用)</h3>
                    <span style="font-size:12px; color:#666; margin-left:10px;">(クリックで展開)</span>
                </summary>
                <div style="margin-top:15px;" id="promptControlArea"></div>
            </details>
        </div>
    `;

    document.getElementById('resultArea').innerHTML = resultHTML;

    if (!hasAuditIssues) {
        window.runScoreAnalysis();
    }
};

// ==========================================
// UIルーラー用ロジック
// ==========================================
window.drawRulerLabels = function() {
    const ticksContainer = document.getElementById('ruler-ticks-container');
    if (!ticksContainer) return;
    ticksContainer.innerHTML = ''; 
    for (let i = 100; i <= 4000; i += 100) {
        const label = document.createElement('div');
        label.className = 'ruler-label';
        label.style.left = i + 'px';
        label.textContent = i;
        ticksContainer.appendChild(label);
    }
};

window.addEventListener('load', window.drawRulerLabels);