// ==========================================
// calc-extractor.js
// ==========================================

// ==========================================
// 内部関数1: ヘッダー情報（馬番、馬名、年齢、斤量等）の抽出
// ==========================================
window.extractHeaderInfo = function(headerArea, validHorseNames) {
    let horseName = "不明";
    for (let n = 0; n < validHorseNames.length; n++) {
        if (headerArea.indexOf(validHorseNames[n]) !== -1) {
            horseName = validHorseNames[n];
            break;
        }
    }

    // 馬番が取得できない場合は一律で "-"（ハイフン）を代入
    let horseNo = "-";
    // window.ATV_MARK_PATTERN を使用して正規表現を動的生成
    let regexNo = new RegExp("(?:^|\\n)\\s*(?:[枠]?\\d{1,2}\\s+)?(\\d{1,2})\\s*(?:\\r?\\n|\\s+)?" + window.ATV_MARK_PATTERN);
    let matchNo = headerArea.match(regexNo);
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
    // D1（出馬表）からの減量マークのクロス・リファレンス抽出
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
        // 文字化け [一-?] を [一-龠] に修正して SyntaxError を回避
        let markMatch = afterAgeArea.match(/[☆△▲★◇](?=[一-龠ぁ-んァ-ヴー])/);
        if (markMatch) jockeyMark = markMatch[0];
    }

    let currentWeight = 55.0;
    let cwMatch = afterAgeArea.match(/(?:牝|牡|セ)\d[\s\S]{1,100}?(4[8-9]\.[05]|5\d\.[05]|6[0-5]\.[05])(?=$|\s|\n)/);
    if (cwMatch) {
        currentWeight = parseFloat(cwMatch[1]);
    } else {
        let cwMatchFallback = afterAgeArea.match(/(?:^|\s|\n)(4[8-9]\.[05]|5\d\.[05]|6[0-5]\\.[05])(?=$|\s|\n)/);
        if (cwMatchFallback) currentWeight = parseFloat(cwMatchFallback[1]);
    }

    return { horseName, horseNo, age, sex, jockeyMark, baseWeight: currentWeight };
};

// ==========================================
// 内部関数2: 各過去走データの解析と補正値計算
// ==========================================
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
        let corner4Pos = null; // 新規追加: 4コーナー位置

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
                corner4Pos = parseInt(posNums[posNums.length - 1], 10); // 最後の数字が4コーナー
                for (let pIdx = 0; pIdx < posNums.length; pIdx++) {
                    if (parseInt(posNums[pIdx]) === 1) hadLead = true;
                }
            }
        }

        // 新規追加: 最終着順の抽出と追い抜き頭数の算出
        let finalRank = null;
        let rankMatch = rText.match(/(\d+)着/);
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
            // 修正: 統計マトリックスに基づく多段階フォールバック処理の適用
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

        // 修正: 芝・ダートで独立した感度定数を取得し、2乗曲線（非線形）による距離損失算出へ刷新
        let currentSensitivity = pTrack === "芝" ? window.ATV_CONFIG.DIST_SENSITIVITY.TURF : window.ATV_CONFIG.DIST_SENSITIVITY.DIRT;
        const calcDistLoss = (d) => Math.pow((d - 1600) / 1000, 2) * currentSensitivity;
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

        // 修正: クラス補正値を適正化されたマトリックス表からの引き当てに変更
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
        // 修正: 斤量補正係数を外部変数（0.002）へ適正化
        let wghtMod = weightDiff * window.ATV_CONFIG.WEIGHT_FACTOR;

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
            isOuter: isOuter,
            passedCount: passedCount // 新規追加: 追い抜き頭数
        };
        pastRaces.push(currentRaceData);
        validATVs.push(currentRaceData);
    }

    return { pastRaces, validATVs, localMax };
};