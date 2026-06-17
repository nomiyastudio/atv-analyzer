// ==========================================
// calc-core.js
// ==========================================
window.calculateATV = function(horseBlocks, validHorseNames, target, ratio) {
    let results = [];
    let maxRacesIdx = 0;
    let auditErrors = [];
    let auditWarnings = [];

    try {
        // --- C値（展開係数）の算出 ---
        // 統括マネージャー（course-manager.js）からターゲットコース固有の展開係数をピンポイント外部引き当て
        let targetCourseData = { ratioId: "02", locFactor: 0.00, cFactor: 0.020, staminaPenalty: 1.00 };
        if (target.location && target.location !== "不明") {
            try {
                targetCourseData = window.getCourseData(target.location, target.trackType, target.distance, "F");
            } catch (e) {
                // 例外時はデフォルト値を使用
            }
        }
        const cFactor = targetCourseData.cFactor;
        // ==========================================
        // 内部関数7: ソートおよび順位付与ヘルパー
        // ==========================================
        const applyRanking = (sortKey, rankKey) => {
            let sorted = [...results].sort((a, b) => {
                let valA = a[sortKey]; let valB = b[sortKey];
                if (valA === null && valB === null) return 0;
                if (valA === null) return 1; 
     
         
                if (valB === null) return -1;
                if (valA !== valB) return valA - valB;
                for(let i=0; i<a.validATVs.length || i<b.validATVs.length; i++) {
                    let atvA = a.validATVs.length > i ? a.validATVs[i].atv : Infinity;
                    let atvB = b.validATVs.length > i ? b.validATVs[i].atv : Infinity;
     
            
                    if(atvA !== atvB) return atvA - atvB;
                }
                let aNo = parseInt(a.horseNo); let bNo = parseInt(b.horseNo);
                if (isNaN(aNo)) aNo = 999; if (isNaN(bNo)) bNo = 999;
                if (aNo !== bNo) return aNo - bNo;
                return a.horseId.localeCompare(b.horseId);
                // 同点時のフォールバック
            });
            sorted.forEach((item, index) => {
                item[rankKey] = item[sortKey] !== null ? (index + 1) : "-";
            });
            return sorted;
        };


        // ==========================================
        // メインループ処理
        // ==========================================
        for (let i = 0; i < horseBlocks.length; i++) {
            let block = horseBlocks[i];
            if (block.includes("調教タイム") || block.includes("ラップ表示")) continue;
            
            let headerArea = /\d{2}\/\d{2}/.test(block) ? block.split(/\d{2}\/\d{2}/)[0] : block;
            // 修正: 外部化されたモジュール（calc-extractor.js）の呼び出し
            let info = window.extractHeaderInfo(headerArea, validHorseNames);
            if (info.horseName === "不明") continue;
            let horseId = "h_" + String(i).padStart(2, '0');

            let races = block.split(/\r?\n(?=\s*\d{2}\/\d{2}[\s\r\n])/);
            // 修正: 外部化されたモジュール（calc-extractor.js）の呼び出し
            let raceData = window.processPastRaces(races, info.baseWeight, info.age, target, ratio);
            if (raceData.localMax > maxRacesIdx) maxRacesIdx = raceData.localMax;
            
            // 修正: 外部化されたモジュール（calc-evaluator.js）の呼び出し
            let turfData = window.checkTurfSpecialist(raceData.validATVs, target);
            let paceData = window.calcPaceAndStyle(raceData.validATVs);
            // 修正: 引数末尾にtargetを渡すように拡張し、事前ペース判定データへのアクセスを可能化
            let aggData = window.calcAggregateATVs(raceData.validATVs, paceData.avgPosRatio, cFactor, target);
            let intervalHtml = window.calcInterval(headerArea, raceData.pastRaces, target);
            results.push({
                horseId: horseId,
                horseNo: info.horseNo, 
                horseName: info.horseName, 
                age: info.age, 
                currentWeight: info.baseWeight, 
                sex: info.sex, 
               
                jockeyMark: info.jockeyMark, 
                pastRaces: raceData.pastRaces, 
                weightedATV: aggData.weightedATV, 
                centralATV: aggData.centralATV, 
                adjCentral: aggData.adjCentral, 
                adjWeighted: aggData.adjWeighted, 
                validCount: raceData.validATVs.length, 
                validATVs: raceData.validATVs, 
                centralAdopted: aggData.centralAdopted, 
                centralOutliers: aggData.centralOutliers, 
                onlyYoshiba: false, // 廃止に伴い一律falseへクレンジング
                onlyNoshiba: turfData.onlyNoshiba, 
                styleClass: paceData.styleClass, 
                styleName: paceData.styleName, 
                avgPosRatio: paceData.avgPosRatio, 
     
                avgPassedCount: paceData.avgPassedCount, // 新規追加: 平均追い抜き頭数 
                intervalHtml: intervalHtml
            });
        }

        // 各指標によるソートและ順位付け
        applyRanking('weightedATV', 'weightedRank');
        let centralSorted = applyRanking('centralATV', 'centralRank');
        applyRanking('adjCentral', 'adjCentralRank');
        applyRanking('adjWeighted', 'adjWeightedRank');
        // --- 監査ロジック ---
        let extractedNames = results.map(r => r.horseName);
        let missingHorses = validHorseNames.filter(name => !extractedNames.includes(name));
        if (missingHorses.length > 0) auditErrors.push(`【抽出漏れ】出馬表に存在する以下の馬が抽出できませんでした: ${missingHorses.join(', ')}`);

        results.forEach(h => {
            h.validATVs.forEach(r => {
                if (isNaN(r.atv) || r.atv <= 0 || r.atv > 100) {
                    auditErrors.push(`【異常値】${h.horseName}の${r.idx}走前: ATV異常 (${r.atv})`);
                }
            });
        });
        for(let i=0; i < centralSorted.length - 1; i++) {
            let valA = (centralSorted[i].centralATV !== null) ? centralSorted[i].centralATV : Infinity;
            let valB = (centralSorted[i+1].centralATV !== null) ? centralSorted[i+1].centralATV : Infinity;
            if (valA > valB) {
                auditErrors.push(`【ソート異常】${centralSorted[i].horseName}(${valA}) が ${centralSorted[i+1].horseName}(${valB}) より上位です。`);
                break;
            }
        }
    } catch (e) {
        auditErrors.push(e.message);
    }

    return { 
        results, 
        maxDisplayRaces: Math.max(5, maxRacesIdx), 
        auditErrors, 
        auditWarnings 
    };
};