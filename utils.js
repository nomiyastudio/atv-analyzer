// --- グローバル変数の初期化 ---
window.generatedPrompts = {};
window.processedData = {};
window.globalSortType = 'centralATV'; 
window.globalCorrectionMode = 'centralATV'; // 追加: 展開補正の算出ベース ('centralATV' or 'weightedATV')
window.resolveMonthCallback = null;

// ==========================================
// utils.js
// ==========================================
window.getWakuColor = function(horseNo, totalHorses) {
    let no = parseInt(horseNo, 10);
    let waku = 0;
    
    if (isNaN(no) || totalHorses < 1) return { waku: "-", bg: "#ffffff", text: "#333333", border: "#cccccc" };
    
    if (totalHorses <= 8) {
        waku = no;
    } else {
        let brackets = [0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < totalHorses; i++) {
            brackets[7 - (i % 8)]++;
        }
        let currentWaku = 1;
        let countInWaku = 0;
        for (let i = 1; i <= totalHorses; i++) {
            if (i === no) {
                waku = currentWaku;
                break;
            }
            countInWaku++;
            if (countInWaku >= brackets[currentWaku - 1]) {
                currentWaku++;
                countInWaku = 0;
            }
        }
    }

    const colors = {
        1: { bg: '#f7f7f7', text: '#333333', border: '#e0e0e0' },
        2: { bg: '#333333', text: '#ffffff', border: '#333333' },
        3: { bg: '#e95556', text: '#ffffff', border: '#e95556' },
        4: { bg: '#2d66b4', text: '#ffffff', border: '#2d66b4' },
        5: { bg: '#f4d002', text: '#333333', border: '#f4d002' },
        6: { bg: '#32a641', text: '#ffffff', border: '#32a641' },
        7: { bg: '#f08f22', text: '#333333', border: '#f08f22' },
        8: { bg: '#f4a1bb', text: '#333333', border: '#f4a1bb' }
    };

    if (waku >= 1 && waku <= 8) {
        return { waku: waku, ...colors[waku] };
    }
    return { waku: "-", bg: '#ffffff', text: '#333333', border: '#cccccc' };
};

window.paceStops = [
    { pct: 0, color: [211, 84, 0] },
    { pct: 33, color: [241, 196, 15] },
    { pct: 66, color: [107, 142, 35] },
    { pct: 100, color: [27, 79, 114] }
];

window.getColorFromStops = function(stops, pct) {
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
        if (pct >= stops[i].pct && pct <= stops[i + 1].pct) {
            lower = stops[i];
            upper = stops[i + 1];
            break;
        }
    }
    if (lower === upper) return lower.color;
    let range = upper.pct - lower.pct;
    let ratio = (pct - lower.pct) / range;
    let r = Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * ratio);
    let g = Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * ratio);
    let b = Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * ratio);
    return [r, g, b];
};

window.rgbToHex = function(rgb) {
    return "#" + rgb.map(x => {
        let hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
};

window.getTextColor = function(rgb) {
    return "#ffffff";
};

window.darken = function(rgb) {
    return rgb.map(x => Math.max(0, Math.floor(x * 0.8)));
};

// --- 新規追加: 基準斤量とレース条件（定量/別定ハンデ）の判定ロジック ---
window.analyzeWeightRule = function(results, target) {
    if (!results || results.length === 0) return { isFlatRace: false, flatBaseWeight: 0, baseWeights: [], avgActualW: 0 };

    let is2yo = target.is2yo || false;
    let raceMonth = target.raceMonth || null;
    let distance = target.distance || 2000;
    let actualWeights = [];
    let baseWeights = [];

    const getAgeAllowance = (age, month, dist) => {
        if (age !== 3 || !month || month < 6 || month > 12) return 0.0;
        let distCat = 0;
        if (dist < 1400) distCat = 0;
        else if (dist <= 1600) distCat = 1;
        else if (dist < 2200) distCat = 2;
        else distCat = 3;
        const table = {
            6: [3.0, 3.0, 3.0, 4.0], 7: [2.0, 3.0, 3.0, 4.0], 8: [2.0, 2.0, 3.0, 3.0],
            9: [1.0, 2.0, 2.0, 3.0], 10: [0.0, 1.0, 2.0, 2.0], 11: [0.0, 1.0, 1.0, 2.0],
            12: [0.0, 0.0, 1.0, 1.0]
        };
        return table[month] ? table[month][distCat] : 0.0;
    };

    results.forEach(h => {
        let actualW = h.currentWeight;
        actualWeights.push(actualW);
        let sexAllowance = (h.sex === "牝" || h.sex === "牝馬") ? (!is2yo ? 2.0 : (raceMonth >= 10 ? 1.0 : 0.0)) : 0.0;
        let jockeyAllowance = {'☆':1.0, '△':2.0, '◇':2.0, '▲':3.0, '★':4.0}[h.jockeyMark] || 0.0;
        let ageAllowance = getAgeAllowance(h.age, raceMonth, distance);
        h.baseWeight = actualW + sexAllowance + jockeyAllowance + ageAllowance;
        baseWeights.push(h.baseWeight);
    });

    let isFlatRace = baseWeights.every(w => w === baseWeights[0]);
    let flatBaseWeight = isFlatRace ? baseWeights[0] : 0;
    let avgActualW = actualWeights.reduce((a, b) => a + b, 0) / actualWeights.length;

    return { isFlatRace, flatBaseWeight, baseWeights, avgActualW, actualWeights };
};