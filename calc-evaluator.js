// ==========================================
// calc-evaluator.js
// ==========================================

// ==========================================
// 内部関数3: 洋芝・野芝専用機判定
// ==========================================
window.checkTurfSpecialist = function(validATVs, target) {
    let onlyYoshiba = false;
    let onlyNoshiba = false;

    if (target.trackType === "芝") {
        let isTargetYoshiba = ["札幌", "函館"].includes(target.location);
        let noshibaBest = Infinity;
        let yoshibaBest = Infinity;
        let hasNoshiba = false;
        let hasYoshiba = false;
        validATVs.forEach(r => {
            let isYoshiba = ["札幌", "函館"].includes(r.pLoc);
            if (isYoshiba) {
                hasYoshiba = true;
                if (r.atv < yoshibaBest) yoshibaBest = r.atv;
            } else {
                hasNoshiba = true;
                if (r.atv < noshibaBest) noshibaBest = r.atv;
            }
        });
        if (!isTargetYoshiba) { 
            if (hasNoshiba) {
                validATVs.forEach(r => {
                    let isYoshiba = ["札幌", "函館"].includes(r.pLoc);
                    if (isYoshiba && r.atv < noshibaBest) { r.atv = noshibaBest; r.isLimited = true; }
                });
            } else if (hasYoshiba) {
                onlyYoshiba = true;
            }
        } else { 
            if (hasYoshiba) {
                validATVs.forEach(r => {
                    let isYoshiba = ["札幌", "函館"].includes(r.pLoc);
                    if (!isYoshiba && r.atv < yoshibaBest) { r.atv = yoshibaBest; r.isLimited = true; }
                });
            } else if (hasNoshiba) {
                onlyNoshiba = true;
            }
        }
    }
    return { onlyYoshiba, onlyNoshiba };
};

// ==========================================
// 内部関数4: 脚質とペース判定および平均追い抜き頭数の算出
// ==========================================
window.calcPaceAndStyle = function(validATVs) {
    let sumRatio = 0;
    let countRatio = 0;
    let hasLeadExperience = false;
    
    let sumPassed = 0;
    let countPassed = 0;
    validATVs.forEach(r => {
        if (r.posRatio !== null) {
            sumRatio += r.posRatio;
            countRatio++;
            if (r.hadLead) hasLeadExperience = true;
        }
        
        // 新規追加: 平均追い抜き頭数の算出（B案: 1以上のレースを母数とする）
        if (r.passedCount !== null && r.passedCount > 0) {
            sumPassed += r.passedCount;
            countPassed++;
        }
    });
    let avgPosRatio = countRatio > 0 ? (sumRatio / countRatio) : null;
    let avgPassedCount = countPassed > 0 ? (sumPassed / countPassed) : 0;
    
    let styleClass = null;
    let styleName = "";
    if (avgPosRatio !== null) {
        if (avgPosRatio <= 0.15) {
            if (hasLeadExperience) { styleClass = 1; styleName = "逃"; }
            else { styleClass = 2; styleName = "先"; }
        } else if (avgPosRatio <= 0.40) { styleClass = 2; styleName = "先"; }
        else if (avgPosRatio <= 0.85) { styleClass = 3; styleName = "差"; }
        else { styleClass = 4; styleName = "追"; }
    }
    return { avgPosRatio, styleClass, styleName, avgPassedCount };
};

