// ==========================================
// main.js
// ==========================================

window.onload = function() {
    let versionDisplay = document.getElementById('version-display');
    if (versionDisplay && window.SYSTEM_VERSION && window.LAST_UPDATED) {
        versionDisplay.style.textAlign = "left";
        versionDisplay.style.height = "auto";
        // 余白を他のブロック要素（20px）と統一
        versionDisplay.style.marginBottom = "20px";
        // <h3>タグの二重ネストを解消し、テキストとspanのみを代入
        versionDisplay.innerHTML = `システムバージョン: v${window.SYSTEM_VERSION} <span style="font-size: 11px; color: #666; font-weight: normal; margin-left: 10px;">(最終更新: ${window.LAST_UPDATED})</span>`;
    }
};

window.runAnalysis = async function() {
    const d1 = document.getElementById('data1').value;
    const d2 = document.getElementById('data2').value;
    const btn = document.getElementById('runBtn');
    const resultArea = document.getElementById('resultArea');

    if (!d1 || !d2) {
        alert("データ①とデータ②の両方を入力してください。");
        return;
    }

    btn.disabled = true;
    btn.innerText = "解析中...";
    resultArea.innerHTML = "";
    window.generatedPrompts = {};
    window.processedData = {};
    window.globalSortType = 'centralATV'; 
    window.globalCorrectionMode = 'centralATV';
    window.globalSortDirection = 'asc'; // 追加: ソート方向の初期化
    window.globalRatioId = '03'; // ステートのリセット

    try {
        const monthData = await window.detectRaceMonth(d1);
        setTimeout(() => {
            try {
                const { validHorseNames, target, horseBlocks } = window.parseAllData(d1, d2);
                
                target.is2yo = monthData.is2yo;
                target.raceMonth = monthData.month;

                const ratios = [
                    { f: 0.0, b: 1.0, id: '00' },
                    { f: 0.1, b: 0.9, id: '01' },
                    { f: 0.2, b: 0.8, id: '02' },
                    { f: 0.3, b: 0.7, id: '03' },
                    { f: 0.4, b: 0.6, id: '04' },
                    { f: 0.5, b: 0.5, id: '05' }
                ];

                let globalHasAuditIssues = false;

                ratios.forEach(ratio => {
                    const data = window.calculateATV(horseBlocks, validHorseNames, target, ratio);
                    window.processedData[ratio.id] = { ...data, target };

                    if (data.auditErrors.length > 0 || data.auditWarnings.length > 0) {
                        globalHasAuditIssues = true;
                    }

                    // プロンプト生成ロジックを prompt-builder.js へ委譲
                    window.generatedPrompts[ratio.id] = window.buildAuditPrompts(data, d1, d2, horseBlocks);
                });

                window.renderUI(target, globalHasAuditIssues);
                window.switchRatio(window.globalRatioId);

            } catch (e) {
                alert("エラーが発生しました: " + e.message);
                console.error(e);
            } finally {
                btn.disabled = false;
                // 解析実行ボタンのテキスト復元時、spanタグ構造を復元するように修正
                btn.innerHTML = `<span class="btn-text-pc">▶ 解析実行</span><span class="btn-text-sp">▶ 解析</span>`;
            }
        }, 50);
    } catch (e) {
        alert("日付判定処理でエラーが発生しました: " + e.message);
        console.error(e);
        btn.disabled = false;
        // エラー時のテキスト復元
        btn.innerHTML = `<span class="btn-text-pc">▶ 解析実行</span><span class="btn-text-sp">▶ 解析</span>`;
    }
};

window.switchRatio = function(id) {
    window.globalRatioId = id;
    // ステートの更新
    let radio = document.getElementById('ratio-' + id);
    if (radio) {
        radio.checked = true;
    }

    let tableContainer = document.getElementById('tableContainer');
    if (tableContainer) {
        tableContainer.innerHTML = window.renderAvgRanking(id);
    }

    let logContainer = document.getElementById('detailedLogContainer');
    if (logContainer) {
        logContainer.innerHTML = window.renderDetailedLog(id);
    }

    if (window.renderPromptArea) {
        window.renderPromptArea(id);
    }
};

window.handleHeaderClick = function(clickedSortType) {
    // 斤量(currentWeight)または脚質(pace)の場合のみトグル（昇順・降順切り替え）を有効化
    if (clickedSortType === 'currentWeight' || clickedSortType === 'pace') {
        if (window.globalSortType === clickedSortType) {
            // 同じ項目が連続クリックされた場合は方向を反転
            window.globalSortDirection = (window.globalSortDirection === 'asc') ? 'desc' : 'asc';
        } else {
            // 新規項目への切り替え時は昇順(asc)をデフォルトとする
            window.globalSortType = clickedSortType;
            window.globalSortDirection = 'asc';
        }
    } else {
        // その他の項目（ATVスコア等）は常に昇順(asc)固定とし、トグルは行わない
        window.globalSortDirection = 'asc';

        if (clickedSortType === 'centralATV') {
            window.globalSortType = 'centralATV';
            window.globalCorrectionMode = 'centralATV';
        } else if (clickedSortType === 'weightedATV') {
            window.globalSortType = 'weightedATV';
            window.globalCorrectionMode = 'weightedATV';
        } else if (clickedSortType === 'adjustedATV') {
            if (window.globalSortType === 'adjustedATV') {
                window.globalCorrectionMode = (window.globalCorrectionMode === 'centralATV') ? 'weightedATV' : 'centralATV';
            } else {
                window.globalSortType = 'adjustedATV';
            }
        } else {
            window.globalSortType = clickedSortType;
        }
    }

    // ステートを使用して再描画
    window.switchRatio(window.globalRatioId);
};