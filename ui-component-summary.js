// ==========================================
// ui-component-summary.js
// ==========================================

/**
 * 「レース条件 ＆ システム検証」ブロック（summary-block）のHTMLマークアップを生成するコンポーネント
 * @param {Object} target - 解析ターゲットのレース条件オブジェクト
 * @param {boolean} hasAuditIssues - 監査エラーの有無フラグ
 * @param {string} weightText - 算出された斤量判定の表記テキスト
 * @param {string} paceLabel - 想定ペースの表記テキスト
 * @param {string} paceStatusText - ペース判定の反映状況ステータステキスト
 * @param {string} paceBtnText - 反映オンオフ切り替えボタンのテキスト
 * @returns {string} summary-blockのHTML文字列
 */
window.renderSummaryBlockHTML = function(target, hasAuditIssues, weightText, paceLabel, paceStatusText, paceBtnText) {
    let auditHtml = "";
    let auditBadge = "";

    if (!hasAuditIssues) {
        // 正常時のシンプルバッジ表示 (右上固定用インラインスタイル付与)
        auditBadge = `<span style="position: absolute; top: 20px; right: 20px; color: #27ae60; font-weight: bold; background: #f4fdf8; padding: 2px 6px; border-radius: 4px; border: 1px solid #27ae60; font-size: 13px;">✓</span>`;
    } else {
        // 異常時の詳細エラーブロック表示
        auditHtml = `<div style="border-left: 4px solid #e74c3c; padding: 5px 10px; background: #fdf2e9; border-radius: 4px;"><details><summary style="color: #e74c3c; font-weight: bold; font-size: 13px; cursor: pointer;">⚠ システム検証: 問題あり (クリックで詳細を展開)</summary><ul style="font-size: 13px; color: #333; margin-top: 10px; padding-left: 20px; margin-bottom: 0;"><li style="color: #e74c3c; font-weight: bold; margin-bottom:4px;">抽出または計算処理に致命的なエラーが検出されました。</li></ul></details></div>`;
    }

    return `
        <div class="summary-block" style="width:100%; box-sizing:border-box;">
            <h3 style="margin: 0;">レース条件 ＆ システム検証</h3>
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
            ${auditBadge}
            <div id="auditArea">${auditHtml}</div>
        </div>
    `;
};