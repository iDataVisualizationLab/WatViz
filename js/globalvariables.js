let mapWidth = 800,
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
    COL_AVERAGE_OVERTIME = 'averageOverTime',
    COL_COUNTY = "County",

    timeStepTypes = [COL_MONTH_INDEX, COL_YEAR_INDEX],
    timeStepOptions = ["Month", "Year"],
    timeStepTypeIndex = 1,

    groupByGroups = [COL_WELL_ID, COL_COUNTY],
    groupOptions = ["None", "County"],
    countySortOptions = ["Alphabetical", "Number of wells"],
    wellSortOptions = ["Alphabetical", "Number of samples"],
    wellSortFunctions = [sortWellsAlphabetically, sortWellsByNumberOfSamples],
    countySortFunctions = [sortCountiesAlphabetically, sortCountiesByNumberOfWells],
    groupSortFunctions = [wellSortFunctions, countySortFunctions],
    groupByIndex = 1,
    groupSortIndex = 0,
    wellSortIndex = 1;

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