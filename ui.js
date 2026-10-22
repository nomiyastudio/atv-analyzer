window.getWakuColor = function(horseNo, totalHorses) {
    let no = parseInt(horseNo, 10);
    let waku = 0;
    
    if (isNaN(no) || totalHorses < 1) return { waku: "-", bg: "#ffffff", text: "#333333", border: "#cccccc" };
    if (totalHorses <= 8) {
        waku = no;
    } else {
        let brackets = [0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < totalHorses; i++) {
            brackets[7 - (i % 8)]++;
        }
        let currentWaku = 1;
        let countInWaku = 0;
        for (let i = 1; i <= totalHorses; i++) {
            if (i === no) {
                waku = currentWaku;
                break;
            }
            countInWaku++;
            if (countInWaku >= brackets[currentWaku - 1]) {
                currentWaku++;
                countInWaku = 0;
            }
        }
    }

    const colors = {
        1: { bg: '#f7f7f7', text: '#333333', border: '#e0e0e0' },
        2: { bg: '#333333', text: '#ffffff', border: '#333333' },
        3: { bg: '#e95556', text: '#ffffff', border: '#e95556' },
        4: { bg: '#2d66b4', text: '#ffffff', border: '#2d66b4' },
        5: { bg: '#f4d002', text: '#333333', border: '#f4d002' },
        6: { bg: '#32a641', text: '#ffffff', border: '#32a641' },
        7: { bg: '#f08f22', text: '#333333', border: '#f08f22' },
        8: { bg: '#f4a1bb', text: '#333333', border: '#f4a1bb' }
    };
    if (waku >= 1 && waku <= 8) {
        return { waku: waku, ...colors[waku] };
    }
    return { waku: "-", bg: '#ffffff', text: '#333333', border: '#cccccc' };
};

window.paceStops = [
    { pct: 0, color: [211, 84, 0] },
    { pct: 33, color: [241, 196, 15] },
    { pct: 66, color: [107, 142, 35] },
    { pct: 100, color: [27, 79, 114] }
];

window.getColorFromStops = function(stops, pct) {
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
        if (pct >= stops[i].pct && pct <= stops[i + 1].pct) {
            lower = stops[i];
            upper = stops[i + 1];
            break;
        }
    }
    if (lower === upper) return lower.color;
    let range = upper.pct - lower.pct;
    let ratio = (pct - lower.pct) / range;
    let r = Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * ratio);
    let g = Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * ratio);
    let b = Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * ratio);
    return [r, g, b];
};

