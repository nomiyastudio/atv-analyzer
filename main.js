window.saveProject = function() {
    const d1 = document.getElementById('data1').value;
    const d2 = document.getElementById('data2').value;

    if (!d1 || !d2) {
        alert("保存するデータ（入力欄）が不足しています。");
        return;
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    let location = "不明";
    let raceNo = "";
    let raceName = "";
    
    const lines = d1.split('\n').map(l => l.trim());
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        let mLoc = line.match(/(\d+)回\s+([^\s]+)\s+\d+日目/);
        if (mLoc && mLoc[2]) {
            location = mLoc[2].replace("競馬", "");
        }

        let mNo = line.match(/^(\d{1,2})R$/);
        if (mNo) {
            raceNo = mNo[1].padStart(2, '0') + "R";
            if (i + 2 < lines.length && lines[i+2].includes("発走")) {
                raceName = lines[i+1];
            }
        }
        if (location !== "不明" && raceNo && raceName) break;
    }

    let cleanRaceName = "";
    if (raceName) {
        cleanRaceName = raceName.replace(/[\\/:*?"<>|]/g, "").trim();
        if (cleanRaceName.length > 10) {
            cleanRaceName = cleanRaceName.substring(0, 10);
        }
    }

    let fileNameParts = ["ATV", location];
    if (raceNo) fileNameParts.push(raceNo);
    if (cleanRaceName) fileNameParts.push(cleanRaceName);
    fileNameParts.push(dateStr);

    const fileName = fileNameParts.join("_") + ".json";

    const projectData = {
        d1_raw: d1,
        d2_raw: d2,
        race_info: `${location}${raceNo}${cleanRaceName ? ' ' + cleanRaceName : ''}`,
        timestamp: now.toISOString(),
        version: window.SYSTEM_VERSION
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.loadProject = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.textContent || e.target.result);
            if (data.d1_raw && data.d2_raw) {
                document.getElementById('data1').value = data.d1_raw;
                document.getElementById('data2').value = data.d2_raw;
                window.runAnalysis();
            } else {
                throw new Error("ファイル形式が正しくありません。");
            }
        } catch (err) {
            alert("読み込みに失敗しました: " + err.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
};

window.pasteFromClipboard = async function(targetId) {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(targetId).value = text;
    } catch (err) {
        alert("クリップボードの読み取りに失敗しました。\n手動で貼り付けてください。");
    }
};

window.onload = function() {
    let versionDisplay = document.getElementById('version-display');
    if (versionDisplay && window.SYSTEM_VERSION && window.LAST_UPDATED) {
        versionDisplay.style.textAlign = "left";
        versionDisplay.style.height = "auto";
        versionDisplay.style.marginBottom = "20px";
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
    window.processedData = {};
    window.globalSortType = 'adjWeighted'; 
    window.globalSortDirection = 'asc';
    window.globalRatioId = '02';

    try {
        const monthData = await window.detectRaceMonth(d1);
        setTimeout(() => {
            try {
                const { validHorseNames, target, horseBlocks } = window.parseAllData(d1, d2);
                
                target.is2yo = monthData.is2yo;
                target.raceMonth = monthData.month;

                if (target.location && target.location !== "不明") {
                    try {
                        let tCourse = window.getCourseData(target.location, target.trackType, target.distance, target.classRank || "F");
                        if (tCourse && tCourse.ratioId) {
                            window.globalRatioId = tCourse.ratioId;
                        }
                    } catch (e) {
                    }
                }

                if (window.analyzeRacePace) {
                    target.predictedPace = window.analyzeRacePace(horseBlocks, validHorseNames, target);
                }

                const ratios = [
                    { f: 0.0, b: 1.0, id: '00' },
                    { f: 0.1, b: 0.9, id: '01' },
                    { f: 0.2, b: 0.8, id: '02' },
                    { f: 0.3, b: 0.7, id: '03' },
                    { f: 0.4, b: 0.6, id: '04' },
                    { f: 0.5, b: 0.5, id: '05' }
                ];

                let globalHasAuditIssues = false;
                let allAuditErrors = [];

                ratios.forEach(ratio => {
                    const data = window.calculateATV(horseBlocks, validHorseNames, target, ratio);
                    window.processedData[ratio.id] = { ...data, target };

                    if (data.auditErrors.length > 0 || data.auditWarnings.length > 0) {
                        globalHasAuditIssues = true;
                        data.auditErrors.forEach(err => {
                            if (!allAuditErrors.includes(err)) {
                                allAuditErrors.push(err);
                            }
                        });
                    }
                });

                window.renderUI(target, globalHasAuditIssues, allAuditErrors);
                window.switchRatio(window.globalRatioId);

            } catch (e) {
                alert("エラーが発生しました: " + e.message);
                console.error(e);
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<span class="btn-text-pc">▶ 解析実行</span><span class="btn-text-sp">▶ 解析</span>`;
            }
        }, 50);
    } catch (e) {
        alert("日付判定処理でエラーが発生しました: " + e.message);
        console.error(e);
        btn.disabled = false;
        btn.innerHTML = `<span class="btn-text-pc">▶ 解析実行</span><span class="btn-text-sp">▶ 解析</span>`;
    }
};

window.switchRatio = function(id) {
    window.globalRatioId = id;
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
};

window.handleHeaderClick = function(clickedSortType) {
    if (clickedSortType === 'currentWeight' || clickedSortType === 'pace') {
        if (window.globalSortType === clickedSortType) {
            window.globalSortDirection = (window.globalSortDirection === 'asc') ? 'desc' : 'asc';
        } else {
            window.globalSortType = clickedSortType;
            window.globalSortDirection = 'asc';
        }
    } else {
        window.globalSortDirection = 'asc';
        window.globalSortType = clickedSortType;
    }

    window.switchRatio(window.globalRatioId);
};

window.togglePaceMode = function() {
    window.useDynamicPace = !window.useDynamicPace;
    window.runAnalysis();
};