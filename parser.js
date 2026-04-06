window.parseAllData = function(d1, d2) {
    let target = window.parseTarget(d1);
    let validHorseNames = [];
    let d1Lines = d1.split('\n').map(l => l.trim()).filter(l => l !== '');

    for (let i = 0; i < d1Lines.length; i++) {
        let m = d1Lines[i].match(/^(\d+)\s+(\d+)\s*$/);
        if (m) {
            let horseNo = parseInt(m[2], 10);
            let name = "";
            let j = i + 1;
            while (j < d1Lines.length && j <= i + 3) {
                let txt = d1Lines[j];
                if (txt !== '--' && !/^[◎○▲△×☆注]+$/.test(txt)) {
                    name = txt.split(/\s+/)[0]; 
                    break;
                }
                j++;
            }
            if (name && name !== "不明" && !validHorseNames.some(h => h.horseNo === horseNo)) {
                validHorseNames.push({ horseNo, horseName: name });
            }
        }
    }

    if (validHorseNames.length === 0) {
        for (let i = 0; i < d1Lines.length - 2; i++) {
            if (/^\d+$/.test(d1Lines[i]) && /^\d+$/.test(d1Lines[i+1])) {
                let waku = parseInt(d1Lines[i], 10);
                let horseNo = parseInt(d1Lines[i+1], 10);
                if (waku > 0 && waku <= 8 && horseNo > 0 && horseNo <= 18) {
                    let name = "";
                    let j = i + 2;
                    while (j < d1Lines.length && j <= i + 4) {
                        let txt = d1Lines[j];
                        if (txt !== '--' && !/^[◎○▲△×☆注]+$/.test(txt)) {
                            name = txt.split(/\s+/)[0];
                            break;
                        }
                        j++;
                    }
                    if (name && name !== "不明" && !validHorseNames.some(h => h.horseNo === horseNo)) {
                        validHorseNames.push({ horseNo, horseName: name });
                    }
                }
            }
        }
    }

    let horseBlocks = d2.split(/(?=^\d+\s+\d+\s+(?:--|[◎○▲△×☆注]+)?\s*\n)/m);
    if (horseBlocks.length <= 1) {
        horseBlocks = d2.split(/(?=^\d+\n\d+\n(?:--|[◎○▲△×☆注]+)?\n)/m);
    }

    horseBlocks = horseBlocks.filter(block => /^\s*\d+[\s\n]+\d+[\s\n]+/.test(block));

    return { validHorseNames, target, horseBlocks };
};

window.parseTarget = function(d1) {
    let lines = d1.split('\n').map(l => l.trim());
    let target = {
        className: "不明",
        distance: 2000,
        trackType: "芝",
        location: "不明",
        weightRule: "馬齢"
    };
    for (let line of lines) {
        let mDist = line.match(/(芝|ダ|ダート)(\d+)m/);
        if (mDist) {
            target.trackType = mDist[1].replace("ダート", "ダ");
            target.distance = parseInt(mDist[2], 10);
        }
        if (line.includes("ハンデ")) target.weightRule = "ハンデ";
        else if (line.includes("別定")) target.weightRule = "別定";
        else if (line.includes("定量")) target.weightRule = "定量";
        let mLoc = line.match(/(\d+)回\s+([^\s]+)\s+\d+日目/);
        if (mLoc && mLoc[2]) {
            target.location = mLoc[2].replace("競馬", "");
        }
    }
    if (target.location === "不明") {
         const locs = ["札幌","函館","福島","新潟","東京","中山","中京","京都","阪神","小倉","川崎","大井","船橋","浦和","盛岡","水沢","門別","園田","姫路","名古屋","笠松","高知","佐賀"];
         let text = d1.replace(/\s+/g, "");
         for(let l of locs) {
             if (text.includes(l)) { target.location = l; break; }
         }
    }
    return target;
};

window.parseHorseBlock = function(block, target) {
    let lines = block.split('\n').map(l => l.trim()).filter(l => l);
    let pastRaces = [];
    let styleClass = null;
    let avgPosRatio = null;
    let currentWeight = 57.0;

    for (let i = 0; i < Math.min(20, lines.length); i++) {
        let wm = lines[i].match(/(\d+\.\d+)/);
        if (wm) {
            let w = parseFloat(wm[1]);
            if (w >= 48.0 && w <= 65.0 && (lines[i].includes("牡") || lines[i].includes("牝") || lines[i].includes("セ"))) {
                currentWeight = w;
                break;
            }
        }
    }

    let raceIdx = 1;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let dateMatch = line.match(/^(\d{2}\/\d{2})\s+([^\s]+)\s+\d+R/);
        if (dateMatch) {
            let pDate = dateMatch[1];
            let pLoc = dateMatch[2].replace(/\[|\]/g, "");
            let j = i + 1;
            
            let pTrack = "芝";
            let pDist = 2000;
            let pCond = "良";
            let pWeight = currentWeight;
            let f3f = NaN;
            let f3b = NaN;
            let posArr = [];

            while (j < lines.length && !lines[j].match(/^\d{2}\/\d{2}\s+/)) {
                let l = lines[j];
                let distMatch = l.match(/(芝|ダ)(\d+)\s+([^\s]+)\s+(良|稍|重|不)/);
                if (distMatch) {
                    pTrack = distMatch[1];
                    pDist = parseInt(distMatch[2], 10);
                    pCond = distMatch[4];
                }
                
                let weightMatch = l.match(/[^\s]+\s+(\d+\.\d+)\s+\d+kg/);
                if (weightMatch) {
                    pWeight = parseFloat(weightMatch[1]);
                }

                if (l.startsWith("前")) {
                    let fMatch = l.match(/^前\s+(\d+\.\d+)/);
                    if (fMatch) f3f = parseFloat(fMatch[1]);
                    let posMatch = l.match(/前\s+(?:\d+\.\d+\s+)?([\d\s\-]+)$/);
                    if (posMatch) {
                        posArr = posMatch[1].split(/\s+/).map(x => parseInt(x)).filter(x => !isNaN(x));
                    }
                }
                if (l.startsWith("後")) {
                    let bMatch = l.match(/^後\s+(\d+\.\d+)/);
                    if (bMatch) f3b = parseFloat(bMatch[1]);
                }
                j++;
            }

            let reason = "";
            let valid = true;
            if (isNaN(f3f) || isNaN(f3b)) { valid = false; reason = "3Fタイム欠損"; }
            if (pTrack !== target.trackType) { valid = false; reason = "芝ダート不一致"; }

            pastRaces.push({
                idx: raceIdx,
                date: pDate,
                pLoc: pLoc,
                pTrack: pTrack,
                pDist: pDist,
                pCond: pCond,
                pWeight: pWeight,
                f3f: f3f,
                f3b: f3b,
                posArr: posArr,
                valid: valid,
                reason: reason
            });
            raceIdx++;
        }
    }
    
    let validPosRaces = pastRaces.filter(r => r.valid && r.posArr && r.posArr.length > 0);
    if (validPosRaces.length > 0) {
        let totalPos = 0;
        validPosRaces.forEach(r => totalPos += r.posArr[0]);
        let avg = totalPos / validPosRaces.length;
        avgPosRatio = Math.min(avg / 16, 1.0);
        if (avg <= 2.5) styleClass = 1;
        else if (avg <= 6.5) styleClass = 2;
        else if (avg <= 11.5) styleClass = 3;
        else styleClass = 4;
    }

    return { pastRaces, currentWeight, styleClass, avgPosRatio };
};
