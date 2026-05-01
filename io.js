// ==========================================
// io.js
// ==========================================

// --- プロジェクト保存機能 ---
window.saveProject = function() {
    const d1 = document.getElementById('data1').value;
    const d2 = document.getElementById('data2').value;

    if (!d1 || !d2) {
        alert("保存するデータ（入力欄）が不足しています。");
        return;
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    let location = "不明";
    let raceNo = "";
    let raceName = "";
    
    const lines = d1.split('\n').map(l => l.trim());
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // 開催場所の抽出
        let mLoc = line.match(/(\d+)回\s+([^\s]+)\s+\d+日目/);
        if (mLoc && mLoc[2]) {
            location = mLoc[2].replace("競馬", "");
        }

        // レース番号（2桁化）とレース名の抽出
        let mNo = line.match(/^(\d{1,2})R$/);
        if (mNo) {
            raceNo = mNo[1].padStart(2, '0') + "R";
            // 次の行にレース名、その次の行に「発走」があるパターンを捕捉
            if (i + 2 < lines.length && lines[i+2].includes("発走")) {
                raceName = lines[i+1];
            }
        }
        if (location !== "不明" && raceNo && raceName) break;
    }

    // レース名のサニタイズ（ファイル名禁止文字の除去）と10文字制限
    let cleanRaceName = "";
    if (raceName) {
        cleanRaceName = raceName.replace(/[\\/:*?"<>|]/g, "").trim();
        if (cleanRaceName.length > 10) {
            cleanRaceName = cleanRaceName.substring(0, 10);
        }
    }

    // ファイル名の構築: ATV_開催場所_レース番号_レース名_YYYYMMDD.json
    // レース名がない場合は ATV_開催場所_レース番号_YYYYMMDD.json
    let fileNameParts = ["ATV", location];
    if (raceNo) fileNameParts.push(raceNo);
    if (cleanRaceName) fileNameParts.push(cleanRaceName);
    fileNameParts.push(dateStr);

    const fileName = fileNameParts.join("_") + ".json";

    const projectData = {
        d1_raw: d1,
        d2_raw: d2,
        race_info: `${location}${raceNo}${cleanRaceName ? ' ' + cleanRaceName : ''}`,
        timestamp: now.toISOString(),
        version: window.SYSTEM_VERSION
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- プロジェクト読み込み機能 ---
window.loadProject = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.textContent || e.target.result);
            if (data.d1_raw && data.d2_raw) {
                document.getElementById('data1').value = data.d1_raw;
                document.getElementById('data2').value = data.d2_raw;
                window.runAnalysis();
            } else {
                throw new Error("ファイル形式が正しくありません。");
            }
        } catch (err) {
            alert("読み込みに失敗しました: " + err.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
};

window.pasteFromClipboard = async function(targetId) {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(targetId).value = text;
    } catch (err) {
        alert("クリップボードの読み取りに失敗しました。\n手動で貼り付けてください。");
    }
};

window.copyPrompt = async function(type, index, btnElement) {
    // DOMクエリを廃止し、ステートを使用して比率を取得
    let activeRatio = window.globalRatioId || '03';
    let prompts = window.generatedPrompts[activeRatio];
    if (!prompts) return;

    let promptText = "";
    if (prompts.hasErrors) {
        promptText = prompts.debugPrompt;
    } else if (type === 'macro') {
        promptText = prompts.macroPrompt;
    } else if (type === 'micro') {
        promptText = prompts.microPrompts[index].text;
    }

    if (!promptText) return;

    try {
        await navigator.clipboard.writeText(promptText);
        if (btnElement) {
            const originalText = btnElement.innerHTML;
            // spanタグ構造を保持するためinnerHTMLを使用
            btnElement.innerText = "✓ OK";
            btnElement.style.backgroundColor = "#27ae60";
            setTimeout(() => {
                btnElement.innerHTML = originalText;
                btnElement.style.backgroundColor = "";
            }, 2000);
        }
    } catch (err) {
        alert("コピーに失敗しました。");
    }
};

window.downloadPrompt = function(type, index) {
    // DOMクエリを廃止し、ステートを使用して比率を取得
    let activeRatio = window.globalRatioId || '03';
    let prompts = window.generatedPrompts[activeRatio];
    if (!prompts) return;

    let promptText = "";
    let prefix = "Verify";
    if (prompts.hasErrors) {
        promptText = prompts.debugPrompt;
        prefix = "DebugReq";
    } else if (type === 'macro') {
        promptText = prompts.macroPrompt;
        prefix = "Macro";
    } else if (type === 'micro') {
        promptText = prompts.microPrompts[index].text;
        prefix = `Micro_${prompts.microPrompts[index].title.replace(/番/g, '')}`;
    }

    if (!promptText) return;

    const blob = new Blob([promptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATV_${prefix}_${dateStr}_${timeStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};