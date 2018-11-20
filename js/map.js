let gm;

function plotMaps(dp) {
    let longAccessor = (d) => {
        return d[COL_LONG];
    }
    let latAccessor = (d) => {
        return d[COL_LAT];
    }
    gm = new GoogleMap("map");
    gm.fitBounds(wells, longAccessor, latAccessor);
    gm.dispatch.on("draw", draw);

    function draw(event) {
        plotContours(event);
        plotWells(event);
    }

    function plotWells(event) {
        let layer = event.overlayMouseTarget;

        if(plotWellsOption){
            let marker = layer.select("#wellsGroup").selectAll("g").data(wells);
            let transform = event.transform(longAccessor, latAccessor);
            //Update existing
            marker.each(transform);
            marker.exit().remove();

            let enter = marker.enter().append("g")
                .each(transform)
                .attr("class", "marker");

            enter.append("circle")
                .attr("r", 1.4326530612244897)
                .attr("fill", "rgba(0,0,0,0.5)")
                .attr("stroke", "black")
                .attr("fill-opacity", .5)
                .attr("stroke-width", 0.6)
                .on("mouseover", d => {
                    showTip(d, formatData);
                })
                .on("mouseout", () => {
                    hidetip();
                });
        }else{
            layer.select("#wellsGroup").selectAll("*").remove();
        }
    }

    function addDivPixelFromLatLng(wells, fromLatLngToDivPixel) {
        //let us get the data of one month
        wells = wells.map(well => {
            let p = fromLatLngToDivPixel(well[COL_LAT], well[COL_LONG]);
            well.x = p.x;
            well.y = p.y;
            return well;
        });
        return wells;
    }

    function plotContours(event) {
        let valueDiffScale = d3.scaleLinear().domain(colorRanges[analyzeValueIndex][timeStepTypeIndex]).range([0, 1]);

        let svg = event.overlayLayer;
        let g = svg.select("#contoursGroup");
        g.selectAll("*").remove();
        if (wells.length <= 0) {
            return;//Don't do any further drawing if wells is empty
        }

        let fromLatLngToDivPixel = event.fromLatLngToDivPixel;
        wells = addDivPixelFromLatLng(wells, fromLatLngToDivPixel);

        let gridSize = 30;
        let recbin = new RecBinner(wells, gridSize);
        let grid = recbin.grid;


        g.attr("class", "contour");
        g.attr("transform", `translate(${grid.x}, ${grid.y})`);
        //TODO: Continue from here to update the contour value.
        let gridValues = grid.map(g=>g.value);
        let minValue = d3.min(gridValues);
        let thresholds = processThresholds(d3.extent(gridValues));

        function processThresholds(range){
            let min0 = range[0];//added some value
            let max0 = range[1];
            let step0 = (max0 - min0)/numberOfThresholds;
            let thresholds0 = [];
            for (let i = 0; i < numberOfThresholds; i++) {
                thresholds0.push(i*step0);//Push it up from zero or above (to avoid zero threshold which is for null value (otherwise null values will be zero and will cover the data)
            }
            thresholds0[0] = thresholds0[0]+10e-6;
            return thresholds0;
        }

        let gridData = grid.map(g=>g.value);
        if(analyzeValueIndex === 1){
           gridData = grid.map(g => (g.value!==null)?g.value-minValue : null);
        }
        g.selectAll("path")
            .data(d3.contours().smooth(true)
                .size(grid.size)
                .thresholds(thresholds)
                (gridData))
            .enter().append("path")
            .attr("d", d3.geoPath(d3.geoIdentity().scale(grid.scale)))
            .attr("fill", function (d) {
                if(analyzeValueIndex === 0){
                    return color.waterLevel(d.value);
                }
                if(analyzeValueIndex === 1){
                    return d3.interpolateRdYlBu(valueDiffScale(d.value + minValue));
                }
            })
            .attr("stroke", "#000")
            .attr("stroke-width", 0.1)
            .attr("class", "marker")
            .attr("opacity", contourOpacity)
            .attr("stroke-linejoin", "round");
    }
}

function plotWellsOptionChange() {
    plotWellsOption = document.getElementById("changePlotWells").checked;
    gm.updateMap();
}
