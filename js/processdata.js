function dataProcessor(data) {
    //<editor-fold desc='data'>
    data = data.map(d => {
        d[COL_LONG] = +d[COL_LONG];
        d[COL_LAT] = +d[COL_LAT];
        d[COL_MEASUREMENT_DATE] = new Date(d[COL_MEASUREMENT_DATE]);
        d[COL_SATURATED_THICKNESS] = +d[COL_SATURATED_THICKNESS];
        return d;
    });
    //Filter data with negative saturated thickness
    data = data.filter(d => {
        //Filter out Ector since it has only one well + only one year measurement
        if (d[COL_COUNTY] === "Ector") {
            return false;
        }
        if (d[COL_SATURATED_THICKNESS] <= 0 || d[COL_SATURATED_THICKNESS] == d[COL_WATER_ELEVATION]) {
            return false;
        } else {
            return true;
        }
    });
    //</editor-fold>
    //let wellStatistics = processWellStatistics(data);
    let wells = getAllWells(data);
    let allWellIds = unpack(wells, "key");
    let allCounties = unpack(data, "County");
    allCounties = allCounties.map(d=>d.toLowerCase());//Convert counties to lowercase
    let dateExtent = d3.extent(unpack(data, COL_MEASUREMENT_DATE));
    let minDate = dateExtent[0];
    let maxDate = dateExtent[1];
    //Add the month index to the data
    addMonthIndex();
    addYearIndex();
    let maxMonthIndex = d3.max(unpack(data, COL_MONTH_INDEX));
    let maxYearIndex = d3.max(unpack(data, COL_YEAR_INDEX));

    let nestedByWellMonthData = getNestedByWellMonthData();
    let nestedByWellYearData = getNestedByWellYearData();

    processDifferenceFromPrevStep();
    // processMinDifferenceFromPrevStepStatistics();
    processMinMax();

    //Used to save wellStatistics
    // let blob = new Blob([JSON.stringify(wellStatistics)], {type: "text/plain;charset=utf-8"});
    // saveAs(blob, "wellStatistics.json");

    let wellMonthData = getWellMonthData(COL_MONTH_INDEX);
    let wellYearData = getWellYearData(COL_YEAR_INDEX);

    //<editor-fold desc='Utils'>
    //Util
    function processMinDifferenceFromPrevStepStatistics() {
        //Add the min difference information to the statistics
        let allWellsMinValues = []
        allWellIds.forEach(wellId => {
            let minMonth = d3.min(nestedByWellMonthData.filter(wm => wm.key.indexOf("$" + wellId + "_") == 0).map(d => d[COL_AVERAGE_DIFFERENCE_FROM_PREV_STEP]));
            let minYear = d3.min(nestedByWellYearData.filter(wm => wm.key.indexOf("$" + wellId + "_") == 0).map(d => d[COL_AVERAGE_DIFFERENCE_FROM_PREV_STEP]));
            wellStatistics[wellId][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_MONTH] = minMonth;
            wellStatistics[wellId][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_YEAR] = minYear;
            allWellsMinValues.push({"key": wellId, "minMonth": minMonth, "minYear": minYear});//Store them for sorting and making group
        });
        //Process the month
        allWellsMinValues = allWellsMinValues.sort((a, b) => {
            if(typeof a.minMonth=== "undefined"){
                return 1;
            }
            if(typeof b.minMonth === "undefined"){
                return -1;
            }
            return a.minMonth - b.minMonth;
        });
        allWellsMinValues.forEach((well, i) => {
            wellStatistics[well.key][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_MONTH_GROUP] = (i < topRows) ? 1 : 2;
        });
        //Process the year
        allWellsMinValues = allWellsMinValues.sort((a, b) => {
            if(typeof a.minYear === "undefined"){
                return 1;
            }
            if(typeof b.minYear === "undefined"){
                return -1;
            }
            return a.minYear - b.minYear;
        });
        allWellsMinValues.forEach((well, i) => {
            wellStatistics[well.key][COL_MIN_AVERAGE_DIFFERENCE_FROM_PREV_YEAR_GROUP] = (i < topRows) ? 1 : 2;
        });
    }
    function getAllSamplesFromWellId(wellId){
        return data.filter(w=>w[COL_WELL_ID]===wellId);
    }
    function processDifferenceFromPrevStep() {
    //Convert nestedByWellYearData into object
        let nestedByWellYearDataObject = {};
        nestedByWellYearData.forEach(row => {
            nestedByWellYearDataObject[row.key] = row;
        });
        //Process the nestedByWellYearData
        for (let i = 0; i <= maxYearIndex; i++) {
            allWellIds.forEach(wellId => {
                let prevKey = '$' + wellId + "_" + (i - 1);
                let currKey = '$' + wellId + "_" + (i);
                let prev = nestedByWellYearDataObject[prevKey];
                let curr = nestedByWellYearDataObject[currKey];
                if (curr && prev) {
                    curr[COL_AVERAGE_DIFFERENCE_FROM_PREV_STEP] = curr[COL_AVERAGE_OVER_TIME_STEP] - prev[COL_AVERAGE_OVER_TIME_STEP];
                }
            });
        }

        //Convert into object
        let nestedByWellMonthDataObject = {};
        nestedByWellMonthData.forEach(row => {
            nestedByWellMonthDataObject[row.key] = row;
        });
        //Process the nestedByWellMonthData
        for (let i = 0; i <= maxMonthIndex; i++) {
            allWellIds.forEach(wellId => {
                let prevKey = '$' + wellId + "_" + (i - 1);
                let currKey = '$' + wellId + "_" + (i);
                let prev = nestedByWellMonthDataObject[prevKey];
                let curr = nestedByWellMonthDataObject[currKey];
                if (curr && prev) {
                    curr[COL_AVERAGE_DIFFERENCE_FROM_PREV_STEP] = curr[COL_AVERAGE_OVER_TIME_STEP] - prev[COL_AVERAGE_OVER_TIME_STEP];
                }
            });
        }
    }

    function getAllWells(rows) {
        let nested = d3.nest().key(d => d[COL_WELL_ID]).entries(rows);
        processAverageValue(nested);
        return nested;
    }

    function processSuddenChange(wells) {
        wells.forEach(well => {
            let maxSuddenIncrement = 0;
            let maxSuddenDecrement = 0;
            let prevDate;
            let currDate;
            let prevValue;
            let currValue;
            let measures = well.values.sort((a, b) => (a[COL_MEASUREMENT_DATE] - b[COL_MEASUREMENT_DATE]));//ORDER BY DATE
            let length = measures.length;
            let measure = measures[0];
            currDate = measure[COL_MEASUREMENT_DATE];
            currValue = measure[COL_SATURATED_THICKNESS];
            let suddenIncrementD1;
            let suddenIncrementD2;
            let suddenDecrementD1;
            let suddenDecrementD2;
            for (let i = 1; i < length; i++) {
                prevDate = currDate;
                prevValue = currValue;
                measure = measures[i];
                currDate = measure[COL_MEASUREMENT_DATE];
                currValue = measure[COL_SATURATED_THICKNESS];
                if (utils.monthdiff(prevDate, currDate) <= 1) {
                    //TODO: Should divide by the number of days between two dates too
                    let change = currValue - prevValue;
                    if (change > maxSuddenIncrement) {
                        maxSuddenIncrement = change;
                        suddenIncrementD1 = prevDate;
                        suddenIncrementD2 = currDate;
                    }
                    if (change < maxSuddenDecrement) {
                        maxSuddenDecrement = change;
                        suddenDecrementD1 = prevDate;
                        suddenDecrementD2 = currDate;
                    }
                }
            }

            well[COL_SUDDEN_DECREMENT_D1] = suddenDecrementD1;
            well[COL_SUDDEN_DECREMENT_D2] = suddenDecrementD2;
            well[COL_SUDDEN_DECREMENT] = maxSuddenDecrement;

            well[COL_SUDDEN_INCREMENT_D1] = suddenIncrementD1;
            well[COL_SUDDEN_INCREMENT_D2] = suddenIncrementD2;
            well[COL_SUDDEN_INCREMENT] = maxSuddenIncrement;
        });
        //Add sudden increment, group

    }

    function processWellStatistics(rows) {
        let wells = d3.nest().key(d => d[COL_WELL_ID]).entries(rows);
        processStandardDeviationAndMean(wells);
        processSuddenChange(wells);

        let result = {};
        //Process the well name alphabetically
        wells = wells.sort((a, b) => a.key.localeCompare(b.key));
        wells.forEach((well, i) => {
            if (!result[well.key]) result[well.key] = {};
            result[well.key][COL_WELL_ALPHABETICAL_GROUP] = (i < topRows) ? 1 : 2;
        });

        //Process the well number of samples
        wells = wells.sort((a, b) => b.values.length - a.values.length);
        wells.forEach((well, i) => {
            if (!result[well.key]) result[well.key] = {};
            result[well.key][COL_WELL_NUM_SAMPLES_GROUP] = (i < topRows) ? 1 : 2;
        });

        //Process the sudden decrement
        wells = wells.sort((a, b) => a[COL_SUDDEN_DECREMENT] - b[COL_SUDDEN_DECREMENT]);
        wells.forEach((well, i) => {
            if (!result[well.key]) result[well.key] = {};
            result[well.key][COL_SUDDEN_DECREMENT_D1] = well[COL_SUDDEN_DECREMENT_D1];
            result[well.key][COL_SUDDEN_DECREMENT_D2] = well[COL_SUDDEN_DECREMENT_D2];
            result[well.key][COL_SUDDEN_DECREMENT] = well[COL_SUDDEN_DECREMENT];
            result[well.key][COL_SUDDEN_DECREMENT_GROUP] = (i < topRows) ? 1 : 2;
        });
        //Process the sudden increment
        wells = wells.sort((a, b) => b[COL_SUDDEN_INCREMENT] - a[COL_SUDDEN_INCREMENT]);
        wells.forEach((well, i) => {
            if (!result[well.key]) result[well.key] = {};
            result[well.key][COL_SUDDEN_INCREMENT_D1] = well[COL_SUDDEN_INCREMENT_D1];
            result[well.key][COL_SUDDEN_INCREMENT_D2] = well[COL_SUDDEN_INCREMENT_D2];
            result[well.key][COL_SUDDEN_INCREMENT] = well[COL_SUDDEN_INCREMENT];
            result[well.key][COL_SUDDEN_INCREMENT_GROUP] = (i < topRows) ? 1 : 2;
        });
        //Process the standard deviation
        wells = wells.sort((a, b) => b[COL_STANDARD_DEVIATION] - a[COL_STANDARD_DEVIATION]);
        wells.forEach((well, i) => {
            if (!result[well.key]) result[well.key] = {};
            result[well.key][COL_STANDARD_DEVIATION] = well[COL_STANDARD_DEVIATION];
            result[well.key][COL_STANDARD_DEVIATION_GROUP] = (i < topRows) ? 1 : 2;
        });
        //Process the overall average
        wells = wells.sort((a, b) => b[COL_OVERALL_AVERAGE] - a[COL_OVERALL_AVERAGE]);
        wells.forEach((well, i) => {
            if (!result[well.key]) result[well.key] = {};
            result[well.key][COL_OVERALL_AVERAGE] = well[COL_OVERALL_AVERAGE];
            result[well.key][COL_OVERALL_AVERAGE_GROUP] = (i < topRows) ? 1 : 2;
        });

        //Process overall reduction
        wells = wells.sort((a, b) => b[COL_OVERALL_REDUCTION] - a[COL_OVERALL_REDUCTION]);
        wells.forEach((well, i) => {
            if (!result[well.key]) result[well.key] = {};
            result[well.key][COL_OVERALL_REDUCTION] = well[COL_OVERALL_REDUCTION];
            result[well.key][COL_OVERALL_REDUCTION_GROUP] = (i < topRows) ? 1 : 2;
        });
        return result;
    }

    //We separate average out from standard deviation since for standard deviation (we measures for all wells in all time steps) but for average, it average over time step only (month, year)
    function processAverageValue(wells) {
        wells.forEach(well => {
            let measures = well.values;
            let thicknesses = unpack(measures, COL_SATURATED_THICKNESS);
            well[COL_AVERAGE_OVER_TIME_STEP] = d3.mean(thicknesses);
            well[COL_AVERAGE_DIFFERENCE_OVER_TIME_STEP] = well[COL_AVERAGE_OVER_TIME_STEP] - wellStatistics[measures[0][COL_WELL_ID]][COL_OVERALL_AVERAGE];
            well[COL_LAT] = d3.mean(unpack(measures, COL_LAT));
            well[COL_LONG] = d3.mean(unpack(measures, COL_LONG));
        });
    }

    function processStandardDeviationAndMean(wells) {
        wells.forEach(well => {
            let measures = well.values;
            let thicknesses = unpack(measures, COL_SATURATED_THICKNESS);
            well[COL_STANDARD_DEVIATION] = d3.deviation(thicknesses);
            well[COL_OVERALL_AVERAGE] = d3.mean(thicknesses);
            //Sort the measures by dates.
            measures = measures.sort((a, b) => a[COL_MEASUREMENT_DATE] - b[COL_MEASUREMENT_DATE]);
            //Take the first date minus the last date and see the differences
            well[COL_OVERALL_REDUCTION] = measures[0][COL_SATURATED_THICKNESS] - measures[measures.length - 1][COL_SATURATED_THICKNESS];

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

    /**
     * This method return array of "$" + "_" + well_id + "_" +  timeStep
     * This is to find a specific well at a specific time step basing on the key specified.
     * @param timeStepColumn
     * @returns {[]} array of wells each item is a well at a time step.
     */
    function getNestedByWellTimeStepData(timeStepColumn) {
        let nested = d3.nest().key(w => "$" + w[COL_WELL_ID] + "_" + w[timeStepColumn]).entries(data);
        processAverageValue(nested);
        //Process the value here.
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
            let theDate = d[COL_MEASUREMENT_DATE];
            let colIndex = theDate.getFullYear() - minDate.getFullYear();
            //if it is from October or above, count it for next year
            let month = theDate.getMonth();
            if (month >= 9) {
                colIndex = colIndex + 1;
            }
            d[COL_YEAR_INDEX] = colIndex;
            return d;
        });
    }

    function getWellMonthData() {
        return getWellTimeStepData(COL_MONTH_INDEX);
    }

    function getWellYearData() {
        return getWellTimeStepData(COL_YEAR_INDEX);
    }

    /**
     * This function is to return an array of wells in each time step (group by timeStep first then wells)
     * Index 0 for all wells in timeStep 0, Index 1 for all wells in timeStep 1, so on and so forth
     * @param timeStepColumn to know we are grouping by year or by month
     * @returns {any[]} length is the number of timeSteps (months or years),
     * in each timeStep it is an array of Wells (all wells with measures at that time step),
     * each well is in form of {"key": "wellID", "values": [Array of wells in this time step with this id] }
     */
    function getWellTimeStepData(timeStepColumn) {
        let maxIndex;
        let nestedByWellTimeStep;
        if (timeStepColumn === COL_MONTH_INDEX) {
            maxIndex = maxMonthIndex;
            nestedByWellTimeStep = nestedByWellMonthData;
        }
        if (timeStepColumn === COL_YEAR_INDEX) {
            maxIndex = maxYearIndex;
            nestedByWellTimeStep = nestedByWellYearData;
        }


        let wellTimeStepData = new Array(maxIndex + 1);
        for (let timeIndex = 0; timeIndex <= maxIndex; timeIndex++) {
            if (!wellTimeStepData[timeIndex]) {
                let nested = nestedByWellTimeStep.filter(w => w.key.split("_")[1] === ("" + timeIndex));
                wellTimeStepData[timeIndex] = nested;
            }
        }
        return wellTimeStepData;
    }

    function unpack(rows, key) {
        return rows.map(r => r[key]);
    }

    function processMinMax() {
        //Get analyze value index
        averageValueRanges[0] = d3.extent(nestedByWellMonthData.map(d => d[COL_AVERAGE_OVER_TIME_STEP]));
        averageValueRanges[1] = d3.extent(nestedByWellYearData.map(d => d[COL_AVERAGE_OVER_TIME_STEP]));

        averageDifferenceValueRanges[0] = d3.extent(nestedByWellMonthData.map(d => d[COL_AVERAGE_DIFFERENCE_OVER_TIME_STEP]));
        averageDifferenceValueRanges[1] = d3.extent(nestedByWellYearData.map(d => d[COL_AVERAGE_DIFFERENCE_OVER_TIME_STEP]));

        differenceFromPrevStepValueRanges[0] = d3.extent(nestedByWellMonthData.map(d => d[COL_AVERAGE_DIFFERENCE_FROM_PREV_STEP]));
        differenceFromPrevStepValueRanges[1] = d3.extent(nestedByWellYearData.map(d => d[COL_AVERAGE_DIFFERENCE_FROM_PREV_STEP]));
    }

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

    function dateToMonthIndex(date) {
        return utils.monthdiff(minDate, date);
    }

    function dateToYearIndex(date) {
        return utils.yeardiff(minDate, date);
    }
    //</editor-fold>
    //Exposing methods and data.
    this.getWellByTimeSteps = [getWellByMonthIndex, getWellByYearIndex];
    this.minDate = minDate;
    this.maxDate = maxDate;
    this.steps = [maxMonthIndex + 1, maxYearIndex + 1];
    this.nestedByWellTimeStepData = [nestedByWellMonthData, nestedByWellYearData];
    this.allWellIds = allWellIds;
    this.allCounties = allCounties;
    this.monthIndexToYear = monthIndexToYear;
    this.data = data;
    this.wellStatistics = wellStatistics;
    this.dateToTimeIndexFunctions = [dateToMonthIndex, dateToYearIndex];
    this.getAllSamplesFromWellId = getAllSamplesFromWellId;
};