// ==========================================
// parse-d1-formats.js
// ==========================================

/**
 * 4種類の出馬表フォーマット（パターン1、パターン2、予想印、スマホ版縦並び）から馬名を直列直列に判定・抽出するモジュール
 * @param {Array} d1Lines - サニタイズ済みの出馬表改行行テキスト配列
 * @param {Function} addValidName - 馬名登録・重複排除を行うコールバック関数
 * @param {Function} isValidHorseNameCandidate - 馬名候補の適正検証を行う判定関数
 */
window.extractHorseNamesByFormats = function(d1Lines, addValidName, isValidHorseNameCandidate) {
    let hasFound = false;

    // パターン1: 枠番・馬番が横並びのフォーマット [cite: 1228-1233]
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

    // パターン2: 枠番と馬番が改行されているフォーマット [cite: 1234-1239]
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

    // パターン3: 予想印フォーマット（馬番未定など）対応の馬名抽出 
    if (!hasFound) {
        for (let i = 0; i < d1Lines.length - 1; i++) {
            // 単独の予想印（-- や ◎◯▲△☆消? など）の行を検知
            if (new RegExp(`^${window.ATV_MARK_PATTERN}$`).test(d1Lines[i])) {
                let name = window.cleanHorseName(d1Lines[i+1]);
                if (name && name.length > 1 && isValidHorseNameCandidate(name) && !/^\d/.test(name)) {
                    addValidName(name);
                    hasFound = true;
                }
            }
        }
    }

    // パターン4: スマホ版（縦並び）フォーマット対応の馬名抽出 [cite: 1243-1251]
    if (!hasFound) {
        for (let i = 0; i < d1Lines.length; i++) {
            // フック1: 「のデータベース」が含まれる行から抽出
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
                // フック2: 数字（馬番）のみの行から下を探索
                let name = "";
                let j = i + 1;
                while (j < d1Lines.length && j <= i + 6) {
                    let txt = d1Lines[j];
                    if (/^\d+$/.test(txt)) break; // 次の馬番らしき数字が来たら探索終了
                    if (isValidHorseNameCandidate(txt) && txt.length > 1 && !/^\d/.test(txt)) {
                        // 馬名らしき文字列（カタカナを含む）を判定
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