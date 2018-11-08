let wells;
let valueTypes = ["Average over time", "Number of measurements", "Standard Deviation", "Sudden increase", "Sudden decrease"];

d3.csv("data/well_data_full.optimized.csv", function(err, data){
    let dp = new dataProcessor(data);
    wells = dp.getWellByTimeSteps[timeStepTypeIndex](0);
    plotMaps(dp);
    function updatePlot(h){
        let index = timeStepTypeIndex===0? utils.monthdiff(dp.minDate, h): utils.yeardiff(dp.minDate, h);
        wells = dp.getWellByTimeSteps[timeStepTypeIndex](index);
        gm.updateMap();
    }
    createPlaySlider(dp.minDate, dp.maxDate, "playButtonDiv", mapWidth, updatePlot, 1000);
    //Plot the discrete heatmap
    let heatmapPlotter = discreteHeatMapPlotter(dp, "heatmap", {});
    heatmapPlotter.plot();
    spinner.stop();
});