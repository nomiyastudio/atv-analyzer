// ==========================================
// ui-component-pace.js
// ==========================================

/**
 * 「展開予想 (脚質グルーピング)」ブロック（pace-pattern-block）のHTMLマークアップを生成するコンポーネント
 * @param {Object} target - 解析ターゲットのレース条件オブジェクト
 * @returns {string} pace-pattern-blockのHTML文字列
 */
window.renderPaceBlockHTML = function(target) {
    let paceHtml = `<div class="pace-grid">`;
    let results03 = window.processedData['03']?.results || [];
    let totalHorses = results03.length;
    const paceStyles = [
        {class: 1, name: "逃げ", border: "#d35400"},
        {class: 2, name: "先行", border: "#f1c40f"},
        {class: 3, name: "差し", border: "#6b8e23"},
        {class: 4, name: "追込", border: "#1b4f72"}
    ];
    paceStyles.forEach(s => {
        let horses = results03.filter(h => h.styleClass === s.class).sort((a,b) => (a.avgPosRatio || 0) - (b.avgPosRatio || 0));
        paceHtml += `<div class="pace-group-card" style="border-color: ${s.border};">
            <h4 class="pace-group-title" style="color: ${s.border}; border-bottom-color: ${s.border};">${s.name}</h4>
            <ul class="pace-group-list">`;

        if (horses.length === 0) {
             paceHtml += `<li class="pace-empty-text">不在</li>`;
        } else {
            horses.forEach(h => {
                let pct = (h.avgPosRatio !== null) ? h.avgPosRatio * 100 : 50;
                let rgb = window.getColorFromStops(window.paceStops, pct);
                let hex = window.rgbToHex(rgb);
  
                let textCol = window.getTextColor(rgb);
                let borderCol = window.rgbToHex(window.darken(rgb));
                let wColor = window.getWakuColor(h.horseNo, totalHorses);
                let wakuBadge = `<span class="waku-badge-ui" style="background-color:${wColor.bg}; color:${wColor.text}; border-color:${wColor.border};">${h.horseNo}</span>`;
                paceHtml += `<li class="pace-horse-item" title="${h.horseNo}. ${h.horseName}">
                    ${wakuBadge}
                    <span class="pace-horse-name" style="background-color:${hex}; color:${textCol}; border-color:${borderCol};">${h.horseName}</span>
                </li>`;
            });
        }
        paceHtml += `</ul></div>`;
    });

    paceHtml += `</div>`;
    return `
        <div class="pace-pattern-block">
            <h3 class="pace-block-title">展開予想 (脚質グルーピング)</h3>
            ${paceHtml}
        </div>
    `;
};