// ==========================================
// ui-ranking.js
// ==========================================
window.renderAvgRanking = function(ratioId) 
{
    let data = window.processedData[ratioId];
    if (!data) return "";
    let sortType = window.globalSortType;
    let target = data.target;
    let res = [...data.results];
    // ソート処理を外部化モジュール（ui-ranking-sorter.js）へ委譲して軽量化
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
    let flatBaseWeight = weightAnalysis.flatBaseWeight;
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
    // ヘッダーの並び順: 展開補正(ベスト) → 展開補正(安定) → 加重平均 → 中央加重
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
  
        // 定量戦の場合は「騎手恩恵 + 年齢恩恵」のみをマイナス差分として強調判定に使用し、牝馬恩恵は除外する
        let diff = isFlatRace ?
        -((h.jockeyAllowance || 0) + (h.ageAllowance || 0)) : (h.currentWeight - avgActualW);
        let weightClass = (diff <= -2.5 || diff >= 2.5) ?
        (diff < 0 ? 'weight-diff-major-negative' : 'weight-diff-major-positive') : ((diff <= -1.5 || diff >= 1.5 ? (diff < 0 ? 'weight-diff-minor-negative' : 'weight-diff-minor-positive') : 'weight-diff-normal'));
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
                    bgCls = h.centralAdopted.some(t => t.idx === race.idx) ?
                    `class="hl-central-adopt"` : (h.centralOutliers.some(t => t.idx === race.idx) ? `class="hl-central-out"` : '');
                } else if (sortType === 'adjCentral') {
                    bgCls = h.centralAdopted.some(t => t.idx === race.idx) ?
                    `class="hl-adj-central-adopt"` : (h.centralOutliers.some(t => t.idx === race.idx) ? `class="hl-adj-central-out"` : '');
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