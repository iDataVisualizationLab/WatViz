dataProcessor = function (data) {
    //convert data type.
    data = data.map(d => {
        d[COL_LONG] = +d[COL_LONG];
        d[COL_LAT] = +d[COL_LAT];
        d[COL_MEASUREMENT_DATE] = new Date(d[COL_MEASUREMENT_DATE]);
        d[COL_SATURATED_THICKNESS] = +d[COL_SATURATED_THICKNESS];
        return d;
    });
    //Filter data with negative saturated thickness
    data = data.filter(d => {
        if (d[COL_SATURATED_THICKNESS] <= 0 || d[COL_SATURATED_THICKNESS] == d[COL_WATER_ELEVATION]) {
            return false;
        } else {
            return true;
        }
    });

    let wells = getAllWells(data);
    debugger;
    //Sort the wells by number of samples.
    wells = wells.sort((a, b) => b.values.length - a.values.length);
    let allWellIds = unpack(wells, "key");
    let dateExtent = d3.extent(unpack(data, COL_MEASUREMENT_DATE));
    let minDate = dateExtent[0];
    let maxDate = dateExtent[1];
    //Add the month index to the data
    addMonthIndex();
    addYearIndex();

    let maxMonthIndex = d3.max(unpack(data, COL_MONTH_INDEX));
    let maxYearIndex = d3.max(unpack(data, COL_YEAR_INDEX));

    function unpack(rows, key) {
        return rows.map(r => r[key]);
    }

    function getAllWells(rows) {
        let nested = d3.nest().key(d => d[COL_WELL_ID]).entries(rows);
        processWellValue(nested);
        return nested;
    }

    function processWellValue(wells) {
        wells.forEach(well => {
            let measures = well.values;
            well[COL_AVERAGE_OVERTIME] = d3.mean(unpack(measures, COL_SATURATED_THICKNESS));
            well[COL_LAT] = d3.mean(unpack(measures, COL_LAT));
            well[COL_LONG] = d3.mean(unpack(measures, COL_LONG));
        });
    }

    function getNestedByWellMonthData() {
        return getNestedByWellTimeStepData(COL_MONTH_INDEX);
    }

    function getNestedByWellYearData() {
        return getNestedByWellTimeStepData(COL_YEAR_INDEX);
    }

    function getNestedByWellTimeStepData(timeStepColumn) {
        let nested = d3.nest().key(w => "$" + w[COL_WELL_ID] + "_" + w[timeStepColumn]).entries(data);
        processWellValue(nested);
        return nested;
    }

    function addMonthIndex() {
        data = data.map(d => {
            d[COL_MONTH_INDEX] = utils.monthdiff(minDate, d[COL_MEASUREMENT_DATE]);
            return d;
        });
    }

    function addYearIndex() {
        data = data.map(d => {
            d[COL_YEAR_INDEX] = d[COL_MEASUREMENT_DATE].getFullYear() - minDate.getFullYear();
            return d;
        });
    }

    function getWellMonthData() {
        return getWellTimeStepData(COL_MONTH_INDEX);
    }

    function getWellYearData() {
        return getWellTimeStepData(COL_YEAR_INDEX);
    }

    function getWellTimeStepData(timeStepColumn) {
        let maxIndex;
        if (timeStepColumn === COL_MONTH_INDEX) {
            maxIndex = maxMonthIndex;
        }
        if (timeStepColumn === COL_YEAR_INDEX) {
            maxIndex = maxYearIndex;
        }
        let wellTimeStepData = new Array(maxIndex + 1);
        for (let timeIndex = 0; timeIndex <= maxIndex; timeIndex++) {
            if (!wellTimeStepData[timeIndex]) {
                let wellt = data.filter(d => d[timeStepColumn] === timeIndex);
                let nested = d3.nest().key(w => w[COL_WELL_ID]).entries(wellt);
                processWellValue(nested);
                wellTimeStepData[timeIndex] = nested;
            }
        }
        return wellTimeStepData;
    }

    let wellMonthData = getWellMonthData(COL_MONTH_INDEX);
    let wellYearData = getWellYearData(COL_YEAR_INDEX);
    let nestedByWellMonthData = getNestedByWellMonthData();
    let nestedByWellYearData = getNestedByWellYearData();

    function getWellByMonthIndex(monthIndex) {
        return wellMonthData[monthIndex];
    }

    function getWellByYearIndex(yearIndex) {
        return wellYearData[yearIndex];
    }

    function monthIndexToYear(month) {
        let date = utils.fromMonthIndexToDate(month, minDate);
        return date.getFullYear();
    }

    //Exposing methods and data.
    this.wells = wells;
    this.getWellByTimeSteps = [getWellByMonthIndex, getWellByYearIndex];
    this.minDate = minDate;
    this.maxDate = maxDate;
    this.steps = [maxMonthIndex + 1, maxYearIndex+1];
    this.wellMonthData = wellMonthData;
    this.wellYearData = wellYearData;
    this.nestedByWellTimeStepData = [nestedByWellMonthData, nestedByWellYearData];
    this.allWellIds = allWellIds;
    this.monthIndexToYear = monthIndexToYear;
}