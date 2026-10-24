window.ATV_CONFIG = {
    DIST_SENSITIVITY: {
        TURF: 0.040,
        DIRT: 0.065
    },
    DIST_EXPONENT: 1.3,
    OUTER_TRACK_MOD: {
        STAMINA_PENALTY: 0.95,
        C_FACTOR: 0.85
    },
    PACE_MOD: {
        SLOW_EXP: 1.3,
        SLOW_MULT: 1.6,
        HIGH_FRONT_EXP: 1.3,
        HIGH_FRONT_MULT: 1.1,
        HIGH_BACK_BIAS: 0.35
    },
    AGE_ALLOWANCE: {
        6: [3.0, 3.0, 3.0, 4.0],
        7: [2.0, 3.0, 3.0, 4.0],
        8: [2.0, 2.0, 3.0, 3.0],
        9: [1.0, 2.0, 2.0, 3.0],
        10: [0.0, 1.0, 2.0, 2.0],
        11: [0.0, 1.0, 1.0, 2.0],
        12: [0.0, 0.0, 1.0, 1.0]
    },
    WEIGHT_FACTOR: 0.002,
    CLASS_FACTOR: {
        1: { "S": 0.000, "A": 0.000, "B": 0.000, "C": 0.005, "D": 0.005, "E": 0.005, "F": 0.010 },
        2: { "S": -0.005, "A": 0.000, "B": 0.005, "C": 0.010, "D": 0.015, "E": 0.020, "F": 0.025 },
        3: { "S": -0.005, "A": 0.000, "B": 0.005, "C": 0.015, "D": 0.020, "E": 0.030, "F": 0.030 }
    },
    LAP_FALLBACK_MATRIX: {
        JRA: {
            TURF: {
                SHORT:  0.965,
                MIDDLE: 0.985,
                LONG:   1.005
            },
            DIRT: {
                SHORT:  0.975,
                MIDDLE: 0.990,
                LONG:   1.015
            }
        },
        NAR: {
            GRADE:   0.970,
            DEFAULT: 1.020
        }
    }
};

window.processedData = {};
window.globalSortType = 'adjWeighted';
window.globalRatioId = '02';
window.globalSortDirection = 'asc';
window.resolveMonthCallback = null;
window.useDynamicPace = false;