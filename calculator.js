window.calculateATV = function(horseBlocks, validHorseNames, target, ratio) {
    let results = [];
    let allBestATVs = [];
    let maxRacesIdx = 0;
    let auditErrors = [];
    let auditWarnings = [];

    const K_CONST = (target.className === "オープンクラス") ? 0.00005 : 0.00003;

    for (let i = 0; i < horseBlocks.length; i++) {
        let block = horseBlocks[i];
        if (!/\d{2}\/\d{2}/.test(block)) continue;

        let headerArea = block.split(/\d{2}\/\d{2}/)[0];
        
        let horseName = "不明";
        for (let n = 0; n < validHorseNames.length; n++) {
            if (headerArea.indexOf(validHorseNames[n]) !== -1) {
                horseName = validHorseNames[n];
                break;
            }
        }

        let horseNo = (results.length + 1).toString();
        let matchNo = headerArea.match(/(?:^|\n)\s*(?:[枠]?\d{1,2}\s+)?(\d{1,2})\s*(?:\r?\n|\s+)?(?:--|◎|◯|〇|▲|△|☆|✓|消|取消|除外)/);
        if (matchNo) horseNo = matchNo[1];

        let currentWeight = 55.0;
        let cwMatch = headerArea.match(/(?:牝|牡|セ)\d[\s\S]{1,50}?(4[8-9]\.[05]|5\d\.[05]|6[0-5]\.[05])(?=$|\s|\n)/);
        if (cwMatch) {
            currentWeight = parseFloat(cwMatch[1]);
        } else {
            let cwMatchFallback = headerArea.match(/(?:^|\s|\n)(4[8-9]\.[05]|5\d\.[05]|6[0-5]\.[05])(?=$|\s|\n)/);
            if (cwMatchFallback) currentWeight = parseFloat(cwMatchFallback[1]);
        }
        let baseWeight = currentWeight;

        let races = block.split(/\r?\n(?=\d{2}\/\d{2}\s)/);
        let pastRaces = [];
        let validATVs = [];

        for (let j = 1; j < races.length; j++) {
            if (j > maxRacesIdx) maxRacesIdx = j;
            let rText = races[j].split(/\r?\n(?:全場(?:芝|ダ)|(?:中山|東京|京都|阪神|中京|小倉|新潟|福島|札幌|函館)(?:芝|ダ)\d+m)/)[0];

            let rDateMatch = rText.match(/^(\d{2}\/\d{2})/);
            let rDate = rDateMatch ? rDateMatch[1] : "不明";

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
            let pLocMatch = rText.match(/\d{2}\/\d{2}\s+(東京|中山|京都|阪神|中京|小倉|新潟|福島|札幌|函館|盛岡|水沢|大井|船橋|川崎|浦和|門別|園田|名古屋|笠松|金沢|高知|佐賀|姫路)/);
            let pLoc = pLocMatch ? pLocMatch[1] : "不明";

            let pwMatch = rText.match(/\s(4[8-9]\.\d|5\d\.\d|6[0-5]\.\d)\s+\d{3}kg/);
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

            let alpha = 0;
            let f3Front = parseFloat(f3FrontStr);
            if (isNaN(f3Front)) alpha = f3Back * 0.99;
            else alpha = (f3Front * ratio.f) + (f3Back * ratio.b);

            let distDiff = target.distance - pDist;
            let Q = (distDiff > 0) ? 1.5 : ((distDiff < 0) ? 0.8 : 1.0);
            let beta = 1.00 + (distDiff * K_CONST * Q);

            let E = 0.00;
            let G = 0.00;
            if (pTrack === "芝") {
                if (pCond === "稍") E = -0.02;
                else if (pCond === "重") E = -0.04;
                else if (pCond === "不") E = -0.08;
                if (["東京","新潟","京都"].includes(pLoc)) G = 0.00;
                else if (["阪神","中京"].includes(pLoc)) G = -0.01;
                else if (["中山","福島","小倉"].includes(pLoc)) G = -0.02;
                else if (["札幌","函館"].includes(pLoc)) G = -0.03;
            } else {
                if (pCond === "稍") E = 0.01;
                else if (pCond === "重" || pCond === "不") E = 0.02;
                if (["東京","新潟","小倉"].includes(pLoc)) G = -0.01;
                else if (["阪神","中京","福島"].includes(pLoc)) G = -0.02;
                else if (["中山","札幌","函館","盛岡"].includes(pLoc)) G = -0.03;
                else if (["水沢"].includes(pLoc)) G = -0.04;
                else if (["大井"].includes(pLoc)) G = -0.05;
                else if (["船橋","川崎","門別","園田"].includes(pLoc)) G = -0.06;
                else if (["浦和","名古屋","笠松","金沢"].includes(pLoc)) G = -0.07;
                else if (["高知","佐賀","姫路"].includes(pLoc)) G = -0.08;
            }

            let weightDiff = baseWeight - pWeight;
            let F = weightDiff * 0.004;

            let gamma = 1.00 + E + F + G;
            let atv = alpha * beta * gamma;
            let atvRounded = Math.round(atv * 100) / 100;

            let currentRaceData = {
                idx: j, date: rDate, valid: true,
                alpha: alpha, beta: beta, gamma: gamma, atv: atvRounded,
                f3f: f3FrontStr, f3b: f3BackStr, distDiff: distDiff,
                eText: pTrack+pCond, e: E, 
                weightDiffText: (weightDiff >= 0 ? "+" : "") + weightDiff.toFixed(1) + "kg", f: F, 
                gText: pLoc || "不明", g: G,
                pLoc: pLoc || "不明", pTrack: pTrack, pDist: pDist, pCond: pCond, pWeight: pWeight,
                isLimited: false, posRatio: posRatio, hadLead: hadLead
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

        if (vLen >= 3) { weightedATV = validATVs[0].atv * 0.5 + validATVs[1].atv * 0.3 + validATVs[2].atv * 0.2; }
        else if (vLen === 2) { weightedATV = validATVs[0].atv * 0.6 + validATVs[1].atv * 0.4; }
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

        let top3 = [];
        for (let k = 0; k < Math.min(3, vLen); k++) { top3.push(validATVs[k]); }

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

        results.push({ horseNo, horseName, currentWeight: baseWeight, pastRaces, weightedATV, centralATV, validCount: vLen, validATVs, top3, centralAdopted, centralOutliers, onlyYoshiba, onlyNoshiba, styleClass, styleName, avgPosRatio, intervalHtml });
        validATVs.forEach(race => {
            allBestATVs.push({ horseNo, horseName, currentWeight: baseWeight, race, weightedATV, centralATV, intervalHtml });
        });
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
        allBestATVs, 
        maxDisplayRaces: Math.max(5, maxRacesIdx), 
        auditErrors, 
        auditWarnings 
    };
};