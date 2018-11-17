let dp, //store data processor
    topRows = 19,
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
    COL_WATER_ELEVATION = 'WaterElevation',
    COL_COUNTY = "County",
    COL_AVERAGE_OVER_TIME_STEP = 'averageOverTimeStep',
    COL_AVERAGE_DIFFERENCE_OVER_TIME_STEP = "averageDifferenceOverTimeStep",
    COL_STANDARD_DEVIATION = 'standardDeviation',
    COL_STANDARD_DEVIATION_GROUP = 'standardDeviationGroup',
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
    analyzeValueOptions = ["Average over time step", "Average difference over time step"],
    analyzeValueIndex = 0,

    groupByGroups = [groupByCounty, groupBySuddenIncrement, groupBySuddenDecrement, groupByStandardDeviation, groupByOverallAverage],
    groupOptions = ["County", "Sudden increment", "Sudden decrement", "Standard deviation", "Overall average"],
    groupSortOptions = [["Alphabetical", "Number of wells"], ["Ascending", "Descending"], ["Ascending", "Descending"], ["Ascending", "Descending"], ["Ascending", "Descending"]],
    countySortFunctions = [sortCountiesAlphabetically, sortCountiesByNumberOfWells],
    statisticSortFunctions = [ascendingOrder, descendingOrder],
    groupSortFunctions = [countySortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions, statisticSortFunctions],
    wellSortOptions = ["Alphabetical", "Number of samples", "Sudden increment", "Sudden decrement", "Standard deviation"],
    wellSortFunctions = [sortWellsAlphabetically, sortWellsByNumberOfSamples, sortWellsBySuddenIncrement, sortWellsBySuddenDecrement, sortWellsByStandardDeviation],
    groupByIndex = 0,
    groupSortIndex = 0,
    wellSortIndex = 1,
    rowPositionTransitionDuration=500,
    contourOpacity = 0.4,
    wells,
    heatmapPlotter,
    playSlider,
    plotWellsOption=false;


function ascendingOrder(a, b){
    return a.key - b.key;
}
function descendingOrder(a, b){
    return b.key - a.key;
}

function groupByCounty(well){
    return well[COL_COUNTY];
}
function groupBySuddenIncrement(well){
    return dp.wellStatistics[well[COL_WELL_ID]][COL_SUDDEN_INCREMENT_GROUP];
}
function groupBySuddenDecrement(well){
    return dp.wellStatistics[well[COL_WELL_ID]][COL_SUDDEN_DECREMENT_GROUP];
}
function groupByStandardDeviation(well){
    return dp.wellStatistics[well[COL_WELL_ID]][COL_STANDARD_DEVIATION_GROUP];
}
function groupByOverallAverage(well){
    return dp.wellStatistics[well[COL_WELL_ID]][COL_OVERALL_AVERAGE_GROUP];
}
function sortCountiesAlphabetically(a, b){
    return a.key.localeCompare(b.key);
}
function sortCountiesByNumberOfWells(a, b){
    return b.values.length - a.values.length;
}
function sortWellsAlphabetically(a, b){
    return a.key.localeCompare(b.key);
}
function sortWellsByNumberOfSamples(a, b){
    return b.values.length - a.values.length;
}
function sortWellsBySuddenIncrement(a, b){
    return dp.wellStatistics[b.key][COL_SUDDEN_INCREMENT] - dp.wellStatistics[a.key][COL_SUDDEN_INCREMENT];
}
function sortWellsBySuddenDecrement(a, b){
    return dp.wellStatistics[a.key][COL_SUDDEN_DECREMENT] - dp.wellStatistics[b.key][COL_SUDDEN_DECREMENT];
}
function sortWellsByStandardDeviation(a, b){
    return dp.wellStatistics[b.key][COL_STANDARD_DEVIATION]- dp.wellStatistics[b.key][COL_STANDARD_DEVIATION];
}