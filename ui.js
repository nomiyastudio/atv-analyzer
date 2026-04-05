window.renderAvgRanking = function(ratioId) {
    let data = window.processedData[ratioId];
    if (!data) return "";
    let sortType = window.globalSortType;
    let target = data.target;
    let res = [...data.results];

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
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== bNo) return aNo - bNo;
            return a.horseName.localeCompare(b.horseName, 'ja');
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
            let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
            if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
            if (aNo !== bNo) return aNo - bNo;
            return a.horseName.localeCompare(b.horseName, 'ja');
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

    let isWeightGradient = (target.weightRule === "ハンデ" || target.weightRule === "別定");
    let minW = Infinity, maxW = -Infinity;
    if (isWeightGradient) {
        res.forEach(h => {
            if (h.currentWeight < minW) minW = h.currentWeight;
            if (h.currentWeight > maxW) maxW = h.currentWeight;
        });
    }

    let minCentralATV = Infinity;
    let minWeightedATV = Infinity;
    res.forEach(h => {
        if (h.centralATV !== null && h.centralATV < minCentralATV) minCentralATV = h.centralATV;
        if (h.weightedATV !== null && h.weightedATV < minWeightedATV) minWeightedATV = h.weightedATV;
    });

    let getThresholds = (key) => {
        let vals = res.map(r => r[key]).filter(v => v !== null).sort((a,b) => a - b);
        if(vals.length === 0) return { t1: 0, t2: 0 };
        let top = vals[0];
        let mid = Math.floor(vals.length / 2);
        let median = vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
        let delta = Math.max(median - top, 0.01);
        return { t1: top + delta * 0.333, t2: top + delta * 0.666 };
    };

    let cThresh = getThresholds('centralATV');
    let wThresh = getThresholds('weightedATV');

    let html = `<table>
        <tr>
            <th class="col-waku sortable-header ${sortType === 'horseNo' ? 'active-sort' : ''}" onclick="window.updateSort('horseNo')" title="枠番">枠</th>
            <th class="col-umaban sortable-header ${sortType === 'horseNo' ? 'active-sort' : ''}" onclick="window.updateSort('horseNo')" title="馬番">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 2px;">馬番</div>
                    ${sortType === 'horseNo' ? '<span style="font-size:10px;color:var(--secondary-color); margin-top:2px;">▼</span>' : ''}
                </div>
            </th>
            <th>馬名</th>
            <th class="col-weight sortable-header ${sortType === 'currentWeight' ? 'active-sort' : ''}" onclick="window.updateSort('currentWeight')" title="今回の斤量">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 2px;">斤量</div>
                    ${sortType === 'currentWeight' ? '<span style="font-size:10px;color:var(--secondary-color); margin-top:2px;">▼</span>' : ''}
                </div>
            </th>
            <th class="col-interval">間隔</th>
            <th class="col-narrow sortable-header ${sortType === 'pace' ? 'active-sort' : ''}" onclick="window.updateSort('pace')" title="クリックで展開位置順にソート">
                脚質<br><span class="sort-desc">(%)</span>
                ${sortType === 'pace' ? '<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'centralATV' ? 'active-sort' : ''}" onclick="window.updateSort('centralATV')" title="クリックでソート切り替え">
                中央加重<br><span class="sort-desc">(安定)</span>
                ${sortType === 'centralATV' ? '<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>
            <th class="sortable-header ${sortType === 'weightedATV' ? 'active-sort' : ''}" onclick="window.updateSort('weightedATV')" title="クリックでソート切り替え">
                加重平均<br><span class="sort-desc">(ベスト)</span>
                ${sortType === 'weightedATV' ? '<br><span style="font-size:10px;color:var(--secondary-color);">▼</span>' : ''}
            </th>`;

    for(let k=1; k<=data.maxDisplayRaces; k++) {
        html += `<th>${k}走前</th>`;
    }
    html += `</tr>`;

    let formatAtvDetail = (race, target) => {
        let locStr = race.pLoc === target.location ? `<span class="match-highlight">${race.pLoc}</span>` : race.pLoc;
        let distStr = race.pDist === target.distance ? `<span class="match-highlight">${race.pTrack}${race.pDist}m</span>` : `${race.pTrack}${race.pDist}m`;
        let limitMark = race.isLimited ? `<span style="color:#e74c3c; font-size:10px; font-weight:bold; margin-left:2px;" title="異芝ストッパーにより上限値に丸められました">[限]</span>` : "";
        let f3fVal = isNaN(parseFloat(race.f3f)) ? "-" : parseFloat(race.f3f).toFixed(1);
        let f3bVal = isNaN(parseFloat(race.f3b)) ? "-" : parseFloat(race.f3b).toFixed(1);
        return `
            <div style="display:flex; justify-content:center; align-items:baseline; gap:4px; margin-bottom:2px;">
                <span style="font-size:10px; color:#888; font-weight:normal;" title="前3F">${f3fVal}</span>
                <span style="font-weight:bold; font-size:14px; color:var(--primary-color);">${race.atv.toFixed(2)}${limitMark}</span>
                <span style="font-size:10px; color:#888; font-weight:normal;" title="後3F">${f3bVal}</span>
            </div>
            <span style="font-size:10px; color:#666;">${race.date} ${locStr} ${race.pWeight.toFixed(1)}kg<br>${race.pCond} ${distStr}</span>`;
    };

    res.forEach((h) => {
        let cBg = 'transparent';
        let cRankNum = parseInt(h.centralRank);
        let cRankW = (!isNaN(cRankNum) && cRankNum <= 3) ? 'bold' : 'normal';
        let cRankC = (!isNaN(cRankNum) && cRankNum <= 3) ? '#111111' : '#666666';

        if (h.centralATV !== null) {
            if (h.centralATV <= cThresh.t1) cBg = '#a5d6a7';
            else if (h.centralATV <= cThresh.t2) cBg = '#e8f5e9';
        }

        let wBg = 'transparent';
        let wRankNum = parseInt(h.weightedRank);
        let wRankW = (!isNaN(wRankNum) && wRankNum <= 3) ? 'bold' : 'normal';
        let wRankC = (!isNaN(wRankNum) && wRankNum <= 3) ? '#111111' : '#666666';

        if (h.weightedATV !== null) {
            if (h.weightedATV <= wThresh.t1) wBg = '#90caf9';
            else if (h.weightedATV <= wThresh.t2) wBg = '#e3f2fd';
        }

        let exceptionMark = "";
        if (h.onlyYoshiba) exceptionMark = `<br><span style="color:#e67e22; font-size:10px; font-weight:bold;" title="野芝実績がないため洋芝データのみで算出">(洋)</span>`;
        if (h.onlyNoshiba) exceptionMark = `<br><span style="color:#e67e22; font-size:10px; font-weight:bold;" title="洋芝実績がないため野芝データのみで算出">(野)</span>`;

        let wakuColor = window.getWakuColor(h.horseNo, res.length);
        let wTdStyle = `background-color:${wakuColor.bg}; color:${wakuColor.text}; border:1px solid ${wakuColor.border}; font-weight:bold; font-size:14px; text-align:center;`;

        let weightHtml = h.currentWeight.toFixed(1);
        let weightTdStyle = "text-align:center; vertical-align:middle; font-size:13px;";
        
        if (isWeightGradient && maxW > minW) {
            let weightCol = "#555555";
            if (h.currentWeight === maxW) {
                weightCol = "#ff0000";
            } else if (h.currentWeight >= maxW - 1.0) {
                weightCol = "#ffaa66";
            } else if (h.currentWeight === minW) {
                weightCol = "#0055ff";
            } else if (h.currentWeight <= minW + 1.0) {
                weightCol = "#4db8ff";
            }
            
            if (weightCol !== "#555555") {
                weightHtml = `<span style="color:${weightCol}; font-weight:900;">${h.currentWeight.toFixed(1)}</span>`;
            } else {
                weightHtml = `<span style="color:#555555; font-weight:bold;">${h.currentWeight.toFixed(1)}</span>`;
            }
        } else {
            weightHtml = `<span style="color:#555555; font-weight:bold;">${h.currentWeight.toFixed(1)}</span>`;
        }

        let isPaceSetter = false;
        if (hasNige) {
            isPaceSetter = (h.styleClass === 1);
        } else {
            isPaceSetter = (h.styleClass === 2 && h.avgPosRatio === minPaceRatio && h.avgPosRatio !== null);
        }

        let posTextHtml = "-";
        let ratioText = "";
        let paceTdStyle = `text-align:center; vertical-align:middle;`;

        if (h.styleClass !== null && h.avgPosRatio !== null) {
            let pct = h.avgPosRatio * 100;
            let rgb = window.getColorFromStops(window.paceStops, pct);
            let hex = window.rgbToHex(rgb);
            let textCol = "#ffffff";
            let borderCol = window.rgbToHex(window.darken(rgb));

            if (isPaceSetter) {
                posTextHtml = `<span style="font-weight: 900; font-size: 14px;">${h.styleName}</span>`;
                ratioText = `<span style="font-size:10px; font-weight:bold; color:inherit; opacity:1;">${pct.toFixed(0)}%</span>`;
                paceTdStyle += `background-color: ${hex}; background-image: repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(0,0,0,0.25) 12px, rgba(0,0,0,0.25) 24px); box-shadow: inset 0 0 0 3px rgba(255,255,255,0.9); color: #ffffff !important; border: 1px solid ${borderCol}; text-shadow: 1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.9);`;
            } else {
                posTextHtml = `<span style="font-weight: bold; font-size: 13px;">${h.styleName}</span>`;
                ratioText = `<span style="font-size:10px; font-weight:normal; color:inherit; opacity:0.9;">${pct.toFixed(0)}%</span>`;
                paceTdStyle += `background-color:${hex}; color:${textCol}; border:1px solid ${borderCol}; text-shadow: 0px 0px 2px rgba(0,0,0,0.5);`;
            }
        } else {
            paceTdStyle += `color:#555; border:1px solid var(--border-color);`;
        }

        let cDiffHtml = "-";
        if (h.centralATV !== null && minCentralATV !== Infinity) {
            let diff = h.centralATV - minCentralATV;
            if (diff > 0) cDiffHtml = `△${diff.toFixed(2)}`;
        }

        let wDiffHtml = "-";
        if (h.weightedATV !== null && minWeightedATV !== Infinity) {
            let diff = h.weightedATV - minWeightedATV;
            if (diff > 0) wDiffHtml = `△${diff.toFixed(2)}`;
        }

        html += `<tr>
            <td style="${wTdStyle}">${wakuColor.waku}</td>
            <td style="font-weight: ${sortType === 'horseNo' ? 'bold' : 'normal'}; font-size:14px;">${h.horseNo}</td>
            <td class="align-left">${h.horseName}${exceptionMark}</td>
            <td style="${weightTdStyle}">${weightHtml}</td>
            <td style="text-align:center; vertical-align:middle;">${h.intervalHtml}</td>
            <td style="${paceTdStyle}" title="平均展開割合 ${(h.avgPosRatio ? (h.avgPosRatio*100).toFixed(1) : 0)}%">
                ${posTextHtml}<br>${ratioText}
            </td>
            <td style="font-weight:bold; font-size:15px; background:${cBg};">
                ${h.centralATV !== null ? h.centralATV.toFixed(2) : "-"}
                <div style="font-size:11px; margin-top:2px;">
                    <span style="font-weight:normal; color:#666666;">${cDiffHtml}</span><br>
                    <span style="font-weight:${cRankW}; color:${cRankC};">${h.centralRank}位</span>
                </div>
            </td>
            <td style="font-weight:bold; font-size:15px; background:${wBg};">
                ${h.weightedATV !== null ? h.weightedATV.toFixed(2) : "-"}
                <div style="font-size:11px; margin-top:2px;">
                    <span style="font-weight:normal; color:#666666;">${wDiffHtml}</span><br>
                    <span style="font-weight:${wRankW}; color:${wRankC};">${h.weightedRank}位</span>
                </div>
            </td>`;

        for(let j=1; j<=data.maxDisplayRaces; j++) {
            let race = h.pastRaces.find(r => r.idx === j);
            if (race && race.valid) {
                let bgClass = '';
                if (sortType === 'weightedATV') {
                    let rankIdx = h.validATVs.findIndex(v => v.idx === race.idx);
                    if (rankIdx === 0) bgClass = `class="highlight-rank-1"`;
                    else if (rankIdx === 1) bgClass = `class="highlight-rank-2"`;
                    else if (rankIdx === 2) bgClass = `class="highlight-rank-3"`;
                } else if (sortType === 'centralATV') {
                    let isAdopted = h.centralAdopted.some(t => t.idx === race.idx);
                    let isOutlier = h.centralOutliers.some(t => t.idx === race.idx);
                    if (isAdopted) bgClass = `class="highlight-trim-main"`;
                    else if (isOutlier) bgClass = `class="highlight-trim-sub"`;
                } else if (sortType === 'horseNo' || sortType === 'pace' || sortType === 'currentWeight') {
                    let rankIdx = h.validATVs.findIndex(v => v.idx === race.idx);
                    if (rankIdx === 0) bgClass = `class="highlight-horse-1"`;
                    else if (rankIdx === 1) bgClass = `class="highlight-horse-2"`;
                    else if (rankIdx === 2) bgClass = `class="highlight-horse-3"`;
                }
                html += `<td ${bgClass}>${formatAtvDetail(race, data.target)}</td>`;
            } else if (race && !race.valid) {
                html += `<td><span class="skip-text">除外<br>(${race.reason})</span></td>`;
            } else {
                html += `<td>-</td>`;
            }
        }
        html += `</tr>`;
    });
    html += `</table>`;
    return html;
};

