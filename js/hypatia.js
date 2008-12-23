    function ajaxError(XMLHttpRequest, textStatus, errorThrown) {
        if ( textStatus ) {
            debug( 'ERROR: textStatus=' + textStatus );
        } else {
            debug( 'ERROR: errorThrown=' + errorThrown );
        }
        this; // the options for this ajax request
    }
