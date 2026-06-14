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
        paceHtml += `<div style="border:1px solid ${s.border}; border-radius:6px; background:transparent; padding:10px; box-sizing:border-box;">
            <h4 style="margin:0 0 10px 0; color:${s.border}; text-align:center; border-bottom:1px solid ${s.border}; padding-bottom:5px;">${s.name}</h4>
            <ul style="list-style:none; padding:0; margin:0; font-size:12px;">`;

        if (horses.length === 0) {
            paceHtml += `<li style="color:#999; text-align:center;">不在</li>`;
        } else {
            horses.forEach(h => {
                let pct = (h.avgPosRatio !== null) ? h.avgPosRatio * 100 : 50;
                let rgb = window.getColorFromStops(window.paceStops, pct);
                let hex = window.rgbToHex(rgb);
                let textCol = window.getTextColor(rgb);
                let borderCol = window.rgbToHex(window.darken(rgb));
                let wColor = window.getWakuColor(h.horseNo, totalHorses);
                let wakuBadge = `<span style="display:inline-block; width:16px; height:16px; line-height:16px; text-align:center; background-color:${wColor.bg}; color:${wColor.text}; border:1px solid ${wColor.border}; border-radius:3px; margin-right:4px; font-size:10px;">${h.horseNo}</span>`;
                paceHtml += `<li style="margin-bottom:2px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center;" title="${h.horseNo}. ${h.horseName}">
                    ${wakuBadge}
                    <span style="background-color:${hex}; color:${textCol}; border:1px solid ${borderCol}; padding: 2px 6px; border-radius: 4px; display:inline-block; width:100%; box-sizing:border-box;">${h.horseName}</span>
                </li>`;
            });
        }
        paceHtml += `</ul></div>`;
    });

    paceHtml += `</div>`;

    return `
        <div class="pace-pattern-block" style="width:100%; box-sizing:border-box;">
            <h3 style="margin-top:0;">展開予想 (脚質グルーピング)</h3>
            ${paceHtml}
        </div>
    `;
};