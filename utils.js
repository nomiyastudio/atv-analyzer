// 脚質グラデーションのカラーポイント定義（オリーブ → ディープブルー）
window.paceStops = [
    { p: 0.00, hex: "#d35400" },
    { p: 0.40, hex: "#f1c40f" },
    { p: 0.401, hex: "#6b8e23" },
    { p: 1.00, hex: "#1b4f72" }
];

// HEXからRGBへの変換
window.hexToRgb = function(hex) {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// RGBからHEXへの変換
window.rgbToHex = function(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
};

// 線形補間（Lerp）ロジック
window.lerp = function(a, b, t) {
    return a + (b - a) * t;
};

// 2色間のカラー補間
window.lerpColor = function(c1, c2, t) {
    return {
        r: Math.round(window.lerp(c1.r, c2.r, t)),
        g: Math.round(window.lerp(c1.g, c2.g, t)),
        b: Math.round(window.lerp(c1.b, c2.b, t))
    };
};

// パーセンテージに基づくグラデーションカラーの取得
window.getColorFromStops = function(stops, percent) {
    let p = percent / 100;
    if (p <= stops[0].p) return window.hexToRgb(stops[0].hex);
    if (p >= stops[stops.length - 1].p) return window.hexToRgb(stops[stops.length - 1].hex);

    for (let i = 0; i < stops.length - 1; i++) {
        if (p >= stops[i].p && p <= stops[i + 1].p) {
            let t = (p - stops[i].p) / (stops[i + 1].p - stops[i].p);
            return window.lerpColor(window.hexToRgb(stops[i].hex), window.hexToRgb(stops[i + 1].hex), t);
        }
    }
    return window.hexToRgb("#ffffff");
};

// カラーを暗くする処理（ボーダー用）
window.darken = function(rgb) {
    return {
        r: Math.floor(rgb.r * 0.8),
        g: Math.floor(rgb.g * 0.8),
        b: Math.floor(rgb.b * 0.8)
    };
};

// 背景色に応じたテキストカラー（白 or 黒）の自動判定
window.getTextColor = function(rgb) {
    let yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
    return (yiq >= 128) ? '#333333' : '#ffffff';
};

// 出走頭数に応じた枠色と文字色の取得
window.getWakuColor = function(horseNoStr, totalHorses) {
    let horseNo = parseInt(horseNoStr);
    if (isNaN(horseNo) || totalHorses < 1) {
        return { waku: "-", bg: "#ffffff", text: "#333333", border: "#cccccc" };
    }
    
    let waku = 8;
    if (totalHorses <= 8) {
        waku = horseNo;
    } else {
        let w = [0, 0, 0, 0, 0, 0, 0, 0];
        let base = Math.floor(totalHorses / 8);
        let remainder = totalHorses % 8;
        
        for (let i = 0; i < 8; i++) w[i] = base;
        for (let i = 0; i < remainder; i++) w[7 - i]++;
        
        let sum = 0;
        for (let i = 0; i < 8; i++) {
            sum += w[i];
            if (horseNo <= sum) {
                waku = i + 1;
                break;
            }
        }
    }
    
    const colors = [
        { waku: 1, bg: "#ffffff", text: "#333333", border: "#cccccc" },
        { waku: 2, bg: "#333333", text: "#ffffff", border: "#222222" },
        { waku: 3, bg: "#e74c3c", text: "#ffffff", border: "#c0392b" },
        { waku: 4, bg: "#3498db", text: "#ffffff", border: "#2980b9" },
        { waku: 5, bg: "#f1c40f", text: "#333333", border: "#d4ac0d" },
        { waku: 6, bg: "#2ecc71", text: "#ffffff", border: "#27ae60" },
        { waku: 7, bg: "#e67e22", text: "#ffffff", border: "#d35400" },
        { waku: 8, bg: "#ff9ff3", text: "#333333", border: "#f368e0" }
    ];
    return colors[waku - 1] || colors[0];
};

// プロンプトのクリップボードへのコピー処理
window.copyPrompt = function() {
    const promptOutput = document.getElementById('promptOutput');
    if (!promptOutput || !promptOutput.value) return;
    
    promptOutput.select();
    promptOutput.setSelectionRange(0, 999999);
    
    try {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(promptOutput.value).then(() => {
                alert("検証用プロンプトをコピーしました。\nこのままチャット欄に貼り付けて送信してください。");
            }).catch(() => {
                window.fallbackCopy();
            });
        } else {
            window.fallbackCopy();
        }
    } catch (err) {
        alert("コピーに失敗しました。下のテキストエリアから手動でコピーしてください。");
    }
};

// フォールバック用コピー処理（古いブラウザ対応）
window.fallbackCopy = function() {
    document.execCommand('copy');
    alert("検証用プロンプトをコピーしました。\nこのままチャット欄に貼り付けて送信してください。");
};