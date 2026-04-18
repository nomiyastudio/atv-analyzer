// ==========================================
// calculator.js
// ==========================================
window.calculateATV = function(horseBlocks, validHorseNames, target, ratio) {
    let results = [];
    let maxRacesIdx = 0;
    let auditErrors = [];
    let auditWarnings = [];

    // --- 距離適性の感度定数 (1600mから1000m離れるごとに5%の減衰) ---
    const DIST_SENSITIVITY = 0.05;

    // --- C値（展開係数）の算出 ---
    const getCourseFactor = (trackType, location, trackDetail) => {
        let c = 0.020;
        if (trackType === "芝") {
            if (["東京", "新潟"].includes(location) || (["京都", "阪神"].includes(location) && trackDetail === "外")) {
                c = 0.015;
            } else if (["中山", "札幌", "函館", "福島", "小倉"].includes(location)) {
                c = 0.025;
            } else {
                c = 0.020;
            }
        } else {
            if (["東京", "中京"].includes(location)) {
                c = 0.020;
            } else if (["京都", "阪神", "新潟"].includes(location)) {
                c = 0.025;
            } else {
                c = 0.030;
            }
        }
        return c;
    };
    const cFactor = getCourseFactor(target.trackType, target.location, target.trackDetail);

    for (let i = 0; i < horseBlocks.length; i++) {
        let block = horseBlocks[i];
        
        if (block.includes("調教タイム") || block.includes("ラップ表示")) continue;
        
        let headerArea = /\d{2}\/\d{2}/.test(block) ? block.split(/\d{2}\/\d{2}/)[0] : block;
        
        let horseName = "不明";
        for (let n = 0; n < validHorseNames.length; n++) {
            if (headerArea.indexOf(validHorseNames[n]) !== -1) {
                horseName = validHorseNames[n];
                break;
            }
        }
        
        if (horseName === "不明") continue;

        let horseNo = (results.length + 1).toString();
        let matchNo = headerArea.match(/(?:^|\n)\s*(?:[枠]?\d{1,2}\s+)?(\d{1,2})\s*(?:\r?\n|\s+)?(?:--|◎|◯|〇|▲|△|☆|✓|✔|消|取消|除外)/);
        if (matchNo) horseNo = matchNo[1];

        let age = 4;
        let ageMatch = headerArea.match(/(?:牝|牡|セ)(\d+)/);
        if (ageMatch) {
            age = parseInt(ageMatch[1], 10);
        }

        let sex = "牡";
        let sexMatch = headerArea.match(/(牝|牡|セ)/);
        if (sexMatch) {
            sex = sexMatch[1];
        }

        let jockeyMark = "";
        let markMatch = headerArea.match(/[☆△▲★◇]/);
        if (markMatch) {
            jockeyMark = markMatch[0];
        }

        let currentWeight = 55.0;
        let cwMatch = headerArea.match(/(?:牝|牡|セ)\d[\s\S]{1,50}?(4[8-9]\.[05]|5\d\.[05]|6[0-5]\.[05])(?=$|\s|\n)/);
        if (cwMatch) {
            currentWeight = parseFloat(cwMatch[1]);
        } else {
            let cwMatchFallback = headerArea.match(/(?:^|\s|\n)(4[8-9]\.[05]|5\d\.[05]|6[0-5]\.[05])(?=$|\s|\n)/);
            if (cwMatchFallback) currentWeight = parseFloat(cwMatchFallback[1]);
        }
        let baseWeight = currentWeight;

        // 修正箇所1: スマホ版の改行フォーマットに対応する分割ロジックの拡張
        let races = block.split(/\r?\n(?=\s*\d{2}\/\d{2}[\s\r\n])/);
        let pastRaces = [];
        let validATVs = [];

        for (let j = 1; j < races.length; j++) {
            if (j > maxRacesIdx) maxRacesIdx = j;
            let rText = races[j].split(/\r?\n(?:全場(?:芝|ダ)|(?:中山|東京|京都|阪神|中京|小倉|新潟|福島|札幌|函館)(?:芝|ダ)\d+m)/)[0];

            // 修正箇所2: 行頭縛りを解除し、スマホ版の空白・改行インデントに対応
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
            
            // 修正箇所3: 日付と場所の間に多段改行が挟まるスマホ版レイアウトに対応
            let pLocMatch = rText.match(/\d{2}\/\d{2}[\s\S]{1,20}?(東京|中山|京都|阪神|中京|小倉|新潟|福島|札幌|函館|盛岡|水沢|大井|船橋|川崎|浦和|門別|園田|名古屋|笠松|金沢|高知|佐賀|姫路)/);
            let pLoc = pLocMatch ? pLocMatch[1] : "不明";

            // 修正箇所4: 斤量と馬体重の間に多段改行が挟まるスマホ版レイアウトに対応
            let pwMatch = rText.match(/[\s\r\n](4[8-9]\.\d|5\d\.\d|6[0-5]\.\d)[\s\r\n]+\d{3}kg/);
            let pWeight = pwMatch ? parseFloat(pwMatch[1]) : currentWeight;

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
            else if (/1勝|１勝|500万|５００万/.test(rText)) pClassRank = "E";
            else if (/新馬|未勝利/.test(rText)) pClassRank = "F";

            let headMatch = rText.match(/(\d+)頭/);
            let horseCount = headMatch ? parseInt(headMatch[1]) : 0;
            let posRatio = null;
            let hadLead = false;

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
                    
                    for (let pIdx = 0; pIdx < posNums.length; pIdx++) {
                        if (parseInt(posNums[pIdx]) === 1) hadLead = true;
                    }
                }
            }

            // --- baseTime (旧alpha) の算出 ---
            let baseTime = 0;
            let f3Front = parseFloat(f3FrontStr);
            if (isNaN(f3Front)) baseTime = f3Back * 0.99;
            else baseTime = (f3Front * ratio.f) + (f3Back * ratio.b);

            // --- distMod (旧beta) の算出: 1600mを頂点とした絶対適性V字モデル ---
            const calcDistLoss = (d) => (Math.abs(d - 1600) / 1000) * DIST_SENSITIVITY;
            let pDistLoss = calcDistLoss(pDist);
            let tDistLoss = calcDistLoss(target.distance);
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

            // --- classMod (旧H): クラス補正 ---
            let classMod = 0.00;
            if (agePattern === 1) {
                if (["S", "A", "B"].includes(pClassRank)) classMod = 0.00;
                else if (["C", "D", "E"].includes(pClassRank)) classMod = 0.01;
                else if (pClassRank === "F") classMod = 0.02;
            } else if (agePattern === 2) {
                if (pClassRank === "S") classMod = -0.01;
                else if (pClassRank === "A") classMod = 0.00;
                else if (pClassRank === "B") classMod = 0.01;
                else if (pClassRank === "C") classMod = 0.02;
                else if (pClassRank === "D") classMod = 0.03;
                else if (pClassRank === "E") classMod = 0.05;
                else if (pClassRank === "F") classMod = 0.08;
            } else {
                if (pClassRank === "S") classMod = -0.01;
                else if (pClassRank === "A") classMod = 0.00;
                else if (pClassRank === "B") classMod = 0.01;
                else if (pClassRank === "C") classMod = 0.03;
                else if (pClassRank === "D") classMod = 0.06;
                else if (["E", "F"].includes(pClassRank)) classMod = 0.10;
            }

            // --- surfMod (旧E): 馬場補正 ---
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

            // --- locMod (旧G): 場所補正 ---
            let locMod = 0.00;
            if (pTrack === "芝") {
                if (["東京","新潟","京都"].includes(pLoc)) locMod = 0.00;
                else if (["阪神","中京"].includes(pLoc)) locMod = -0.01;
                else if (["中山","福島","小倉"].includes(pLoc)) locMod = -0.02;
                else if (["札幌","函館"].includes(pLoc)) locMod = -0.03;
            } else {
                if (["東京","新潟","小倉"].includes(pLoc)) locMod = -0.01;
                else if (["阪神","中京","福島"].includes(pLoc)) locMod = -0.02;
                else if (["中山","札幌","函館","盛岡"].includes(pLoc)) locMod = -0.03;
                else if (["水沢"].includes(pLoc)) locMod = -0.04;
                else if (["大井"].includes(pLoc)) locMod = -0.05;
                else if (["船橋","川崎","門別","園田"].includes(pLoc)) locMod = -0.06;
                else if (["浦和","名古屋","笠松","金沢"].includes(pLoc)) locMod = -0.07;
                else if (["高知","佐賀","姫路"].includes(pLoc)) locMod = -0.08;
            }

            // --- wghtMod (旧F): 斤量補正 ---
            let weightDiff = baseWeight - pWeight;
            let wghtMod = weightDiff * 0.004;

            // --- condMod (旧gamma) の集計とATVの決定 ---
            let condMod = 1.00 + surfMod + wghtMod + locMod + classMod; 
            let atv = baseTime * distMod * condMod;
            let atvRounded = Math.round(atv * 100) / 100;

            let currentRaceData = {
                idx: j, date: rDate, valid: true,
                baseTime: baseTime, distMod: distMod, condMod: condMod, atv: atvRounded,
                f3f: f3FrontStr, f3b: f3BackStr, distDiff: target.distance - pDist,
                surfModText: pTrack+pCond, surfMod: surfMod, 
                wghtModText: (weightDiff >= 0 ? "+" : "") + weightDiff.toFixed(1) + "kg", wghtMod: wghtMod, 
                locModText: pLoc || "不明", locMod: locMod,
                classMod: classMod, agePattern: agePattern, pClassRank: pClassRank, 
                pLoc: pLoc || "不明", pTrack: pTrack, pDist: pDist, pCond: pCond, pWeight: pWeight,
                isLimited: false, posRatio: posRatio, hadLead: hadLead,
                isOuter: isOuter
            };

            pastRaces.push(currentRaceData);
            validATVs.push(currentRaceData);
        }

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

        let sumRatio = 0;
        let countRatio = 0;
        let hasLeadExperience = false;

        validATVs.forEach(r => {
            if (r.posRatio !== null) {
                sumRatio += r.posRatio;
                countRatio++;
                if (r.hadLead) hasLeadExperience = true;
            }
        });

        let avgPosRatio = countRatio > 0 ? (sumRatio / countRatio) : null;
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
            let penaltyMultiplier = 1.00 + Math.pow(avgPosRatio, 2) * cFactor;
            
            if (centralATV !== null) {
                adjCentral = centralATV * penaltyMultiplier;
                adjCentral = Math.round(adjCentral * 100) / 100;
            }
            if (weightedATV !== null) {
                adjWeighted = weightedATV * penaltyMultiplier;
                adjWeighted = Math.round(adjWeighted * 100) / 100;
            }
        }

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

        results.push({ horseNo, horseName, age, currentWeight: baseWeight, sex, jockeyMark, pastRaces, weightedATV, centralATV, adjCentral, adjWeighted, validCount: vLen, validATVs, centralAdopted, centralOutliers, onlyYoshiba, onlyNoshiba, styleClass, styleName, avgPosRatio, intervalHtml });
    }

    let rankSorted = [...results].sort((a, b) => {
        let valA = a.weightedATV; let valB = b.weightedATV;
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1; if (valB === null) return -1;
        if (valA !== valB) return valA - valB;
        for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
            let atvA = a.validATVs.length > i ? a.validATVs[i].atv : Infinity;
            let atvB = b.validATVs.length > i ? b.validATVs[i].atv : Infinity;
            if(atvA !== atvB) return atvA - atvB;
        }
        return parseInt(a.horseNo) - parseInt(b.horseNo);
    });
    rankSorted.forEach((item, index) => {
        results.find(r => r.horseNo === item.horseNo).weightedRank = item.weightedATV !== null ? (index + 1) : "-";
    });

    let centralSorted = [...results].sort((a, b) => {
        let valA = a.centralATV; let valB = b.centralATV;
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1; if (valB === null) return -1;
        if (valA !== valB) return valA - valB;
        for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
            let atvA = a.validATVs.length > i ? a.validATVs[i].atv : Infinity;
            let atvB = b.validATVs.length > i ? b.validATVs[i].atv : Infinity;
            if(atvA !== atvB) return atvA - atvB;
        }
        return parseInt(a.horseNo) - parseInt(b.horseNo);
    });
    centralSorted.forEach((item, index) => {
        results.find(r => r.horseNo === item.horseNo).centralRank = item.centralATV !== null ? (index + 1) : "-";
    });

    let adjCentralSorted = [...results].sort((a, b) => {
        let valA = a.adjCentral; let valB = b.adjCentral;
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1; if (valB === null) return -1;
        if (valA !== valB) return valA - valB;
        for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
            let atvA = a.validATVs.length > i ? a.validATVs[i].atv : Infinity;
            let atvB = b.validATVs.length > i ? b.validATVs[i].atv : Infinity;
            if(atvA !== atvB) return atvA - atvB;
        }
        return parseInt(a.horseNo) - parseInt(b.horseNo);
    });
    adjCentralSorted.forEach((item, index) => {
        results.find(r => r.horseNo === item.horseNo).adjCentralRank = item.adjCentral !== null ? (index + 1) : "-";
    });

    let adjWeightedSorted = [...results].sort((a, b) => {
        let valA = a.adjWeighted; let valB = b.adjWeighted;
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1; if (valB === null) return -1;
        if (valA !== valB) return valA - valB;
        for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
            let atvA = a.validATVs.length > i ? a.validATVs[i].atv : Infinity;
            let atvB = b.validATVs.length > i ? b.validATVs[i].atv : Infinity;
            if(atvA !== atvB) return atvA - atvB;
        }
        return parseInt(a.horseNo) - parseInt(b.horseNo);
    });
    adjWeightedSorted.forEach((item, index) => {
        results.find(r => r.horseNo === item.horseNo).adjWeightedRank = item.adjWeighted !== null ? (index + 1) : "-";
    });

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
        let valA = centralSorted[i].centralATV !== null ? centralSorted[i].centralATV : Infinity;
        let valB = centralSorted[i+1].centralATV !== null ? centralSorted[i+1].centralATV : Infinity;
        if (valA > valB) {
            auditErrors.push(`【ソート異常】${centralSorted[i].horseName}(${valA}) が ${centralSorted[i+1].horseName}(${valB}) より上位です。`);
            break;
        }
    }

    return { 
        results, 
        maxDisplayRaces: Math.max(5, maxRacesIdx), 
        auditErrors, 
        auditWarnings 
    };
};