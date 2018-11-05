var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
function showTip(htmlstr){
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