// ==========================================
// parser.js
// ==========================================
window.resolveMonth = function(month) {
    document.getElementById('month-prompt-modal').style.display = 'none';
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
            document.getElementById('month-prompt-modal').style.display = 'flex';
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

window.parseAllData = function(d1, d2) {
    let target = window.parseTarget(d1);
    let validHorseNames = [];
    
    // --- 新規追加: 抽出漏れストッパー（不要なフッター領域のカット） ---
    let cleanD1 = d1;
    let d1CutoffMatch = d1.match(/選んだ馬のオッズ|予想を共有|AI展開予測|各データ上位3頭|展開予測の見方/);
    if (d1CutoffMatch) {
        cleanD1 = d1.substring(0, d1CutoffMatch.index);
    }

    let d1Lines = cleanD1.split('\n').map(l => l.trim()).filter(l => l !== '');

    let isIgnoreText = (txt) => {
        return txt === '--' || 
               /^[◎○◯〇▲△×☆注消－✓✔]+$/.test(txt) || 
               /^&#\d+;?$/.test(txt) || 
               /削除|保存|閉じる|文字以内|馬メモ|次走|相性度|波乱度|マスターコース|ログイン|予想|展開|トラックバイアス|的中|プラス|コース情報|ペース|編集/.test(txt) ||
               /^前走/.test(txt) ||
               /^\d+$/.test(txt); 
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

    // D1からの馬名抽出ロジック
    for (let i = 0; i < d1Lines.length; i++) {
        if (/^\d+[\s\t]+\d+$/.test(d1Lines[i])) {
            let name = "";
            let j = i + 1;
            while (j < d1Lines.length && j <= i + 15) {
                let txt = d1Lines[j];
                
                if (/^\d+[\s\t]+\d+$/.test(txt)) break;
                
                if (!isIgnoreText(txt) && txt.length > 1 && !/^\d/.test(txt)) {
                    name = window.cleanHorseName(txt);
                    break;
                }
                j++;
            }
            addValidName(name);
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
                    while (j < d1Lines.length && j <= i + 15) {
                        let txt = d1Lines[j];
                        
                        if (/^\d+$/.test(txt) && j+1 < d1Lines.length && /^\d+$/.test(d1Lines[j+1])) break;
                        
                        if (!isIgnoreText(txt) && txt.length > 1 && !/^\d/.test(txt)) {
                            name = window.cleanHorseName(txt);
                            break;
                        }
                        j++;
                    }
                    addValidName(name);
                }
            }
        }
    }

    // --- スマホ版（縦並び）フォーマット対応の馬名抽出 ---
    if (validHorseNames.length === 0) {
        for (let i = 0; i < d1Lines.length; i++) {
            // フック1: 「のデータベース」が含まれる行から抽出
            let dbMatch = d1Lines[i].match(/(?:牡|牝|セ)\d+[\s\S]*?([^\s]+)のデータベース/);
            if (!dbMatch) {
                dbMatch = d1Lines[i].match(/^([^\s]+)のデータベース/);
            }
            
            if (dbMatch) {
                let name = window.cleanHorseName(dbMatch[1]);
                addValidName(name);
            } else if (/^\d+$/.test(d1Lines[i])) {
                // フック2: 数字（馬番）のみの行から下を探索
                let name = "";
                let j = i + 1;
                while (j < d1Lines.length && j <= i + 6) {
                    let txt = d1Lines[j];
                    if (/^\d+$/.test(txt)) break; // 次の馬番らしき数字が来たら探索終了
                    
                    if (!isIgnoreText(txt) && txt.length > 1 && !/^\d/.test(txt)) {
                        // 馬名らしき文字列（カタカナを含む）を判定
                        if (/[\u30A0-\u30FF]/.test(txt)) {
                            let cleanTxt = txt.replace(/のデータベース.*$/, '');
                            name = window.cleanHorseName(cleanTxt);
                            break;
                        }
                    }
                    j++;
                }
                addValidName(name);
            }
        }
    }

    // D2のクレンジング
    let cleanD2 = d2;
    let cutoffMatch = d2.match(/選んだ馬のオッズを見る|競馬新聞の見方/);
    if (cutoffMatch) {
        cleanD2 = d2.substring(0, cutoffMatch.index);
    }

    // ブロック分割の正規表現に ◯ (大きな丸) と 〇 (漢数字のゼロ) を追加
    let horseBlocks = cleanD2.split(/(?=^\d+\s+\d+\s+(?:--|[◎○◯〇▲△×☆注消✓✔]+)?\s*\n)/m);
    if (horseBlocks.length <= 1) {
        horseBlocks = cleanD2.split(/(?=^\d+\r?\n\d+\r?\n(?:--|[◎○◯〇▲△×☆注消✓✔]+)?\r?\n)/m);
    }
    if (horseBlocks.length <= 1) {
        horseBlocks = cleanD2.split(/(?=^\d+[\t ]+\d+[\t ]*(?:\r?\n|--|[◎○◯〇▲△×☆注消✓✔]+))/m);
    }
    
    // --- スマホ版（縦並び）フォーマット対応のブロック分割 ---
    if (horseBlocks.length <= 1) {
        // スマホ版: 馬番(数字1〜2桁) -> 改行 -> 予想印(省略可) -> 改行 -> 馬名+のデータベース
        horseBlocks = cleanD2.split(/(?=^\d{1,2}\r?\n(?:--|[◎○◯〇▲△×☆注消✓✔]+)?\r?\n?[^\n]*のデータベース)/m);
    }
    if (horseBlocks.length <= 1) {
        // さらにシンプルなスマホ版ブロック分割（数字行＋印行＋カタカナ行）
        horseBlocks = cleanD2.split(/(?=^\d{1,2}\r?\n(?:--|[◎○◯〇▲△×☆注消✓✔]+)\r?\n)/m);
    }

    // D2ブロックと馬名のマッチング判定強化
    horseBlocks = horseBlocks.filter(block => {
        let cleanBlock = block.replace(/[\r\n\s\t\u200B-\u200D\uFEFF]/g, '');
        return validHorseNames.some(name => cleanBlock.includes(name));
    });

    return { validHorseNames, target, horseBlocks };
};

window.parseTarget = function(d1) {
    let lines = d1.split('\n').map(l => l.trim());
    let target = {
        distance: 2000,
        trackType: "芝",
        location: "不明",
        weightRule: "馬齢",
        trackDetail: "標準"
    };
    for (let line of lines) {
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