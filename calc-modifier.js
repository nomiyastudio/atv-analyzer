// ==========================================
// calc-modifier.js
// ==========================================

/**
 * パース済みの過去走データを受け取り、4大数理補正（距離、斤量、場所、クラス）を執行する数理計算モジュール
 * @param {Object} rawRaceData - パース済みの生レースデータオブジェクト
 * @param {number} baseWeight - 今回の基準斤量（info.baseWeight）
 * @param {number} age - 馬の年齢
 * @param {Object} target - 今回のターゲットレース条件オブジェクト
 * @returns {Object} 各種補正値および最終ATVがマージされた過去走データオブジェクト
 */
window.calculateRaceModifications = function(rawRaceData, baseWeight, age, target) {
    let j = rawRaceData.idx;
    let rDate = rawRaceData.date;
    let pLoc = rawRaceData.pLoc;
    let pTrack = rawRaceData.pTrack;
    let pDist = rawRaceData.pDist;
    let pCond = rawRaceData.pCond;
    let pWeight = rawRaceData.pWeight;
    let f3FrontStr = rawRaceData.f3FrontStr;
    let f3BackStr = rawRaceData.f3BackStr;
    let posRatio = rawRaceData.posRatio;
    let hadLead = rawRaceData.hadLead;
    let isOuter = rawRaceData.isOuter;
    let passedCount = rawRaceData.passedCount;
    let baseTime = rawRaceData.baseTime;
    let pClassRank = rawRaceData.pClassRank;

    // 統括マネージャー（course-manager.js）からコース特性データを動的引き当て
    let targetCourseData = { locFactor: 0.00, cFactor: 0.020, staminaPenalty: 1.00 };
    let pastCourseData = { locFactor: 0.00, cFactor: 0.020, staminaPenalty: 1.00 };

    if (target.location && target.location !== "不明" && pLoc !== "不明") {
        targetCourseData = window.getCourseData(target.location, target.trackType, target.distance, "F");
        pastCourseData = window.getCourseData(pLoc, pTrack, pDist, pClassRank);
    } else if (pLoc !== "不明" && window.ATV_COURSE_MASTER[pLoc]) {
        try {
            pastCourseData = window.getCourseData(pLoc, pTrack, pDist, pClassRank);
        } catch (e) {
            // ペース分析時などの未登録例外はデフォルト値でエスケープ
        }
    }

    // 1. 距離損失（distMod）: 2乗曲線（非線形）にコース固有のスタミナ負荷倍率を合成 [cite: 989-991]
    let currentSensitivity = pTrack === "芝" ? window.ATV_CONFIG.DIST_SENSITIVITY.TURF : window.ATV_CONFIG.DIST_SENSITIVITY.DIRT;
    const calcDistLoss = (d, penalty) => Math.pow((d - 1600) / 1000, 2) * currentSensitivity * penalty;
    let pDistLoss = calcDistLoss(pDist, pastCourseData.staminaPenalty);
    let tDistLoss = calcDistLoss(target.distance, targetCourseData.staminaPenalty);
    let distMod = 1.00 + (tDistLoss - pDistLoss);

    // 年齢パターンの決定 [cite: 992-995]
    let agePattern = 3;
    let monthCheck = target.raceMonth ? target.raceMonth : 11;
    if (age === 2 || (age === 3 && monthCheck <= 5)) {
        agePattern = 1;
    } else if (age === 3 && monthCheck >= 6) {
        agePattern = 2;
    } else if (age >= 4) {
        agePattern = 3;
    }

    // 2. クラス補正（classMod） [cite: 996-997]
    let classMod = window.ATV_CONFIG.CLASS_FACTOR[agePattern][pClassRank] !== undefined ? window.ATV_CONFIG.CLASS_FACTOR[agePattern][pClassRank] : 0.00;

    // 馬場状態補正の基礎値算出 [cite: 997-1000]
    let surfModBase = 0.00;
    if (pTrack === "芝") {
        if (pCond === "稍") surfModBase = -0.01;
        else if (pCond === "重") surfModBase = -0.02;
        else if (pCond === "不") surfModBase = -0.04;
    } else {
        if (pCond === "稍") surfModBase = 0.01;
        else if (pCond === "重" || pCond === "不") surfModBase = 0.02;
    }
    let surfMod = surfModBase * (pDist / 1600);

    // 3. 場所補正（locMod）: 完全相対差分方式（過去走 - 開催）で算出 [cite: 1002]
    let locMod = pastCourseData.locFactor - targetCourseData.locFactor;

    // 4. 斤量補正（wghtMod） [cite: 1003]
    let weightDiff = baseWeight - pWeight;
    let wghtMod = weightDiff * window.ATV_CONFIG.WEIGHT_FACTOR;

    // 条件補正（condMod）の合成および最終ATV算出 [cite: 1004-1005]
    let condMod = 1.00 + surfMod + wghtMod + locMod + classMod;
    let atv = baseTime * distMod * condMod;
    let atvRounded = Math.round(atv * 100) / 100;

    return {
        idx: j, date: rDate, valid: true,
        baseTime: baseTime, distMod: distMod, condMod: condMod, atv: atvRounded,
        f3f: f3FrontStr, f3b: f3BackStr, distDiff: target.distance - pDist,
        surfModText: pTrack + pCond, surfMod: surfMod, 
        wghtModText: (weightDiff >= 0 ? "+" : "") + weightDiff.toFixed(1) + "kg", wghtMod: wghtMod, 
        locModText: pLoc || "不明", locMod: locMod,
        classMod: classMod, agePattern: agePattern, pClassRank: pClassRank, 
        pLoc: pLoc || "不明", pTrack: pTrack, pDist: pDist, pCond: pCond, pWeight: pWeight,
        isLimited: false, posRatio: posRatio, hadLead: hadLead,
        isOuter: isOuter,
        passedCount: passedCount
    };
};