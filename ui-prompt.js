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
            <div style="margin-bottom:10px; display:flex; gap:5px; justify-content:flex-start;">
                <button class="copy-btn" onclick="window.copyPrompt('debug', 0, this)" style="background:#c0392b; flex:none; padding:10px 20px;">📋 デバッグ要求プロンプトをコピー</button>
                <button class="action-btn btn-save" onclick="window.downloadPrompt('debug', 0)" style="width:45px; height:45px; flex:none;">💾</button>
            </div>`;
    } else {
        html += `
            <div style="margin-bottom:12px;">
                <label style="font-size:12px; color:#2c3e50; margin-bottom:5px; display:block;">▼ ステップ1: 全体検証（抽出・ソート）</label>
                <div style="display:flex; gap:5px; justify-content:flex-start;">
                    <button class="copy-btn" onclick="window.copyPrompt('macro', 0, this)" style="background:#2980b9; padding:12px 20px; flex:none; font-size:13px; min-width:max-content;">📋 全体検証（抽出・ソート）</button>
                    <button class="action-btn btn-save" onclick="window.downloadPrompt('macro', 0)" style="width:45px; height:45px; flex:none;">💾</button>
                </div>
            </div>`;
        html += `
            <label style="font-size:12px; color:#2c3e50; margin-bottom:5px; display:block;">▼ ステップ2: 個別検算（3頭ずつ分割）</label>
            <div style="display:flex; flex-wrap:wrap; gap:8px; width:100%;">`;
        pData.microPrompts.forEach((m, idx) => {
            html += `
                <div style="display:flex; gap:3px; flex: 0 1 auto; min-width:max-content;">
                    <button class="copy-btn" onclick="window.copyPrompt('micro', ${idx}, this)" style="font-size:12px; padding:10px 12px; flex:none;">📋 ${m.title}</button>
                    <button class="action-btn btn-save" onclick="window.downloadPrompt('micro', ${idx})" style="width:38px; height:38px; flex:none; font-size:12px;">💾</button>
                </div>`;
        });
        html += `</div>`;
    }
    container.innerHTML = html;
};