// ==========================================
// state.js
// ==========================================

// --- グローバル変数の初期化 ---
window.generatedPrompts = {};
window.processedData = {};
window.globalSortType = 'adjWeighted'; // 初期ソートキーを展開補正(ベスト)に設定
window.globalRatioId = '02'; // 現在選択されている比率のステート管理
window.globalSortDirection = 'asc'; // ソートの昇順/降順管理
window.resolveMonthCallback = null;