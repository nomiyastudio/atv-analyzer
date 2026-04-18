// ==========================================
// ui.js
// ==========================================
window.renderAvgRanking = function(ratioId) {
    let data = window.processedData[ratioId];
    if (!data) return "";
    let sortType = window.globalSortType;
    let correctionMode = window.globalCorrectionMode; // 'centralATV' or 'weightedATV'
    let target = data.target;
    let res = [...data.results];

    // ソートロジック
    res.sort((a, b) => {
        if (sortType === 'horseNo') {
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== bNo) return aNo - bNo;
            return a.horseName.localeCompare(b.horseName, 'ja');
        } else if (sortType === 'currentWeight') {
            let wA = a.currentWeight; let wB = b.currentWeight;
            if (wA !== wB) return wB - wA;
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== bNo) return aNo - bNo;
            return a.horseName.localeCompare(b.horseName, 'ja');
        } else if (sortType === 'pace') {
            let classA = a.styleClass !== null ? a.styleClass : 99;
            let classB = b.styleClass !== null ? b.styleClass : 99;
            if (classA !== classB) return classA - classB;
            let valA = a.avgPosRatio; let valB = b.avgPosRatio;
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1; if (valB === null) return -1;
            if (valA !== valB) return valA - valB;
            let cA = a.centralATV !== null ? a.centralATV : Infinity;
            let cB = b.centralATV !== null ? b.centralATV : Infinity;
            if (cA !== cB) return cA - cB;
            return parseInt(a.horseNo) - parseInt(b.horseNo);
        } else if (sortType === 'adjustedATV') {
            let valA = (correctionMode === 'centralATV') ? a.adjCentral : a.adjWeighted;
            let valB = (correctionMode === 'centralATV') ? b.adjCentral : b.adjWeighted;
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1; if (valB === null) return -1;
            if (valA !== valB) return valA - valB;
            return parseInt(a.horseNo) - parseInt(b.horseNo);
        } else {
            let valA = a[sortType]; let valB = b[sortType];
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1; if (valB === null) return -1;
            if (valA !== valB) return valA - valB;
            for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
                let atvA = a.validATVs.length > i ? a.validATVs[i].atv : Infinity;
                let atvB = b.validATVs.length > i ? b.validATVs[i].atv : Infinity;
                if(atvA !== atvB) return atvA - atvB;
            }
            return parseInt(a.horseNo) - parseInt(b.horseNo);
        }
    });

    let hasNige = res.some(h => h.styleClass === 1);
    let minPaceRatio = Infinity;
    if (!hasNige) {
        res.forEach(h => {
            if (h.styleClass === 2 && h.avgPosRatio !== null && h.avgPosRatio < minPaceRatio) {
                minPaceRatio = h.avgPosRatio;
            }
        });
    }

    let is2yo = target.is2yo || false;
    let raceMonth = target.raceMonth || null;
    let actualWeights = [];
    let baseWeights = [];

    const getAgeAllowance = (age, month, distance) => {
        if (age !== 3 || !month || month < 6 || month > 12) return 0.0;
        let distCat = 0;
        if (distance < 1400) distCat = 0;
        else if (distance <= 1600) distCat = 1;
        else if (distance < 2200) distCat = 2;
        else distCat = 3;
        const table = {
            6: [3.0, 3.0, 3.0, 4.0], 7: [2.0, 3.0, 3.0, 4.0], 8: [2.0, 2.0, 3.0, 3.0],
            9: [1.0, 2.0, 2.0, 3.0], 10: [0.0, 1.0, 2.0, 2.0], 11: [0.0, 1.0, 1.0, 2.0],
            12: [0.0, 0.0, 1.0, 1.0]
        };
        return table[month][distCat];
    };

    res.forEach(h => {
        let actualW = h.currentWeight;
        actualWeights.push(actualW);
        let sexAllowance = (h.sex === "牝" || h.sex === "牝馬") ? (!is2yo ? 2.0 : (raceMonth >= 10 ? 1.0 : 0.0)) : 0.0;
        let jockeyAllowance = {'☆':1.0, '△':2.0, '◇':2.0, '▲':3.0, '★':4.0}[h.jockeyMark] || 0.0;
        let ageAllowance = getAgeAllowance(h.age, raceMonth, target.distance);
        h.baseWeight = actualW + sexAllowance + jockeyAllowance + ageAllowance;
        baseWeights.push(h.baseWeight);
    });

    let isFlatRace = baseWeights.length > 0 && baseWeights.every(w => w === baseWeights[0]);
    let flatBaseWeight = isFlatRace ? baseWeights[0] : 0;
    let avgActualW = actualWeights.length > 0 ? actualWeights.reduce((a, b) => a + b, 0) / actualWeights.length : 0;

    // 各指標の1位（最小値）を取得
    let minCentralATV = Infinity;
    let minWeightedATV = Infinity;
    let minAdjCentral = Infinity;
    let minAdjWeighted = Infinity;
    res.forEach(h => {
        if (h.centralATV !== null && h.centralATV < minCentralATV) minCentralATV = h.centralATV;
        if (h.weightedATV !== null && h.weightedATV < minWeightedATV) minWeightedATV = h.weightedATV;
        if (h.adjCentral !== null && h.adjCentral < minAdjCentral) minAdjCentral = h.adjCentral;
        if (h.adjWeighted !== null && h.adjWeighted < minAdjWeighted) minAdjWeighted = h.adjWeighted;
    });

    let getThresholds = (key) => {
        let vals = res.map(r => r[key]).filter(v => v !== null).sort((a,b) => a - b);
        if(vals.length === 0) return { t1: 0, t2: 0 };
        let top = vals[0], mid = Math.floor(vals.length / 2);
        let median = vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
        let delta = Math.max(median - top, 0.01);
        return { t1: top + delta * 0.333, t2: top + delta * 0.666 };
    };

    let cThresh = getThresholds('centralATV');
    let wThresh = getThresholds('weightedATV');

    let adjTitle = (correctionMode === 'centralATV') ? '展開補正<br><span class="sort-desc">(安定)</span>' : '展開補正<br><span class="sort-desc">(ベスト)</span>';

    let html = `<table>
        <tr>
            <th class="col-waku sortable-header ${sortType === 'horseNo' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('horseNo')" title="枠番">枠</th>
            <th class="col-umaban sortable-header ${sortType === 'horseNo' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('horseNo')" title="馬番">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 2px;">馬番</div>
                    ${sortType === 'horseNo' ? '<span style="font-size:10px;color:var(--secondary-color); margin-top:2px;">▼</span>' : ''}
                </div>
            </th>
            <th>馬名</th>
            <th class="col-weight sortable-header ${sortType === 'currentWeight' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('currentWeight')" title="今回の斤量">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 2px;">斤量</div>
                    ${sortType === 'currentWeight' ? '<span style="font-size:10px;color:var(--secondary-color); margin-top:2px;">▼</span>' : ''}
                </div>
            </th>
            <th class="col-interval">間隔</th>
            <th class="col-narrow sortable-header ${sortType === 'pace' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('pace')" title="クリックで展開位置順にソート">
                脚質<br><span class="sort-desc">(%)</span>
                ${sortType === 'pace' ? '<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'adjustedATV' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('adjustedATV')" title="展開補正を加味したATV（クリックでベース切り替え）">
                ${adjTitle}
                ${sortType === 'adjustedATV' ? '<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'centralATV' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('centralATV')" title="中央加重でソート（展開補正も安定モードに同期）">
                中央加重<br><span class="sort-desc">(安定)</span>
                ${sortType === 'centralATV' ? '<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'weightedATV' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('weightedATV')" title="加重平均でソート（展開補正もベストモードに同期）">
                加重平均<br><span class="sort-desc">(ベスト)</span>
                ${sortType === 'weightedATV' ? '<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>`;

    for(let k=1; k<=data.maxDisplayRaces; k++) html += `<th>${k}走前</th>`;
    html += `</tr>`;

    let formatAtvDetail = (race, target) => {
        let locStr = race.pLoc === target.location ? `<span class="match-highlight">${race.pLoc}</span>` : race.pLoc;
        let distStr = race.pDist === target.distance ? `<span class="match-highlight">${race.pTrack}${race.pDist}m</span>` : `${race.pTrack}${race.pDist}m`;
        let limitMark = race.isLimited ? `<span style="color:#e74c3c; font-size:10px; font-weight:bold; margin-left:2px;">[限]</span>` : "";
        return `
            <div style="display:flex; justify-content:center; align-items:baseline; gap:4px; margin-bottom:2px;">
                <span style="font-size:10px; color:#888;">${isNaN(parseFloat(race.f3f)) ? "-" : parseFloat(race.f3f).toFixed(1)}</span>
                <span style="font-weight:bold; font-size:14px; color:var(--primary-color);">${race.atv.toFixed(2)}${limitMark}</span>
                <span style="font-size:10px; color:#888;">${isNaN(parseFloat(race.f3b)) ? "-" : parseFloat(race.f3b).toFixed(1)}</span>
            </div>
            <span style="font-size:10px; color:#666;">${race.date} ${locStr} ${race.pWeight.toFixed(1)}kg<br>${race.pCond} ${distStr}</span>`;
    };

    res.forEach((h) => {
        let cBg = (h.centralATV !== null) ? (h.centralATV <= cThresh.t1 ? '#a5d6a7' : (h.centralATV <= cThresh.t2 ? '#e8f5e9' : 'transparent')) : 'transparent';
        let wBg = (h.weightedATV !== null) ? (h.weightedATV <= wThresh.t1 ? '#90caf9' : (h.weightedATV <= wThresh.t2 ? '#e3f2fd' : 'transparent')) : 'transparent';
        let exceptionMark = h.onlyYoshiba ? `<br><span style="color:#e67e22; font-size:10px; font-weight:bold;">(洋)</span>` : (h.onlyNoshiba ? `<br><span style="color:#e67e22; font-size:10px; font-weight:bold;">(野)</span>` : "");
        let wakuColor = window.getWakuColor(h.horseNo, res.length);
        let diff = isFlatRace ? (h.currentWeight - flatBaseWeight) : (h.currentWeight - avgActualW);
        let wCol = (diff <= -2.5 || diff >= 2.5) ? (diff < 0 ? '#0055ff' : '#e74c3c') : (diff <= -1.5 || diff >= 1.5 ? (diff < 0 ? '#0077cc' : '#e67e22') : '#555555');
        let isPaceSetter = hasNige ? (h.styleClass === 1) : (h.styleClass === 2 && h.avgPosRatio === minPaceRatio && h.avgPosRatio !== null);
        let paceTdStyle = `text-align:center; vertical-align:middle; padding:4px; border:1px solid var(--border-color);` + (isPaceSetter ? `background-color: #fff3e0; background-image: repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,167,38,0.15) 8px, rgba(255,167,38,0.15) 16px); box-shadow: inset 0 0 0 2px #ffa726; border: 1px solid #ff9800;` : ``);

        // 現在の補正モードに基づく補正値・順位・1位差の決定
        let displayAdj = (correctionMode === 'centralATV') ? h.adjCentral : h.adjWeighted;
        let displayAdjRank = (correctionMode === 'centralATV') ? h.adjCentralRank : h.adjWeightedRank;
        let minAdj = (correctionMode === 'centralATV') ? minAdjCentral : minAdjWeighted;

        html += `<tr>
            <td style="background-color:${wakuColor.bg}; color:${wakuColor.text}; border:1px solid ${wakuColor.border}; font-weight:bold; font-size:14px;">${wakuColor.waku}</td>
            <td style="font-weight: ${sortType === 'horseNo' ? 'bold' : 'normal'}; font-size:14px;">${h.horseNo}</td>
            <td class="align-left">${h.horseName}${exceptionMark}</td>
            <td style="text-align:center; font-size:13px;"><span style="color:${wCol}; font-weight:bold;">${h.currentWeight.toFixed(1)}</span></td>
            <td style="text-align:center;">${h.intervalHtml}</td>
            <td style="${paceTdStyle}">
                ${(h.styleClass !== null) ? `
                <div class="pace-badge-wrapper" style="--badge-color: ${window.rgbToHex(window.getColorFromStops(window.paceStops, h.avgPosRatio*100))};">
                    <div class="pace-shape ${['','shape-nige','shape-senko','shape-sashi','shape-oikomi'][h.styleClass]}">${h.styleName.charAt(0)}</div>
                    <span class="pace-pct-text">${(h.avgPosRatio*100).toFixed(0)}%</span>
                </div>` : "-"}
            </td>
            <td style="font-weight:bold; font-size:15px; background:#fbfcfc;">
                ${displayAdj !== null ? displayAdj.toFixed(2) : "-"}
                <div style="font-size:11px; margin-top:2px;">
                    <span style="color:${parseInt(displayAdjRank)<=3?'#111':'#666'}; font-weight:${parseInt(displayAdjRank)<=3?'bold':'normal'};">${displayAdjRank}位</span><br>
                    <span style="font-weight:normal; color:#666;">${(displayAdj !== null && minAdj !== Infinity && displayAdj > minAdj) ? '△'+(displayAdj-minAdj).toFixed(2) : '-'}</span>
                </div>
            </td>
            <td style="font-weight:bold; font-size:15px; background:${cBg};">
                ${h.centralATV !== null ? h.centralATV.toFixed(2) : "-"}
                <div style="font-size:11px; margin-top:2px;">
                    <span style="color:${parseInt(h.centralRank)<=3?'#111':'#666'}; font-weight:${parseInt(h.centralRank)<=3?'bold':'normal'};">${h.centralRank}位</span><br>
                    <span style="font-weight:normal; color:#666;">${(h.centralATV !== null && minCentralATV !== Infinity && h.centralATV > minCentralATV) ? '△'+(h.centralATV-minCentralATV).toFixed(2) : '-'}</span>
                </div>
            </td>
            <td style="font-weight:bold; font-size:15px; background:${wBg};">
                ${h.weightedATV !== null ? h.weightedATV.toFixed(2) : "-"}
                <div style="font-size:11px; margin-top:2px;">
                    <span style="color:${parseInt(h.weightedRank)<=3?'#111':'#666'}; font-weight:${parseInt(h.weightedRank)<=3?'bold':'normal'};">${h.weightedRank}位</span><br>
                    <span style="font-weight:normal; color:#666;">${(h.weightedATV !== null && minWeightedATV !== Infinity && h.weightedATV > minWeightedATV) ? '△'+(h.weightedATV-minWeightedATV).toFixed(2) : '-'}</span>
                </div>
            </td>`;

        for(let j=1; j<=data.maxDisplayRaces; j++) {
            let race = h.pastRaces.find(r => r.idx === j);
            if (race && race.valid) {
                let bgCls = '';
                if (sortType === 'weightedATV' || (sortType === 'adjustedATV' && correctionMode === 'weightedATV')) {
                    let idx = h.validATVs.findIndex(v => v.idx === race.idx);
                    bgCls = idx < 3 ? `class="highlight-rank-${idx+1}"` : '';
                } else if (sortType === 'centralATV' || (sortType === 'adjustedATV' && correctionMode === 'centralATV')) {
                    bgCls = h.centralAdopted.some(t => t.idx === race.idx) ? `class="highlight-trim-main"` : (h.centralOutliers.some(t => t.idx === race.idx) ? `class="highlight-trim-sub"` : '');
                }
                html += `<td ${bgCls}>${formatAtvDetail(race, data.target)}</td>`;
            } else {
                html += `<td>${race ? `<span class="skip-text">除外<br>(${race.reason})</span>` : "-"}</td>`;
            }
        }
        html += `</tr>`;
    });
    return html + `</table>`;
};

