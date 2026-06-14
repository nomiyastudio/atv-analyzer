// ==========================================
// ui-ranking-detail.js
// ==========================================

/**
 * ランキングテーブル内の各過去走セル（ATV詳細情報）のHTMLマークアップを生成するヘルパー関数
 * @param {Object} race - 過去走データオブジェクト
 * @param {Object} target - ターゲットレースの条件オブジェクト
 * @returns {string} 過去走詳細セルのHTML文字列
 */
window.formatAtvDetail = function(race, target) {
    let locStr = race.pLoc === target.location ? `<span class="match-highlight">${race.pLoc}</span>` : race.pLoc;
    let distStr = race.pDist === target.distance ? `<span class="match-highlight">${race.pTrack}${race.pDist}m</span>` : `${race.pTrack}${race.pDist}m`;
    let limitMark = race.isLimited ? `<span style="color:#e74c3c; font-size:10px; font-weight:bold; margin-left:2px;">[限]</span>` : "";
    
    let passedMark = "";
    if (race.passedCount !== null && race.passedCount !== undefined) {
        if (race.passedCount > 0) {
            passedMark = ` <span style="color:#e74c3c; font-weight:bold;">↑${race.passedCount}</span>`;
        } else if (race.passedCount === 0) {
            passedMark = ` <span style="color:#7f8c8d;">±0</span>`;
        }
    }

    return `
        <div style="display:flex; justify-content:center; align-items:baseline; gap:4px; margin-bottom:2px;">
            <span style="font-size:10px; color:#888;">${isNaN(parseFloat(race.f3f)) ? "-" : parseFloat(race.f3f).toFixed(1)}</span>
            <span style="font-weight:bold; font-size:14px; color:var(--primary-color);">${race.atv.toFixed(2)}${limitMark}</span>
            <span style="font-size:10px; color:#888;">${isNaN(parseFloat(race.f3b)) ? "-" : parseFloat(race.f3b).toFixed(1)}</span>
        </div>
        <span style="font-size:10px; color:#666;">${race.date} ${locStr} ${race.pWeight.toFixed(1)}kg<br>${race.pCond} ${distStr}${passedMark}</span>`;
};