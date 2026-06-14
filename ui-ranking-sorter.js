// ==========================================
// ui-ranking-sorter.js
// ==========================================

/**
 * 馬場解析結果データを指定された指標および方向に基づいてソートするモジュール
 * @param {Array} res - ソート対象の馬データオブジェクト配列
 * @param {string} sortType - ソート基準とするプロパティキー
 * @param {string} globalSortDirection - 斤量・脚質ソート時の方向指定 ('asc' / 'desc')
 * @returns {Array} ソート完了後の配列
 */
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