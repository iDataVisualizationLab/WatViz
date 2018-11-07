let cellWidth = 6,
    cellHeight = 6;
    // rowsPerPage = Math.floor(mapHeight / cellHeight);

function discreteHeatMapPlotter(dp, theDivId, plotOptions) {
    let months = dp.months;
    let allWellIds = dp.allWellIds;
    let nestedByWellMonthObject = {};
    let nested = dp.getNestedByWellMonthData();
    //Calculate the border scale by the number of samples
    let borderScale = d3.scaleLinear().domain(d3.extent(nested.map(n=>n.values.length))).range([minCellBorder, maxCellBorder]);
    //Store this by key for quicker access
    nested.forEach(r => {
        nestedByWellMonthObject[r.key] = r;
    });



    let width = months*cellWidth;
    function plot() {
        generateTimeLabels();
        let svg = d3.select("#" + theDivId).append("svg").attr("width", width).attr("height", allWellIds.length*cellHeight).attr("overflow", "scroll");
        let mainGroup = svg.append("g").attr("transform", `translate(0, 0)`);
        for (let row = 0; row < allWellIds.length; row++) {
            let wellId = allWellIds[row];
            let rowGroup = mainGroup.append("g").attr("transform", `translate(${0}, ${row * cellHeight})`);
            for (let month = 0; month < months; month++) {
                let key = "$" + wellId + "_" + month;
                let d = nestedByWellMonthObject[key];
                if (d) {
                    let strokeWidth = borderScale(d.values.length);
                    rowGroup.append("g")
                        .attr("transform", `translate(${month * cellWidth}, 0)`)
                        .selectAll("rect")
                        .data([d]).enter()
                        .append("rect")
                        .attr("stroke-width", strokeWidth)
                        .attr("stroke", "black")
                        .attr("width", (cellWidth - strokeWidth/2))
                        .attr("height", (cellHeight -strokeWidth/2))
                        .attr("fill", d=>color.waterLevel(d[COL_AVERAGE_OVERTIME]))
                        .on("mouseover", d=>{showTip(d, formatData)})
                        .on("mouseout", ()=>{hidetip();});
                }

            }
        }

        function generateTimeLabels() {
            var timeSvg = d3.select("#mapHeaderSVG").attr("overflow", "visible");
            timeSvg.attr("width", width);
            timeSvg.attr("height", timeLabelHeight);
            let firstYear = dp.monthIndexToYear(0);
            for (let month = 0; month < months; month++) {
                let year = dp.monthIndexToYear(month);
                timeSvg.append("text").text(year).attr("transform", "translate(" + ((year - firstYear) * 12 * cellWidth) + ", " + (timeLabelHeight / 2) + ")")
                    .attr("text-anchor", "start").attr("alignment-baseline", "middle").attr("style", "font: 10px sans-serif");
            }
            //Add the separator line
            timeSvg.append("g").attr("transform", `translate(0, ${timeLabelHeight})`).append("line").attr("x1", 0).attr("x2", width).attr("y1", 0).attr("y2", 0).attr("stroke", "black").attr("stroke-width", 1);

        }
    }

    //Exposing necessary components
    this.plot = plot;
    return this;
}
