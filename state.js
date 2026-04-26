// --- グローバル変数の初期化 ---
window.generatedPrompts = {};
window.processedData = {};
window.globalSortType = 'centralATV'; 
window.globalCorrectionMode = 'centralATV'; // 追加: 展開補正の算出ベース ('centralATV' or 'weightedATV')
window.globalRatioId = '03'; // 追加: 現在選択されている比率のステート管理
window.resolveMonthCallback = null;