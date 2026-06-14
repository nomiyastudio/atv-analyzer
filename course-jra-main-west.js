// ==========================================
// course-jra-main-west.js
// ==========================================

window.ATV_COURSE_MASTER = window.ATV_COURSE_MASTER || {};

window.ATV_COURSE_MASTER["京都"] = {
    TURF: {
        1200: { locFactor: -0.01, cFactor: 0.024, staminaPenalty: 1.05, classes: { "S":"04", "A":"04", "B":"03", "C":"03", "D":"03", "E":"02", "F":"02" } },
        1400: { locFactor: 0.00,  cFactor: 0.015, staminaPenalty: 1.02, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }, // 外回り代表
        1600: { locFactor: 0.00,  cFactor: 0.015, staminaPenalty: 1.02, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }, // 外回り
        1800: { locFactor: 0.00,  cFactor: 0.015, staminaPenalty: 1.02, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } },
        2000: { locFactor: -0.01, cFactor: 0.022, staminaPenalty: 1.05, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } }, // 内回り
        2200: { locFactor: 0.00,  cFactor: 0.015, staminaPenalty: 1.02, classes: { "S":"01", "A":"01", "B":"01", "C":"01", "D":"01", "E":"00", "F":"00" } },
        2400: { locFactor: 0.00,  cFactor: 0.015, staminaPenalty: 1.02, classes: { "S":"01", "A":"01", "B":"01", "C":"01", "D":"01", "E":"00", "F":"00" } },
        3000: { locFactor: 0.00,  cFactor: 0.012, staminaPenalty: 1.02, classes: { "S":"01", "A":"01", "B":"01", "C":"01", "D":"01", "E":"00", "F":"00" } },
        3200: { locFactor: 0.00,  cFactor: 0.012, staminaPenalty: 1.02, classes: { "S":"01", "A":"01", "B":"01", "C":"01", "D":"01", "E":"00", "F":"00" } }
    },
    DIRT: {
        1200: { locFactor: -0.02, cFactor: 0.028, staminaPenalty: 1.00, classes: { "S":"05", "A":"04", "B":"04", "C":"04", "D":"03", "E":"03", "F":"03" } },
        1400: { locFactor: -0.02, cFactor: 0.025, staminaPenalty: 1.00, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1800: { locFactor: -0.02, cFactor: 0.025, staminaPenalty: 1.00, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1900: { locFactor: -0.02, cFactor: 0.025, staminaPenalty: 1.00, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};

window.ATV_COURSE_MASTER["阪神"] = {
    TURF: {
        1200: { locFactor: -0.01, cFactor: 0.026, staminaPenalty: 1.10, classes: { "S":"05", "A":"04", "B":"04", "C":"04", "D":"04", "E":"03", "F":"03" } }, // 内回り
        1400: { locFactor: -0.01, cFactor: 0.022, staminaPenalty: 1.10, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }, // 内回り
        1600: { locFactor: 0.00,  cFactor: 0.014, staminaPenalty: 1.05, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }, // 外回り
        1800: { locFactor: 0.00,  cFactor: 0.014, staminaPenalty: 1.05, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }, // 外回り
        2000: { locFactor: -0.01, cFactor: 0.022, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } }, // 内回り
        2200: { locFactor: -0.01, cFactor: 0.022, staminaPenalty: 1.10, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }, // 内回り
        2400: { locFactor: 0.00,  cFactor: 0.014, staminaPenalty: 1.05, classes: { "S":"01", "A":"01", "B":"01", "C":"01", "D":"01", "E":"00", "F":"00" } }, // 外回り
        2600: { locFactor: 0.00,  cFactor: 0.014, staminaPenalty: 1.05, classes: { "S":"01", "A":"01", "B":"01", "C":"01", "D":"01", "E":"00", "F":"00" } }, // 外回り
        3000: { locFactor: -0.01, cFactor: 0.018, staminaPenalty: 1.10, classes: { "S":"01", "A":"01", "B":"01", "C":"01", "D":"01", "E":"00", "F":"00" } }  // 内回り
    },
    DIRT: {
        1200: { locFactor: -0.02, cFactor: 0.030, staminaPenalty: 1.00, classes: { "S":"05", "A":"05", "B":"05", "C":"04", "D":"04", "E":"04", "F":"04" } },
        1400: { locFactor: -0.02, cFactor: 0.025, staminaPenalty: 1.00, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1800: { locFactor: -0.02, cFactor: 0.025, staminaPenalty: 1.00, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        2000: { locFactor: -0.02, cFactor: 0.025, staminaPenalty: 1.00, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};