window.renderDetailedLog = function(ratioId) {
    let data = window.processedData[ratioId];
    if (!data || data.auditErrors.length > 0) return "";
    let originalResults = [...data.results].sort((a, b) => (parseInt(a.horseNo) || 999) - (parseInt(b.horseNo) || 999));
    
    let logHtml = `<div class="table-responsive"><table class="log-table"><tr><th>走</th><th>日付</th><th>判定</th><th>前3F</th><th>後3F</th><th>距離補正<br>(distMod)</th><th>馬場補正<br>(surfMod)</th><th>斤量補正<br>(wghtMod)</th><th>場所補正<br>(locMod)</th><th>クラス補正<br>(classMod)</th><th>条件補正<br>(condMod)</th><th style="background:#eaf2f8;">ATV(0.0)</th><th style="background:#eaf2f8;">ATV(0.1)</th><th style="background:#eaf2f8;">ATV(0.2)</th><th style="background:#eaf2f8;">ATV(0.3)</th><th style="background:#eaf2f8;">ATV(0.4)</th><th style="background:#eaf2f8;">ATV(0.5)</th></tr>`;
    
    originalResults.forEach(h => {
        logHtml += `<tr><td colspan="17" class="align-left" style="background:#f4f6f7; font-weight:bold; color:var(--primary-color);">(${h.horseNo}) ${h.horseName}</td></tr>`;
        h.pastRaces.forEach(r => {
            if (r.valid) {
                let getAtv = (id) => { 
                    let res = window.processedData[id].results.find(res => res.horseNo === h.horseNo); 
                    return res ? res.pastRaces.find(pr => pr.idx === r.idx).atv.toFixed(2) : "-"; 
                };
                
                logHtml += `<tr>
                    <td>${r.idx}走</td>
                    <td>${r.date}</td>
                    <td class="success">✓</td>
                    <td>${parseFloat(r.f3f).toFixed(1)}</td>
                    <td>${parseFloat(r.f3b).toFixed(1)}</td>
                    <td>${r.distMod.toFixed(3)}</td>
                    <td>${r.surfMod.toFixed(3)}</td>
                    <td>${r.wghtMod.toFixed(3)}</td>
                    <td>${r.locMod.toFixed(2)}</td>
                    <td>${r.classMod.toFixed(2)}</td>
                    <td>${r.condMod.toFixed(3)}</td>
                    <td style="font-weight:bold;">${getAtv('00')}</td>
                    <td style="font-weight:bold;">${getAtv('01')}</td>
                    <td style="font-weight:bold;">${getAtv('02')}</td>
                    <td style="font-weight:bold;">${getAtv('03')}</td>
                    <td style="font-weight:bold;">${getAtv('04')}</td>
                    <td style="font-weight:bold;">${getAtv('05')}</td>
                </tr>`;
            } else {
                logHtml += `<tr><td>${r.idx}走</td><td>${r.date}</td><td class="error">×</td><td colspan="14" class="align-left">スキップ: ${r.reason}</td></tr>`;
            }
        });
    });
    return logHtml + `</table></div>`;
};