window.rgbToHex = function(rgb) {
    return "#" + rgb.map(x => {
        let hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
};

window.getTextColor = function(rgb) {
    return "#ffffff";
};

window.darken = function(rgb) {
    return rgb.map(x => Math.max(0, Math.floor(x * 0.8)));
};

window.toggleRuler = function() {
    const ruler = document.getElementById('ui-ruler-v4');
    const btn = document.getElementById('rulerToggleBtn');
    if (!ruler || !btn) return;

    const isHidden = ruler.classList.toggle('hidden-element');
    document.body.classList.toggle('ruler-active', !isHidden);
    btn.textContent = isHidden ? "▼" : "▲";
};

window.drawRulerLabels = function() {
    const ticksContainer = document.getElementById('ruler-ticks-container');
    if (!ticksContainer) return;
    ticksContainer.innerHTML = '';
    for (let i = 100; i <= 4000; i += 100) {
        const label = document.createElement('div');
        label.className = 'ruler-label';
        label.style.left = i + 'px';
        label.textContent = i;
        ticksContainer.appendChild(label);
    }
};

window.addEventListener('load', window.drawRulerLabels);

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

window.renderPaceBlockHTML = function(target) {
    let paceHtml = `<div class="pace-grid">`;
    let results03 = window.processedData['03']?.results || [];
    let totalHorses = results03.length;
    const paceStyles = [
        {class: 1, name: "逃げ", border: "#d35400"},
        {class: 2, name: "先行", border: "#f1c40f"},
        {class: 3, name: "差し", border: "#6b8e23"},
        {class: 4, name: "追込", border: "#1b4f72"}
    ];
    paceStyles.forEach(s => {
        let horses = results03.filter(h => h.styleClass === s.class).sort((a,b) => (a.avgPosRatio || 0) - (b.avgPosRatio || 0));
        paceHtml += `<div class="pace-group-card" style="border-color: ${s.border};">
            <h4 class="pace-group-title" style="color: ${s.border}; border-bottom-color: ${s.border};">${s.name}</h4>
            <ul class="pace-group-list">`;

        if (horses.length === 0) {
             paceHtml += `<li class="pace-empty-text">不在</li>`;
        } else {
            horses.forEach(h => {
                let pct = (h.avgPosRatio !== null) ? h.avgPosRatio * 100 : 50;
                let rgb = window.getColorFromStops(window.paceStops, pct);
                let hex = window.rgbToHex(rgb);
                let textCol = window.getTextColor(rgb);
                let borderCol = window.rgbToHex(window.darken(rgb));
                let wColor = window.getWakuColor(h.horseNo, totalHorses);
                let wakuBadge = `<span class="waku-badge-ui" style="background-color:${wColor.bg}; color:${wColor.text}; border-color:${wColor.border};">${h.horseNo}</span>`;
                paceHtml += `<li class="pace-horse-item" title="${h.horseNo}. ${h.horseName}">
                    ${wakuBadge}
                    <span class="pace-horse-name" style="background-color:${hex}; color:${textCol}; border-color:${borderCol};">${h.horseName}</span>
                </li>`;
            });
        }
        paceHtml += `</ul></div>`;
    });

    paceHtml += `</div>`;
    return `
        <div class="pace-pattern-block">
            <h3 class="pace-block-title">展開予想 (脚質グルーピング)</h3>
            ${paceHtml}
        </div>
    `;
};

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

window.sortHorseResults = function(res, sortType, globalSortDirection) {
    return res.sort((a, b) => {
        if (sortType === 'horseNo') {
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== bNo) return aNo - bNo;
            return a.horseId.localeCompare(b.horseId);
        } else if (sortType === 'currentWeight') {
            let wA = a.currentWeight; let wB = b.currentWeight;
            if (wA !== wB) {
                return globalSortDirection === 'desc' ? wB - wA : wA - wB;
            }
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== bNo) return aNo - bNo;
            return a.horseId.localeCompare(b.horseId);
        } else if (sortType === 'pace') {
            let classA = a.styleClass !== null ? a.styleClass : 99;
            let classB = b.styleClass !== null ? b.styleClass : 99;
            if (classA !== classB) {
                return globalSortDirection === 'desc' ? classB - classA : classA - classB;
            }
            let valA = a.avgPosRatio;
            let valB = b.avgPosRatio;
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
            if (valB === null) return -1;
            if (valA !== valB) {
                return globalSortDirection === 'desc' ? valB - valA : valA - valB;
            }
            let cA = a.centralATV !== null ? a.centralATV : Infinity;
            let cB = b.centralATV !== null ? b.centralATV : Infinity;
            if (cA !== cB) return cA - cB;
            
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== bNo) return aNo - bNo;
            return a.horseId.localeCompare(b.horseId);
        } else {
            let valA = a[sortType];
            let valB = b[sortType];
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
            if (valB === null) return -1;
            if (valA !== valB) return valA - valB;
            for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
                let atvA = a.validATVs.length > i ? a.validATVs[i].atv : Infinity;
                let atvB = b.validATVs.length > i ? b.validATVs[i].atv : Infinity;
                if(atvA !== atvB) return atvA - atvB;
            }
            
            let aNo = parseInt(a.horseNo);
            let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== bNo) return aNo - bNo;
            return a.horseId.localeCompare(b.horseId);
        }
    });
};

