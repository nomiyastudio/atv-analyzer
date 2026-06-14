// ==========================================
// course-manager.js
// ==========================================

// グローバルデータプール（受け皿）の初期化宣言
window.ATV_COURSE_MASTER = window.ATV_COURSE_MASTER || {};

/**
 * 算出エンジン層へ均一化されたコース特性数値を引き渡す中央統括API
 * @param {string} location - 競馬場名 (target.location)
 * @param {string} trackType - トラックタイプ ("芝" / "ダ")
 * @param {number|string} distance - レース距離 (メートル)
 * @param {string} classRank - レースの格（クラス）
 * @returns {Object} 均一化された数値プロパティオブジェクト
 */
window.getCourseData = function(location, trackType, distance, classRank) {
    // 1. 競馬場データの存在検証
    let locData = window.ATV_COURSE_MASTER[location];
    if (!locData) {
        throw new Error(`【未登録コース検出】競馬場「${location}」のマスターデータが辞書に登録されていません。course-*.js を確認してください。`);
    }

    // 2. トラックタイプ（芝・ダート）の存在検証
    let trackKey = (trackType === "ダート" || trackType === "ダ") ? "DIRT" : "TURF";
    let trackData = locData[trackKey];
    if (!trackData) {
        throw new Error(`【未登録コース検出】${location} のトラック「${trackType}」のマスターデータが辞書に登録されていません。`);
    }

    // 3. 距離（レイアウト）のピンポイント存在検証
    let distKey = parseInt(distance, 10);
    let course = trackData[distKey];
    if (!course) {
        throw new Error(`【未登録コース検出】${location} ${trackType} ${distance}m のコースマスターデータが辞書に登録されていません。`);
    }

    // 4. レースの格（クラスランク）の正規化引き当て
    let normalizedClass = "F";
    if (["S", "G1", "Ｇ１", "Jpn1", "Ｊｐｎ１"].includes(classRank)) {
        normalizedClass = "S";
    } else if (["A", "G2", "Ｇ２", "Jpn2", "Ｊｐｎ２", "G3", "Ｇ３", "Jpn3", "Ｊｐｎ３"].includes(classRank)) {
        normalizedClass = "A";
    } else if (["B", "OP", "ＯＰ", "L", "Ｌ", "リステッド"].includes(classRank)) {
        normalizedClass = "B";
    } else if (["C", "3勝", "３勝", "1600万", "１６０0万"].includes(classRank)) {
        normalizedClass = "C";
    } else if (["D", "2勝", "２勝", "1000万", "１０００万"].includes(classRank)) {
        normalizedClass = "D";
    } else if (["E", "1勝", "１勝", "500万", "５０0万"].includes(classRank)) {
        normalizedClass = "E";
    } else {
        normalizedClass = "F";
    }

    // クラス別適正比率（ratioId）の抽出
    let ratioId = "02"; 
    if (course.classes && course.classes[normalizedClass] !== undefined) {
        ratioId = course.classes[normalizedClass];
    } else {
        throw new Error(`【未登録コース検出】${location} ${trackType} ${distance}m におけるクラス「${classRank}(${normalizedClass})」の適正比率データが登録されていません。`);
    }

    // 5. 下流エンジンがそのまま計算式に合成できるクリーンな数値オブジェクトを返却
    return {
        ratioId: ratioId,
        locFactor: course.locFactor !== undefined ? course.locFactor : 0.00,
        cFactor: course.cFactor !== undefined ? course.cFactor : 0.020,
        staminaPenalty: course.staminaPenalty !== undefined ? course.staminaPenalty : 1.00
    };
};