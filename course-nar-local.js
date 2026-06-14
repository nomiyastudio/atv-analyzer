// ==========================================
// course-nar-local.js
// ==========================================

window.ATV_COURSE_MASTER = window.ATV_COURSE_MASTER || {};

window.ATV_COURSE_MASTER["門別"] = {
    DIRT: {
        1000: { locFactor: -0.05, cFactor: 0.030, staminaPenalty: 1.05, classes: { "S":"05", "A":"05", "B":"05", "C":"04", "D":"04", "E":"04", "F":"04" } },
        1200: { locFactor: -0.05, cFactor: 0.030, staminaPenalty: 1.05, classes: { "S":"05", "A":"05", "B":"05", "C":"04", "D":"04", "E":"04", "F":"04" } },
        1700: { locFactor: -0.06, cFactor: 0.026, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1800: { locFactor: -0.06, cFactor: 0.026, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } }
    }
};

window.ATV_COURSE_MASTER["盛岡"] = {
    TURF: {
        1000: { locFactor: -0.02, cFactor: 0.026, staminaPenalty: 1.10, classes: { "S":"05", "A":"04", "B":"04", "C":"04", "D":"04", "E":"03", "F":"03" } },
        1600: { locFactor: -0.02, cFactor: 0.022, staminaPenalty: 1.10, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } },
        1700: { locFactor: -0.02, cFactor: 0.022, staminaPenalty: 1.10, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } },
        2400: { locFactor: -0.02, cFactor: 0.020, staminaPenalty: 1.10, classes: { "S":"01", "A":"01", "B":"01", "C":"01", "D":"01", "E":"00", "F":"00" } }
    },
    DIRT: {
        1000: { locFactor: -0.03, cFactor: 0.028, staminaPenalty: 1.00, classes: { "S":"05", "A":"04", "B":"04", "C":"04", "D":"03", "E":"03", "F":"03" } },
        1200: { locFactor: -0.03, cFactor: 0.028, staminaPenalty: 1.00, classes: { "S":"04", "A":"04", "B":"04", "C":"04", "D":"03", "E":"03", "F":"03" } },
        1600: { locFactor: -0.03, cFactor: 0.025, staminaPenalty: 1.00, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1800: { locFactor: -0.03, cFactor: 0.025, staminaPenalty: 1.00, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } }
    }
};