window.formatAtvDetail = function(race, target) {
    let locStr = race.pLoc === target.location ? `<span class="match-highlight">${race.pLoc}</span>` : race.pLoc;
    let distStr = race.pDist === target.distance ? `<span class="match-highlight">${race.pTrack}${race.pDist}m</span>` : `${race.pTrack}${race.pDist}m`;
    let limitMark = race.isLimited ? `<span style="color:#e74c3c; font-size:10px; font-weight:bold; margin-left:2px;">[限]</span>` : "";
    
    let passedMark = "";
    if (race.passedCount !== null && race.passedCount !== undefined) {
        if (race.passedCount > 0) {
            passedMark = ` <span style="color:#e74c3c; font-weight:bold;">↑${race.passedCount}</span>`;
        } else if (race.passedCount === 0) {
            passedMark = ` <span style="color:#7f8c8d;">±0</span>`;
        }
    }

    return `
        <div style="display:flex; justify-content:center; align-items:baseline; gap:4px; margin-bottom:2px;">
            <span style="font-size:10px; color:#888;">${isNaN(parseFloat(race.f3f)) ? "-" : parseFloat(race.f3f).toFixed(1)}</span>
            <span style="font-weight:bold; font-size:14px; color:var(--primary-color);">${race.atv.toFixed(2)}${limitMark}</span>
            <span style="font-size:10px; color:#888;">${isNaN(parseFloat(race.f3b)) ? "-" : parseFloat(race.f3b).toFixed(1)}</span>
        </div>
        <span style="font-size:10px; color:#666;">${race.date} ${locStr} ${race.pWeight.toFixed(1)}kg<br>${race.pCond} ${distStr}${passedMark}</span>`;
};

