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
        <div class="summary-block">
            <h3>レース条件</h3>
            <div class="cond-container">
                <span><b>条件:</b> ${target.distance}m / ${target.trackType}</span>
                <span><b>基準斤量:</b> ${weightText} / ${target.location}</span>
                <span><b>想定ペース:</b> <span class="match-highlight">${paceLabel}</span></span>
                <span><b>反映ステータス:</b> <b>${paceStatusText}</b></span>
            </div>
            <div>
                <button class="action-btn btn-load btn-pace-toggle" onclick="window.togglePaceMode()">
                    ${paceBtnText}
                </button>
            </div>
        </div>
    `;
};