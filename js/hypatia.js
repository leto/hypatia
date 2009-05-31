function ajaxError(XMLHttpRequest, textStatus, errorThrown) {
    if ( textStatus ) {
        debug( 'ERROR: textStatus=' + textStatus );
    } else {
        debug( 'ERROR: errorThrown=' + errorThrown );
    }
    this; // the options for this ajax request
}

function sampleFunction(x1,x2,points,func,legend_label) {
    debug('sampling data for ' + x1 + ' to ' + x2 );
    var d = [];
    var step = (x2 - x1)/points;
    for (var i = x1; i < x2; i += step ) {
        d.push([i, func( i )]);
    }

    return [
        { label: legend_label , data: d }
    ];
}

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
