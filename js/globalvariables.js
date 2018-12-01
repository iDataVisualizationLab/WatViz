let dp, //store data processor
    topRows = 100,
    mapWidth = 800,
    mapHeight = 1200,
    timeLabelHeight = 50,
    groupLabelWidth = 80,
    minCellBorder = 0.4,
    maxCellBorder = 2,
    COL_WELL_ID = 'Well_ID',
    COL_LAT = 'y_lat',
    COL_LONG = 'x_long',
    COL_MEASUREMENT_DATE = 'MeasurementDate',
    COL_MONTH_INDEX = 'monthIndex',
    COL_YEAR_INDEX = 'yearIndex',
    COL_SATURATED_THICKNESS = 'SaturatedThickness',
    // COL_SATURATED_THICKNESS = 'lev_va_ft',
    COL_WATER_ELEVATION = 'WaterElevation',
    COL_COUNTY = "County",
    COL_AVERAGE_OVER_TIME_STEP = 'averageOverTimeStep',
    COL_AVERAGE_DIFFERENCE_OVER_TIME_STEP = "averageDifferenceOverTimeStep",
    COL_AVERAGE_DIFFERENCE_FROM_PREV_STEP = "averageDifferenceFromPrevStep",
    COL_WELL_ALPHABETICAL_GROUP = 'wellAlphabeticalGroup',
    COL_WELL_NUM_SAMPLES_GROUP = 'wellNumberOfSamplesGroup',

    COL_STANDARD_DEVIATION = 'standardDeviation',
    COL_STANDARD_DEVIATION_GROUP = 'standardDeviationGroup',

    COL_OVERALL_REDUCTION = 'overallReduction',
    COL_OVERALL_REDUCTION_GROUP = 'overallReductionGroup',

    COL_OVERALL_AVERAGE = 'overallAverage',
    COL_OVERALL_AVERAGE_GROUP = 'overallAverageGroup',

    COL_SUDDEN_INCREMENT = "suddenIncrement",
    COL_SUDDEN_DECREMENT = "suddenDecrement",
    COL_SUDDEN_INCREMENT_GROUP = "suddenIncrementGroup",
    COL_SUDDEN_DECREMENT_GROUP = "suddenDecrementGroup",

    COL_SUDDEN_INCREMENT_D1 = "suddenIncrementD1",
    COL_SUDDEN_INCREMENT_D2 = "suddenIncrementD2",
    COL_SUDDEN_DECREMENT_D1 = "suddenDecrementD1",
    COL_SUDDEN_DECREMENT_D2 = "suddenDecrementD2",

    suddenChangeTypes = [COL_SUDDEN_INCREMENT, COL_SUDDEN_DECREMENT],
    suddenChangeTypesDates = [[COL_SUDDEN_INCREMENT_D1, COL_SUDDEN_INCREMENT_D2], [COL_SUDDEN_DECREMENT_D1, COL_SUDDEN_DECREMENT_D2]],
    cellStrokeNormalColor = "black",
    cellNormalOpacity = 1.0,
    cellFadeOpacity = 0.2,

    timeStepTypes = [COL_MONTH_INDEX, COL_YEAR_INDEX],
    timeStepOptions = ["Month", "Year"],
    timeStepTypeIndex = 1,

    analyzeValues = [COL_AVERAGE_OVER_TIME_STEP, COL_AVERAGE_DIFFERENCE_OVER_TIME_STEP],
    analyzeValueOptions = ["Absolute value", "Difference"],
    analyzeValueIndex = 1,
    averageValueRanges = new Array(2),
    averageDifferenceValueRanges = new Array(2),
    colorRanges = [averageValueRanges, averageDifferenceValueRanges],
    numberOfThresholds = [14, 8],
    averageValueThresholds = [10e-6, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1500],
    groupByGroups = [groupByCounty, groupByWellAlphabetical, groupByWellNumberOfSamples, groupBySuddenIncrement, groupBySuddenDecrement, groupByStandardDeviation, groupByOverallReduction, groupByOverallAverage],
    groupOptions = ["County", "Well alphabetical", "Well number of samples", "Sudden increment", "Sudden decrement", "Standard deviation", "Overall reduction", "Overall average"],
    groupSortOptions = [["Alphabetical", "Number of wells", "Overall reduction", "Thickness (ascending)", "Thickness (descending)"], ["Ascending", "Descending"], ["Ascending", "Descending"],["Ascending", "Descending"], ["Ascending", "Descending"], ["Ascending", "Descending"], ["Ascending", "Descending"], ["Ascending", "Descending"]],
    countySortFunctions = [sortCountiesAlphabetically, sortCountiesByNumberOfWells, sortCountiesByOverallReduction, sortCountiesBySaturatedThickness(true), sortCountiesBySaturatedThickness(false)],
    statisticSortFunctions = [ascendingOrder, descendingOrder],
    groupSortFunctions = [countySortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions],
    wellSortOptions = ["Alphabetical", "Number of samples", "Sudden increment", "Sudden decrement", "Standard deviation", "Overall reduction", "Thickness (ascending)", "Thickness (descending)"],
    wellSortFunctions = [sortWellsAlphabetically, sortWellsByNumberOfSamples, sortWellsBySuddenIncrement, sortWellsBySuddenDecrement, sortWellsByStandardDeviation, sortWellsByOverallReduction, sortWellsByAverageThickness(true), sortWellsByAverageThickness(false)],
    groupByIndex = 5,
    groupSortIndex = 0,
    wellSortIndex = 5,
    rowPositionTransitionDuration = 500,
    contourOpacity = 0.5,
    contourStrokeWidth = 0.1,
    wells,
    heatmapPlotter,
    playSlider,
    plotWellsOption = false,
    plotContoursOption = true,
    plotCountyOption = true,
    isGroupedByCounty = false,
    us;


