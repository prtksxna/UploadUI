( function ( mw ) {
	$( function () {
		var oolink = mw.util.addPortletLink( 'p-tb', '#', 'Upload file', 't-upload-script', 'Upload a file to this wiki from your computer' ),
			$oolink = $( oolink );

	var showDialog = function () {
		var uploadDialog = new mw.ForeignStructuredUpload.Dialog( {
			size: 'small',
			targetHost: 'localhost:8080'
		} );
		var windowManager = new OO.ui.WindowManager();
		$( 'body' ).append( windowManager.$element );
		windowManager.addWindows( [ uploadDialog ] );
		windowManager.openWindow( uploadDialog ).then( function ( opened ) {
			opened.then( function ( closing, data ) {
				if ( data ) {
					alert( '[[File:' + data.internalUrl + ']]' );
				}
			} );
		} );
	}

	$oolink.click( showDialog );

	} );
}( mediaWiki ) );
