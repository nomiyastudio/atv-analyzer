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
// 内部関数2: 各過去走データの解析（パース処理特化）
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

        // 抽出したパースデータを構造化
        let rawRaceData = {
            idx: j, date: rDate, pLoc, pTrack, pDist, pCond, pWeight,
            f3FrontStr, f3BackStr, posRatio, hadLead, isOuter, passedCount, baseTime, pClassRank
        };

        // 新設の数理計算モジュール（calc-modifier.js）へ処理を委譲
        let currentRaceData = window.calculateRaceModifications(rawRaceData, baseWeight, age, target);

        pastRaces.push(currentRaceData);
        validATVs.push(currentRaceData);
    }

    return { pastRaces, validATVs, localMax };
};