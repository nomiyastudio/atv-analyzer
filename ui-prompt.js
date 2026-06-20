// ==========================================
// ui-prompt.js
// ==========================================

// プロンプトエリアのレンダリング (スマホ対応・左寄せマクロボタン)
window.renderPromptArea = function(ratioId) {
    let pData = window.generatedPrompts[ratioId];
    let container = document.getElementById('promptControlArea');
    if (!container || !pData) return;

    let html = "";
    if (pData.hasErrors) {
        html = `
            <div class="prompt-btn-wrap">
                <button class="copy-btn prompt-btn-debug" onclick="window.copyPrompt('debug', 0, this)" style="background:#c0392b;">📋 デバッグ要求プロンプトをコピー</button>
                <button class="action-btn btn-save prompt-action-icon" onclick="window.downloadPrompt('debug', 0)">💾</button>
            </div>`;
    } else {
        html += `
            <div class="prompt-section-wrap">
                <label class="prompt-section-label">▼ ステップ1: 全体検証（抽出・ソート）</label>
                <div class="prompt-btn-wrap">
                    <button class="copy-btn prompt-btn-macro" onclick="window.copyPrompt('macro', 0, this)" style="background:#2980b9;">📋 全体検証（抽出・ソート）</button>
                    <button class="action-btn btn-save prompt-action-icon" onclick="window.downloadPrompt('macro', 0)">💾</button>
                </div>
            </div>`;
        html += `
            <label class="prompt-section-label">▼ ステップ2: 個別検算（3頭ずつ分割）</label>
            <div class="prompt-micro-wrap">`;
        pData.microPrompts.forEach((m, idx) => {
            html += `
                <div class="prompt-micro-box">
                    <button class="copy-btn prompt-btn-micro" onclick="window.copyPrompt('micro', ${idx}, this)">📋 ${m.title}</button>
                    <button class="action-btn btn-save prompt-icon-micro" onclick="window.downloadPrompt('micro', ${idx})">💾</button>
                </div>`;
        });
        html += `</div>`;
    }
    container.innerHTML = html;
};