window.renderDetailedLog = function(ratioId) {
    let data = window.processedData[ratioId];
    if (!data || data.auditErrors.length > 0) return "";

    let originalResults = [...data.results].sort((a, b) => {
        let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
        if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
        if (aNo !== bNo) return aNo - bNo;
        return a.horseName.localeCompare(b.horseName, 'ja');
    });

    let logHtml = `<div class="table-responsive">
        <table class="log-table">
        <tr><th>走</th><th>日付</th><th>判定</th><th>前3F</th><th>後3F</th><th>距離差</th><th>β値</th><th>馬場</th><th>E値</th><th>斤量差</th><th>F値</th><th>場所</th><th>G値</th><th>γ値</th><th style="background:#eaf2f8;" title="前0.2/後0.8">ATV(0.2)</th><th style="background:#eaf2f8;" title="前0.3/後0.7">ATV(0.3)</th><th style="background:#eaf2f8;" title="前0.4/後0.6">ATV(0.4)</th><th style="background:#eaf2f8;" title="前0.5/後0.5">ATV(0.5)</th></tr>`;

    originalResults.forEach(h => {
        logHtml += `<tr><td colspan="18" class="align-left" style="background:#f4f6f7; font-weight:bold; font-size:13px; color:var(--primary-color);">(${h.horseNo}) ${h.horseName}</td></tr>`;
        h.pastRaces.forEach(r => {
            if (r.valid) {
                let getAtv = (rId) => {
                    let res = window.processedData[rId].results.find(res => res.horseNo === h.horseNo);
                    if(res) {
                        let pr = res.pastRaces.find(pr => pr.idx === r.idx);
                        if(pr && pr.valid) return pr.atv.toFixed(2) + (pr.isLimited ? '<span style="color:#e74c3c;font-size:9px;">[限]</span>' : '');
                    }
                    return "-";
                };
                let atv02 = getAtv('02'); let atv03 = getAtv('03'); let atv04 = getAtv('04'); let atv05 = getAtv('05');

                let f3fVal = isNaN(parseFloat(r.f3f)) ? "-" : parseFloat(r.f3f).toFixed(1);
                let f3bVal = isNaN(parseFloat(r.f3b)) ? "-" : parseFloat(r.f3b).toFixed(1);

                logHtml += `<tr><td>${r.idx}走前</td><td>${r.date}</td><td class="success">✓</td><td>${f3fVal}</td><td>${f3bVal}</td><td>${(r.distDiff > 0 ? "+" : "")}${r.distDiff}m</td><td>${r.beta.toFixed(3)}</td><td>${r.eText}</td><td>${r.e.toFixed(2)}</td><td>${r.weightDiffText}</td><td>${r.f.toFixed(3)}</td><td>${r.gText}</td><td>${r.g.toFixed(2)}</td><td>${r.gamma.toFixed(3)}</td><td style="font-weight:bold; color:var(--primary-color);">${atv02}</td><td style="font-weight:bold; color:var(--primary-color);">${atv03}</td><td style="font-weight:bold; color:var(--primary-color);">${atv04}</td><td style="font-weight:bold; color:var(--primary-color);">${atv05}</td></tr>`;
            } else {
                logHtml += `<tr><td>${r.idx}走前</td><td>${r.date}</td><td class="error">×</td><td colspan="15" class="align-left" style="color:#7f8c8d;">スキップ: ${r.reason}</td></tr>`;
            }
        });
    });
    logHtml += `</table></div>`;
    return logHtml;
};