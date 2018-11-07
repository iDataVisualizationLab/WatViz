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
                showTip(d, formatData);
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
        let svg = event.layer;
        let g = svg.select("#contoursGroup");
        g.selectAll("*").remove();
        if(wells.length <= 0){
            return;//Don't do any further drawing if wells is empty
        }

        let fromLatLngToDivPixel = event.fromLatLngToDivPixel;
        wells = addDivPixelFromLatLng(wells, fromLatLngToDivPixel);
        let gridSize = 30;
        let recbin = new RecBinner(wells, gridSize);
        let grid = recbin.grid;

        g.attr("class", "contour");
        g.attr("transform", `translate(${grid.x}, ${grid.y})`);
        g.selectAll("path")
            .data(d3.contours().smooth(true)
                .size(grid.size)
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

    function smoothCardinal(ring, values, value) {
        ring.forEach(function(point) {
            var x = point[0],
                y = point[1],
                xt = x | 0,
                yt = y | 0,
                v0,
                v1 = values[yt * dx + xt];
            if (x > 0 && x < dx && xt === x) {
                v0 = values[yt * dx + xt - 1];
                point[0] = x + (value - v0) / (v1 - v0) - 0.5;
            }
            if (y > 0 && y < dy && yt === y) {
                v0 = values[(yt - 1) * dx + xt];
                point[1] = y + (value - v0) / (v1 - v0) - 0.5;
            }
        });
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
