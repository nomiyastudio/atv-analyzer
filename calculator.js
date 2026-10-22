window.extractHeaderInfo = function(headerArea, validHorseNames) {
    let horseName = "不明";
    for (let n = 0; n < validHorseNames.length; n++) {
        if (headerArea.indexOf(validHorseNames[n]) !== -1) {
            horseName = validHorseNames[n];
            break;
        }
    }

    let horseNo = "-";
    let regexNo = new RegExp("(?:^|\\n)\\s*(?:[枠]?\\d{1,2}\\s+)?(\\d{1,2})\\s*(?:\\r?\\n|\\s+)?" + window.ATV_MARK_PATTERN);
    let matchNo = headerArea.match(regexNo);
    if (matchNo) horseNo = matchNo[1];

    let age = 4;
    let sex = "牡";
    let sexAgeMatch = headerArea.match(/(牝|牡|セ)(\d+)/);
    let afterAgeArea = headerArea;
    
    if (sexAgeMatch) {
        sex = sexAgeMatch[1];
        age = parseInt(sexAgeMatch[2], 10);
        afterAgeArea = headerArea.substring(sexAgeMatch.index);
    }

    let jockeyMark = "";
    let d1Element = document.getElementById('data1');
    if (d1Element && d1Element.value && horseName !== "不明") {
        let d1Text = d1Element.value;
        let d1Regex = new RegExp(horseName + "[^\\r\\n]*\\s+(?:牝|牡|セ)\\d+\\s+(?:4[8-9]\\.[05]|5\\d\\.[05]|6[0-5]\\.[05])\\s*([☆△▲★◇])");
        let d1Match = d1Text.match(d1Regex);
        if (d1Match) {
            jockeyMark = d1Match[1];
        }
    }

    if (!jockeyMark) {
        let markMatch = afterAgeArea.match(/[☆△▲★◇](?=[一-推])/);
        if (markMatch) jockeyMark = markMatch[0];
    }

    let currentWeight = 55.0;
    let cwMatch = afterAgeArea.match(/(?:牝|牡|セ)\d[\s\S]{1,100}?(4[8-9]\.[05]|5\d\.[05]|6[0-5]\.[05])(?=$|\s|\n)/);
    if (cwMatch) {
        currentWeight = parseFloat(cwMatch[1]);
    } else {
        let cwMatchFallback = afterAgeArea.match(/(?:^|\s|\n)(4[8-9]\.[05]|5\d\.[05]|6[0-5]\.[05])(?=$|\s|\n)/);
        if (cwMatchFallback) currentWeight = parseFloat(cwMatchFallback[1]);
    }

    return { horseName, horseNo, age, sex, jockeyMark, baseWeight: currentWeight };
};

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

    let targetCourseData = { locFactor: 0.00, cFactor: 0.020, staminaPenalty: 1.00 };
    let pastCourseData = { locFactor: 0.00, cFactor: 0.020, staminaPenalty: 1.00 };

    if (target.location && target.location !== "不明" && pLoc !== "不明") {
        targetCourseData = window.getCourseData(target.location, target.trackType, target.distance, "F");
        pastCourseData = window.getCourseData(pLoc, pTrack, pDist, pClassRank);
    } else if (pLoc !== "不明" && window.ATV_COURSE_MASTER[pLoc]) {
        try {
            pastCourseData = window.getCourseData(pLoc, pTrack, pDist, pClassRank);
        } catch (e) {
        }
    }

    let currentSensitivity = pTrack === "芝" ? window.ATV_CONFIG.DIST_SENSITIVITY.TURF : window.ATV_CONFIG.DIST_SENSITIVITY.DIRT;
    const calcDistLoss = (d, penalty) => Math.pow((d - 1600) / 1000, 2) * currentSensitivity * penalty;
    let pDistLoss = calcDistLoss(pDist, pastCourseData.staminaPenalty);
    let tDistLoss = calcDistLoss(target.distance, targetCourseData.staminaPenalty);
    let distMod = 1.00 + (tDistLoss - pDistLoss);

    let agePattern = 3;
    let monthCheck = target.raceMonth ? target.raceMonth : 11;
    if (age === 2 || (age === 3 && monthCheck <= 5)) {
        agePattern = 1;
    } else if (age === 3 && monthCheck >= 6) {
        agePattern = 2;
    } else if (age >= 4) {
        agePattern = 3;
    }

    let classMod = window.ATV_CONFIG.CLASS_FACTOR[agePattern][pClassRank] !== undefined ? window.ATV_CONFIG.CLASS_FACTOR[agePattern][pClassRank] : 0.00;

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

    let locMod = pastCourseData.locFactor - targetCourseData.locFactor;

    let weightDiff = baseWeight - pWeight;
    let wghtMod = weightDiff * window.ATV_CONFIG.WEIGHT_FACTOR;

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