// ==========================================
// 内部関数5: ATVの集計と展開補正
// ==========================================
window.calcAggregateATVs = function(validATVs, avgPosRatio, cFactor, target) {
    validATVs.sort((a, b) => a.atv - b.atv);
    let weightedATV = null;
    let centralATV = null;
    let vLen = validATVs.length;
    let centralAdopted = [];
    let centralOutliers = [];
    if (vLen >= 3) { weightedATV = validATVs[0].atv * 0.8 + validATVs[1].atv * 0.15 + validATVs[2].atv * 0.05; }
    else if (vLen === 2) { weightedATV = validATVs[0].atv * 0.8 + validATVs[1].atv * 0.2; }
    else if (vLen === 1) { weightedATV = validATVs[0].atv; }
    
    if (weightedATV !== null) weightedATV = Math.round(weightedATV * 100) / 100;
    let vLenCalc = Math.min(5, vLen);
    if (vLenCalc >= 5) {
        let eVal = (validATVs[0].atv + validATVs[4].atv) / 2;
        centralATV = (validATVs[1].atv + validATVs[2].atv + validATVs[3].atv + eVal * 0.5) / 3.5;
        centralAdopted = [validATVs[1], validATVs[2], validATVs[3]];
        centralOutliers = [validATVs[0], validATVs[4]];
    } else if (vLenCalc === 4) {
        let eVal = (validATVs[0].atv + validATVs[3].atv) / 2;
        centralATV = (validATVs[1].atv + validATVs[2].atv + eVal * 0.5) / 2.5;
        centralAdopted = [validATVs[1], validATVs[2]];
        centralOutliers = [validATVs[0], validATVs[3]];
    } else if (vLenCalc === 3) {
        let eVal = (validATVs[0].atv + validATVs[2].atv) / 2;
        centralATV = (validATVs[1].atv + eVal * 0.5) / 1.5;
        centralAdopted = [validATVs[1]];
        centralOutliers = [validATVs[0], validATVs[2]];
    } else if (vLenCalc === 2) {
        centralATV = (validATVs[0].atv + validATVs[1].atv) / 2;
        centralAdopted = [validATVs[0], validATVs[1]];
    } else if (vLenCalc === 1) {
        centralATV = validATVs[0].atv;
        centralAdopted = [validATVs[0]];
    }
    if (centralATV !== null) centralATV = Math.round(centralATV * 100) / 100;
    let adjCentral = null;
    let adjWeighted = null;
    
    if (avgPosRatio !== null) {
        let penaltyMultiplier = 1.00;
        let paceMode = "MIDDLE"; // デフォルト仕様
        
        // フラグON時のみ事前判定された3値にスイッチ
        if (window.useDynamicPace && target && target.predictedPace) {
            paceMode = target.predictedPace;
        }
        
        if (paceMode === "SLOW") {
            penaltyMultiplier = 1.00 + Math.pow(avgPosRatio, 2) * cFactor;
        } else if (paceMode === "HIGH") {
            penaltyMultiplier = 1.00 + Math.pow(1 - avgPosRatio, 2) * cFactor;
        } else {
            // MIDDLE（判定オフの場合も一律ミドル線形処理テスト仕様）
            penaltyMultiplier = 1.00 + avgPosRatio * cFactor;
        }

        if (centralATV !== null) {
            adjCentral = centralATV * penaltyMultiplier;
            adjCentral = Math.round(adjCentral * 100) / 100;
        }
        if (weightedATV !== null) {
            adjWeighted = weightedATV * penaltyMultiplier;
            adjWeighted = Math.round(adjWeighted * 100) / 100;
        }
    }

    return { weightedATV, centralATV, adjCentral, adjWeighted, centralAdopted, centralOutliers };
};

// ==========================================
// 内部関数6: レース間隔判定
// ==========================================
window.calcInterval = function(headerArea, pastRaces, target) {
    let intervalHtml = "-";
    let intervalMatch = headerArea.match(/(連闘|中\s*\d+\s*週|休\s*\d+\s*月|休\s*半年|半年\s*休)/);
    
    if (intervalMatch) {
        let intervalText = intervalMatch[1].replace(/\s+/g, '');
        let isHard = /連闘|中1週|中2週/.test(intervalText);
        let color = isHard ? "#e74c3c" : "#555";
        let fw = isHard ? "bold" : "normal";
        let bd = isHard ? `border:1px solid #e74c3c; background-color:#fdedec;` : `border:1px solid transparent;`;
        intervalHtml = `<span style="font-size:11px; color:${color}; font-weight:${fw}; ${bd} padding:2px 4px; border-radius:4px; display:inline-block;">${intervalText}</span>`;
    } else if (target.dateStr) {
        let tMatch = target.dateStr.match(/(\d{1,2})月(\d{1,2})日/);
        let latestRace = pastRaces.find(r => r.idx === 1);
        if (tMatch && latestRace && latestRace.date !== "不明") {
            let tMonth = parseInt(tMatch[1]);
            let tDay = parseInt(tMatch[2]);
            let pMatch = latestRace.date.split('/');
            if (pMatch.length === 2) {
                let pMonth = parseInt(pMatch[0]);
                let pDay = parseInt(pMatch[1]);
                let tYear = 2026, pYear = 2026;
                if (tMonth < pMonth) pYear--;
                let d1 = new Date(tYear, tMonth-1, tDay);
                let d2 = new Date(pYear, pMonth-1, pDay);
                let diff = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
                if (diff >= 0) {
                    let weeks = Math.floor(diff / 7);
                    if (weeks === 0) {
                        intervalHtml = `<span style="font-size:11px; color:#e74c3c; font-weight:bold; border:1px solid #e74c3c; padding:2px 4px; border-radius:4px; background-color:#fdedec; display:inline-block;">連闘</span>`;
                    } else {
                        let color = weeks < 3 ? "#e74c3c" : "#555";
                        let fw = weeks < 3 ? "bold" : "normal";
                        let bd = weeks < 3 ? `border:1px solid #e74c3c; background-color:#fdedec;` : `border:1px solid transparent;`;
                        intervalHtml = `<span style="font-size:11px; color:${color}; font-weight:${fw}; ${bd} padding:2px 4px; border-radius:4px; display:inline-block;">中${weeks}週</span>`;
                    }
                }
            }
        }
    }
    return intervalHtml;
};