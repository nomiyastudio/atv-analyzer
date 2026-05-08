// ==========================================
// parse-core.js
// ==========================================

window.parseAllData = function(d1, d2) {
    // 1. D1（出馬表）からレース条件（距離、馬場、場所など）を解析
    let target = window.parseTarget(d1);
    
    // 2. D1（出馬表）から出走する馬の正確な名前リストを抽出
    let validHorseNames = window.extractValidHorseNames(d1);
    
    // 3. D2（馬柱）の巨大テキストを、馬名リストを頼りに1頭ごとのブロックに安全に分割
    let horseBlocks = window.splitHorseBlocks(d2, validHorseNames);
    
    return { validHorseNames, target, horseBlocks };
};