// ==========================================
// score.js
// ==========================================

window.runScoreAnalysis = function() {
    let metrics = Array.from(document.querySelectorAll('.score-metric-cb:checked')).map(cb => cb.value);
    let threshold = parseFloat(document.getElementById('scoreThreshold').value);
    let selectedRatios = Array.from(document.querySelectorAll('.score-ratio-cb:checked')).map(cb => cb.value);

    if (metrics.length === 0 || selectedRatios.length === 0) {
        document.getElementById('scoreResultContainer').innerHTML = "";
        return;
    }
    
    if (isNaN(threshold) || threshold <= 0) {
        alert("正しい閾値(0より大きい数値)を入力してください。");
        return;
    }

    let horseScores = {};
    
    let baseData = window.processedData['03'].results; 
    baseData.forEach(h => {
        horseScores[h.horseNo] = {
            horseNo: h.horseNo,
            horseName: h.horseName,
            totalScore: 0,
            metrics: {}
        };
        metrics.forEach(m => {
            horseScores[h.horseNo].metrics[m] = { subTotal: 0, scores: {} };
            selectedRatios.forEach(r => horseScores[h.horseNo].metrics[m].scores[r] = 0);
        });
    });

    metrics.forEach(metric => {
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
                    hs.metrics[metric].scores[ratioId] = points;
                    hs.metrics[metric].subTotal += points;
                    hs.totalScore += points;
                }
            });
        });
    });

    // 合計スコアおよび小計スコアを100点満点に正規化
    Object.values(horseScores).forEach(hs => {
        metrics.forEach(m => {
            hs.metrics[m].subTotal = hs.metrics[m].subTotal / selectedRatios.length;
        });
        hs.totalScore = hs.totalScore / (metrics.length * selectedRatios.length);
    });

    let sortedScores = Object.values(horseScores)
        .filter(h => h.totalScore > 0)
        .sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            return aNo - bNo;
        });

    if (sortedScores.length === 0) {
        document.getElementById('scoreResultContainer').innerHTML = `<p style="text-align:center; color:#e74c3c; font-size:13px; font-weight:bold; padding:20px 0;">設定した閾値(${threshold})以内に該当する馬はいませんでした。</p>`;
        return;
    }

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

    let html = `<table style="border-collapse:collapse; font-size:13px; text-align:center;">
        <tr>
            <th rowspan="2" class="col-score-rank">順位</th>
            <th rowspan="2" class="col-score-waku">枠</th>
            <th rowspan="2" class="col-score-umaban">馬番</th>
            <th rowspan="2" class="col-score-name">馬名</th>
            <th rowspan="2" class="col-score-total">総合スコア</th>`;
    
    // ヘッダー上段: 評価指標のグループ
    metrics.forEach(m => {
        let label = metricLabels[m] || m;
        html += `<th colspan="${selectedRatios.length + 1}" class="metric-header">${label}</th>`;
    });
    html += `</tr><tr>`;

    // ヘッダー下段: 小計と各比率
    metrics.forEach(m => {
        html += `<th class="col-subtotal">小計</th>`;
        selectedRatios.forEach(r => {
            html += `<th class="col-score-ratio">${ratioLabels[r]}</th>`;
        });
    });
    html += `</tr>`;

    let rank = 1;
    sortedScores.forEach((h, index) => {
        if (index > 0 && h.totalScore < sortedScores[index - 1].totalScore) rank = index + 1;
        let wakuColor = window.getWakuColor(h.horseNo, totalHorses);
        
        html += `<tr>
            <td style="font-weight:bold; color:#555;">${h.totalScore > 0 ? rank : '-'}</td>
            <td style="background-color:${wakuColor.bg}; color:${wakuColor.text}; border:1px solid ${wakuColor.border}; font-weight:bold;">${wakuColor.waku}</td>
            <td style="font-weight:bold;">${h.horseNo}</td>
            <td class="align-left" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${h.horseName}</td>
            <td style="font-weight:bold; font-size:15px; color:var(--primary-color); background:#fbfcfc;">${h.totalScore.toFixed(0)}</td>`;
        
        metrics.forEach(m => {
            // 小計列の出力
            html += `<td class="col-subtotal" style="font-weight:bold; color:#2c3e50; background:#eaf2f8;">${h.metrics[m].subTotal.toFixed(0)}</td>`;
            
            // 各比率列の出力
            selectedRatios.forEach(r => {
                let pts = h.metrics[m].scores[r];
                let color = pts >= 80 ? '#e74c3c' : (pts >= 50 ? '#e67e22' : '#555');
                let fw = pts >= 50 ? 'bold' : 'normal';
                html += `<td style="color:${color}; font-weight:${fw};">${pts > 0 ? pts.toFixed(0) : '0'}</td>`;
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