window.processPastRaces = function(races, baseWeight, age, target, ratio) {
    let pastRaces = [];
    let validATVs = [];
    let localMax = 0;

    for (let j = 1; j < races.length; j++) {
        if (j > localMax) localMax = j;
        let rText = races[j].split(/\r?\n(?:全場(?:芝|ダ)|(?:中山|東京|京都|阪神|中京|小倉|新潟|福島|札幌|函館)(?:芝|ダ)\d+m)/)[0];

        let rDateMatch = rText.match(/(?:^|\n|\s)(\d{2}\/\d{2})/);
        let rDate = rDateMatch ? rDateMatch[1] : "不明";

        let isOuter = /外/.test(rText);
        let rTrackMatch = rText.match(/(芝|ダ)(\d+)/);
        if (!rTrackMatch) continue;
        let pTrack = rTrackMatch[1];
        let pDist = parseInt(rTrackMatch[2], 10);
        if (pTrack !== target.trackType) {
            pastRaces.push({ idx: j, date: rDate, valid: false, reason: "馬場不一致" });
            continue;
        }

        let condMatch = rText.match(/(良|稍|重|不)/);
        let pCond = condMatch ? condMatch[1] : "良";
        
        let pLocMatch = rText.match(/\d{2}\/\d{2}[\s\S]{1,20}?(東京|中山|京都|阪神|中京|小倉|新潟|福島|札幌|函館|盛岡|水沢|大井|船橋|川崎|浦和|門別|園田|名古屋|笠松|金沢|高知|佐賀|姫路)/);
        let pLoc = pLocMatch ? pLocMatch[1] : "不明";
        let pwMatch = rText.match(/[\s\r\n](4[8-9]\.\d|5\d\.\d|6[0-5]\.\d)[\s\r\n]+\d{3}kg/);
        let pWeight = pwMatch ? parseFloat(pwMatch[1]) : baseWeight;

        let f3Match = rText.match(/前[\s\S]*?([0-9\.]+|-+)([\s\S]*?)後[\s\S]*?([0-9\.]+|-+)/);
        if (!f3Match) {
            pastRaces.push({ idx: j, date: rDate, valid: false, reason: "タイム欠損" });
            continue;
        }

        let f3FrontStr = f3Match[1];
        let posStr = f3Match[2];
        let f3BackStr = f3Match[3];
        
        let f3Back = parseFloat(f3BackStr);
        if (isNaN(f3Back)) {
            pastRaces.push({ idx: j, date: rDate, valid: false, reason: "後3F欠損" });
            continue;
        }

        let pClassRank = "F";
        if (/G1|Ｇ１|Jpn1|Ｊｐｎ１/i.test(rText)) pClassRank = "S";
        else if (/G2|Ｇ２|Jpn2|Ｊｐｎ２|G3|Ｇ３|Jpn3|Ｊｐｎ３/i.test(rText)) pClassRank = "A";
        else if (/OP|ＯＰ|L|Ｌ|リステッド/i.test(rText)) pClassRank = "B";
        else if (/3勝|３勝|1600万|１６００万/.test(rText)) pClassRank = "C";
        else if (/2勝|２勝|1000万|１０００万/.test(rText)) pClassRank = "D";
        else if (/1勝|１勝|500万|５０0万/.test(rText)) pClassRank = "E";
        else if (/新馬|未勝利/.test(rText)) pClassRank = "F";
        let headMatch = rText.match(/(\d+)頭/);
        let horseCount = headMatch ? parseInt(headMatch[1]) : 0;
        let posRatio = null;
        let hadLead = false;
        let corner4Pos = null;

        if (horseCount > 0 && posStr) {
            let posNums = posStr.match(/\d+/g);
            if (posNums && posNums.length > 0) {
                let targetPos = null;
                if (posNums.length === 4) {
                    targetPos = (parseInt(posNums[1]) + parseInt(posNums[2])) / 2;
                } else if (posNums.length === 3) {
                    targetPos = (parseInt(posNums[0]) + parseInt(posNums[1])) / 2;
                } else {
                    targetPos = parseInt(posNums[0]);
                }
                posRatio = targetPos / horseCount;
                corner4Pos = parseInt(posNums[posNums.length - 1], 10);
                for (let pIdx = 0; pIdx < posNums.length; pIdx++) {
                    if (parseInt(posNums[pIdx]) === 1) hadLead = true;
                }
            }
        }

        let finalRank = null;
        let rankMatch = rText.match(/(\d+)(?:着|[\s\t]+\d+頭)/);
        if (rankMatch) {
            finalRank = parseInt(rankMatch[1], 10);
        }

        let passedCount = null;
        if (corner4Pos !== null && finalRank !== null) {
            passedCount = corner4Pos - finalRank;
        }

        let baseTime = 0;
        let f3Front = parseFloat(f3FrontStr);
        if (isNaN(f3Front)) {
            let jraLocs = ["東京", "中山", "阪神", "京都", "中京", "新潟", "福島", "小倉", "札幌", "函館"];
            let isJra = jraLocs.includes(pLoc);
            let factor = window.ATV_CONFIG.LAP_FALLBACK_MATRIX.NAR.DEFAULT;
            if (isJra) {
                let distCat = pDist < 1400 ? "SHORT" : (pDist < 2000 ? "MIDDLE" : "LONG");
                let trackCat = pTrack === "芝" ? "TURF" : "DIRT";
                factor = window.ATV_CONFIG.LAP_FALLBACK_MATRIX.JRA[trackCat][distCat];
            } else {
                if (pClassRank === "S" || pClassRank === "A") {
                    factor = window.ATV_CONFIG.LAP_FALLBACK_MATRIX.NAR.GRADE;
                }
            }
            baseTime = f3Back * factor;
        } else {
            baseTime = (f3Front * ratio.f) + (f3Back * ratio.b);
        }

        let rawRaceData = {
            idx: j, date: rDate, pLoc, pTrack, pDist, pCond, pWeight,
            f3FrontStr, f3BackStr, posRatio, hadLead, isOuter, passedCount, baseTime, pClassRank
        };
        let currentRaceData = window.calculateRaceModifications(rawRaceData, baseWeight, age, target);

        pastRaces.push(currentRaceData);
        validATVs.push(currentRaceData);
    }

    return { pastRaces, validATVs, localMax };
};

