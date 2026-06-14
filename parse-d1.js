// ==========================================
// parse-d1.js
// ==========================================

window.ATV_MARK_PATTERN = "(?:--|取消|除外|[◎○◯〇▲△×☆注消✓✔??－]+)";

window.resolveMonth = function(month) {
    document.getElementById('month-prompt-modal').classList.add('hidden-element');
    if (window.resolveMonthCallback) window.resolveMonthCallback(month);
};

window.detectRaceMonth = async function(d1Text) {
    let is2yo = /2歳|２歳/.test(d1Text);
    if (!is2yo) return { is2yo: false, month: null };

    let headerText = d1Text.split(/1R|2R|3R|4R|5R|6R|7R|8R|9R|10R|11R|12R/)[0];
    let mMatch = [...headerText.matchAll(/(\d{1,2})(?:\/|月)/g)].map(m => parseInt(m[1], 10));
    let uniqueMonths = [...new Set(mMatch)].filter(m => m >= 1 && m <= 12);

    let raceMonth = null;
    if (uniqueMonths.includes(9) && uniqueMonths.includes(10)) {
        raceMonth = await new Promise(resolve => {
            window.resolveMonthCallback = resolve;
            document.getElementById('month-prompt-modal').classList.remove('hidden-element');
        });
    } else if (uniqueMonths.length > 0) {
        raceMonth = uniqueMonths[uniqueMonths.length - 1];
    } else {
        raceMonth = 11;
    }
    return { is2yo: true, month: raceMonth };
};

window.cleanHorseName = function(rawName) {
    if (!rawName) return "";
    let name = rawName.split('(')[0];
    // 空白文字（全角・半角・タブなど）をすべて削除して純粋な馬名文字列にする
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
        raceName: "" // 新規追加: レース名保持用プロパティ
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

        // 新規追加: レース名の抽出
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
             if (text.includes(l)) { target.location = l;
             break; }
         }
    }
    return target;
};

window.extractValidHorseNames = function(d1) {
    let validHorseNames = [];
    // --- 新規追加: 抽出漏れストッパー（不要なフッター領域のカット） ---
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
        // 完全一致で除外
        if (/^(予想|展開|ペース|プラス|次走|編集|削除|保存|閉じる|的中|ログイン)$/.test(txt)) return false;
        // 部分一致で除外
        if (/文字以内|馬メモ|ペース合わず|相性度|波乱度|マスターコース|トラックバイアス|コース情報/.test(txt)) return false;
        // カタカナ必須条件：全角カタカナが2文字以上含まれていること
        let katakanaMatch = txt.match(/[\u30A0-\u30FF]/g);
        if (!katakanaMatch || katakanaMatch.length < 2) return false;

        return true;
    };
    // --- 新規追加: 重複・略称排除フィルター ---
    const addValidName = (name) => {
        if (!name || name === "不明") return;
        // 既に存在する馬名の一部（略称）であれば追加しない
        if (validHorseNames.some(existing => existing.includes(name))) return;
        // 逆に追加しようとしている名前が、既存の短い名前を包含している場合は上書きする
        let shortIdx = validHorseNames.findIndex(existing => name.includes(existing));
        if (shortIdx !== -1) {
            validHorseNames[shortIdx] = name;
        } else {
            validHorseNames.push(name);
        }
    };

    // フォーマットごとの個別抽出処理を外部化関数（parse-d1-formats.js）に委譲して軽量化 [cite: 1228-1251]
    window.extractHorseNamesByFormats(d1Lines, addValidName, isValidHorseNameCandidate);

    return validHorseNames;
};