let cellWidths = [6, 12],
    cellHeights = [6, 6];
let nestedByWellTimeStepObjects = new Array(timeStepTypes.length);
let valueDiffScale;//Used to scale the value range to [0, 1] => to use the RedYellowBlue scale.
function discreteHeatMapPlotter(dp, theDivId, plotOptions) {
    d3.select("#" + theDivId).selectAll("*").remove();
    let labelsGroup;
    //Process the group position.
    let cellWidth = cellWidths[timeStepTypeIndex];
    let cellHeight = cellHeights[timeStepTypeIndex];

    //process row positions
    let rowPositions;
    let groups;

    function processRowPositions() {
        rowPositions = {};
        groups = d3.nest().key(d => groupByGroups[groupByIndex](d)).key(d => d[COL_WELL_ID]).entries(dp.data);
        //Sort the group.
        groups = groups.sort(groupSortFunctions[groupByIndex][groupSortIndex]);
        //Sort the subgroup
        groups.forEach(g => {
            g.values = g.values.sort(wellSortFunctions[wellSortIndex]);
        });
        //Process group position
        for (let i = 0; i < groups.length; i++) {
            if (i == 0) {
                groups[i].y = 0;
            } else {
                groups[i].y = groups[i - 1].y + cellHeight * groups[i - 1].values.length;
            }
        }
        //Process the well position.
        groups.forEach(g => {
            g.values.forEach((well, i) => {
                well.y = g.y + i * cellHeight;
            });
        });

        groups.forEach(g => {
            g.values.forEach(well => {
                rowPositions[well.key] = well.y;
            })
        });
    }

    processRowPositions();


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
    let rows = {};
    let svg = d3.select("#" + theDivId).append("svg").attr("width", width + groupLabelWidth).attr("height", allWellIds.length * cellHeight).attr("overflow", "scroll");

    function plot() {
        generateTimeLabels(timeStepTypeIndex);
        generateGroupLabels();
        generateRows();
        setRowPositions();
    }

    function updatePositions() {
        processRowPositions();
        generateGroupLabels();
        setRowPositions();
    }

    function generateRows() {
        valueDiffScale = d3.scaleLinear().domain(colorRanges[analyzeValueIndex][timeStepTypeIndex]).range([0, 1]);
        let mainGroup = svg.append("g").attr("transform", `translate(0, 0)`);
        for (let row = 0; row < allWellIds.length; row++) {
            let wellId = allWellIds[row];
            if (!rows[wellId]) {
                let rowGroup = mainGroup.append("g").attr("transform", `translate(${0}, ${row * cellHeight})`).attr("id", `well${wellId}`);
                for (let step = 0; step < steps; step++) {
                    let key = "$" + wellId + "_" + step;
                    let d = nestedByWellTimeStepObject[key];
                    if (d) {
                        let strokeWidth = borderScale(d.values.length);
                        let locationMarker;
                        rowGroup.append("g").attr("transform", `translate(${step * cellWidth}, 0)`)
                            .selectAll("rect")
                            .data([d]).enter()
                            .append("rect")
                            .attr("class", `timeStep${step}`)
                            .attr("stroke-width", strokeWidth)
                            .attr("stroke", cellStrokeNormalColor)
                            .attr("width", (cellWidth - strokeWidth / 2))
                            .attr("height", (cellHeight - strokeWidth / 2))
                            .attr("fill", d => {
                                if(analyzeValueIndex === 0){
                                    return color.waterLevel(d[COL_AVERAGE_OVER_TIME_STEP]);
                                }
                                if(analyzeValueIndex === 1){
                                    return d3.interpolateRdYlBu(valueDiffScale(d[COL_AVERAGE_DIFFERENCE_OVER_TIME_STEP]));
                                }
                            })
                            .on("mouseover", d => {
                                showTip(d, formatData);
                                let myLatLng = {lat: d[COL_LAT], lng: d[COL_LONG]};
                                locationMarker = new google.maps.Marker({
                                    position: myLatLng,
                                    map: gm.map,
                                    title: d.key,
                                    zIndex: 1000
                                });
                                //Slide the play slider to corresponding location.
                                playSlider.setTime(d.values[0][COL_MEASUREMENT_DATE]);
                            })
                            .on("mouseout", () => {
                                hidetip();
                                locationMarker.setMap(null);
                            });
                    }
                }
                rows[wellId] = rowGroup;
            }
        }
    }

    function setRowPositions() {
        d3.keys(rows).forEach(wellId => {
            rows[wellId].transition().duration(rowPositionTransitionDuration).attr("transform", `translate(0, ${rowPositions[wellId]})`)
        });
    }

    function generateTimeLabels(timeStepTypeIndex) {
        let timeSvg = d3.select("#mapHeaderSVG").attr("overflow", "visible");
        timeSvg.selectAll("*").remove();
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
            for (let year = firstYear; year < firstYear + steps; year++) {
                if ((year - firstYear) % 5 === 0) {
                    labels.push({
                        text: year,
                        x: ((year - firstYear) * cellWidth),
                    });
                }
            }
        }
        timeSvg.selectAll(".label").data(labels).enter().append("text").text(d => d.text).attr("transform", d => "translate(" + (d.x) + ", " + (40) + ")")
            .attr("text-anchor", "start").attr("alignment-baseline", "middle").attr("style", "font-size: 10px;");
        //Add the separator line
        timeSvg.append("g").attr("transform", `translate(0, ${timeLabelHeight})`).append("line").attr("x1", 0).attr("x2", width + groupLabelWidth).attr("y1", 0).attr("y2", 0).attr("stroke", "black").attr("stroke-width", 1);
    }

    function generateGroupLabels() {
        if (labelsGroup) {
            labelsGroup.selectAll("*").remove();
        }
        let cellContentWidth = steps * cellWidth;
        // let cellContentHeight = allWellIds.length*cellHeight;
        if (!labelsGroup) {
            labelsGroup = svg.append("g").attr("class", "labelsGroup").attr("transform", `translate(${(cellContentWidth)}, 0)`);
        }
        let lgs = labelsGroup.selectAll(".groupLabel").data(groups);
        let enter = lgs.enter();
        let g = enter.append("g").attr("transform", d => `translate(0, ${d.y})`);
        g.append("text").text(d => d.key).attr("alignment-baseline", "hanging").attr("transform", "translate(5, 5)");
        g.append("line").attr("class", "groupSeparator").attr("x1", -(cellContentWidth)).attr("x2", groupLabelWidth).attr("y1", -1).attr("y2", -1).attr("stroke", "#dcdcdc").attr("stroke-width", 1);

        lgs.exit().remove();
    }

    //Exposing necessary components
    this.plot = plot;
    this.updatePositions = updatePositions;
    return this;
}

