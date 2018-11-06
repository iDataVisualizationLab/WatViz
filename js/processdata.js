let COL_WELL_ID = 'Well_ID',
    COL_LAT = 'y_lat',
    COL_LONG = 'x_long',
    COL_MEASUREMENT_DATE = 'MeasurementDate',
    COL_MONTH_INDEX = 'monthIndex',
    COL_SATURATED_THICKNESS = 'SaturatedThickness',
    COL_WATER_ELEVATION = 'WaterElevation',
    COL_AVERAGE_OVERTIME = 'averageOverTime';

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
    data = data.filter(d=>{
        if(d[COL_SATURATED_THICKNESS] <= 0 || d[COL_SATURATED_THICKNESS] == d[COL_WATER_ELEVATION]){
            return false;
        }else{
            return true;
        }
    });

    let wells = getAllWells(data);
    let dateExtent = d3.extent(unpack(data, COL_MEASUREMENT_DATE));
    let minDate = dateExtent[0];
    let maxDate = dateExtent[1];

    //Add the month index to the data
    addMonthIndex();
    let maxMonthIndex = d3.max(unpack(data, COL_MONTH_INDEX));

    function unpack(rows, key) {
        return rows.map(r => r[key]);
    }

    function unpacklong(rows) {
        return unpack(rows, COL_LONG);
    }

    function unpacklat(rows) {
        return unpack(rows, COL_LAT);
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

    function addMonthIndex() {
        data = data.map(d => {
            d[COL_MONTH_INDEX] = utils.monthdiff(minDate, d[COL_MEASUREMENT_DATE]);
            return d;
        });
    }
    let wellMonthData = new Array(maxMonthIndex+1);
    function getWellByMonthIndex(monthIndex) {
        if(!wellMonthData[monthIndex]){
            let wellm = data.filter(d=>d[COL_MONTH_INDEX] === monthIndex);
            let nested = d3.nest().key(w=>w[COL_WELL_ID]).entries(wellm);
            processWellValue(nested);
            wellMonthData[monthIndex] = nested;
        }
        return wellMonthData[monthIndex];
    }
    //Exposing methods and data.
    this.wells = wells;
    this.getWellByMonthIndex = getWellByMonthIndex;
    this.minDate = minDate;
    this.maxDate = maxDate;

}