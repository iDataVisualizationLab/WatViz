/*Adapted from: https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763*/
/***
 *
 * @param startDate
 * @param endDate
 * @param divId the div to render the slider inside
 * @param updatePlot function to update the plut => it will output the date corresponding to the selected value
 * @param options should specify: {margin:{top: , left: , right: , bottom: }, }
 */
var timer;
function createPlaySlider(startDate, endDate, divId, divWidth, divHeight, margin, updatePlot, interval) {
    //Set start date, end date to be the same middle of the month/or to the same date => so that each time we add a scale step => it increase exactly 1 month
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 15);
    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 15);


    let formatDateIntoYear = d3.timeFormat("%Y"),
        formatDate = d3.timeFormat("%b %Y"),
        div = d3.select("#" + divId),
        width = divWidth - margin.left - margin.right,
        height = divHeight - margin.top - margin.bottom;
    div.style("width", divWidth);
    div.style("height", divHeight);
    if (!margin) margin = {left: 0, top: 0, right: 0, bottom: 0};
    if(!interval) interval = 1000;
    let svg = div
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    ////////// slider //////////
    let moving = false;
    let currentValue = 0;
    let targetValue = width;
    let months = utils.monthdiff(startDate, endDate);
    let playButton = d3.select("#play-button");

    let x = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, targetValue])
        .clamp(true);

    let slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + height / 5 + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-inset")
        .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function () {
                slider.interrupt();
            })
            .on("start drag", function () {
                currentValue = d3.event.x;
                update(x.invert(currentValue));
            })
        );

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(x.ticks(10))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function (d) {
            return formatDateIntoYear(d);
        });

    let handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    let label = slider.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatDate(startDate))
        .attr("transform", "translate(0," + (-25) + ")")

    //Play button.
    playButton
        .on("click", function () {
            let button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                button.text("Play");
            } else {
                moving = true;
                timer = setInterval(step, interval);
                button.text("Pause");
            }
        });
    function step() {
        update(x.invert(currentValue));
        currentValue = currentValue + (targetValue / months);
        if (currentValue>=targetValue) {
            moving = false;
            currentValue = 0;
            clearInterval(timer);
            playButton.text("Play");
        }
    }

    function update(h) {
        // update position and text of label according to slider scale
        handle.attr("cx", x(h));
        label.attr("x", x(h))
            .text(formatDate(h));
        console.log(h);
        updatePlot(h);
    }
}