/*Control options*/
function changeTimeAggregation() {
    spinner.spin(target);
    timeStepTypeIndex = document.getElementById("aggregationSelect").selectedIndex;
    wells = dp.getWellByTimeSteps[timeStepTypeIndex](0);
    plotMaps(dp);
    playSlider = createPlaySlider(dp.minDate, dp.maxDate, "playButtonDiv", mapWidth, updatePlot, 500);
    //Plot the discrete heatmap
    heatmapPlotter = discreteHeatMapPlotter(dp, "heatmap", {});
    heatmapPlotter.plot();
    spinner.stop();
}

function changeAnalyzedValue(){
    analyzeValueIndex = document.getElementById("analyzedValueSelect").selectedIndex;
    //Update cell colors based on the selection.
    //TODO: may need to change this by a class name => since rect may be used for different things rather than cell only.
    let cells = d3.selectAll("rect");
    cells.attr("fill", d => {
        if(analyzeValueIndex === 0){
            return color.waterLevel(d[COL_AVERAGE_OVER_TIME_STEP]);
        }
        if(analyzeValueIndex === 1){
            return d3.interpolateRdYlBu(valueDiffScale(d[COL_AVERAGE_DIFFERENCE_OVER_TIME_STEP]));
        }
    })
    //Update contour colors based on the selection.
    gm.updateMap();
}

function changeGroupOrder() {
    groupSortIndex = document.getElementById("groupOrderSelect").selectedIndex;
    //Need to change the group sort order options
    setOptions(groupSortOptions[groupByIndex], "groupOrderSelect", groupSortIndex);

    wellSortIndex = document.getElementById("wellOrderSelect").selectedIndex;
    heatmapPlotter.updatePositions();
}

function changeGroup() {
    groupByIndex = document.getElementById("groupSelect").selectedIndex;
    //TODO: Check by text to avoid order changes
    if (groupByIndex === 1 || groupByIndex === 2) {//for sudden changes
        //enable focus options
        document.getElementById("changeFocus").disabled = false;
    } else {
        document.getElementById("changeFocus").checked = false;
        document.getElementById("changeFocus").disabled = false;
    }
    changeGroupOrder();
}

function changeWellOrder() {
    changeGroupOrder();
}

function processFocusCells() {
    let typeColIndex = groupByIndex - 1;//first option is for the county group
    processFocusSuddenChange(typeColIndex);

}

function focusOptionChange() {
    if (document.getElementById("changeFocus").checked == true) {
        processFocusCells();
    } else {
        d3.selectAll("rect").attr("opacity", cellNormalOpacity);
    }
}

let focusCells;

function processFocusSuddenChange(typeColIndex) {
    //Clear previous focus cells
    //TODO: may need to change this by a class name => since rect may be used for different things rather than cell only.
    d3.selectAll("rect").attr("opacity", cellFadeOpacity);

    if (typeColIndex < suddenChangeTypes.length) {
        //Select all cells and set to faded
        focusCells = [];
        d3.keys(dp.wellStatistics).forEach(wellId => {
            if (dp.wellStatistics[wellId][suddenChangeTypes[typeColIndex]] != 0) {
                let d0 = dp.wellStatistics[wellId][suddenChangeTypesDates[typeColIndex][0]];
                let d1 = dp.wellStatistics[wellId][suddenChangeTypesDates[typeColIndex][1]];
                //Select the well group
                let step0 = dp.dateToTimeIndexFunctions[timeStepTypeIndex](d0);
                let step1 = dp.dateToTimeIndexFunctions[timeStepTypeIndex](d1);
                let blinking0 = d3.select(`#well${wellId}`).select(".timeStep" + step0);
                focusCells.push(blinking0);
                if (step1 != step0) {
                    let blinking1 = d3.select(`#well${wellId}`).select(".timeStep" + step1);
                    focusCells.push(blinking1);
                }
            }
        });
        setFocusCells(focusCells);

        function setFocusCells(cells) {
            cells.forEach(cell => {
                cell.attr("opacity", cellNormalOpacity);
            });
        }
    }
}