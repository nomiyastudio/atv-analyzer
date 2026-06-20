// ==========================================
// ui-component-score.js
// ==========================================

/**
 * 「多角展開スコア分析」ブロック（score-analysis-block）のHTMLマークアップを生成するコンポーネント
 * @returns {string} score-analysis-blockのHTML文字列
 */
window.renderScoreBlockHTML = function() {
    return `
        <div class="score-analysis-block">
            <h3>多角展開スコア分析</h3>
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

                <div class="score-control-group score-input-wrapper">
                    <label class="score-control-label">許容差分閾値 (Δ)</label>
                    <div class="score-select-combo">
                        <input type="text" id="scoreThreshold" value="0.50" class="score-input-number">
                        <select class="score-input-select" onchange="let v=this.value; document.getElementById('scoreThreshold').value = (v==='ALL' ? 'ALL' : parseFloat(v).toFixed(2)); window.runScoreAnalysis(); this.selectedIndex = 0;">
                            <option value="" disabled selected hidden>▼</option>
                            <option value="ALL">&nbsp;&nbsp;全頭&nbsp;&nbsp;</option>
                            <option value="0.5">&nbsp;&nbsp;0.50&nbsp;&nbsp;</option>
                            <option value="1.0">&nbsp;&nbsp;1.00&nbsp;&nbsp;</option>
                            <option value="1.5">&nbsp;&nbsp;1.50&nbsp;&nbsp;</option>
                            <option value="2.0">&nbsp;&nbsp;2.00&nbsp;&nbsp;</option>
                        </select>
                    </div>
                    <button class="score-submit-btn" onclick="window.runScoreAnalysis()">確定</button>
                </div>
            </div>
            <div id="scoreResultContainer" class="table-responsive score-table-container"></div>
        </div>
    `;
};