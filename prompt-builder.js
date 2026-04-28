// ==========================================
// prompt-builder.js
// ==========================================

window.buildAuditPrompts = function(data, d1, d2, horseBlocks) {
    const tbStr = data.results.map(h => `${h.horseNo},${h.horseName},${h.pastRaces.length},${h.validCount}`).join('|');
    const rkStr = data.results.map((h, i) => `${h.centralRank},${h.horseNo},${h.horseName},中央加重:${h.centralATV !== null ? h.centralATV.toFixed(2) : "-"},展開補正(安定):${h.adjCentral !== null ? h.adjCentral.toFixed(2) : "-"},加重:${h.weightedATV !== null ? h.weightedATV.toFixed(2) : "-"},展開補正(ベスト):${h.adjWeighted !== null ? h.adjWeighted.toFixed(2) : "-"}`).join('|');
    
    let promptObj = { hasErrors: false, debugPrompt: "", macroPrompt: "", microPrompts: [], fullText: "" };
    
    if (data.auditErrors.length > 0) {
        promptObj.hasErrors = true;
        promptObj.debugPrompt = `[ATV-DEBUG-REQ]\nSYSTEM_DIRECTIVE: 内部監査により以下のエラーが検出された。JavaScriptの抽出・計算ロジックの修正案を論理的に推論し、コードを出力せよ。\n\n【エラー】\n- ${data.auditErrors.join('\n- ')}\n\nD1:\n${d1}\nD2:\n${d2}`;
        promptObj.fullText = promptObj.debugPrompt;
    } else {
        // マクロ検証プロンプトの生成
        promptObj.macroPrompt = `[ATV-VERIFY-MACRO]\nSYSTEM_DIRECTIVE: あなたは厳格なデータ監査役である。提供されたD1、TB、RKを絶対的な事実として扱い、以下の【検証ステップ】を実行せよ。過去走データ（D2）は本ステップでは不要なため提供していない。途中式の省略を禁ずる。\n\n【検証ステップ】\nStep 1. 抽出の網羅性チェック\nD1に記載されている全出走馬をリストアップし、それがTB（内部データ）に漏れなく存在するか確認せよ。「〇番: 馬名 - 抽出OK」の形式で全頭分出力せよ。「以下略」は固く禁ずる。\n\nStep 2. ソートとNull処理の確認\nRKの順位が正しいか確認せ位。1位から最下位まで、隣り合う馬の数値（展開補正または中央加重など）を「1位(100.5) ＞ 2位(98.2) : 正常」の形式で全順位分比較して証明せよ。\n\n【データ】\nD1:\n${d1}\nTB:${tbStr}\nRK:${rkStr}`;
        
        // ミクロ検証プロンプトの生成（3頭ずつ分割）
        let sortedForMicro = [...data.results].sort((a,b) => (parseInt(a.horseNo)||999) - (parseInt(b.horseNo)||999));
        let targetConditions = d1.split('\n').slice(0, 5).join('\n');

        for (let i = 0; i < sortedForMicro.length; i += 3) {
            let batch = sortedForMicro.slice(i, i + 3);
            let targetHorseNumbers = batch.map(h => `${h.horseNo}番`).join('、');
            let batchNames = batch.map(h => h.horseName);
            let d2Filtered = horseBlocks.filter(block => {
                let cleanBlock = block.replace(/[\r\n\s\t\u200B-\u200D\uFEFF]/g, '');
                return batchNames.some(name => cleanBlock.includes(name));
            }).join('\n\n');
            
            let tbFiltered = batch.map(h => `${h.horseNo},${h.horseName},${h.pastRaces.length},${h.validCount}`).join('|');
            let rkFiltered = batch.map((h, idx) => `${h.centralRank},${h.horseNo},${h.horseName},中央加重:${h.centralATV !== null ? h.centralATV.toFixed(2) : "-"},展開補正(安定):${h.adjCentral !== null ? h.adjCentral.toFixed(2) : "-"},加重:${h.weightedATV !== null ? h.weightedATV.toFixed(2) : "-"},展開補正(ベスト):${h.adjWeighted !== null ? h.adjWeighted.toFixed(2) : "-"}`).join('|');
            
            let microText = `[ATV-VERIFY-MICRO: 対象馬 ${targetHorseNumbers}]\nSYSTEM_DIRECTIVE: あなたは厳格なデータ監査役である。提供されたデータを絶対的な事実とし、対象となる馬（${targetHorseNumbers}）についてのみ、以下の【検証ステップ】を実行せよ。ハルシネーションを防ぐため、途中式を絶対に省略せず、ステップ・バイ・ステップで検算せよ。\n\n【検証ステップ】\nStep 3. 過去走データの抽出と除外判定\n対象馬について、D2の過去走数とTBの有効データ数に齟齬がないか確認し、除外されたレースがあればその理由（馬場不一致やタイム欠損など）を明記せよ。\n\nStep 4. 補正値とATV計算のトレース\n対象馬について、ベース算出ロジック（距離ハンデ差分、馬場、斤量、場所、クラス補正）を検算せよ。さらに、脚質とコース係数（C値）による「展開補正（安定・ベスト）」のペナルティ乗算が正確に行われているか確認し、最終的な「中央加重」「加重平均」との整合性を検証せよ。\n\n【出力要件】\n「すべて正常」といった省略、および「以下略」「同様に」といった手抜きは固く禁ずる。必ず対象馬すべての計算過程を出力せよ。\n\n【データ】\n対象レース条件（D1より抽出）:\n${targetConditions}\n\n対象馬の過去走データ（D2抽出分）:\n${d2Filtered}\n\n対象馬のTBデータ:\n${tbFiltered}\n\n対象馬のRKデータ:\n${rkFiltered}`;
            
            promptObj.microPrompts.push({
                title: `${batch[0].horseNo}番〜${batch[batch.length-1].horseNo}番`,
                text: microText
            });
        }
        promptObj.fullText = promptObj.macroPrompt + "\n\n====================\n\n" + promptObj.microPrompts.map(m => m.text).join("\n\n====================\n\n");
    }
    
    return promptObj;
};