// --- 多角展開スコア分析のテーブル描画ロジック ---
window.renderScoreResultTable = function(sortedScores, selectedRatios, totalHorses) {
    // 修正: styleから width:100%; を削除
    let html = `<table style="border-collapse:collapse; font-size:13px; text-align:center;">
        <tr>
            <th class="col-score-rank">順位</th>
            <th class="col-score-waku">枠</th>
            <th class="col-score-umaban">馬番</th>
            <th class="col-score-name">馬名</th>
            <th class="col-score-total">合計スコア</th>`;
    
    selectedRatios.forEach(r => {
        let label = {'00':'0:10', '01':'1:9', '02':'2:8', '03':'3:7', '04':'4:6', '05':'5:5'}[r];
        html += `<th class="col-score-ratio">${label}</th>`;
    });
    html += `</tr>`;

    let rank = 1;
    sortedScores.forEach((h, index) => {
        if (index > 0 && h.totalScore < sortedScores[index - 1].totalScore) rank = index + 1;
        let wakuColor = window.getWakuColor(h.horseNo, totalHorses);
        
        html += `<tr>
            <td style="font-weight:bold; color:#555;">${h.totalScore > 0 ? rank : '-'}</td>
            <td style="background-color:${wakuColor.bg}; color:${wakuColor.text}; border:1px solid ${wakuColor.border}; font-weight:bold;">${wakuColor.waku}</td>
            <td style="font-weight:bold;">${h.horseNo}</td>
            <td class="align-left" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${h.horseName}</td>
            <td style="font-weight:bold; font-size:15px; color:var(--primary-color); background:#fbfcfc;">${h.totalScore.toFixed(1)}</td>`;
        
        selectedRatios.forEach(r => {
            let pts = h.scores[r];
            let color = pts >= 80 ? '#e74c3c' : (pts >= 50 ? '#e67e22' : '#555');
            let fw = pts >= 50 ? 'bold' : 'normal';
            html += `<td style="color:${color}; font-weight:${fw};">${pts > 0 ? pts.toFixed(1) : '0.0'}</td>`;
        });
        
        html += `</tr>`;
    });
    html += `</table>`;

    let container = document.getElementById('scoreResultContainer');
    if (container) {
        container.innerHTML = html;
    }
};