window.renderAvgRanking = function(ratioId) {
    let data = window.processedData[ratioId];
    if (!data) return "";
    let sortType = window.globalSortType;
    let target = data.target;
    let res = [...data.results];
    res = window.sortHorseResults(res, sortType, window.globalSortDirection);

    let hasNige = res.some(h => h.styleClass === 1);
    let minPaceRatio = Infinity;
    if (!hasNige) {
        res.forEach(h => {
            if (h.styleClass === 2 && h.avgPosRatio !== null && h.avgPosRatio < minPaceRatio) {
                minPaceRatio = h.avgPosRatio;
            }
        });
    }

    let weightAnalysis = window.analyzeWeightRule(res, target);
    let isFlatRace = weightAnalysis.isFlatRace;
    let avgActualW = weightAnalysis.avgActualW;

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

    let awThresh = getThresholds('adjWeighted');
    let acThresh = getThresholds('adjCentral');
    let wThresh = getThresholds('weightedATV');
    let cThresh = getThresholds('centralATV');

    let html = `<table>
        <tr>
            <th class="col-waku sortable-header ${sortType === 'horseNo' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('horseNo')" title="枠番">枠</th>
            <th class="col-umaban sortable-header ${sortType === 'horseNo' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('horseNo')" title="馬番">
                <div class="header-v-align">
                    <div class="v-text-spacing">馬番</div>
                    ${sortType === 'horseNo' ? '<span class="sort-indicator">▼</span>' : ''}
                </div>
            </th>
            <th>馬名</th>
            <th class="col-weight sortable-header ${sortType === 'currentWeight' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('currentWeight')" title="今回の斤量">
                <div class="header-v-align">
                    <div class="v-text-spacing">斤量</div>
                    ${sortType === 'currentWeight' ? `<span class="sort-indicator">${window.globalSortDirection === 'desc' ? '▼' : '▲'}</span>` : ''}
                </div>
            </th>
            <th class="col-interval">間隔</th>
            <th class="col-narrow sortable-header ${sortType === 'pace' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('pace')" title="クリックで展開位置順にソート">
                脚質<br><span class="sort-desc">(%)</span>
                ${sortType === 'pace' ? `<br><span class="sort-indicator">${window.globalSortDirection === 'desc' ? '▼' : '▲'}</span>` : ''}
            </th>
            <th class="col-passed" title="平均位置変化（追い抜き頭数）">変化</th>
            <th class="sortable-header ${sortType === 'adjWeighted' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('adjWeighted')" title="展開補正(ベスト)でソート">
                展開補正<br><span class="sort-desc">(ベスト)</span>
                ${sortType === 'adjWeighted' ? '<br><span class="sort-indicator">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'adjCentral' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('adjCentral')" title="展開補正(安定)でソート">
                展開補正<br><span class="sort-desc">(安定)</span>
                ${sortType === 'adjCentral' ? '<br><span class="sort-indicator">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'weightedATV' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('weightedATV')" title="加重平均でソート">
                加重平均<br><span class="sort-desc">(ベスト)</span>
                ${sortType === 'weightedATV' ? '<br><span class="sort-indicator">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'centralATV' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('centralATV')" title="中央加重でソート">
                中央加重<br><span class="sort-desc">(安定)</span>
                ${sortType === 'centralATV' ? '<br><span class="sort-indicator">▼</span>' : ''}
            </th></tr>`;
    res.forEach((h) => {
        let awStyle = (h.adjWeighted !== null) ? (h.adjWeighted <= awThresh.t1 ? 'background-color: var(--bg-aw-1); border-color: var(--bd-aw-1); font-weight: bold; color: #111;' : (h.adjWeighted <= awThresh.t2 ? 'background-color: var(--bg-aw-2); border-color: var(--bd-aw-2);' : '')) : '';
        let acStyle = (h.adjCentral !== null) ? (h.adjCentral <= acThresh.t1 ? 'background-color: var(--bg-ac-1); border-color: var(--bd-ac-1); font-weight: bold; color: #111;' : (h.adjCentral <= acThresh.t2 ? 'background-color: var(--bg-ac-2); border-color: var(--bd-ac-2);' : '')) : '';
        let wStyle = (h.weightedATV !== null) ? (h.weightedATV <= wThresh.t1 ? 'background-color: var(--bg-w-1); border-color: var(--bd-w-1); font-weight: bold; color: #111;' : (h.weightedATV <= wThresh.t2 ? 'background-color: var(--bg-w-2); border-color: var(--bd-w-2);' : '')) : '';
        let cStyle = (h.centralATV !== null) ? (h.centralATV <= cThresh.t1 ? 'background-color: var(--bg-c-1); border-color: var(--bd-c-1); font-weight: bold; color: #111;' : (h.centralATV <= cThresh.t2 ? 'background-color: var(--bg-c-2); border-color: var(--bd-c-2);' : '')) : '';
        let isTargetYoshiba = ["札幌", "函館"].includes(target.location);
        let exceptionMark = (isTargetYoshiba && h.onlyNoshiba) ? `<br><span class="exception-warning-text">⚠️洋未経験</span>` : "";
        let wakuColor = window.getWakuColor(h.horseNo, res.length);
  
        let diff = isFlatRace ? -((h.jockeyAllowance || 0) + (h.ageAllowance || 0)) : (h.currentWeight - avgActualW);
        let weightClass = (diff <= -2.5 || diff >= 2.5) ? (diff < 0 ? 'weight-diff-major-negative' : 'weight-diff-major-positive') : ((diff <= -1.5 || diff >= 1.5 ? (diff < 0 ? 'weight-diff-minor-negative' : 'weight-diff-minor-positive') : 'weight-diff-normal'));
        let isPaceSetter = hasNige ? (h.styleClass === 1) : (h.styleClass === 2 && h.avgPosRatio === minPaceRatio && h.avgPosRatio !== null);
        let paceTdClass = isPaceSetter ? "pace-td-setter" : "pace-td-normal";
        html += `<tr>
            <td class="waku-cell-box" style="background-color:${wakuColor.bg}; color:${wakuColor.text}; border-color:${wakuColor.border};">${wakuColor.waku}</td>
            <td class="umaban-cell-box ${sortType === 'horseNo' ? 'font-weight-bold' : ''}">${h.horseNo}</td>
            <td class="align-left">${h.horseName}${exceptionMark}</td>
            <td class="weight-cell-box"><span class="${weightClass}">${h.currentWeight.toFixed(1)}</span></td>
            <td>${h.intervalHtml}</td>
            <td class="${paceTdClass}">
                ${(h.styleClass !== null) ?
                `
                <div class="pace-badge-wrapper">
                    <div class="pace-text-area">
                        <span class="pace-style-name">${h.styleName}</span>
                        <span class="pace-pct-text">${(h.avgPosRatio * 100).toFixed(0)}%</span>
                    </div>
                    <div class="pace-gauge-v">
                        <div class="pace-gauge-pointer" style="top: ${(h.avgPosRatio * 100).toFixed(1)}%;"></div>
                    </div>
                </div>
                ` : "-"}
            </td>
            <td class="col-passed">
                ${(h.styleClass !== null) ?
                `
                <span class="${h.avgPassedCount > 0 ? 'passed-count-positive' : 'passed-count-neutral'}">
                    ${h.avgPassedCount > 0 ? '↑' + h.avgPassedCount.toFixed(1) : '±0'}
                </span>
                ` : "-"}
            </td>
            <td class="atv-rank-cell" style="${awStyle}">
                ${h.adjWeighted !== null ? h.adjWeighted.toFixed(2) : "-"}
                <div class="rank-sub-info">
                    <span class="${parseInt(h.adjWeightedRank)<=3?'rank-top-three':'rank-other'}">${h.adjWeightedRank}位</span><br>
                    <span class="rank-delta-text">${(h.adjWeighted !== null && minAdjWeighted !== Infinity && h.adjWeighted > minAdjWeighted) ? '△'+(h.adjWeighted-minAdjWeighted).toFixed(2) : '-'}</span>
                </div>
            </td>
            <td class="atv-rank-cell" style="${acStyle}">
                ${h.adjCentral !== null ? h.adjCentral.toFixed(2) : "-"}
                <div class="rank-sub-info">
                    <span class="${parseInt(h.adjCentralRank)<=3?'rank-top-three':'rank-other'}">${h.adjCentralRank}位</span><br>
                    <span class="rank-delta-text">${(h.adjCentral !== null && minAdjCentral !== Infinity && h.adjCentral > minAdjCentral) ? '△'+(h.adjCentral-minAdjCentral).toFixed(2) : '-'}</span>
                </div>
            </td>
            <td class="atv-rank-cell" style="${wStyle}">
                ${h.weightedATV !== null ? h.weightedATV.toFixed(2) : "-"}
                <div class="rank-sub-info">
                    <span class="${parseInt(h.weightedRank)<=3?'rank-top-three':'rank-other'}">${h.weightedRank}位</span><br>
                    <span class="rank-delta-text">${(h.weightedATV !== null && minWeightedATV !== Infinity && h.weightedATV > minWeightedATV) ? '△'+(h.weightedATV-minWeightedATV).toFixed(2) : '-'}</span>
                </div>
            </td>
            <td class="atv-rank-cell" style="${cStyle}">
                ${h.centralATV !== null ? h.centralATV.toFixed(2) : "-"}
                <div class="rank-sub-info">
                    <span class="${parseInt(h.centralRank)<=3?'rank-top-three':'rank-other'}">${h.centralRank}位</span><br>
                    <span class="rank-delta-text">${(h.centralATV !== null && minCentralATV !== Infinity && h.centralATV > minCentralATV) ? '△'+(h.centralATV-minCentralATV).toFixed(2) : '-'}</span>
                </div>
            </td>`;
        for(let j=1; j<=data.maxDisplayRaces; j++) {
            let race = h.pastRaces.find(r => r.idx === j);
            if (race && race.valid) {
                let bgCls = '';
                if (sortType === 'weightedATV') {
                    let idx = h.validATVs.findIndex(v => v.idx === race.idx);
                    bgCls = idx < 3 ? `class="hl-weighted-${idx+1}"` : '';
                } else if (sortType === 'adjWeighted') {
                    let idx = h.validATVs.findIndex(v => v.idx === race.idx);
                    bgCls = idx < 3 ? `class="hl-adj-weighted-${idx+1}"` : '';
                } else if (sortType === 'centralATV') {
                    bgCls = h.centralAdopted.some(t => t.idx === race.idx) ? `class="hl-central-adopt"` : (h.centralOutliers.some(t => t.idx === race.idx) ? `class="hl-central-out"` : '');
                } else if (sortType === 'adjCentral') {
                    bgCls = h.centralAdopted.some(t => t.idx === race.idx) ? `class="hl-adj-central-adopt"` : (h.centralOutliers.some(t => t.idx === race.idx) ? `class="hl-adj-central-out"` : '');
                }
                
                html += `<td ${bgCls}>${window.formatAtvDetail(race, data.target)}</td>`;
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
    
    let logHtml = `<div class="table-responsive"><table class="log-table"><tr><th>走</th><th>日付</th><th>判定</th><th>前3F</th><th>後3F</th><th>距離補正<br>(distMod)</th><th>馬場補正<br>(surfMod)</th><th>斤量補正<br>(wghtMod)</th><th>場所補正<br>(locMod)</th><th>クラス補正<br>(classMod)</th><th>条件補正<br>(condMod)</th><th class="log-th-ratio">ATV(0.0)</th><th class="log-th-ratio">ATV(0.1)</th><th class="log-th-ratio">ATV(0.2)</th><th class="log-th-ratio">ATV(0.3)</th><th class="log-th-ratio">ATV(0.4)</th><th class="log-th-ratio">ATV(0.5)</th></tr>`;
    
    originalResults.forEach(h => {
        logHtml += `<tr><td colspan="17" class="align-left log-horse-title">(${h.horseNo}) ${h.horseName}</td></tr>`;
        h.pastRaces.forEach(r => {
            if (r.valid) {
                let getAtv = (id) => { 
                    let res = window.processedData[id].results.find(res => res.horseId === h.horseId); 
                    let pr = res ? res.pastRaces.find(pr => pr.idx === r.idx) : null;
                    return (pr && pr.atv != null) ? pr.atv.toFixed(2) : "-";
                };
                
                logHtml += `<tr>
                    <td>${r.idx}走</td>
                    <td>${r.date}</td>
                    <td class="success">✓</td>
                    <td>${isNaN(parseFloat(r.f3f)) ? "-" : parseFloat(r.f3f).toFixed(1)}</td>
                    <td>${isNaN(parseFloat(r.f3b)) ? "-" : parseFloat(r.f3b).toFixed(1)}</td>
                    <td>${r.distMod.toFixed(3)}</td>
                    <td>${r.surfMod.toFixed(3)}</td>
                    <td>${r.wghtMod.toFixed(3)}</td>
                    <td>${r.locMod.toFixed(2)}</td>
                    <td>${r.classMod.toFixed(2)}</td>
                    <td>${r.condMod.toFixed(3)}</td>
                    <td class="log-atv-bold">${getAtv('00')}</td>
                    <td class="log-atv-bold">${getAtv('01')}</td>
                    <td class="log-atv-bold">${getAtv('02')}</td>
                    <td class="log-atv-bold">${getAtv('03')}</td>
                    <td class="log-atv-bold">${getAtv('04')}</td>
                    <td class="log-atv-bold">${getAtv('05')}</td>
                </tr>`;
            } else {
                logHtml += `<tr><td>${r.idx}走</td><td>${r.date}</td><td class="error">×</td><td colspan="14" class="align-left">スキップ: ${r.reason}</td></tr>`;
            }
        });
    });
    return logHtml + `</table></div>`;
};

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

window.runScoreAnalysis = function() {
    let metrics = Array.from(document.querySelectorAll('.score-metric-cb:checked')).map(cb => cb.value);
    let thresholdInput = document.getElementById('scoreThreshold').value;
    let selectedRatios = Array.from(document.querySelectorAll('.score-ratio-cb:checked')).map(cb => cb.value);
    if (metrics.length === 0 || selectedRatios.length === 0) {
        document.getElementById('scoreResultContainer').innerHTML = "";
        return;
    }
    
    let sortedScores = window.computeScoreAnalysis(metrics, selectedRatios, thresholdInput);
    if (!sortedScores) return;

    if (sortedScores.length === 0) {
        let isAllMode = (thresholdInput === 'ALL');
        let threshold = isAllMode ? 0 : parseFloat(thresholdInput);
        document.getElementById('scoreResultContainer').innerHTML = `<p style="text-align:center; color:#e74c3c; font-size:13px; font-weight:bold; padding:20px 0;">設定した閾値(${threshold})以内に該当する馬はいませんでした。</p>`;
        return;
    }

    let baseData = window.processedData['03'].results;
    if (window.renderScoreResultTable) {
        window.renderScoreResultTable(sortedScores, selectedRatios, metrics, baseData.length);
    }
};

window.renderScoreResultTable = function(sortedScores, selectedRatios, metrics, totalHorses) {
    const metricLabels = {
        'adjWeighted': '展開補正(ベスト)',
        'adjCentral': '展開補正(安定)',
        'weightedATV': '加重平均(ベスト)',
        'centralATV': '中央加重(安定)'
    };
    const ratioLabels = {'00':'0:10', '01':'1:9', '02':'2:8', '03':'3:7', '04':'4:6', '05':'5:5'};

    let html = `<table style="border-collapse:collapse; font-size:13px; text-align:center; vertical-align:middle;">
        <tr>
            <th rowspan="2" class="col-score-rank" style="text-align:center; writing-mode:vertical-rl; text-orientation:upright; padding:10px 5px;">順位</th>
            <th rowspan="2" class="col-score-waku" style="text-align:center; padding:10px 4px;">枠</th>
            <th rowspan="2" class="col-score-umaban" style="text-align:center; writing-mode:vertical-rl; text-orientation:upright; padding:10px 5px;">馬番</th>
            <th rowspan="2" class="col-score-name" style="text-align:center;">馬名</th>
            <th rowspan="2" class="col-score-pace" style="text-align:center; writing-mode:vertical-rl; text-orientation:upright; padding:10px 5px;">脚質</th>
            <th rowspan="2" class="col-score-total" style="text-align:center;">総合スコア</th>`;

    metrics.forEach(m => {
        let label = metricLabels[m] || m;
        html += `<th colspan="${selectedRatios.length + 1}" class="metric-header" style="text-align:center;">${label}</th>`;
    });
    html += `</tr><tr>`;

    metrics.forEach(m => {
        html += `<th class="col-subtotal" style="text-align:center;">小計</th>`;
        selectedRatios.forEach(r => {
            html += `<th class="col-score-ratio" style="text-align:center;">${ratioLabels[r]}</th>`;
        });
    });
    html += `</tr>`;

    let rank = 1;
    sortedScores.forEach((h, index) => {
        if (index > 0 && h.totalScore < sortedScores[index - 1].totalScore) rank = index + 1;
        let wakuColor = window.getWakuColor(h.horseNo, totalHorses);
        
        let paceColor = "#999";
        let paceText = "-";
        if (h.avgPosRatio !== null) {
            let pct = h.avgPosRatio * 100;
            let rgb = window.getColorFromStops(window.paceStops, pct);
            paceColor = window.rgbToHex(rgb);
            paceText = h.styleName || "-";
        }

        html += `<tr>
            <td style="font-weight:bold; color:#555; text-align:center;">${h.totalScore >= 0 ? rank : '-'}</td>
            <td style="background-color:${wakuColor.bg}; color:${wakuColor.text}; border:1px solid ${wakuColor.border}; font-weight:bold; text-align:center;">${wakuColor.waku}</td>
            <td style="font-weight:bold; text-align:center;">${h.horseNo}</td>
            <td class="align-left" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${h.horseName}</td>
            <td style="color:${paceColor}; font-weight:bold; text-align:center;">${paceText}</td>
            <td style="font-weight:bold; font-size:15px; color:var(--primary-color); background:#fbfcfc; text-align:center;">${h.totalScore.toFixed(0)}</td>`;
        
        metrics.forEach(m => {
            html += `<td class="col-subtotal" style="font-weight:bold; color:#2c3e50; background:#eaf2f8; text-align:center;">${h.metrics[m].subTotal.toFixed(0)}</td>`;
            selectedRatios.forEach(r => {
                let pts = h.metrics[m].scores[r];
                let color = pts >= 80 ? '#e74c3c' : (pts >= 50 ? '#e67e22' : '#555');
                let fw = pts >= 50 ? 'bold' : 'normal';
                html += `<td style="color:${color}; font-weight:${fw}; text-align:center;">${pts > 0 ? pts.toFixed(0) : '0'}</td>`;
            });
        });
        
        html += `</tr>`;
    });
    html += `</table>`;

    let container = document.getElementById('scoreResultContainer');
    if (container) {
        container.innerHTML = html;
    }
};

window.renderUI = function(target, hasAuditIssues, allAuditErrors) {
    let weightText = "計算中...";
    let paceLabel = target.predictedPace === "SLOW" ? "スローペース" : (target.predictedPace === "HIGH" ? "ハイペース" : "ミドルペース");
    let paceBtnText = window.useDynamicPace ? "⏸ ペース判定をオフにする" : "⚡ ペース判定をオンにする";
    let paceStatusText = window.useDynamicPace ? `反映中 (${paceLabel})` : "未反映 (一律ミドル処理)";

    if (!hasAuditIssues) {
        let results03 = window.processedData['03']?.results || [];
        let weightAnalysis = window.analyzeWeightRule(results03, target);
        if (weightAnalysis.isFlatRace) {
            weightText = `定量 (ベース ${weightAnalysis.flatBaseWeight.toFixed(1)}kg)`;
        } else {
            weightText = "別定/ハンデ";
        }
    }

    let resultHTML = window.renderSummaryBlockHTML(target, hasAuditIssues, weightText, paceLabel, paceStatusText, paceBtnText, allAuditErrors);

    if (!hasAuditIssues) {
        resultHTML += window.renderPaceBlockHTML(target);
        resultHTML += `
            <div class="pattern-block">
                <h3>ATVランキング</h3>
                <div class="segmented-control style-pill">
                    <input type="radio" name="radio" id="ratio-00" value="00" onchange="window.switchRatio('00')">
                    <label for="ratio-00">0:10</label>
                    <input type="radio" name="radio" id="ratio-01" value="01" onchange="window.switchRatio('01')">
                    <label for="ratio-01">1:9</label>
                    <input type="radio" name="radio" id="ratio-02" value="02" onchange="window.switchRatio('02')" checked>
                    <label for="ratio-02">2:8</label>
                    <input type="radio" name="radio" id="ratio-03" value="03" onchange="window.switchRatio('03')">
                    <label for="ratio-03">3:7</label>
                    <input type="radio" name="radio" id="ratio-04" value="04" onchange="window.switchRatio('04')">
                    <label for="ratio-04">4:6</label>
                    <input type="radio" name="radio" id="ratio-05" value="05" onchange="window.switchRatio('05')">
                    <label for="ratio-05">5:5</label>
                </div>
                <div id="tableContainer" class="table-responsive"></div>
            </div>
        `;
        resultHTML += window.renderScoreBlockHTML();
        resultHTML += `
            <div class="details-block">
                <details>
                    <summary>
                        <h3>詳細データ (計算プロセスログ)</h3>
                        <span class="summary-hint">(クリックで展開)</span>
                    </summary>
                    <div class="details-content" id="detailedLogContainer"></div>
                </details>
            </div>
        `;
    } else {
        let firstErrorText = (allAuditErrors && allAuditErrors.length > 0) ? allAuditErrors[0] : "抽出または計算処理に致命的なエラーが検出されました。";
        let errorListHtml = "";

        if (allAuditErrors && allAuditErrors.length > 0) {
            allAuditErrors.forEach(err => {
                errorListHtml += `<li>${err}</li>`;
            });
        } else {
            errorListHtml = `<li>抽出または計算処理に致命的なエラーが検出されました。</li>`;
        }

        resultHTML += `
            <div class="pattern-block">
                <div class="stop-analysis-container">
                    <h3 class="stop-title">⚠ 解析停止</h3>
                    <p class="stop-msg-main">システム検証で問題が検出されたため、解析結果の表示を停止しています。</p>
                    
                    <div class="audit-error-card">
                        <div class="error-first">⚠️ 解析停止の原因: ${firstErrorText}</div>
                        <details>
                            <summary>すべての検出エラー（全 ${allAuditErrors ? allAuditErrors.length : 0} 件）を確認する</summary>
                            <ul class="error-list">
                                ${errorListHtml}
                            </ul>
                        </details>
                    </div>

                    <p class="stop-msg-sub">下の検証用プロンプトをコピーし、AIに修正案をリクエストしてください。</p>
                </div>
            </div>
        `;
    }

    resultHTML += `
        <div class="prompt-block">
            <details>
                <summary>
                    <h3>検証用プロンプト (AI監査用)</h3>
                    <span class="summary-hint">(クリックで展開)</span>
                </summary>
                <div class="prompt-content-area" id="promptControlArea"></div>
            </details>
        </div>
    `;
    document.getElementById('resultArea').innerHTML = resultHTML;

    if (!hasAuditIssues) {
        window.runScoreAnalysis();
    }
};