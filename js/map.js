let gm;
let positiveValueDiffScale;
let negativeValueDiffScale;

function createColorScale() {
    let thresholds = processThresholds1(colorRanges[analyzeValueIndex][timeStepTypeIndex]);
    let colorScaleControl = createPlotColorScale(thresholds, colorType("negative"), 70, 400);
    colorScaleControl.index = 3;
    gm.map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(colorScaleControl);
}

function updateId(d) {
    return d3.select(this).attr("id", `wellCircle${d.key}`);
}

let radiusScale = d3.scaleLinear().domain([0, 19]).range([5, 2]);
let colorValueScale = d3.scaleLinear().domain([0, 19]).range([1, 0]);

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
    let radiusScale = d3.scaleLinear().domain([1, 19]).range([5, 2]);
    let colorValueScale = d3.scaleLinear().domain([1, 19]).range([1, 0]);
    function plotWells(event) {
        let layer = event.overlayMouseTarget;

        if (plotWellsOption) {
            let wells1 = wells.sort(wellSortFunctions[wellSortIndex]);

            let marker = layer.select("#wellsGroup").selectAll("g").data(wells1);

            let transform = event.transform(longAccessor, latAccessor);
            //Update existing
            marker.each(transform);
            marker.each(updateId);

            marker.exit().remove();

            let enter = marker.enter().append("g")
                .each(transform)
                .attr("class", "marker");

            enter.append("circle")
                .attr("id", (d, i) => `wellCircle${d.key}`)
                .attr("stroke", "black")
                .attr("fill-opacity", .5)
                .attr("stroke-width", 0.6)
                .attr("r", (d, i)=>{
                    if(i<=19){
                        return radiusScale(i);
                    }else{
                        return 1.4;
                    }
                })
                .attr("fill", (d, i)=>{
                    if(i<=19){
                        return d3.interpolateReds(colorValueScale(i));
                    }else{
                        return "rgba(0,0,0,0.5)";
                    }
                })
                .on("mouseover", d => {
                    showTip(d, formatData);
                })
                .on("mouseout", () => {
                    hidetip();
                });
            //Highlights and
            let length = wells.length;//select 19 last ones (are the biggest)
            for (let i = 1; i <= 19; i++) {
                d3.select(`#wellCircle${length-i}`).attr("fill", d3.interpolateReds(colorValueScale(i))).attr("r", radiusScale(i));
            }
        } else {
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
        positiveValueDiffScale = d3.scaleLinear().domain([0, colorRanges[analyzeValueIndex][timeStepTypeIndex][1]]).range([0.05, 1]);
        negativeValueDiffScale = d3.scaleLinear().domain([0, -colorRanges[analyzeValueIndex][timeStepTypeIndex][0]]).range([0.05, 1]);

        let svg = event.overlayLayer;
        let g = svg.select("#contoursGroup");
        g.selectAll("*").remove();
        if (wells.length <= 0) {
            return;//Don't do any further drawing if wells is empty
        }

        let fromLatLngToDivPixel = event.fromLatLngToDivPixel;
        wells = addDivPixelFromLatLng(wells, fromLatLngToDivPixel);

        let gridSize = 25;
        let recbin = new RecBinner(wells, gridSize);
        let grid = recbin.grid;


        g.attr("class", "contour");
        g.attr("transform", `translate(${grid.x}, ${grid.y})`);
        let positiveGrid = copy(grid);
        positiveGrid.forEach(d => {
            if (d.value < 0 || typeof d.value === "object") {
                d.value = null;
            }
        });
        let negativeGrid = copy(grid);
        negativeGrid.forEach(d => {
            if (d.value >= 0 || typeof d.value === "object") {
                d.value = null;
            } else {
                d.value = -d.value;//Convert to positive.
            }
        });

        function copy(o) {
            var output, v, key;
            output = Array.isArray(o) ? [] : {};
            for (key in o) {
                v = o[key];
                output[key] = (typeof v === "object") ? copy(v) : v;
            }
            return output;
        }

        plotContoursFromData(g, positiveGrid, colorType("positive"));
        if (negativeGrid.filter(g => g.value !== null).length > 0) {
            plotContoursFromData(g, negativeGrid, colorType("negative"));
        }
    }

    //Plot some extra controls
    //create and set the plot well controls
    let plotWellControl = createPlotWellsControl();
    plotWellControl.index = 3;
    gm.map.controls[google.maps.ControlPosition.TOP_LEFT].push(plotWellControl);

    createColorScale();
}

function colorType(type) {
    return function (d) {
        if (analyzeValueIndex === 0) {
            return color.waterLevel(d.value);
        }
        if (analyzeValueIndex === 1) {
            if (type == "negative") {
                return d3.interpolateReds(negativeValueDiffScale(d.value));
            }
            if (type === "positive") {
                return d3.interpolateBlues(positiveValueDiffScale(d.value));
            }
        }
    }
}

