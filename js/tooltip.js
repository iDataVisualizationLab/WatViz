var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0).style("z-index", 1000);
function showTip(d, formatData){
    let htmlstr = formatData(d);
    tooltip.transition()
        .duration(200)
        .style("opacity", .9);
    tooltip.html(htmlstr)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
}
function hidetip(){
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}
function formatData(d) {
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