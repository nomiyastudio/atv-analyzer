// ==========================================
// calculator.js
// ==========================================
window.calculateATV = function(horseBlocks, validHorseNames, target, ratio) {
    let results = [];
    let maxRacesIdx = 0;
    let auditErrors = [];
    let auditWarnings = [];

    // --- 距離適性の感度定数 (1600mから1000m離れるごとに5%の減衰) ---
    const DIST_SENSITIVITY = window.ATV_CONFIG.DIST_SENSITIVITY;

    // --- C値（展開係数）の算出 ---
    const getCourseFactor = (trackType, location, trackDetail) => {
        let c = window.ATV_CONFIG.C_FACTOR.TURF.DEFAULT;
        if (trackType === "芝") {
            if (["東京", "新潟"].includes(location) || (["京都", "阪神"].includes(location) && trackDetail === "外")) {
                c = window.ATV_CONFIG.C_FACTOR.TURF.FAST;
            } else if (["中山", "札幌", "函館", "福島", "小倉"].includes(location)) {
                c = window.ATV_CONFIG.C_FACTOR.TURF.HEAVY;
            } else {
                c = window.ATV_CONFIG.C_FACTOR.TURF.DEFAULT;
            }
        } else {
            if (["東京", "中京"].includes(location)) {
                c = window.ATV_CONFIG.C_FACTOR.DIRT.FAST;
            } else if (["京都", "阪神", "新潟"].includes(location)) {
                c = window.ATV_CONFIG.C_FACTOR.DIRT.HEAVY;
            } else {
                c = window.ATV_CONFIG.C_FACTOR.DIRT.DEFAULT;
            }
        }
        return c;
    };
    const cFactor = getCourseFactor(target.trackType, target.location, target.trackDetail);

    // ==========================================
    // 内部関数1: ヘッダー情報（馬番、馬名、年齢、斤量等）の抽出
    // ==========================================
    const extractHeaderInfo = (headerArea) => {
        let horseName = "不明";
        for (let n = 0; n < validHorseNames.length; n++) {
            if (headerArea.indexOf(validHorseNames[n]) !== -1) {
                horseName = validHorseNames[n];
                break;
            }
        }

        // 馬番が取得できない場合は一律で "-"（ハイフン）を代入
        let horseNo = "-";
        let matchNo = headerArea.match(/(?:^|\n)\s*(?:[枠]?\d{1,2}\s+)?(\d{1,2})\s*(?:\r?\n|\s+)?(?:--|◎|◯|〇|▲|△|☆|✓|✔|消|取消|除外)/);
        if (matchNo) horseNo = matchNo[1];

        let age = 4;
        let sex = "牡";
        let sexAgeMatch = headerArea.match(/(牝|牡|セ)(\d+)/);
        let afterAgeArea = headerArea; // 基準点より下のテキスト領域
        
        if (sexAgeMatch) {
            sex = sexAgeMatch[1];
            age = parseInt(sexAgeMatch[2], 10);
            afterAgeArea = headerArea.substring(sexAgeMatch.index);
        }

        let jockeyMark = "";
        
        // --- 新規追加: D1（出馬表）からの減量マークのクロス・リファレンス抽出 ---
        let d1Element = document.getElementById('data1');
        if (d1Element && d1Element.value && horseName !== "不明") {
            let d1Text = d1Element.value;
            // 馬名 → 性別・年齢 → 斤量(数字) → 減量マーク の順を追跡し、斤量直後の記号のみを捕捉
            let d1Regex = new RegExp(horseName + "[^\\r\\n]*\\s+(?:牝|牡|セ)\\d+\\s+(?:4[8-9]\\.[05]|5\\d\\.[05]|6[0-5]\\.[05])\\s*([☆△▲★◇])");
            let d1Match = d1Text.match(d1Regex);
            if (d1Match) {
                jockeyMark = d1Match[1];
            }
        }

        // D1で見つからなかった場合のみ、従来通りD2の限定領域（afterAgeArea）からフォールバック探索
        if (!jockeyMark) {
            let markMatch = afterAgeArea.match(/[☆△▲★◇](?=[一-龥ぁ-んァ-ヴー])/);
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

    // ==========================================
    // 内部関数2: 各過去走データの解析と補正値計算
    // ==========================================
    const processPastRaces = (races, baseWeight, age) => {
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

            let baseTime = 0;
            let f3Front = parseFloat(f3FrontStr);
            if (isNaN(f3Front)) baseTime = f3Back * 0.99;
            else baseTime = (f3Front * ratio.f) + (f3Back * ratio.b);
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

            let weightDiff = baseWeight - pWeight;
            let wghtMod = weightDiff * 0.004;

            let condMod = 1.00 + surfMod + wghtMod + locMod + classMod;
            let atv = baseTime * distMod * condMod;
            let atvRounded = Math.round(atv * 100) / 100;
            let currentRaceData = {
                idx: j, date: rDate, valid: true,
                baseTime: baseTime, distMod: distMod, condMod: condMod, atv: atvRounded,
                f3f: f3FrontStr, f3b: f3BackStr, distDiff: target.distance - pDist,
                surfModText: pTrack+pCond, surfMod: surfMod, 
                wghtModText: (weightDiff >= 0 ? "+" : "") + weightDiff.toFixed(1) + "kg", wghtMod: wghtMod, 
                locModText: pLoc ||
"不明", locMod: locMod,
                classMod: classMod, agePattern: agePattern, pClassRank: pClassRank, 
                pLoc: pLoc ||
"不明", pTrack: pTrack, pDist: pDist, pCond: pCond, pWeight: pWeight,
                isLimited: false, posRatio: posRatio, hadLead: hadLead,
                isOuter: isOuter
            };
            pastRaces.push(currentRaceData);
            validATVs.push(currentRaceData);
        }

        return { pastRaces, validATVs, localMax };
    };
    // ==========================================
    // 内部関数3: 洋芝・野芝専用機判定
    // ==========================================
    const checkTurfSpecialist = (validATVs) => {
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
                        if (isYoshiba && r.atv < 
noshibaBest) { r.atv = noshibaBest; r.isLimited = true; }
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
    // 内部関数4: 脚質とペース判定
    // ==========================================
    const calcPaceAndStyle = (validATVs) => {
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
                if (hasLeadExperience) { styleClass = 1;
styleName = "逃"; }
                else { styleClass = 2;
styleName = "先"; }
            } else if (avgPosRatio <= 0.40) { styleClass = 2;
styleName = "先"; }
            else if (avgPosRatio <= 0.85) { styleClass = 3;
styleName = "差"; }
            else { styleClass = 4;
styleName = "追"; }
        }
        return { avgPosRatio, styleClass, styleName };
    };

    // ==========================================
    // 内部関数5: ATVの集計と展開補正
    // ==========================================
    const calcAggregateATVs = (validATVs, avgPosRatio) => {
        validATVs.sort((a, b) => a.atv - b.atv);
        let weightedATV = null;
        let centralATV = null;
        let vLen = validATVs.length;
        let centralAdopted = [];
        let centralOutliers = [];
        if (vLen >= 3) { weightedATV = validATVs[0].atv * 0.8 + validATVs[1].atv * 0.15 + validATVs[2].atv * 0.05;
        }
        else if (vLen === 2) { weightedATV = validATVs[0].atv * 0.8 + validATVs[1].atv * 0.2;
        }
        else if (vLen === 1) { weightedATV = validATVs[0].atv;
        }
        
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

        return { weightedATV, centralATV, adjCentral, adjWeighted, centralAdopted, centralOutliers };
    };

    // ==========================================
    // 内部関数6: レース間隔判定
    // ==========================================
    const calcInterval = (headerArea, pastRaces) => {
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
                            let color = weeks < 3 ?
"#e74c3c" : "#555";
                            let fw = weeks < 3 ? "bold" : "normal";
                            let bd = weeks < 3 ?
`border:1px solid #e74c3c; background-color:#fdedec;` : `border:1px solid transparent;`;
                            intervalHtml = `<span style="font-size:11px; color:${color}; font-weight:${fw}; ${bd} padding:2px 4px; border-radius:4px; display:inline-block;">中${weeks}週</span>`;
                        }
                    }
                }
            }
        }
        return intervalHtml;
    };

    // ==========================================
    // 内部関数7: ソートおよび順位付与ヘルパー
    // ==========================================
    const applyRanking = (sortKey, rankKey) => {
        let sorted = [...results].sort((a, b) => {
            let valA = a[sortKey]; let valB = b[sortKey];
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1; if (valB === null) return 
-1;
            if (valA !== valB) return valA - valB;
            for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
                let atvA = a.validATVs.length > i ? a.validATVs[i].atv : Infinity;
                let atvB = b.validATVs.length > i ? b.validATVs[i].atv : Infinity;
             
                if(atvA !== atvB) return atvA - atvB;
            }
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            return aNo - bNo;
        });
        sorted.forEach((item, index) => {
            item[rankKey] = item[sortKey] !== null ? (index + 1) : "-";
        });
        return sorted;
    };


    // ==========================================
    // メインループ処理
    // ==========================================
    for (let i = 0; i < horseBlocks.length; i++) {
        let block = horseBlocks[i];
        if (block.includes("調教タイム") || block.includes("ラップ表示")) continue;
        
        let headerArea = /\d{2}\/\d{2}/.test(block) ? block.split(/\d{2}\/\d{2}/)[0] : block;
        
        let info = extractHeaderInfo(headerArea);
        if (info.horseName === "不明") continue;

        let races = block.split(/\r?\n(?=\s*\d{2}\/\d{2}[\s\r\n])/);
        
        let raceData = processPastRaces(races, info.baseWeight, info.age);
        if (raceData.localMax > maxRacesIdx) maxRacesIdx = raceData.localMax;
        
        let turfData = checkTurfSpecialist(raceData.validATVs);
        let paceData = calcPaceAndStyle(raceData.validATVs);
        let aggData = calcAggregateATVs(raceData.validATVs, paceData.avgPosRatio);
        let intervalHtml = calcInterval(headerArea, raceData.pastRaces);

        results.push({
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
            centralAdopted: 
aggData.centralAdopted, 
            centralOutliers: aggData.centralOutliers, 
            onlyYoshiba: turfData.onlyYoshiba, 
            onlyNoshiba: turfData.onlyNoshiba, 
            styleClass: paceData.styleClass, 
            styleName: paceData.styleName, 
            avgPosRatio: paceData.avgPosRatio, 
            intervalHtml: intervalHtml
  
        });
    }

    // 各指標によるソートと順位付け
    applyRanking('weightedATV', 'weightedRank');
    let centralSorted = applyRanking('centralATV', 'centralRank');
    applyRanking('adjCentral', 'adjCentralRank');
    applyRanking('adjWeighted', 'adjWeightedRank');

    // --- 監査ロジック ---
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
        let valA = centralSorted[i].centralATV !== null ?
centralSorted[i].centralATV : Infinity;
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