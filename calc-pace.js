// ==========================================
// calc-pace.js
// ==========================================

window.analyzeRacePace = function(horseBlocks, validHorseNames) {
    let totalHorses = 0;
    let nigeCount = 0;
    let senkoCount = 0;

    // 脚質判定用のダミーのターゲット条件と比率
    // (脚質の判定ロジックは位置比率のみを参照するため、距離や前後比率には依存しない)
    const dummyTarget = { trackType: "芝", distance: 1600, raceMonth: 11 };
    const dummyRatio = { f: 0.5, b: 0.5 };

    for (let i = 0; i < horseBlocks.length; i++) {
        let block = horseBlocks[i];
        if (block.includes("調教タイム") || block.includes("ラップ表示")) continue;

        let headerArea = /\d{2}\/\d{2}/.test(block) ? block.split(/\d{2}\/\d{2}/)[0] : block;
        let info = window.extractHeaderInfo(headerArea, validHorseNames);
        if (info.horseName === "不明") continue;

        totalHorses++;

        let races = block.split(/\r?\n(?=\s*\d{2}\/\d{2}[\s\r\n])/);
        let raceData = window.processPastRaces(races, info.baseWeight, info.age, dummyTarget, dummyRatio);
        let paceData = window.calcPaceAndStyle(raceData.validATVs);

        if (paceData.styleClass === 1) {
            nigeCount++;
        } else if (paceData.styleClass === 2) {
            senkoCount++;
        }
    }

    let frontRatio = totalHorses > 0 ? (nigeCount + senkoCount) / totalHorses : 0;
    let pace = "MIDDLE";

    if (nigeCount <= 1 && frontRatio < 0.30) {
        pace = "SLOW";
    } else if (nigeCount >= 3 || frontRatio >= 0.60) {
        pace = "HIGH";
    }

    return pace;
};