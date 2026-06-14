// ==========================================
// ui-component-score.js
// ==========================================

/**
 * 「多角展開スコア分析」ブロック（score-analysis-block）のHTMLマークアップを生成するコンポーネント
 * @returns {string} score-analysis-blockのHTML文字列
 */
window.renderScoreBlockHTML = function() {
    return `
        <div class="score-analysis-block" style="width:100%; box-sizing:border-box;">
            <h3 style="margin-top:0;">多角展開スコア分析</h3>
            <div class="score-controls">
                <div class="score-control-group score-checkbox-container">
                    <label class="score-control-label">評価指標</label>
                    <div class="score-checkbox-group">
                        <label class="score-checkbox-label"><input type="checkbox" class="score-metric-cb" value="adjWeighted" onchange="window.runScoreAnalysis()">展開補正(ベスト)</label>
                        <label class="score-checkbox-label"><input type="checkbox" class="score-metric-cb" value="adjCentral" onchange="window.runScoreAnalysis()">展開補正(安定)</label>
                        <label class="score-checkbox-label"><input type="checkbox" class="score-metric-cb" value="weightedATV" onchange="window.runScoreAnalysis()">加重平均(ベスト)</label>
                        <label class="score-checkbox-label"><input type="checkbox" class="score-metric-cb" value="centralATV" onchange="window.runScoreAnalysis()">中央加重(安定)</label>
                    </div>
                </div>
              
                <div class="score-control-group score-checkbox-container">
                    <label class="score-control-label">評価対象比率</label>
                    <div class="score-checkbox-group">
                        <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="00" onchange="window.runScoreAnalysis()">0:10</label>
                        <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="01" onchange="window.runScoreAnalysis()">1:9</label>
                        <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="02" onchange="window.runScoreAnalysis()">2:8</label>
                        <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="03" onchange="window.runScoreAnalysis()">3:7</label>
                        <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="04" onchange="window.runScoreAnalysis()">4:6</label>
                        <label class="score-checkbox-label"><input type="checkbox" class="score-ratio-cb" value="05" onchange="window.runScoreAnalysis()">5:5</label>
                    </div>
                </div>

                <div class="score-control-group" style="display: flex; align-items: center; gap: 0;">
                    <label class="score-control-label" style="margin-right: 8px;">許容差分閾値 (Δ)</label>
                    <div style="display: flex; align-items: stretch;">
                        <input type="text" id="scoreThreshold" value="0.50" class="score-input-number" style="width: 55px; border-right: none; border-radius: 4px 0 0 4px; z-index: 1;">
                        <select class="score-input-select" style="width: 24px; padding: 0; border-radius: 0 4px 4px 0; border-left: 1px solid #ccc; cursor: pointer; outline: none; margin-left: -1px; z-index: 2; appearance: none; -webkit-appearance: none; text-align: center; text-align-last: center;" onchange="let v=this.value; document.getElementById('scoreThreshold').value = (v==='ALL' ? 'ALL' : parseFloat(v).toFixed(2)); window.runScoreAnalysis(); this.selectedIndex = 0;">
                            <option value="" disabled selected hidden>▼</option>
                            <option value="ALL">&nbsp;&nbsp;全頭&nbsp;&nbsp;</option>
                            <option value="0.5">&nbsp;&nbsp;0.50&nbsp;&nbsp;</option>
                            <option value="1.0">&nbsp;&nbsp;1.00&nbsp;&nbsp;</option>
                            <option value="1.5">&nbsp;&nbsp;1.50&nbsp;&nbsp;</option>
                            <option value="2.0">&nbsp;&nbsp;2.00&nbsp;&nbsp;</option>
                        </select>
                    </div>
                    <button onclick="window.runScoreAnalysis()" style="padding: 4px 10px; background: #3498db; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; margin-left: 5px;">確定</button>
                </div>
            </div>
            <div id="scoreResultContainer" class="table-responsive score-table-container"></div>
        </div>
    `;
};