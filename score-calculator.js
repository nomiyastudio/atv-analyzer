// ==========================================
// score-calculator.js
// ==========================================

/**
 * 選択された評価指標および比率、閾値(Δ)に基づいて多角展開スコアを算出し、100点満点正規化およびソートを行うモジュール
 * @param {Array} metrics - 選択された評価指標プロパティキーの配列 (例: ['adjWeighted', 'adjCentral'])
 * @param {Array} selectedRatios - 選択された比率IDの配列 (例: ['02', '03'])
 * @param {string} thresholdInput - 閾値の入力値文字列 ('ALL' または 数値文字列)
 * @returns {Array|null} 100点満点に正規化され、スコア順にソートされた各馬の集計オブジェクト配列（エラー時はnull）
 */
window.computeScoreAnalysis = function(metrics, selectedRatios, thresholdInput) {
    let isAllMode = (thresholdInput === 'ALL');
    let threshold = 0;
    if (!isAllMode) {
        threshold = parseFloat(thresholdInput);
        if (isNaN(threshold) || threshold <= 0) {
            alert("正しい閾値(0より大きい数値)を入力してください。");
            return null;
        }
    }

    let horseScores = {};
    let baseData = window.processedData['03'].results;
    
    baseData.forEach(h => {
        horseScores[h.horseId] = {
            horseId: h.horseId,
            horseNo: h.horseNo,
            horseName: h.horseName,
            avgPosRatio: h.avgPosRatio,
            styleName: h.styleName,
            totalScore: 0,
            metrics: {}
        };
        metrics.forEach(m => {
            horseScores[h.horseId].metrics[m] = { subTotal: 0, scores: {} };
            selectedRatios.forEach(r => horseScores[h.horseId].metrics[m].scores[r] = 0);
        });
    });

    metrics.forEach(metric => {
        selectedRatios.forEach(ratioId => {
            let data = window.processedData[ratioId].results;
            
            let minVal = Infinity;
            let maxVal = -Infinity;
            data.forEach(h => {
                if (h[metric] !== null && h[metric] < minVal) minVal = h[metric];
                if (h[metric] !== null && h[metric] > maxVal) maxVal = h[metric];
            });

            data.forEach(h => {
                let val = h[metric];
                let points = 0;
                if (val !== null && minVal !== Infinity) {
                    if (isAllMode) {
                        let range = maxVal - minVal;
                        if (range === 0) {
                            points = 100;
                        } else {
                            points = 1 + 99 * (1 - (val - minVal) / range);
                        }
                    } else {
                        let diff = val - minVal;
                        if (diff <= threshold) {
                            points = 100 * (1 - (diff / threshold));
                            if (points < 0) points = 0;
                        }
                    }
                }
                let hs = horseScores[h.horseId];
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
        .filter(h => isAllMode ? h.totalScore >= 0 : h.totalScore > 0)
        .sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== bNo) return aNo - bNo;
            return a.horseId.localeCompare(b.horseId);
        });

    return sortedScores;
};