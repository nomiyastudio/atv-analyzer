// ==========================================
// state.js
// ==========================================

// --- グローバル変数の初期化 ---
window.generatedPrompts = {};
window.processedData = {};
window.globalSortType = 'adjustedATV'; 
window.globalCorrectionMode = 'weightedATV'; // 追加: 展開補正の算出ベース ('centralATV' or 'weightedATV')
window.globalRatioId = '02'; // 追加: 現在選択されている比率のステート管理
window.globalSortDirection = 'asc'; // 追加: ソートの昇順/降順管理
window.resolveMonthCallback = null;