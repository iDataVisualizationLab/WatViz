d3.json("data/dataWatViz.json", readyWordStream);
d3.json("data/wellStatistics.json", function (error, ws) {
    wellStatistics = ws;
    d3.json("lib/TX-48-texas-counties.json", function (error, data) {
        us = data;
        // d3.csv("data/well_data_full.optimized.csv", function (err, data) {
        d3.csv("data/well_data_full.optimized1.csv", function (err, data) {
            // d3.csv("data/SaturatedThickness19952013.csv", function (err, data) {
            dp = new dataProcessor(data);
            wells = dp.getWellByTimeSteps[timeStepTypeIndex](0);
            plotMaps(dp);
            playSlider = createPlaySlider(dp.minDate, dp.maxDate, "playButtonDiv", mapWidth, updatePlot, sliderTimeInterval);
            //Plot the discrete heatmap
            heatmapPlotter = discreteHeatMapPlotter(dp, "heatmap", {});
            heatmapPlotter.plot();
        });
    });
    spinner.stop();
});


function updatePlot(h) {
    let index = timeStepTypeIndex === 0 ? utils.monthdiff(dp.minDate, h) : utils.yeardiff(dp.minDate, h);
    wells = dp.getWellByTimeSteps[timeStepTypeIndex](index);
    //Filter out wells without the data.
    wells = wells.filter(w=>(typeof (w[analyzeValues[analyzeValueIndex]]) !== "undefined") && (w[analyzeValues[analyzeValueIndex]]!=null))
    try {
        gm.updateMap();
    } catch (ex) {
        console.log("waiting for google resource.")
    }
}
