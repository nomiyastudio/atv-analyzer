// ==========================================
// course-nar-minami-kanto.js
// ==========================================

window.ATV_COURSE_MASTER = window.ATV_COURSE_MASTER || {};

window.ATV_COURSE_MASTER["大井"] = {
    DIRT: {
        1200: { locFactor: -0.04, cFactor: 0.025, staminaPenalty: 1.10, classes: { "S":"05", "A":"04", "B":"04", "C":"04", "D":"03", "E":"03", "F":"03" } }, // 内回り
        1400: { locFactor: -0.04, cFactor: 0.025, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } }, // 内回り
        1600: { locFactor: -0.04, cFactor: 0.025, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } }, // 内回り
        1700: { locFactor: -0.05, cFactor: 0.025, staminaPenalty: 1.15, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } }, // 外回り
        1800: { locFactor: -0.05, cFactor: 0.025, staminaPenalty: 1.15, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } }, // 外回り
        2000: { locFactor: -0.05, cFactor: 0.025, staminaPenalty: 1.15, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }, // 外回り
        2600: { locFactor: -0.05, cFactor: 0.022, staminaPenalty: 1.15, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }  // 外回り
    }
};

window.ATV_COURSE_MASTER["川崎"] = {
    DIRT: {
        900:  { locFactor: -0.06, cFactor: 0.032, staminaPenalty: 1.05, classes: { "S":"05", "A":"05", "B":"05", "C":"04", "D":"04", "E":"04", "F":"04" } },
        1400: { locFactor: -0.06, cFactor: 0.030, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1500: { locFactor: -0.06, cFactor: 0.030, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1600: { locFactor: -0.06, cFactor: 0.030, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        2000: { locFactor: -0.06, cFactor: 0.028, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        2100: { locFactor: -0.06, cFactor: 0.028, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } }
    }
};

window.ATV_COURSE_MASTER["船橋"] = {
    DIRT: {
        1000: { locFactor: -0.06, cFactor: 0.030, staminaPenalty: 1.05, classes: { "S":"05", "A":"05", "B":"05", "C":"04", "D":"04", "E":"04", "F":"04" } },
        1200: { locFactor: -0.06, cFactor: 0.028, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"04", "D":"03", "E":"03", "F":"03" } },
        1500: { locFactor: -0.06, cFactor: 0.026, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1600: { locFactor: -0.06, cFactor: 0.026, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1700: { locFactor: -0.06, cFactor: 0.026, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1800: { locFactor: -0.06, cFactor: 0.026, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        2200: { locFactor: -0.06, cFactor: 0.024, staminaPenalty: 1.10, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};

window.ATV_COURSE_MASTER["浦和"] = {
    DIRT: {
        800:  { locFactor: -0.07, cFactor: 0.035, staminaPenalty: 1.00, classes: { "S":"05", "A":"05", "B":"05", "C":"05", "D":"04", "E":"04", "F":"04" } },
        1300: { locFactor: -0.07, cFactor: 0.035, staminaPenalty: 1.05, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1400: { locFactor: -0.07, cFactor: 0.035, staminaPenalty: 1.05, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1500: { locFactor: -0.07, cFactor: 0.035, staminaPenalty: 1.05, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        2000: { locFactor: -0.07, cFactor: 0.032, staminaPenalty: 1.05, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } }
    }
};