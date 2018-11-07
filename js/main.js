let wells;
let valueTypes = ["Average over time", "Number of measurements", "Standard Deviation", "Sudden increase", "Sudden decrease"];

d3.csv("data/well_data_full.optimized.csv", function(err, data){
    let dp = new dataProcessor(data);
    wells = dp.getWellByMonthIndex(0);
    plotMaps(dp);
    function updatePlot(h){
        let index = utils.monthdiff(dp.minDate, h);
        wells = dp.getWellByMonthIndex(index);
        gm.updateMap();
    }
    createPlaySlider(dp.minDate, dp.maxDate, "playButtonDiv", mapWidth, playButtonDivHeight, {top: 10, right: 40, bottom: 10, left: 40}, updatePlot, 1000);
    //Plot the discrete heatmap
    let heatmapPlotter = discreteHeatMapPlotter(dp, "heatmap", {});
    heatmapPlotter.plot();
});