function plotContoursFromData(group, grid, colorFunction) {
    let gridData = grid.map(g => g.value);
    let thresholds = processThresholds(d3.extent(gridData));
    let g = group.append("g");
    let contourData = d3.contours().smooth(true)
        .size(grid.size)
        .thresholds(thresholds)
        (gridData);
    // const interpolate = d3.line()
    //     .x(d => d[0] )
    //     .y(d => d[1] )
    //     .curve(d3.curveCardinalClosed);
    // const smoothPath = (pstr) => {
    //     var polygons = pstr.split("ZM");
    //     let result = "";
    //     polygons.forEach(plg =>{
    //         let sp = plg.replace(/M/, "").replace(/Z/, "").split("L").map(d=>d.split(","));
    //         result = result + interpolate(sp) + "Z";
    //     });
    //     return result;
    // }
    g.selectAll("path")
        .data(contourData)
        .enter().append("path")
        .attr("d", d => {
            let path = d3.geoPath(d3.geoIdentity().scale(grid.scale))(d);
            // return smoothPath(path);
            return path;
        })
        .attr("fill", colorFunction)
        .attr("stroke", "#000")
        .attr("stroke-width", contourStrokeWidth)
        .attr("class", "marker")
        .attr("opacity", contourOpacity)
        .attr("stroke-linejoin", "round");
}


function processThresholds(range) {
    let min0 = range[0];//added some value
    let max0 = range[1];
    let step0 = (max0 - min0) / numberOfThresholds[analyzeValueIndex];
    let thresholds0 = [];
    for (let i = 0; i < numberOfThresholds[analyzeValueIndex]; i++) {
        thresholds0.push(i * step0);//Push it up from zero or above (to avoid zero threshold which is for null value (otherwise null values will be zero and will cover the data)
    }
    thresholds0[0] = thresholds0[0] + 10e-6;
    return thresholds0;
}

function processThresholds1(range) {
    let min0 = range[0];//added some value
    let max0 = range[1];
    let step0 = (max0 - min0) / numberOfThresholds[analyzeValueIndex];
    let thresholds0 = [];
    for (let i = 0; i < numberOfThresholds[analyzeValueIndex]; i++) {
        thresholds0.push(min0 + i * step0);//Push it up from zero or above (to avoid zero threshold which is for null value (otherwise null values will be zero and will cover the data)
    }
    return thresholds0;
}

function plotWellsOptionChange() {
    plotWellsOption = document.getElementById("changePlotWells").checked;
    gm.updateMap();
}

function createPlotWellsControl() {
    let controlDiv = document.createElement('div');
    controlDiv.style.marginLeft = '-12px';
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.borderBottomRightRadius = '2px';
    controlUI.style.borderTopRightRadius = '2px';
    controlUI.style.boxShadow = 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;';
    controlUI.style.height = '40px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginTop = '10px';
    controlUI.style.cssFloat = 'left';
    controlUI.style.position = 'relative';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to plot well';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = '<label for="changePlotWells">Plot wells</label>\n' +
        '        <input type="checkbox" id="changePlotWells" onchange="plotWellsOptionChange()"/>';
    controlUI.appendChild(controlText);
    return controlDiv;
}

function createPlotColorScale(ticks, colorFunction, width, height) {
    d3.select("#colorScaleDiv").remove();
    d3.select("#colorScaleSvg").remove();
    ticks = ticks.map(d => Math.round(d));
    positiveValueDiffScale = d3.scaleLinear().domain([0, colorRanges[analyzeValueIndex][timeStepTypeIndex][1]]).range([0.05, 1]);
    negativeValueDiffScale = d3.scaleLinear().domain([0, -colorRanges[analyzeValueIndex][timeStepTypeIndex][0]]).range([0.05, 1]);
    let margin = {left: 10, right: 10, top: 10, bottom: 10};
    let controlDiv = document.createElement('div');
    controlDiv.id = "colorScaleDiv";
    controlDiv.style.width = width + "px";
    controlDiv.style.height = (height + margin.top + margin.bottom) + "px";
    controlDiv.style.backgroundColor = '#fff';
    controlDiv.style.borderRadius = '2px';
    controlDiv.style.boxShadow = 'rgba(0, 0, 0, 0.3) 4px 4px 1px 1px;';
    controlDiv.style.cursor = 'pointer';
    controlDiv.style.marginRight = "10px";

    let y = d3.scaleLinear().domain(d3.extent(ticks)).range([height - margin.top - margin.bottom, 0]);
    // let svg = d3.select(document.createElement('svg'));
    let svg = d3.select("body").append("svg");
    svg.node().style.all = "unset";
    svg.attr("overflow", "visible");
    svg.attr("id", "colorScaleSvg");
    svg.attr("width", width);
    svg.attr("height", (height + margin.top + margin.bottom));


    let step = y(ticks[0]) - y(ticks[1]);
    ticks.shift();
    let enter = svg.append("g").attr("transform", `translate(0, ${margin.top})`).selectAll("rect").data(ticks.map(d => {
        return {value: d}
    })).enter();
    enter.append("rect")
        .attr("width", 25)
        .attr("height", step)
        .attr("x", 34)
        .attr("y", (d, i) => (y(ticks[i])))
        .attr("fill", d => {
            if (analyzeValueIndex === 0) {
                return color.waterLevel(d.value);
            }
            if (analyzeValueIndex === 1) {
                if (d.value < 0) {
                    return d3.interpolateReds(negativeValueDiffScale(-d.value));
                }
                if (d.value >= 0) {
                    return d3.interpolateBlues(positiveValueDiffScale(d.value));
                }
            }
        });
    enter.append("text")
        .attr("x", 30)
        .attr("y", (d, i) => (y(ticks[i]) + step / 2))
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", "end")
        .text((d, i) => ticks[i]);

    controlDiv.appendChild(svg.node());

    return controlDiv;
}
