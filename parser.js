window.ATV_MARK_PATTERN = "(?:--|取消|除外|[◎○◯〇▲△×☆注消✓✔??－]+)";

window.resolveMonth = function(month) {
    document.getElementById('month-prompt-modal').classList.add('hidden-element');
    if (window.resolveMonthCallback) window.resolveMonthCallback(month);
};

window.detectRaceMonth = async function(d1Text) {
    let is2yo = /2歳|２歳/.test(d1Text);

    let headerText = d1Text.split(/1R|2R|3R|4R|5R|6R|7R|8R|9R|10R|11R|12R/)[0];
    let mMatch = [...headerText.matchAll(/(\d{1,2})(?:\/|月)/g)].map(m => parseInt(m[1], 10));
    let uniqueMonths = [...new Set(mMatch)].filter(m => m >= 1 && m <= 12);

    let raceMonth = null;
    if (is2yo && uniqueMonths.includes(9) && uniqueMonths.includes(10)) {
        raceMonth = await new Promise(resolve => {
            window.resolveMonthCallback = resolve;
            document.getElementById('month-prompt-modal').classList.remove('hidden-element');
        });
    } else if (uniqueMonths.length > 0) {
        raceMonth = uniqueMonths[uniqueMonths.length - 1];
    } else {
        raceMonth = 11;
    }
    return { is2yo: is2yo, month: raceMonth };
};

window.cleanHorseName = function(rawName) {
    if (!rawName) return "";
    let name = rawName.split('(')[0];
    name = name.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
    return name;
};

window.parseTarget = function(d1) {
    let lines = d1.split('\n').map(l => l.trim());
    let target = {
        distance: 2000,
        trackType: "芝",
        location: "不明",
        weightRule: "馬齢",
        trackDetail: "標準",
        raceName: "",
        classRank: "F"
    };
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let mDist = line.match(/(芝|ダ|ダート)(\d+)m/);
        if (mDist) {
            target.trackType = mDist[1].replace("ダート", "ダ");
            target.distance = parseInt(mDist[2], 10);
            if (line.includes("外")) target.trackDetail = "外";
            else if (line.includes("内")) target.trackDetail = "内";
            else target.trackDetail = "標準";
        }
        if (line.includes("ハンデ")) target.weightRule = "ハンデ";
        else if (line.includes("別定")) target.weightRule = "別定";
        else if (line.includes("定量")) target.weightRule = "定量";
        
        let mLoc = line.match(/(\d+)回\s+([^\s]+)\s+\d+日目/);
        if (mLoc && mLoc[2]) {
            target.location = mLoc[2].replace("競馬", "");
        }

        if (/^\d{1,2}R$/.test(line) && i + 2 < lines.length) {
            if (lines[i+2].includes("発走")) {
                target.raceName = lines[i+1];
            }
        }
    }
    if (target.location === "不明") {
         const locs = ["札幌","函館","福島","新潟","東京","中山","中京","京都","阪神","小倉","川崎","大井","船橋","浦和","盛岡","水沢","門別","園田","姫路","名古屋","笠松","高知","佐賀"];
         let text = d1.replace(/\s+/g, "");
         for(let l of locs) {
             if (text.includes(l)) {
                 target.location = l;
                 break;
             }
         }
    }
    
    if (/G1|Ｇ１|Jpn1|Ｊｐｎ１/i.test(d1)) target.classRank = "S";
    else if (/G2|Ｇ２|Jpn2|Ｊｐｎ２|G3|Ｇ３|Jpn3|Ｊｐｎ３/i.test(d1)) target.classRank = "A";
    else if (/OP|ＯＰ|L|Ｌ|リステッド/i.test(d1)) target.classRank = "B";
    else if (/3勝|３勝|1600万|１６００万/.test(d1)) target.classRank = "C";
    else if (/2勝|２勝|1000万|１０００万/.test(d1)) target.classRank = "D";
    else if (/1勝|１勝|500万|５０0万/.test(d1)) target.classRank = "E";
    else if (/新馬|未勝利/.test(d1)) target.classRank = "F";

    return target;
};

