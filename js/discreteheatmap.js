let cellWidth = 6,
    cellHeight = 6;
    // rowsPerPage = Math.floor(mapHeight / cellHeight);

function discreteHeatMapPlotter(dp, theDivId, plotOptions) {
    let months = dp.months;
    let allWellIds = dp.allWellIds;
    let nestedByWellMonthObject = {};
    dp.getNestedByWellMonthData().forEach(r => {
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
                    rowGroup.append("g")
                        .attr("transform", `translate(${month * cellWidth}, 0)`)
                        .selectAll("rect")
                        .data([d]).enter()
                        .append("rect")
                        .attr("width", cellWidth)
                        .attr("height", cellHeight)
                        .attr("fill", d=>color.waterLevel(d[COL_AVERAGE_OVERTIME]));
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
