/**
 * parser.js
 * 入力されたテキストデータを解析し、構造化されたデータオブジェクトに変換する
 */

window.parseAllData = function(nameData, rawData) {
    let validHorseNames = [];

    // 1. 出馬表（nameData）から有効な馬名の辞書を作成
    // 通常の正規表現による一括抽出
    const regDB = /([ァ-ヴー]{2,9})のデータベース/g;
    const regWeight = /([ァ-ヴー]{2,9})\s+(?:牝|牡|セ)\d\s+(?:4[8-9]\.\d|5\d\.\d|6[0-5]\.\d)/g;
    const regMemo = /馬メモ\s*\r?\n\s*([ァ-ヴー]{2,9})\s*\r?\n\s*全角/g;
    
    let match;
    while ((match = regDB.exec(nameData)) !== null) { if (!validHorseNames.includes(match[1])) validHorseNames.push(match[1]); }
    while ((match = regWeight.exec(nameData)) !== null) { if (!validHorseNames.includes(match[1])) validHorseNames.push(match[1]); }
    while ((match = regMemo.exec(nameData)) !== null) { if (!validHorseNames.includes(match[1])) validHorseNames.push(match[1]); }

    // 除外・取消馬の特殊な改行パターンへの対応（行ベースの走査）
    const lines = nameData.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (/(?:取消|除外)/.test(lines[i])) {
            // 「除外」と書かれた行の直後2行以内に馬名（カタカナのみ）があるか探す
            for (let j = 1; j <= 2; j++) {
                if (i + j < lines.length) {
                    let m = lines[i + j].match(/^\s*([ァ-ヴー]{2,9})\s*$/);
                    if (m && !validHorseNames.includes(m[1])) {
                        validHorseNames.push(m[1]);
                        break;
                    }
                }
            }
        }
    }

    // 文字数の長い順にソート（部分一致による誤判定を防ぐ）
    validHorseNames.sort((a, b) => b.length - a.length);

    // 2. ターゲットレースの条件を抽出
    const headerStr = rawData.substring(0, 1000);
    let target = {
        className: "条件戦クラス",
        distance: 0,
        trackType: "芝",
        weightRule: "定量",
        location: "不明",
        dateStr: ""
    };

    // クラス判定
    if (headerStr.match(/オープン|OP|G1|G2|G3|Jpn|重賞/)) target.className = "オープンクラス";
    
    // 日付
    let targetDateMatch = headerStr.match(/(\d{1,2})月(\d{1,2})日/);
    if (targetDateMatch) target.dateStr = `${targetDateMatch[1]}月${targetDateMatch[2]}日`;
    
    // 距離・トラック
    const distMatch = headerStr.match(/(芝|ダ|ダート)\s*(\d+)m/);
    if (distMatch) {
        target.trackType = distMatch[1].replace("ダート", "ダ");
        target.distance = parseInt(distMatch[2], 10);
    }
    
    // 場所
    const locMatch = headerStr.match(/回\s*(東京|中山|京都|阪神|中京|小倉|新潟|福島|札幌|函館)/);
    if (locMatch) target.location = locMatch[1];
    
    // 斤量ルール
    if (headerStr.match(/ハンデ/)) target.weightRule = "ハンデ";
    else if (headerStr.match(/別定/)) target.weightRule = "別定";

    // 3. 馬ごとのデータブロックに分割
    // 各馬のデータ開始を示すパターン（馬番 + 印 などの並び）で分割
    let horseBlocks = rawData.split(/\r?\n(?=\s*\d{1,2}\s+\d{1,2}\s*(?:\r?\n|\s+)?(?:--|◎|◯|〇|▲|△|☆|✓|消|取消|除外))/);
    
    // 分割に失敗した場合のフォールバックパターン
    if (horseBlocks.length <= 1) {
        horseBlocks = rawData.split(/\r?\n(?=\d{1,2}\r?\n(?:--|◎|◯|〇|▲|△|☆|✓|消|取消|除外)\r?\n[ァ-ヴーA-Za-z])/);
    }
    if (horseBlocks.length <= 1) {
        horseBlocks = rawData.split(/\r?\n(?=\d{1,2}\(\d{1,2}\))/);
    }

    return {
        validHorseNames,
        target,
        horseBlocks
    };
};