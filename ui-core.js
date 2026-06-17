// ==========================================
// ui-core.js
// ==========================================

window.renderUI = function(target, hasAuditIssues, allAuditErrors) {
    let weightText = "計算中...";
    let paceLabel = target.predictedPace === "SLOW" ? "スローペース" : (target.predictedPace === "HIGH" ? "ハイペース" : "ミドルペース");
    let paceBtnText = window.useDynamicPace ? "⏸ ペース判定をオフにする" : "⚡ ペース判定をオンにする";
    let paceStatusText = window.useDynamicPace ? `反映中 (${paceLabel})` : "未反映 (一律ミドル処理)";

    if (!hasAuditIssues) {
        let results03 = window.processedData['03']?.results || [];
        let weightAnalysis = window.analyzeWeightRule(results03, target);
        if (weightAnalysis.isFlatRace) {
            weightText = `定量 (ベース ${weightAnalysis.flatBaseWeight.toFixed(1)}kg)`;
        } else {
            weightText = "別定/ハンデ";
        }
    }

    // 各情報ブロックのHTMLは、新設するコンポーネント関数から取得して結合する（軽量化・ハルシネーション防止）
    let resultHTML = window.renderSummaryBlockHTML(target, hasAuditIssues, weightText, paceLabel, paceStatusText, paceBtnText, allAuditErrors);

    if (!hasAuditIssues) {
        resultHTML += window.renderPaceBlockHTML(target);
        resultHTML += `
            <div class="pattern-block" style="width:100%; box-sizing:border-box;">
                <h3 style="margin-top:0;">ATVランキング</h3>
                <div class="segmented-control style-pill" style="margin-bottom: 20px;">
                    <input type="radio" name="radio" id="ratio-00" value="00" onchange="window.switchRatio('00')">
                    <label for="ratio-00">0:10</label>
                    <input type="radio" name="radio" id="ratio-01" value="01" onchange="window.switchRatio('01')">
                    <label for="ratio-01">1:9</label>
                    <input type="radio" name="radio" id="ratio-02" value="02" onchange="window.switchRatio('02')" checked>
                    <label for="ratio-02">2:8</label>
                    <input type="radio" name="radio" id="ratio-03" value="03" onchange="window.switchRatio('03')">
                    <label for="ratio-03">3:7</label>
                    <input type="radio" name="radio" id="ratio-04" value="04" onchange="window.switchRatio('04')">
                    <label for="ratio-04">4:6</label>
                    <input type="radio" name="radio" id="ratio-05" value="05" onchange="window.switchRatio('05')">
                    <label for="ratio-05">5:5</label>
                </div>
                <div id="tableContainer" class="table-responsive"></div>
            </div>
        `;
        // 多角展開スコア分析ブロックの生成を新設コンポーネントに委譲
        resultHTML += window.renderScoreBlockHTML();
        resultHTML += `
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
        let firstErrorText = (allAuditErrors && allAuditErrors.length > 0) ? allAuditErrors[0] : "抽出または計算処理に致命的なエラーが検出されました。";
        let errorListHtml = "";

        if (allAuditErrors && allAuditErrors.length > 0) {
            allAuditErrors.forEach(err => {
                errorListHtml += `<li style="margin-bottom:4px; word-break:break-all; line-height:1.4;">${err}</li>`;
            });
        } else {
            errorListHtml = `<li style="margin-bottom:4px; word-break:break-all; line-height:1.4;">抽出または計算処理に致命的なエラーが検出されました。</li>`;
        }

        resultHTML += `
            <div class="pattern-block" style="width:100%; box-sizing:border-box;">
                <div class="pattern-content">
                    <div style="text-align:center; padding: 30px 10px 10px 10px;">
                        <h3 style="color:#e74c3c; display:inline-block; border-left:4px solid #e74c3c; margin-bottom:10px; padding-left:8px;">⚠ 解析停止</h3>
                        <p style="color:#555; font-size:14px; font-weight:bold; margin:0;">システム検証で問題が検出されたため、解析結果の表示を停止しています。</p>
                        
                        <div style="border-left: 4px solid #e74c3c; padding: 10px; background: #fdf2e9; border-radius: 4px; margin: 15px auto; text-align: left; max-width: 800px; box-sizing: border-box;">
                            <div style="color: #e74c3c; font-weight: bold; font-size: 14px; margin-bottom: 8px; word-break: break-all; line-height: 1.4;">⚠️ 解析停止の原因: ${firstErrorText}</div>
                            <details style="margin-top: 6px;">
                                <summary style="color: #555; font-weight: bold; font-size: 12px; cursor: pointer; user-select: none;">すべての検出エラー（全 ${allAuditErrors ? allAuditErrors.length : 0} 件）を確認する</summary>
                                <ul style="font-size: 13px; color: #333; margin-top: 8px; padding-left: 20px; margin-bottom: 0;">
                                    ${errorListHtml}
                                </ul>
                            </details>
                        </div>

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