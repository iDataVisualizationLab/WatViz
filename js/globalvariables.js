let dp, //store data processor
    topRows = 100,
    mapWidth = 800,
    mapHeight = 1200,
    sliderTimeInterval = 1000,
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
    COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_MONTH = "minAverageDifferenceFromPrevMonth",
    COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_YEAR = "minAverageDifferenceFromPrevYear",
    COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_MONTH_GROUP = "minAverageDifferenceFromPrevMonthGroup",
    COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_YEAR_GROUP = "minAverageDifferenceFromPrevYearGroup",
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

    analyzeValues = [COL_AVERAGE_OVER_TIME_STEP, COL_AVERAGE_DIFFERENCE_OVER_TIME_STEP, COL_AVERAGE_DIFFERENCE_FROM_PREV_STEP],
    analyzeValueOptions = ["Absolute value", "Difference from average", "Difference from previous step"],
    analyzeValueIndex = 1,
    averageValueRanges = new Array(2),
    averageDifferenceValueRanges = new Array(2),
    differenceFromPrevStepValueRanges = new Array(2),
    colorRanges = [averageValueRanges, averageDifferenceValueRanges, differenceFromPrevStepValueRanges],
    numberOfThresholds = [14, 8, 8],
    gridSize = [35, 35, 40],
    averageValueThresholds = [10e-6, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1500],
    groupByGroups = [groupByCounty, groupByWellAlphabetical, groupByWellNumberOfSamples, groupBySuddenIncrement, groupBySuddenDecrement, groupByStandardDeviation, groupByOverallReduction, groupByMinDifferenceFromPrevStep, groupByOverallAverage],
    groupOptions = ["County", "Well alphabetical", "Well number of samples", "Sudden increment", "Sudden decrement", "Standard deviation", "Overall reduction", "Min Diff from Prev Step", "Overall average"],
    groupSortOptions = [["Alphabetical", "Number of wells", "Overall reduction", "Thickness (ascending)", "Thickness (descending)"], ["Ascending", "Descending"], ["Ascending", "Descending"],["Ascending", "Descending"], ["Ascending", "Descending"], ["Ascending", "Descending"], ["Ascending", "Descending"], ["Ascending", "Descending"]],
    countySortFunctions = [sortCountiesAlphabetically, sortCountiesByNumberOfWells, sortCountiesByOverallReduction, sortCountiesBySaturatedThickness(true), sortCountiesBySaturatedThickness(false)],
    statisticSortFunctions = [ascendingOrder, descendingOrder],
    groupSortFunctions = [countySortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions],
    wellSortOptions = ["Alphabetical", "Number of samples", "Sudden increment", "Sudden decrement", "Standard deviation", "Overall reduction", "Difference", "Thickness (ascending)", "Thickness (descending)"],
    wellSortFunctions = [sortWellsAlphabetically, sortWellsByNumberOfSamples, sortWellsBySuddenIncrement, sortWellsBySuddenDecrement, sortWellsByStandardDeviation, sortWellsByOverallReduction, sortWellsByOverallDifference, sortWellsByAverageThickness(true), sortWellsByAverageThickness(false)],
    groupByIndex = 5,
    groupSortIndex = 0,
    wellSortIndex = 5,
    rowPositionTransitionDuration = 500,
    contourOpacity = 0.6,
    contourStrokeWidth = 0.2,
    wells,
    heatmapPlotter,
    playSlider,
    plotWellsOption = false,
    plotContoursOption = true,
    plotCountyOption = false,
    isGroupedByCounty = false,
    us,
    wellStatistics;
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

function groupByMinDifferenceFromPrevStep(well) {
    if(timeStepTypeIndex==0){
        return dp.wellStatistics[well[COL_WELL_ID]][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_MONTH_GROUP];
    }else{
        return dp.wellStatistics[well[COL_WELL_ID]][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_YEAR_GROUP];
    }

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
    let akey = a.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(akey.indexOf('$')>=0){
        akey = akey.replace('$', '').split('_')[0];
    }
    let bkey = b.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(bkey.indexOf('$')>=0){
        bkey = bkey.replace('$', '').split('_')[0];
    }
    return dp.wellStatistics[bkey][COL_SUDDEN_INCREMENT] - dp.wellStatistics[akey][COL_SUDDEN_INCREMENT];
}

function sortWellsBySuddenDecrement(a, b) {
    let akey = a.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(akey.indexOf('$')>=0){
        akey = akey.replace('$', '').split('_')[0];
    }
    let bkey = b.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(bkey.indexOf('$')>=0){
        bkey = bkey.replace('$', '').split('_')[0];
    }
    return dp.wellStatistics[akey][COL_SUDDEN_DECREMENT] - dp.wellStatistics[bkey][COL_SUDDEN_DECREMENT];
}

function sortWellsByStandardDeviation(a, b) {
    let akey = a.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(akey.indexOf('$')>=0){
        akey = akey.replace('$', '').split('_')[0];
    }
    let bkey = b.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(bkey.indexOf('$')>=0){
        bkey = bkey.replace('$', '').split('_')[0];
    }
    return dp.wellStatistics[bkey][COL_STANDARD_DEVIATION] - dp.wellStatistics[akey][COL_STANDARD_DEVIATION];
}

function sortWellsByOverallReduction(a, b) {
    let akey = a.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(akey.indexOf('$')>=0){
        akey = akey.replace('$', '').split('_')[0];
    }
    let bkey = b.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(bkey.indexOf('$')>=0){
        bkey = bkey.replace('$', '').split('_')[0];
    }
    return dp.wellStatistics[bkey][COL_OVERALL_REDUCTION] - dp.wellStatistics[akey][COL_OVERALL_REDUCTION];
}

function sortWellsByOverallDifference(a, b) {
    let akey = a.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(akey.indexOf('$')>=0){
        akey = akey.replace('$', '').split('_')[0];
    }
    let bkey = b.key;
    //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
    if(bkey.indexOf('$')>=0){
        bkey = bkey.replace('$', '').split('_')[0];
    }
    let aDiff = (timeStepTypeIndex==0)?dp.wellStatistics[akey][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_MONTH]:dp.wellStatistics[akey][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_YEAR];
    let bDiff = (timeStepTypeIndex==0)?dp.wellStatistics[bkey][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_MONTH]:dp.wellStatistics[bkey][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_YEAR];
    if(typeof aDiff==="undefined"){
        return 1;
    }
    if(typeof bDiff=="undefined"){
        return -1;
    }
    return aDiff - bDiff;

}

function sortWellsByAverageThickness(ascending) {
    return function (a, b) {
        let akey = a.key;
        //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
        if(akey.indexOf('$')>=0){
            akey = akey.replace('$', '').split('_')[0];
        }
        let bkey = b.key;
        //If the wellId contains $ and _, it means it was the combination of wellID + month, we split and take only well ID
        if(bkey.indexOf('$')>=0){
            bkey = bkey.replace('$', '').split('_')[0];
        }
        let aAverageThickness = dp.wellStatistics[akey][COL_OVERALL_AVERAGE];
        let bAverageThickness = dp.wellStatistics[bkey][COL_OVERALL_AVERAGE];
        if (ascending) {
            return aAverageThickness - bAverageThickness;
        } else {
            return bAverageThickness - aAverageThickness;
        }
    }

}