window.extractHorseNamesByFormats = function(d1Lines, addValidName, isValidHorseNameCandidate) {
    let hasFound = false;

    for (let i = 0; i < d1Lines.length; i++) {
        if (/^\d+[\s\t]+\d+$/.test(d1Lines[i])) {
            let name = "";
            let j = i + 1;
            while (j < d1Lines.length && j <= i + 15) {
                let txt = d1Lines[j];
                if (/^\d+[\s\t]+\d+$/.test(txt)) break;
                if (isValidHorseNameCandidate(txt) && txt.length > 1 && !/^\d/.test(txt)) {
                    name = window.cleanHorseName(txt);
                    break;
                }
                j++;
            }
            if (name && name !== "不明") {
                addValidName(name);
                hasFound = true;
            }
        }
    }

    if (!hasFound) {
        for (let i = 0; i < d1Lines.length - 2; i++) {
            if (/^\d+$/.test(d1Lines[i]) && /^\d+$/.test(d1Lines[i+1])) {
                let waku = parseInt(d1Lines[i], 10);
                let horseNo = parseInt(d1Lines[i+1], 10);
                
                if (waku > 0 && waku <= 8 && horseNo > 0 && horseNo <= 18) {
                    let name = "";
                    let j = i + 2;
                    while (j < d1Lines.length && j <= i + 15) {
                        let txt = d1Lines[j];
                        if (/^\d+$/.test(txt) && j+1 < d1Lines.length && /^\d+$/.test(d1Lines[j+1])) break;
                        if (isValidHorseNameCandidate(txt) && txt.length > 1 && !/^\d/.test(txt)) {
                            name = window.cleanHorseName(txt);
                            break;
                        }
                        j++;
                    }
                    if (name && name !== "不明") {
                        addValidName(name);
                        hasFound = true;
                    }
                }
            }
        }
    }

    if (!hasFound) {
        for (let i = 0; i < d1Lines.length - 1; i++) {
            if (new RegExp(`^${window.ATV_MARK_PATTERN}$`).test(d1Lines[i])) {
                let name = window.cleanHorseName(d1Lines[i+1]);
                if (name && name.length > 1 && isValidHorseNameCandidate(name) && !/^\d/.test(name)) {
                    addValidName(name);
                    hasFound = true;
                }
            }
        }
    }

    if (!hasFound) {
        for (let i = 0; i < d1Lines.length; i++) {
            let dbMatch = d1Lines[i].match(/(?:牡|牝|セ)\d+[\s\S]*?([^\s]+)のデータベース/);
            if (!dbMatch) {
                dbMatch = d1Lines[i].match(/^([^\s]+)のデータベース/);
            }
            if (dbMatch) {
                let name = window.cleanHorseName(dbMatch[1]);
                if (name && name !== "不明") {
                    addValidName(name);
                    hasFound = true;
                }
            } else if (/^\d+$/.test(d1Lines[i])) {
                let name = "";
                let j = i + 1;
                while (j < d1Lines.length && j <= i + 6) {
                    let txt = d1Lines[j];
                    if (/^\d+$/.test(txt)) break;
                    if (isValidHorseNameCandidate(txt) && txt.length > 1 && !/^\d/.test(txt)) {
                        if (/[\u30A0-\u30FF]/.test(txt)) {
                            let cleanTxt = txt.replace(/のデータベース.*$/, '');
                            name = window.cleanHorseName(cleanTxt);
                            break;
                        }
                    }
                    j++;
                }
                if (name && name !== "不明") {
                    addValidName(name);
                    hasFound = true;
                }
            }
        }
    }
};

