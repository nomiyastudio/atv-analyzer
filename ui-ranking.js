// ==========================================
// ui-ranking.js
// ==========================================
window.renderAvgRanking = function(ratioId) {
    
    let data = window.processedData[ratioId];
    if (!data) return "";
    let sortType = window.globalSortType;
    let correctionMode = window.globalCorrectionMode;
// 'centralATV' or 'weightedATV'
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
            if (wA !== wB) {
                return window.globalSortDirection === 'desc' ? wB - wA : wA - wB;
            }
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== 
bNo) return aNo - bNo;
            return a.horseName.localeCompare(b.horseName, 'ja');
        } else if (sortType === 'pace') {
            let classA = a.styleClass !== null ? a.styleClass : 99;
            let classB = b.styleClass !== null ? b.styleClass : 99;
            if (classA !== classB) {
                return window.globalSortDirection === 'desc' ? classB - classA : classA - classB;
            }
       
             let valA = a.avgPosRatio; let valB = b.avgPosRatio;
if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
if (valB === null) return -1;
            if (valA !== valB) {
                return window.globalSortDirection === 'desc' ? valB - valA : valA - valB;
            }
let cA = a.centralATV !== null ? a.centralATV : Infinity;
            let cB = b.centralATV !== null ? b.centralATV : Infinity;
if (cA !== cB) return cA - cB;
            return parseInt(a.horseNo) - parseInt(b.horseNo);
} else if (sortType === 'adjustedATV') {
            let valA = (correctionMode === 'centralATV') ?
a.adjCentral : a.adjWeighted;
            let valB = (correctionMode === 'centralATV') ? b.adjCentral : b.adjWeighted;
if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
if (valB === null) return -1;
            if (valA !== valB) return valA - valB;
            return parseInt(a.horseNo) - parseInt(b.horseNo);
} else {
            let valA = a[sortType];
let valB = b[sortType];
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
if (valB === null) return -1;
            if (valA !== valB) return valA - valB;
for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
                let atvA = a.validATVs.length > i ?
a.validATVs[i].atv : Infinity;
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

    let cThresh = getThresholds('centralATV');
    let wThresh = getThresholds('weightedATV');

    let adjTitle = (correctionMode === 'centralATV') ?
'展開補正<br><span class="sort-desc">(安定)</span>' : '展開補正<br><span class="sort-desc">(ベスト)</span>';

    let html = `<table>
        <tr>
            <th class="col-waku sortable-header ${sortType === 'horseNo' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('horseNo')" title="枠番">枠</th>
            <th class="col-umaban sortable-header ${sortType === 'horseNo' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('horseNo')" title="馬番">
                <div style="display:flex; flex-direction:column; align-items:center;">
                   
                 <div style="writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 2px;">馬番</div>
                    ${sortType === 'horseNo' ?
'<span style="font-size:10px;color:var(--secondary-color); margin-top:2px;">▼</span>' : ''}
                </div>
            </th>
            <th>馬名</th>
            <th class="col-weight sortable-header ${sortType === 'currentWeight' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('currentWeight')" title="今回の斤量">
                <div style="display:flex; flex-direction:column; align-items:center;">
              
                    <div style="writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 2px;">斤量</div>
                    ${sortType === 'currentWeight' ?
`<span style="font-size:10px;color:var(--secondary-color); margin-top:2px;">${window.globalSortDirection === 'desc' ? '▼' : '▲'}</span>` : ''}
                </div>
            </th>
            <th class="col-interval">間隔</th>
            <th class="col-narrow sortable-header ${sortType === 'pace' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('pace')" title="クリックで展開位置順にソート">
                脚質<br><span class="sort-desc">(%)</span>
               
                 ${sortType === 'pace' ? `<br><span style="font-size:10px;color:var(--secondary-color);">${window.globalSortDirection === 'desc' ? '▼' : '▲'}</span>` : ''}
            </th>
            <th class="sortable-header ${sortType === 'adjustedATV' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('adjustedATV')" title="展開補正を加味したATV（クリックでベース切り替え）">
                ${adjTitle}
                ${sortType === 'adjustedATV' ?
'<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'centralATV' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('centralATV')" title="中央加重でソート（展開補正も安定モードに同期）">
                中央加重<br><span class="sort-desc">(安定)</span>
                ${sortType === 'centralATV' ?
'<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'weightedATV' ? 'active-sort' : ''}" onclick="window.handleHeaderClick('weightedATV')" title="加重平均でソート（展開補正もベストモードに同期）">
                加重平均<br><span class="sort-desc">(ベスト)</span>
                ${sortType === 'weightedATV' ?
'<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>`;
for(let k=1; k<=data.maxDisplayRaces; k++) html += `<th>${k}走前</th>`;
    html += `</tr>`;
let formatAtvDetail = (race, target) => {
        let locStr = race.pLoc === target.location ?
`<span class="match-highlight">${race.pLoc}</span>` : race.pLoc;
        let distStr = race.pDist === target.distance ? `<span class="match-highlight">${race.pTrack}${race.pDist}m</span>` : `${race.pTrack}${race.pDist}m`;
        let limitMark = race.isLimited ?
`<span style="color:#e74c3c; font-size:10px; font-weight:bold; margin-left:2px;">[限]</span>` : "";
        return `
            <div style="display:flex; justify-content:center; align-items:baseline; gap:4px; margin-bottom:2px;">
                <span style="font-size:10px; color:#888;">${isNaN(parseFloat(race.f3f)) ?
"-" : parseFloat(race.f3f).toFixed(1)}</span>
                <span style="font-weight:bold; font-size:14px; color:var(--primary-color);">${race.atv.toFixed(2)}${limitMark}</span>
                <span style="font-size:10px; color:#888;">${isNaN(parseFloat(race.f3b)) ?
"-" : parseFloat(race.f3b).toFixed(1)}</span>
            </div>
            <span style="font-size:10px; color:#666;">${race.date} ${locStr} ${race.pWeight.toFixed(1)}kg<br>${race.pCond} ${distStr}</span>`;
};

    res.forEach((h) => {
        let cBg = (h.centralATV !== null) ? (h.centralATV <= cThresh.t1 ? '#a5d6a7' : (h.centralATV <= cThresh.t2 ? '#e8f5e9' : 'transparent')) : 'transparent';
        let wBg = (h.weightedATV !== null) ? (h.weightedATV <= wThresh.t1 ? '#90caf9' : (h.weightedATV <= wThresh.t2 ? '#e3f2fd' : 'transparent')) : 'transparent';
        let exceptionMark = h.onlyYoshiba ? `<br><span style="color:#e67e22; font-size:10px; font-weight:bold;">(洋)</span>` : (h.onlyNoshiba ? `<br><span style="color:#e67e22; font-size:10px; font-weight:bold;">(野)</span>` : "");
        let wakuColor = window.getWakuColor(h.horseNo, res.length);
  
       
        // 定量戦の場合は「騎手恩恵 + 年齢恩恵」のみをマイナス差分として強調判定に使用し、牝馬恩恵は除外する
        let diff = isFlatRace ? -( (h.jockeyAllowance || 0) + (h.ageAllowance || 0) ) : (h.currentWeight - avgActualW);
        let wCol = (diff <= -2.5 || diff >= 2.5) ? (diff < 0 ? '#0055ff' : '#e74c3c') : (diff <= -1.5 || diff >= 1.5 ? (diff < 0 ? '#0077cc' : '#e67e22') : '#555555');
let isPaceSetter = hasNige ? (h.styleClass === 1) : (h.styleClass === 2 && h.avgPosRatio === minPaceRatio && h.avgPosRatio !== null);
let paceTdStyle = `text-align:center; vertical-align:middle; padding:4px; border:1px solid var(--border-color);` + (isPaceSetter ? `background-color: #fff3e0; background-image: repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,167,38,0.15) 8px, rgba(255,167,38,0.15) 16px); box-shadow: inset 0 0 0 2px #ffa726; border: 1px solid #ff9800;` : ``);
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
   
             ${(h.styleClass !== null) ?
`
                <div class="pace-badge-wrapper" style="--badge-color: ${window.rgbToHex(window.getColorFromStops(window.paceStops, h.avgPosRatio*100))};">
                    <div class="pace-shape ${['','shape-nige','shape-senko','shape-sashi','shape-oikomi'][h.styleClass]}">${h.styleName.charAt(0)}</div>
                    <span class="pace-pct-text">${(h.avgPosRatio*100).toFixed(0)}%</span>
                </div>` : "-"}
            </td>
       
             <td style="font-weight:bold; font-size:15px; background:#fbfcfc;">
                ${displayAdj !== null ?
displayAdj.toFixed(2) : "-"}
                <div style="font-size:11px; margin-top:2px;">
                    <span style="color:${parseInt(displayAdjRank)<=3?'#111':'#666'}; font-weight:${parseInt(displayAdjRank)<=3?'bold':'normal'};">${displayAdjRank}位</span><br>
                    <span style="font-weight:normal; color:#666;">${(displayAdj !== null && minAdj !== Infinity && displayAdj > minAdj) ?
'△'+(displayAdj-minAdj).toFixed(2) : '-'}</span>
                </div>
            </td>
            <td style="font-weight:bold; font-size:15px; background:${cBg};">
                ${h.centralATV !== null ?
h.centralATV.toFixed(2) : "-"}
                <div style="font-size:11px; margin-top:2px;">
                    <span style="color:${parseInt(h.centralRank)<=3?'#111':'#666'}; font-weight:${parseInt(h.centralRank)<=3?'bold':'normal'};">${h.centralRank}位</span><br>
                    <span style="font-weight:normal; color:#666;">${(h.centralATV !== null && minCentralATV !== Infinity && h.centralATV > minCentralATV) ?
'△'+(h.centralATV-minCentralATV).toFixed(2) : '-'}</span>
                </div>
            </td>
            <td style="font-weight:bold; font-size:15px; background:${wBg};">
                ${h.weightedATV !== null ?
h.weightedATV.toFixed(2) : "-"}
                <div style="font-size:11px; margin-top:2px;">
                    <span style="color:${parseInt(h.weightedRank)<=3?'#111':'#666'}; font-weight:${parseInt(h.weightedRank)<=3?'bold':'normal'};">${h.weightedRank}位</span><br>
                    <span style="font-weight:normal; color:#666;">${(h.weightedATV !== null && minWeightedATV !== Infinity && h.weightedATV > minWeightedATV) ?
'△'+(h.weightedATV-minWeightedATV).toFixed(2) : '-'}</span>
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
                    bgCls = h.centralAdopted.some(t => t.idx === race.idx) ?
`class="highlight-trim-main"` : (h.centralOutliers.some(t => t.idx === race.idx) ? `class="highlight-trim-sub"` : '');
}
                html += `<td ${bgCls}>${formatAtvDetail(race, data.target)}</td>`;
} else {
                html += `<td>${race ?
`<span class="skip-text">除外<br>(${race.reason})</span>` : "-"}</td>`;
            }
        }
        html += `</tr>`;
});
    return html + `</table>`;
};