window.checkTurfSpecialist = function(validATVs, target) {
    let onlyYoshiba = false;
    let onlyNoshiba = false;

    if (target.trackType === "芝") {
        let hasYoshiba = false;
        validATVs.forEach(r => {
            let isYoshiba = ["札幌", "函館"].includes(r.pLoc);
            if (isYoshiba) {
                hasYoshiba = true;
            }
        });
        if (!hasYoshiba) {
            onlyNoshiba = true;
        }
    }
    return { onlyYoshiba, onlyNoshiba };
};

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
        let paceMode = "MIDDLE";
        
        if (window.useDynamicPace && target && target.predictedPace) {
            paceMode = target.predictedPace;
        }
        
        if (paceMode === "SLOW") {
            penaltyMultiplier = 1.00 + Math.pow(avgPosRatio, 2) * cFactor;
        } else if (paceMode === "HIGH") {
            penaltyMultiplier = 1.00 + Math.pow(1 - avgPosRatio, 2) * cFactor;
        } else {
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
    }
    return intervalHtml;
};

window.calculateATV = function(horseBlocks, validHorseNames, target, ratio) {
    let results = [];
    let maxRacesIdx = 0;
    let auditErrors = [];
    let auditWarnings = [];

    try {
        let targetCourseData = { ratioId: "02", locFactor: 0.00, cFactor: 0.020, staminaPenalty: 1.00 };
        if (target.location && target.location !== "不明") {
            try {
                targetCourseData = window.getCourseData(target.location, target.trackType, target.distance, "F");
            } catch (e) {
            }
        }
        const cFactor = targetCourseData.cFactor;

        const applyRanking = (sortKey, rankKey) => {
            let sorted = [...results].sort((a, b) => {
                let valA = a[sortKey]; let valB = b[sortKey];
                if (valA === null && valB === null) return 0;
                if (valA === null) return 1; 
                if (valB === null) return -1;
                if (valA !== valB) return valA - valB;
                for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
                    let atvA = a.validATVs.length > i ? a.validATVs[i].atv : Infinity;
                    let atvB = b.validATVs.length > i ? b.validATVs[i].atv : Infinity;
                    if(atvA !== atvB) return atvA - atvB;
                }
                let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
                if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
                if (aNo !== bNo) return aNo - bNo;
                return a.horseId.localeCompare(b.horseId);
            });
            sorted.forEach((item, index) => {
                item[rankKey] = item[sortKey] !== null ? (index + 1) : "-";
            });
            return sorted;
        };

        for (let i = 0; i < horseBlocks.length; i++) {
            let block = horseBlocks[i];
            if (block.includes("調教タイム") || block.includes("ラップ表示")) continue;
            
            let headerArea = /\d{2}\/\d{2}/.test(block) ? block.split(/\d{2}\/\d{2}/)[0] : block;
            let info = window.extractHeaderInfo(headerArea, validHorseNames);
            if (info.horseName === "不明") continue;
            let horseId = "h_" + String(i).padStart(2, '0');

            let races = block.split(/\r?\n(?=\s*\d{2}\/\d{2}[\s\r\n])/);
            let raceData = window.processPastRaces(races, info.baseWeight, info.age, target, ratio);
            if (raceData.localMax > maxRacesIdx) maxRacesIdx = raceData.localMax;
            
            let turfData = window.checkTurfSpecialist(raceData.validATVs, target);
            let paceData = window.calcPaceAndStyle(raceData.validATVs);
            let aggData = window.calcAggregateATVs(raceData.validATVs, paceData.avgPosRatio, cFactor, target);
            let intervalHtml = window.calcInterval(headerArea, raceData.pastRaces, target);
            results.push({
                horseId: horseId,
                horseNo: info.horseNo, 
                horseName: info.horseName, 
                age: info.age, 
                currentWeight: info.baseWeight, 
                sex: info.sex, 
                jockeyMark: info.jockeyMark, 
                pastRaces: raceData.pastRaces, 
                weightedATV: aggData.weightedATV, 
                centralATV: aggData.centralATV, 
                adjCentral: aggData.adjCentral, 
                adjWeighted: aggData.adjWeighted, 
                validCount: raceData.validATVs.length, 
                validATVs: raceData.validATVs, 
                centralAdopted: aggData.centralAdopted, 
                centralOutliers: aggData.centralOutliers, 
                onlyYoshiba: false,
                onlyNoshiba: turfData.onlyNoshiba, 
                styleClass: paceData.styleClass, 
                styleName: paceData.styleName, 
                avgPosRatio: paceData.avgPosRatio, 
                avgPassedCount: paceData.avgPassedCount,
                intervalHtml: intervalHtml
            });
        }

        applyRanking('weightedATV', 'weightedRank');
        let centralSorted = applyRanking('centralATV', 'centralRank');
        applyRanking('adjCentral', 'adjCentralRank');
        applyRanking('adjWeighted', 'adjWeightedRank');

        let extractedNames = results.map(r => r.horseName);
        let missingHorses = validHorseNames.filter(name => !extractedNames.includes(name));
        if (missingHorses.length > 0) auditErrors.push(`【抽出漏れ】出馬表に存在する以下の馬が抽出できませんでした: ${missingHorses.join(', ')}`);

        results.forEach(h => {
            h.validATVs.forEach(r => {
                if (isNaN(r.atv) || r.atv <= 0 || r.atv > 100) {
                    auditErrors.push(`【異常値】${h.horseName}の${r.idx}走前: ATV異常 (${r.atv})`);
                }
            });
        });
        for(let i=0; i < centralSorted.length - 1; i++) {
            let valA = (centralSorted[i].centralATV !== null) ? centralSorted[i].centralATV : Infinity;
            let valB = (centralSorted[i+1].centralATV !== null) ? centralSorted[i+1].centralATV : Infinity;
            if (valA > valB) {
                auditErrors.push(`【ソート異常】${centralSorted[i].horseName}(${valA}) が ${centralSorted[i+1].horseName}(${valB}) より上位です。`);
                break;
            }
        }
    } catch (e) {
        auditErrors.push(e.message);
    }

    return { 
        results, 
        maxDisplayRaces: Math.max(5, maxRacesIdx), 
        auditErrors, 
        auditWarnings 
    };
};

