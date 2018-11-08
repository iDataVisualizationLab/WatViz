let cellWidths = [6, 12],
    cellHeights = [6, 6];
// rowsPerPage = Math.floor(mapHeight / cellHeight);
let nestedByWellTimeStepObjects = new Array(timeStepTypes.length);

function discreteHeatMapPlotter(dp, theDivId, plotOptions) {
    let cellWidth = cellWidths[timeStepTypeIndex];
    let cellHeight = cellHeights[timeStepTypeIndex];

    let steps = dp.steps[timeStepTypeIndex];
    let allWellIds = dp.allWellIds;

    let nested = dp.nestedByWellTimeStepData[timeStepTypeIndex];
    //Calculate the border scale by the number of samples
    let borderScale = d3.scaleLinear().domain(d3.extent(nested.map(n => n.values.length))).range([minCellBorder, maxCellBorder]);

    //Convert to object for better access
    if (!nestedByWellTimeStepObjects[timeStepTypeIndex]) {
        nestedByWellTimeStepObjects[timeStepTypeIndex] = {};
        //Store this by key for quicker access
        nested.forEach(r => {
            nestedByWellTimeStepObjects[timeStepTypeIndex][r.key] = r;
        });
    }
    let nestedByWellTimeStepObject = nestedByWellTimeStepObjects[timeStepTypeIndex];


    let width = steps * cellWidth;

    function plot() {
        generateTimeLabels(timeStepTypeIndex);
        let svg = d3.select("#" + theDivId).append("svg").attr("width", width).attr("height", allWellIds.length * cellHeight).attr("overflow", "scroll");
        let mainGroup = svg.append("g").attr("transform", `translate(0, 0)`);
        let locationMarker;
        for (let row = 0; row < allWellIds.length; row++) {
            let wellId = allWellIds[row];
            let rowGroup = mainGroup.append("g").attr("transform", `translate(${0}, ${row * cellHeight})`);
            for (let step = 0; step < steps; step++) {
                let key = "$" + wellId + "_" + step;
                let d = nestedByWellTimeStepObject[key];
                if (d) {
                    let strokeWidth = borderScale(d.values.length);
                    rowGroup.append("g")
                        .attr("transform", `translate(${step * cellWidth}, 0)`)
                        .selectAll("rect")
                        .data([d]).enter()
                        .append("rect")
                        .attr("stroke-width", strokeWidth)
                        .attr("stroke", "black")
                        .attr("width", (cellWidth - strokeWidth / 2))
                        .attr("height", (cellHeight - strokeWidth / 2))
                        .attr("fill", d => color.waterLevel(d[COL_AVERAGE_OVERTIME]))
                        .on("mouseover", d => {
                            showTip(d, formatData);
                            let myLatLng = {lat: d[COL_LAT], lng: d[COL_LONG]};
                            locationMarker = new google.maps.Marker({
                                position: myLatLng,
                                map: gm.map,
                                title: d.key,
                                zIndex: 1000
                            });
                        })
                        .on("mouseout", () => {
                            hidetip();
                            locationMarker.setMap(null);
                        });
                }

            }
        }

        function generateTimeLabels(timeStepTypeIndex) {
            let timeSvg = d3.select("#mapHeaderSVG").attr("overflow", "visible");
            timeSvg.attr("width", width);
            timeSvg.attr("height", timeLabelHeight);
            let labels = [];
            if (timeStepTypeIndex === 0) {//Month
                let firstYear = dp.monthIndexToYear(0);
                for (let month = 0; month < steps; month++) {
                    let year = dp.monthIndexToYear(month);
                    labels.push({
                        text: year,
                        x: ((year - firstYear) * 12 * cellWidth),
                    });
                }
            }
            if (timeStepTypeIndex === 1) {//Year
                let firstYear = dp.minDate.getFullYear();
                for (let year = firstYear; year < firstYear+steps; year++) {
                    if ((year - firstYear) % 5 === 0) {
                        labels.push({
                            text: year,
                            x: ((year - firstYear) * cellWidth),
                        });
                    }
                }
            }
            timeSvg.selectAll(".label").data(labels).enter().append("text").text(d=>d.text).attr("transform", d=> "translate(" + (d.x) + ", " + (40) + ")")
                .attr("text-anchor", "start").attr("alignment-baseline", "middle").attr("style", "font: 10px sans-serif");
            //Add the separator line
            timeSvg.append("g").attr("transform", `translate(0, ${timeLabelHeight})`).append("line").attr("x1", 0).attr("x2", width).attr("y1", 0).attr("y2", 0).attr("stroke", "black").attr("stroke-width", 1);
        }
    }

    //Exposing necessary components
    this.plot = plot;
    return this;
}
