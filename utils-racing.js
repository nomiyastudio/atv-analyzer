// ==========================================
// utils-racing.js
// ==========================================

// --- 基準斤量とレース条件（定量/別定ハンデ）の判定ロジック ---
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
        
        const table = window.ATV_CONFIG.AGE_ALLOWANCE;
        return table[month] ? table[month][distCat] : 0.0;
    };

    results.forEach(h => {
        let actualW = h.currentWeight;
        actualWeights.push(actualW);
        let sexAllowance = (h.sex === "牝" || h.sex === "牝馬") ? (!is2yo ? 2.0 : (raceMonth >= 10 ? 1.0 : 0.0)) : 0.0;
        let jockeyAllowance = {'☆':1.0, '△':2.0, '◇':2.0, '▲':3.0, '★':4.0}[h.jockeyMark] || 0.0;
        let ageAllowance = getAgeAllowance(h.age, raceMonth, distance);
        
        h.sexAllowance = sexAllowance;
        h.jockeyAllowance = jockeyAllowance;
        h.ageAllowance = ageAllowance;

        h.baseWeight = actualW + sexAllowance + jockeyAllowance + ageAllowance;
        baseWeights.push(h.baseWeight);
    });

    let isFlatRace = baseWeights.every(w => w === baseWeights[0]);
    let flatBaseWeight = isFlatRace ? baseWeights[0] : 0;
    let avgActualW = actualWeights.reduce((a, b) => a + b, 0) / actualWeights.length;

    return { isFlatRace, flatBaseWeight, baseWeights, avgActualW, actualWeights };
};