window.ATV_COURSE_MASTER["水沢"] = {
    DIRT: {
        850:  { locFactor: -0.04, cFactor: 0.032, staminaPenalty: 1.05, classes: { "S":"05", "A":"05", "B":"05", "C":"05", "D":"04", "E":"04", "F":"04" } },
        1300: { locFactor: -0.04, cFactor: 0.030, staminaPenalty: 1.05, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1400: { locFactor: -0.04, cFactor: 0.030, staminaPenalty: 1.05, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1600: { locFactor: -0.04, cFactor: 0.026, staminaPenalty: 1.05, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1900: { locFactor: -0.04, cFactor: 0.026, staminaPenalty: 1.05, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};

window.ATV_COURSE_MASTER["園田"] = {
    DIRT: {
        820:  { locFactor: -0.06, cFactor: 0.035, staminaPenalty: 1.05, classes: { "S":"05", "A":"05", "B":"05", "C":"05", "D":"04", "E":"04", "F":"04" } },
        1230: { locFactor: -0.06, cFactor: 0.030, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"04", "D":"03", "E":"03", "F":"03" } },
        1400: { locFactor: -0.06, cFactor: 0.030, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1700: { locFactor: -0.06, cFactor: 0.028, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1870: { locFactor: -0.06, cFactor: 0.028, staminaPenalty: 1.10, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};

window.ATV_COURSE_MASTER["姫路"] = {
    DIRT: {
        800:  { locFactor: -0.08, cFactor: 0.035, staminaPenalty: 1.10, classes: { "S":"05", "A":"05", "B":"05", "C":"05", "D":"04", "E":"04", "F":"04" } },
        1400: { locFactor: -0.08, cFactor: 0.032, staminaPenalty: 1.15, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1500: { locFactor: -0.08, cFactor: 0.032, staminaPenalty: 1.15, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1800: { locFactor: -0.08, cFactor: 0.030, staminaPenalty: 1.15, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        2000: { locFactor: -0.08, cFactor: 0.030, staminaPenalty: 1.15, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};

window.ATV_COURSE_MASTER["名古屋"] = {
    DIRT: {
        920:  { locFactor: -0.07, cFactor: 0.032, staminaPenalty: 1.10, classes: { "S":"05", "A":"05", "B":"05", "C":"04", "D":"04", "E":"04", "F":"04" } },
        1500: { locFactor: -0.07, cFactor: 0.030, staminaPenalty: 1.15, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1700: { locFactor: -0.07, cFactor: 0.030, staminaPenalty: 1.15, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        2000: { locFactor: -0.07, cFactor: 0.028, staminaPenalty: 1.15, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};

window.ATV_COURSE_MASTER["笠松"] = {
    DIRT: {
        800:  { locFactor: -0.07, cFactor: 0.035, staminaPenalty: 1.05, classes: { "S":"05", "A":"05", "B":"05", "C":"05", "D":"04", "E":"04", "F":"04" } },
        1400: { locFactor: -0.07, cFactor: 0.032, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1600: { locFactor: -0.07, cFactor: 0.030, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1900: { locFactor: -0.07, cFactor: 0.030, staminaPenalty: 1.10, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};

window.ATV_COURSE_MASTER["金沢"] = {
    DIRT: {
        900:  { locFactor: -0.07, cFactor: 0.035, staminaPenalty: 1.05, classes: { "S":"05", "A":"05", "B":"05", "C":"04", "D":"04", "E":"04", "F":"04" } },
        1400: { locFactor: -0.07, cFactor: 0.032, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1500: { locFactor: -0.07, cFactor: 0.032, staminaPenalty: 1.10, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1700: { locFactor: -0.07, cFactor: 0.030, staminaPenalty: 1.10, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1900: { locFactor: -0.07, cFactor: 0.030, staminaPenalty: 1.10, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};

window.ATV_COURSE_MASTER["高知"] = {
    DIRT: {
        800:  { locFactor: -0.08, cFactor: 0.035, staminaPenalty: 1.25, classes: { "S":"05", "A":"05", "B":"05", "C":"05", "D":"04", "E":"04", "F":"04" } },
        1300: { locFactor: -0.08, cFactor: 0.032, staminaPenalty: 1.25, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1400: { locFactor: -0.08, cFactor: 0.032, staminaPenalty: 1.25, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1600: { locFactor: -0.08, cFactor: 0.030, staminaPenalty: 1.25, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1900: { locFactor: -0.08, cFactor: 0.030, staminaPenalty: 1.25, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};

window.ATV_COURSE_MASTER["佐賀"] = {
    DIRT: {
        900:  { locFactor: -0.08, cFactor: 0.035, staminaPenalty: 1.15, classes: { "S":"05", "A":"05", "B":"05", "C":"04", "D":"04", "E":"04", "F":"04" } },
        1300: { locFactor: -0.08, cFactor: 0.032, staminaPenalty: 1.15, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1400: { locFactor: -0.08, cFactor: 0.032, staminaPenalty: 1.15, classes: { "S":"04", "A":"04", "B":"04", "C":"03", "D":"03", "E":"03", "F":"03" } },
        1750: { locFactor: -0.08, cFactor: 0.030, staminaPenalty: 1.15, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        1800: { locFactor: -0.08, cFactor: 0.030, staminaPenalty: 1.15, classes: { "S":"03", "A":"03", "B":"03", "C":"03", "D":"02", "E":"02", "F":"02" } },
        2000: { locFactor: -0.08, cFactor: 0.028, staminaPenalty: 1.15, classes: { "S":"02", "A":"02", "B":"02", "C":"02", "D":"02", "E":"01", "F":"01" } }
    }
};