function ascendingOrder(a, b) {
    return a.key - b.key;
}

function descendingOrder(a, b) {
    return b.key - a.key;
}

function groupByCounty(well) {
    return well[COL_COUNTY];
}

function groupBySuddenIncrement(well) {
    return dp.wellStatistics[well[COL_WELL_ID]][COL_SUDDEN_INCREMENT_GROUP];
}

function groupByWellAlphabetical(well){
    return dp.wellStatistics[well[COL_WELL_ID]][COL_WELL_ALPHABETICAL_GROUP];
}

function groupByWellNumberOfSamples(well){
    return dp.wellStatistics[well[COL_WELL_ID]][COL_WELL_NUM_SAMPLES_GROUP];
}

function groupBySuddenDecrement(well) {
    return dp.wellStatistics[well[COL_WELL_ID]][COL_SUDDEN_DECREMENT_GROUP];
}

function groupByStandardDeviation(well) {
    return dp.wellStatistics[well[COL_WELL_ID]][COL_STANDARD_DEVIATION_GROUP];
}

function groupByOverallReduction(well) {
    return dp.wellStatistics[well[COL_WELL_ID]][COL_OVERALL_REDUCTION_GROUP];
}

function groupByOverallAverage(well) {
    return dp.wellStatistics[well[COL_WELL_ID]][COL_OVERALL_AVERAGE_GROUP];
}

function sortCountiesAlphabetically(a, b) {
    return a.key.localeCompare(b.key);
}

function sortCountiesByNumberOfWells(a, b) {
    return b.values.length - a.values.length;
}

function sortCountiesByOverallReduction(a, b) {
    let aReduction = d3.sum(a.values.map(w => dp.wellStatistics[w.key][COL_OVERALL_REDUCTION]));
    let bReduction = d3.sum(b.values.map(w => dp.wellStatistics[w.key][COL_OVERALL_REDUCTION]));
    return bReduction - aReduction;
}

function sortCountiesBySaturatedThickness(ascending) {
    return function (a, b) {
        let aAverage = d3.mean(a.values.map(w => dp.wellStatistics[w.key][COL_OVERALL_AVERAGE]));
        let bAverage = d3.mean(b.values.map(w => dp.wellStatistics[w.key][COL_OVERALL_AVERAGE]));
        if (ascending) {
            return aAverage - bAverage;
        } else {
            return bAverage - aAverage;
        }
    }
}

function sortWellsAlphabetically(a, b) {
    return a.key.localeCompare(b.key);
}

function sortWellsByNumberOfSamples(a, b) {
    return b.values.length - a.values.length;
}

function sortWellsBySuddenIncrement(a, b) {
    return dp.wellStatistics[b.key][COL_SUDDEN_INCREMENT] - dp.wellStatistics[a.key][COL_SUDDEN_INCREMENT];
}

function sortWellsBySuddenDecrement(a, b) {
    return dp.wellStatistics[a.key][COL_SUDDEN_DECREMENT] - dp.wellStatistics[b.key][COL_SUDDEN_DECREMENT];
}

function sortWellsByStandardDeviation(a, b) {
    return dp.wellStatistics[b.key][COL_STANDARD_DEVIATION] - dp.wellStatistics[a.key][COL_STANDARD_DEVIATION];
}

function sortWellsByOverallReduction(a, b) {
    return dp.wellStatistics[b.key][COL_OVERALL_REDUCTION] - dp.wellStatistics[a.key][COL_OVERALL_REDUCTION];
}

function sortWellsByAverageThickness(ascending) {
    return function (a, b) {
        let aAverageThickness = dp.wellStatistics[a.key][COL_OVERALL_AVERAGE];
        let bAverageThickness = dp.wellStatistics[b.key][COL_OVERALL_AVERAGE];
        if (ascending) {
            return aAverageThickness - bAverageThickness;
        } else {
            return bAverageThickness - aAverageThickness;
        }
    }

}
