// ==========================================
// score-analyzer.js
// ==========================================

window.runScoreAnalysis = function() {
    let metrics = Array.from(document.querySelectorAll('.score-metric-cb:checked')).map(cb => cb.value);
    let thresholdInput = document.getElementById('scoreThreshold').value;
    let selectedRatios = Array.from(document.querySelectorAll('.score-ratio-cb:checked')).map(cb => cb.value);
    if (metrics.length === 0 || selectedRatios.length === 0) {
        document.getElementById('scoreResultContainer').innerHTML = "";
        return;
    }
    
    // 計算処理を外部化モジュール（score-calculator.js）へ委譲してビュー層を軽量化 [cite: 1282-1304]
    let sortedScores = window.computeScoreAnalysis(metrics, selectedRatios, thresholdInput);
    if (!sortedScores) return;

    if (sortedScores.length === 0) {
        let isAllMode = (thresholdInput === 'ALL');
        let threshold = isAllMode ? 0 : parseFloat(thresholdInput);
        document.getElementById('scoreResultContainer').innerHTML = `<p style="text-align:center; color:#e74c3c; font-size:13px; font-weight:bold; padding:20px 0;">設定した閾値(${threshold})以内に該当する馬はいませんでした。</p>`;
        return;
    }

    let baseData = window.processedData['03'].results;
    if (window.renderScoreResultTable) {
        window.renderScoreResultTable(sortedScores, selectedRatios, metrics, baseData.length);
    }
};

window.renderScoreResultTable = function(sortedScores, selectedRatios, metrics, totalHorses) {
    const metricLabels = {
        'adjWeighted': '展開補正(ベスト)',
        'adjCentral': '展開補正(安定)',
        'weightedATV': '加重平均(ベスト)',
        'centralATV': '中央加重(安定)'
    };
    const ratioLabels = {'00':'0:10', '01':'1:9', '02':'2:8', '03':'3:7', '04':'4:6', '05':'5:5'};

    let html = `<table style="border-collapse:collapse; font-size:13px; text-align:center; vertical-align:middle;">
        <tr>
            <th rowspan="2" class="col-score-rank" style="text-align:center; writing-mode:vertical-rl; text-orientation:upright; padding:10px 5px;">順位</th>
            <th rowspan="2" class="col-score-waku" style="text-align:center; padding:10px 4px;">枠</th>
            <th rowspan="2" class="col-score-umaban" style="text-align:center; writing-mode:vertical-rl; text-orientation:upright; padding:10px 5px;">馬番</th>
            <th rowspan="2" class="col-score-name" style="text-align:center;">馬名</th>
            <th rowspan="2" class="col-score-pace" style="text-align:center; writing-mode:vertical-rl; text-orientation:upright; padding:10px 5px;">脚質</th>
            <th rowspan="2" class="col-score-total" style="text-align:center;">総合スコア</th>`;

    // ヘッダー上段: 評価指標のグループ
    metrics.forEach(m => {
        let label = metricLabels[m] || m;
        html += `<th colspan="${selectedRatios.length + 1}" class="metric-header" style="text-align:center;">${label}</th>`;
    });
    html += `</tr><tr>`;

    // ヘッダー下段: 小計と各比率
    metrics.forEach(m => {
        html += `<th class="col-subtotal" style="text-align:center;">小計</th>`;
        selectedRatios.forEach(r => {
            html += `<th class="col-score-ratio" style="text-align:center;">${ratioLabels[r]}</th>`;
        });
    });
    html += `</tr>`;

    let rank = 1;
    sortedScores.forEach((h, index) => {
        if (index > 0 && h.totalScore < sortedScores[index - 1].totalScore) rank = index + 1;
        let wakuColor = window.getWakuColor(h.horseNo, totalHorses);
        
        // 脚質カラーとテキストの計算 [cite: 1310-1311]
        let paceColor = "#999";
        let paceText = "-";
        if (h.avgPosRatio !== null) {
            let pct = h.avgPosRatio * 100;
            let rgb = window.getColorFromStops(window.paceStops, pct);
            paceColor = window.rgbToHex(rgb);
            paceText = h.styleName || "-"; // 変更: パーセント数値から漢字表記へ [cite: 1311]
        }

        html += `<tr>
            <td style="font-weight:bold; color:#555; text-align:center;">${h.totalScore >= 0 ? rank : '-'}</td>
            <td style="background-color:${wakuColor.bg}; color:${wakuColor.text}; border:1px solid ${wakuColor.border}; font-weight:bold; text-align:center;">${wakuColor.waku}</td>
            <td style="font-weight:bold; text-align:center;">${h.horseNo}</td>
            <td class="align-left" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${h.horseName}</td>
            <td style="color:${paceColor}; font-weight:bold; text-align:center;">${paceText}</td>
            <td style="font-weight:bold; font-size:15px; color:var(--primary-color); background:#fbfcfc; text-align:center;">${h.totalScore.toFixed(0)}</td>`;
        
        metrics.forEach(m => {
            // 小計列の出力
            html += `<td class="col-subtotal" style="font-weight:bold; color:#2c3e50; background:#eaf2f8; text-align:center;">${h.metrics[m].subTotal.toFixed(0)}</td>`;
            // 各比率列の出力
            selectedRatios.forEach(r => {
                let pts = h.metrics[m].scores[r];
                let color = pts >= 80 ? '#e74c3c' : (pts >= 50 ? '#e67e22' : '#555');
                let fw = pts >= 50 ? 'bold' : 'normal';
                html += `<td style="color:${color}; font-weight:${fw}; text-align:center;">${pts > 0 ? pts.toFixed(0) : '0'}</td>`;
            });
        });
        
        html += `</tr>`;
    });
    html += `</table>`;

    let container = document.getElementById('scoreResultContainer');
    if (container) {
        container.innerHTML = html;
    }
};