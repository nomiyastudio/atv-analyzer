// ==========================================
// parse-d2.js
// ==========================================

window.splitHorseBlocks = function(d2, validHorseNames) {
    // D2のクレンジング
    let cleanD2 = d2;
    let cutoffMatch = d2.match(/選んだ馬のオッズを見る|競馬新聞の見方/);
    if (cutoffMatch) {
        cleanD2 = d2.substring(0, cutoffMatch.index);
    }

    // 既存のブロック分割 (数字ベース)
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

    // --- 新規追加: 馬番なしフォーマット（抽出した馬名ベース）対応のブロック分割 ---
    if (horseBlocks.length <= 1 && validHorseNames.length > 0) {
        let indices = [];
        validHorseNames.forEach(name => {
            // 馬名が行頭、または予想印の直後に出現する箇所を特定
            let regex = new RegExp(`(?:^|\\n)${window.ATV_MARK_PATTERN}?\\s*\\n?${name}\\s*\\n(?:牡|牝|セ)\\d+`, 'm');
            let match = cleanD2.match(regex);
            
            // 性齢が続かない場合でも馬名で探すフォールバック
            if (!match) {
                regex = new RegExp(`(?:^|\\n)${window.ATV_MARK_PATTERN}?\\s*\\n?${name}`, 'm');
                match = cleanD2.match(regex);
            }
            
            if (match) {
                let idx = match.index;
                if (cleanD2[idx] === '\n') idx++; // \nからマッチした場合は次の文字から開始
                indices.push({ name: name, index: idx });
            }
        });
        
        if (indices.length > 1) {
            indices.sort((a, b) => a.index - b.index);
            horseBlocks = [];
            // 最初の馬名より前にゴミデータがあればスキップするか、とりあえず格納
            if (indices[0].index > 0) {
                let prefix = cleanD2.substring(0, indices[0].index).trim();
                if (prefix.length > 0) horseBlocks.push(prefix);
            }
            // 各馬名のインデックスでテキストを分割
            for (let i = 0; i < indices.length; i++) {
                let start = indices[i].index;
                let end = (i + 1 < indices.length) ? indices[i+1].index : cleanD2.length;
                horseBlocks.push(cleanD2.substring(start, end));
            }
        }
    }

    // D2ブロックと馬名のマッチング判定強化
    horseBlocks = horseBlocks.filter(block => {
        let cleanBlock = block.replace(/[\r\n\s\t\u200B-\u200D\uFEFF]/g, '');
        return validHorseNames.some(name => cleanBlock.includes(name));
    });

    return horseBlocks;
};