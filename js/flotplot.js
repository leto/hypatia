$(function () {
    // setup plot
    function getData(x1, x2) {
        var d = [];
        var step = (x2 - x1)/300;
        for (var i = x1; i < x2; i += step )
            d.push([i, Math.sin( i*i )]);

        return [
            { label: "sin(x^2)", data: d }
        ];
    }

    var options = {
        crosshair: { mode: "xy", color: "#ff0000" },
        legend: { show: true },
        lines: { show: true  },
        points: { show: false },
        xaxis: { ticks: 4 },
        yaxis: { ticks: 4, base:  0 },
        selection: { mode: "xy" },
        grid: { hoverable: true, clickable: true , color: "#999"}
    };

    var startData = getData( -2*Math.PI , 2*Math.PI );
    
    var plot = $.plot($("#placeholder"), startData, options);

    // setup overview
    var overview = $.plot($("#overview"), startData, {
        legend: { show: true, container: $("#overviewLegend") },
        lines: { show: true, lineWidth: 1 },
        shadowSize: 0,
        xaxis: { ticks: 4 },
        yaxis: { ticks: 4, base: 0, tickDecimals: 2 },

        grid: { color: "#999" },
        selection: { mode: "xy" }
    });

    // now connect the two
    
    $("#placeholder").bind("plotselected", function (event, ranges) {
        // clamp the zooming to prevent eternal zoom
        if (ranges.xaxis.to - ranges.xaxis.from < 0.00001)
            ranges.xaxis.to = ranges.xaxis.from + 0.00001;
        if (ranges.yaxis.to - ranges.yaxis.from < 0.00001)
            ranges.yaxis.to = ranges.yaxis.from + 0.00001;
        
        // do the zooming
        plot = $.plot($("#placeholder"), getData(ranges.xaxis.from, ranges.xaxis.to),
                      $.extend(true, {}, options, {
                          xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to },
                          yaxis: { min: ranges.yaxis.from, max: ranges.yaxis.to }
                      }));
        
        // don't fire event on the overview to prevent eternal loop
        overview.setSelection(ranges, true);
    });
    $("#overview").bind("plotselected", function (event, ranges) {
        plot.setSelection(ranges);
    });
 function showTooltip(x, y, contents) {
        $('<div id="tooltip">' + contents + '</div>').css( {
            position: 'absolute',
            display: 'none',
            top: y + 5,
            left: x + 5,
            border: '1px solid #fdd',
            padding: '2px',
            'background-color': '#fee',
            opacity: 0.80
        }).appendTo("body").fadeIn(200);
    }

    var previousPoint = null;
    $("#placeholder").bind("plothover", function (event, pos, item) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));

        if ($("#enableTooltip:checked").length > 0) {
            if (item) {
                if (previousPoint != item.datapoint) {
                    previousPoint = item.datapoint;
                    
                    $("#tooltip").remove();
                    var x = item.datapoint[0].toFixed(2),
                        y = item.datapoint[1].toFixed(2);
                    
                    showTooltip(item.pageX, item.pageY,
                                item.series.label + " of " + x + " = " + y);
                }
            }
            else {
                $("#tooltip").remove();
                previousPoint = null;            
            }
        }
    });

    $("#placeholder").bind("plotclick", function (event, pos, item) {
        if (item) {
            $("#clickdata").text("You clicked point " + item.dataIndex + " in " + item.series.label + ".");
            plot.highlight(item.series, item.datapoint);
        }
    });
});
