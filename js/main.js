let wells;
d3.csv("data/well_data_full.optimized.csv", function(err, data){
    let dp = new dataProcessor(data);
    wells = dp.getWellByMonthIndex(263);
    plotMaps(dp);
    function updatePlot(h){
        let index = utils.monthdiff(dp.minDate, h);
        wells = dp.getWellByMonthIndex(index);
        gm.updateMap();
    }
    createPlaySlider(dp.minDate, dp.maxDate, "playButtonDiv", 800, 220, {top: 10, right: 40, bottom: 10, left: 40}, updatePlot, 1000);
});