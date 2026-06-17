// ==========================================
// ui-component-summary.js
// ==========================================

/**
 * 「レース条件」ブロック（summary-block）のHTMLマークアップを生成するコンポーネント
 * @param {Object} target - 解析ターゲットのレース条件オブジェクト
 * @param {boolean} hasAuditIssues - 監査エラーの有無フラグ
 * @param {string} weightText - 算出された斤量判定の表記テキスト
 * @param {string} paceLabel - 想定ペースの表記テキスト
 * @param {string} paceStatusText - ペース判定の反映状況ステータステキスト
 * @param {string} paceBtnText - 反映オンオフ切り替えボタンのテキスト
 * @param {Array} allAuditErrors - 検出された一意なエラーメッセージ文字列の配列
 * @returns {string} summary-blockのHTML文字列
 */
window.renderSummaryBlockHTML = function(target, hasAuditIssues, weightText, paceLabel, paceStatusText, paceBtnText, allAuditErrors) {
    return `
        <div class="summary-block" style="width:100%; box-sizing:border-box;">
            <h3 style="margin: 0;">レース条件</h3>
            <div style="margin-top:10px; margin-bottom:10px; display:flex; flex-wrap:wrap; gap:15px; font-size:15px;">
                <span><b>条件:</b> ${target.distance}m / ${target.trackType}</span>
                <span><b>基準斤量:</b> ${weightText} / ${target.location}</span>
                <span><b>想定ペース:</b> <span style="font-weight:bold; color:var(--match-color);">${paceLabel}</span></span>
                <span><b>反映ステータス:</b> <span style="font-weight:bold;">${paceStatusText}</span></span>
            </div>
            <div style="margin-bottom:10px;">
                <button class="action-btn btn-load" style="padding: 6px 12px; font-size: 12px; width: auto;" onclick="window.togglePaceMode()">
                    ${paceBtnText}
                </button>
            </div>
        </div>
    `;
};