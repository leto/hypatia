$( function() {
    $("#container").tabs({ fx: { opacity: 'toggle' } });
    var currentOptions;
    var calcOptions = {
                    layout          : $.calculator.scientificLayout,
                    PI              : true,
                    showOn          : 'button',
                    showAnim        : 'fadeIn',
                    duration        : 'slow',
                    buttonImageOnly : true,
                    buttonImage     : '/hypatia/img/calculator.png'
   };
  $('input#lower').calculator( calcOptions );
  $('input#upper').calculator( calcOptions );

    var startData = sampleFunction( -2*Math.PI , 2*Math.PI, 300, function (x) { return Math.sin(x*x) }, 'sin(x^2)' );

    var options = {
        crosshair: { mode: "xy", color: "#ff0000" },
        legend: { show: true },
        lines: { show: true  },
        points: { show: false },
        xaxis: { ticks: 5 },
        yaxis: { ticks: 5, base:  0 },
        selection: { mode: "xy" },
        grid: { hoverable: true, clickable: true , color: "#999"}
    };

   var overviewOptions = {
        legend: { show: true, container: $("#overviewLegend") },
        lines: { show: true, lineWidth: 1 },
        shadowSize: 0,
        xaxis: { ticks: 4 },
        yaxis: { ticks: 4, base: 0, tickDecimals: 2 },
        grid: { color: "#999" },
        selection: { mode: "xy" }
    };

    var previousPoint = null;

    $("#plot1").bind("plothover", function (event, pos, item) {
            $("#x").text(pos.x.toFixed(2));
            $("#y").text(pos.y.toFixed(2));

            if ($("#enableTooltip:checked").length > 0) {
                if (item) {
                    if (previousPoint != item.datapoint) {
                        previousPoint = item.datapoint;
                        
                        $("#tooltip").remove();
                        var x = item.datapoint[0].toFixed(2),
                            y = parseFloat(item.datapoint[1]).toFixed(2);
                        
                        showTooltip(item.pageX, item.pageY,
                                    item.series.label + "(" + x + ") = " + y);
                    }
                }
                else {
                    $("#tooltip").remove();
                    previousPoint = null;            
                }
            }
        });

 $("#plot1").bind("plotclick", function (event, pos, item) {
        if (item) {
            $("#clickdata").text("You clicked point " + item.dataIndex + " in " + item.series.label + ".");
            plot.highlight(item.series, item.datapoint);
        }
    });




    var plotUpdater = function() {

    var url = "cgi/gsl.cgi/=/sf/" + $("select#function").val() + "/"
              + $("input#lower").val()
              + ':' + $("input#upper").val()
              + ':' + "100";

    debug('getting ' + url );

    $.ajax({
        dataType: "json",
        url: url,
        error: ajaxError,
        success: function(json){
                $("input#y").val( json.values[0] );
                $("#previousValues").prepend( '<li>' + $("select#function").val()
                                                     + '(' + $("input#x").val() + ')'
                                                     + ' = ' + $("input#y").val() + '</li>'
                );
                debug('converting data, start='+ json.start + ', end=' + json.end );

                var d = [ ];
                var step = parseFloat( (json.end - json.start)/json.points );
                debug('step='+step);

                for ( var i = parseFloat(json.start); i < json.end; i += step ) {
                   d.push( [ i, json.values.shift() ] );
                }
                debug('plotting');
                
                $.plot($("#previous"), startData, overviewOptions);

                startData = [ { label : $("select#function").val() , data : d }  ];

                if ($("#togglePoints:checked").length > 0) {
                    $.plot($("#plot1"), startData, $.extend(true, {}, options, {
                            points: { show: true },
                      }));
                } else {
                    $.plot($("#plot1"), startData, options);

                }
                $.plot($("#overview"),startData, overviewOptions);
        }
    });

   return false;
    };

    $("input#plotFunction").click( plotUpdater );
    var plot = $.plot($("#plot1"), startData, options);
    var overview = $.plot($("#overview"), startData, overviewOptions );
    var previous = $.plot($("#previous"), startData, overviewOptions );

    $("#plot1").bind("plotselected", function (event, ranges) {
        // clamp the zooming to prevent eternal zoom
        if (ranges.xaxis.to - ranges.xaxis.from < 0.00001)
            ranges.xaxis.to = ranges.xaxis.from + 0.00001;
        if (ranges.yaxis.to - ranges.yaxis.from < 0.00001)
            ranges.yaxis.to = ranges.yaxis.from + 0.00001;
        
        // do the zooming
        currentOptions = $.extend(true, {}, options, {
                          xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to },
                          yaxis: { min: ranges.yaxis.from, max: ranges.yaxis.to }
                      });
        plot = $.plot($("#plot1"), startData,currentOptions);
        
        // don't fire event on the overview to prevent eternal loop
        overview.setSelection(ranges, true);
    });

    $("input#resetZoom").click(function() {
        plot = $.plot($("#plot1"), startData, options );
    });
    $("input#togglePoints").click(function() {
        var toggled = $("#togglePoints:checked").length > 0;
        $.plot($("#plot1"), startData, 
                $.extend(true, {}, currentOptions, {
                    points: { show: toggled },
            }));

    });
        

});