window.extractValidHorseNames = function(d1) {
    let validHorseNames = [];
    let cleanD1 = d1;
    let d1CutoffMatch = d1.match(/選んだ馬のオッズ|予想を共有|AI展開予測|各データ上位3頭|展開予測の見方/);
    if (d1CutoffMatch) {
        cleanD1 = d1.substring(0, d1CutoffMatch.index);
    }

    let d1Lines = cleanD1.split('\n').map(l => l.trim()).filter(l => l !== '');
    let isValidHorseNameCandidate = (txt) => {
        if (new RegExp(`^${window.ATV_MARK_PATTERN}$`).test(txt)) return false;
        if (/^&#\d+;?$/.test(txt)) return false;
        if (/^\d+$/.test(txt)) return false;
        if (/^前走/.test(txt)) return false;
        if (/^(予想|展開|ペース|プラス|次走|編集|削除|保存|閉じる|的中|ログイン)$/.test(txt)) return false;
        if (/文字以内|馬メモ|ペース合わず|相性度|波乱度|マスターコース|トラックバイアス|コース情報/.test(txt)) return false;
        let katakanaMatch = txt.match(/[\u30A0-\u30FF]/g);
        if (!katakanaMatch || katakanaMatch.length < 2) return false;

        return true;
    };

    const addValidName = (name) => {
        if (!name || name === "不明") return;
        if (validHorseNames.some(existing => existing.includes(name))) return;
        let shortIdx = validHorseNames.findIndex(existing => name.includes(existing));
        if (shortIdx !== -1) {
            validHorseNames[shortIdx] = name;
        } else {
            validHorseNames.push(name);
        }
    };

    window.extractHorseNamesByFormats(d1Lines, addValidName, isValidHorseNameCandidate);

    return validHorseNames;
};

window.splitHorseBlocks = function(d2, validHorseNames) {
    let cleanD2 = d2;
    let cutoffMatch = d2.match(/選んだ馬のオッズを見る|競馬新聞の見方/);
    if (cutoffMatch) {
        cleanD2 = d2.substring(0, cutoffMatch.index);
    }

    let horseBlocks = cleanD2.split(new RegExp(`(?=^\\d+\\s+\\d+\\s+${window.ATV_MARK_PATTERN}?\\s*\\n)`, 'm'));
    if (horseBlocks.length <= 1) {
        horseBlocks = cleanD2.split(new RegExp(`(?=^\\d+\\r?\\n\\d+\\r?\\n${window.ATV_MARK_PATTERN}?\\r?\\n)`, 'm'));
    }
    if (horseBlocks.length <= 1) {
        horseBlocks = cleanD2.split(new RegExp(`(?=^\\d+[\\t ]+\\d+[\\t ]*(?:\\r?\\n|${window.ATV_MARK_PATTERN}))`, 'm'));
    }
    if (horseBlocks.length <= 1) {
        horseBlocks = cleanD2.split(new RegExp(`(?=^\\d{1,2}\\r?\\n${window.ATV_MARK_PATTERN}?\\r?\\n?[^\\n]*のデータベース)`, 'm'));
    }
    if (horseBlocks.length <= 1) {
        horseBlocks = cleanD2.split(new RegExp(`(?=^\\d{1,2}\\r?\\n${window.ATV_MARK_PATTERN}\\r?\\n)`, 'm'));
    }

    if (horseBlocks.length <= 1 && validHorseNames.length > 0) {
        let indices = [];
        validHorseNames.forEach(name => {
            let regex = new RegExp(`(?:^|\\n)${window.ATV_MARK_PATTERN}?\\s*\\n?${name}\\s*\\n(?:牡|牝|セ)\\d+`, 'm');
            let match = cleanD2.match(regex);
            
            if (!match) {
                regex = new RegExp(`(?:^|\\n)${window.ATV_MARK_PATTERN}?\\s*\\n?${name}`, 'm');
                match = cleanD2.match(regex);
            }
            
            if (match) {
                let idx = match.index;
                if (cleanD2[idx] === '\n') idx++;
                indices.push({ name: name, index: idx });
            }
        });
        
        if (indices.length > 1) {
            indices.sort((a, b) => a.index - b.index);
            horseBlocks = [];
            if (indices[0].index > 0) {
                let prefix = cleanD2.substring(0, indices[0].index).trim();
                if (prefix.length > 0) horseBlocks.push(prefix);
            }
            for (let i = 0; i < indices.length; i++) {
                let start = indices[i].index;
                let end = (i + 1 < indices.length) ? indices[i+1].index : cleanD2.length;
                horseBlocks.push(cleanD2.substring(start, end));
            }
        }
    }

    horseBlocks = horseBlocks.filter(block => {
        let cleanBlock = block.replace(/[\r\n\s\t\u200B-\u200D\uFEFF]/g, '');
        return validHorseNames.some(name => cleanBlock.includes(name));
    });

    return horseBlocks;
};

window.parseAllData = function(d1, d2) {
    let target = window.parseTarget(d1);
    let validHorseNames = window.extractValidHorseNames(d1);
    let horseBlocks = window.splitHorseBlocks(d2, validHorseNames);
    
    return { validHorseNames, target, horseBlocks };
};