// ==========================================
// ui-log.js
// ==========================================

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
                    // 修正: 内部ID(horseId)で検索するよう変更し、データ参照を完全に一意化
                    let res = window.processedData[id].results.find(res => res.horseId === h.horseId); 
                    // 修正: 過去走が存在しない（undefined）場合のクラッシュを防ぐ安全なアクセス処理に変更
                    let pr = res ? res.pastRaces.find(pr => pr.idx === r.idx) : null;
                    return (pr && pr.atv != null) ? pr.atv.toFixed(2) : "-";
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
                    <td class="log-atv-bold">${getAtv('00')}</td>
                    <td class="log-atv-bold">${getAtv('01')}</td>
                    <td class="log-atv-bold">${getAtv('02')}</td>
                    <td class="log-atv-bold">${getAtv('03')}</td>
                    <td class="log-atv-bold">${getAtv('04')}</td>
                    <td class="log-atv-bold">${getAtv('05')}</td>
                </tr>`;
            } else {
                logHtml += `<tr><td Esh><td>${r.date}</td><td class="error">×</td><td colspan="14" class="align-left">スキップ: ${r.reason}</td></tr>`;
            }
        });
    });
    return logHtml + `</table></div>`;
};