function displayData(d) {
    let wellId = d.key;
    let position = `Long: ${d[COL_LONG]}<br/>Lat: ${d[COL_LAT]}`;
    let htmlStr = `<b>Well id: ${wellId}</b><br/>${position}`;
    let table = "<table>";
    let values = d.values;
    values.forEach(value=>{
        table += "<tr>";
        let date = utils.dateFormat(value[COL_MEASUREMENT_DATE]);
        let st = value[COL_SATURATED_THICKNESS];
        table += `<td>${date}</td><td style="text-align: right; padding-left: 10px;">${Math.round(st)}</td>`;
        table += "</tr>";
    });
    table += "</table>";
    htmlStr += table;
    return htmlStr;
}

function plotMaps(dp) {
    let longAccessor = (d) => {
        return d[COL_LONG];
    }
    let latAccessor = (d) => {
        return d[COL_LAT];
    }
    let wells = dp.wells;
    // let wells = dp.getWellByMonthIndex(0);

    gm = new GoogleMap("map");
    gm.fitBounds(wells, longAccessor, latAccessor);
    gm.dispatch.on("draw", draw);

    function draw(event) {
        // plotVoronoi(event);
        plotContours(event);
        plotWells(event);
    }

    function plotWells(event) {
        // let wells = dp.wells;
        let layer = event.layer;
        let transform = event.transform(longAccessor, latAccessor);
        let marker = layer.select("#wellsGroup").selectAll("g").data(wells);

        //Update existing
        marker.each(transform);
        marker.exit().remove();

        let enter = marker.enter().append("g")
            .each(transform)
            .attr("class", "marker");

        enter.append("circle")
            .attr("r", 1.4326530612244897)
            // .attr("fill", d => color.waterLevel(d[COL_AVERAGE_OVERTIME]))
            // .attr("fill", "rgba(0,0,0,0.5)")
            .attr("fill", "red")
            .attr("stroke", "black")
            .attr("fill-opacity", .5)
            .attr("stroke-width", 0.6)
            .on("mouseover", d=>{
                let htmlStr = displayData(d);
                showTip(htmlStr);
            })
            .on("mouseout", ()=>{
                hidetip();
            });
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
        let fromLatLngToDivPixel = event.fromLatLngToDivPixel;
        wells = addDivPixelFromLatLng(wells, fromLatLngToDivPixel);
        let gridSize = 30;
        let recbin = new RecBinner(wells, gridSize);
        let grid = recbin.grid;
        let svg = event.layer;
        let g = svg.select("#contoursGroup");
        g.selectAll("*").remove();
        g.attr("class", "contour");
        g.attr("transform", `translate(${grid.x}, ${grid.y})`);
        g.selectAll("path")
            .data(d3.contours()
                .size(grid.size).smooth(true)
                .thresholds(color.waterLevel.domain())
                (grid.map(g => g.value)))
            .enter().append("path")
            .attr("d", d3.geoPath(d3.geoIdentity().scale(grid.scale)))
            .attr("fill", function (d) {
                return color.waterLevel(d.value);
            })
            .attr("stroke", "#000")
            .attr("stroke-width", 0.3)
            .attr("class", "marker")
            .attr("opacity", 1)
            .attr("stroke-linejoin", "round");
    }

    function plotPlotlyContours(event) {
        let fromLatLngToDivPixel = event.fromLatLngToDivPixel;
        wells = addDivPixelFromLatLng(wells, fromLatLngToDivPixel);
        let recbin = new RecBinner(wells, [100, 200]);
        let grid = recbin.grid;
        let x = [];
        let y = [];
        let z = [];
        grid.forEach(g => {
            x.push(g.x);
            y.push(g.y);
            z.push(g.value);
        });
        var data = [{
            z: z,
            x: x,
            y: y,
            type: 'contour'
        }
        ];
        Plotly.newPlot('mycontour', data);

        debugger

    }

    function plotVoronoi(event) {
        let wells = dp.getWellByMonthIndex(0);
        //let wells = dp.getWellByMonthIndex(1);
        let layer = event.layer;
        let fromLatLngToDivPixel = event.fromLatLngToDivPixel;
        wells = addDivPixelFromLatLng(wells, fromLatLngToDivPixel);

        let xs = d3.extent(wells.map(well => well.x));
        let ys = d3.extent(wells.map(well => well.y));

        var cell = layer.append("g")
            .attr("class", "cells")
            .selectAll("g").data(d3.voronoi()
                .extent([[xs[0], ys[0]], [xs[1], ys[1]]])
                .x(function (d) {
                    return d.x;
                })
                .y(function (d) {
                    return d.y;
                })
                .polygons(wells)).enter().append("g")
            .style("position", "absolute");

        cell.append("circle")
            .attr("r", 1.43)
            .attr("cx", function (d) {
                return d.data.x;
            })
            .attr("cy", function (d) {
                return d.data.y;
            });

        cell.append("path")
            .attr("d", function (d) {
                return "M" + d.join("L") + "Z";
            })
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1);
    }
}