window.analyzeRacePace = function(horseBlocks, validHorseNames, target) {
    let totalHorses = 0;
    let nigeCount = 0;
    let senkoCount = 0;

    const dummyTarget = { 
        trackType: (target && target.trackType) ? target.trackType : "芝", 
        distance: 1600, 
        raceMonth: 11 
    };
    const dummyRatio = { f: 0.5, b: 0.5 };

    for (let i = 0; i < horseBlocks.length; i++) {
        let block = horseBlocks[i];
        if (block.includes("調教タイム") || block.includes("ラップ表示")) continue;

        let headerArea = /\d{2}\/\d{2}/.test(block) ? block.split(/\d{2}\/\d{2}/)[0] : block;
        let info = window.extractHeaderInfo(headerArea, validHorseNames);
        if (info.horseName === "不明") continue;

        totalHorses++;

        let races = block.split(/\r?\n(?=\s*\d{2}\/\d{2}[\s\r\n])/);
        try {
            let raceData = window.processPastRaces(races, info.baseWeight, info.age, dummyTarget, dummyRatio);
            let paceData = window.calcPaceAndStyle(raceData.validATVs);

            if (paceData.styleClass === 1) {
                nigeCount++;
            } else if (paceData.styleClass === 2) {
                senkoCount++;
            }
        } catch (e) {
            totalHorses--;
            continue;
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