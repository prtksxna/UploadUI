var UW = UW || {};

/**
 * Uploader interface for a single file in a ProcessDialog
 *
 * @class
 * @extends OO.ui.ProcessDialog
 */
UW.UploadDialog = function ( config ) {
	UW.UploadDialog.super.call( this, config );
}
OO.inheritClass( UW.UploadDialog, OO.ui.ProcessDialog );

/**
 * @property
 */
UW.UploadDialog.static.title = 'Upload file';

/**
 * @property
 */
UW.UploadDialog.static.actions = [
	{ flags: 'safe', action: 'cancel', label: 'Cancel', modes: [ 'upload', 'insert', 'save' ] },
	{ flags: [ 'primary', 'progressive' ], label: 'Insert media', action: 'insert', modes: 'insert' },
	{ flags: [ 'primary', 'progressive' ], label: 'Save', action: 'save', modes: 'save' },
	{ flags: [ 'primary', 'progressive' ], label: 'Upload', action: 'upload', modes: 'upload' }
];

/**
 * @method
 */
UW.UploadDialog.prototype.initialize = function () {
	UW.UploadDialog.super.prototype.initialize.call( this );
	this.$content = $( '<div>' ).attr( 'id', 'uw-dialog-container' );
	this.$body.append( this.$content );

	var self = this;

	self.uploader = new UW.Uploader( {
		container: 'uw-dialog-container',
		containerType: 'dialog'
	} );
	self.uploader.on( 'fileSaved', function ( d ) {
		self.uploadDetails = d;
		self.actions.setMode( 'insert' );
	} );
};

/**
 * @method
 */
UW.UploadDialog.prototype.getBodyHeight = function () {
	return 500;
};

/**
 * @method
 */
UW.UploadDialog.prototype.getSetupProcess = function ( data ) {
	return UW.UploadDialog.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			this.actions.setMode( 'upload' );
		}, this );
};

/**
 * @method
 */
UW.UploadDialog.prototype.getActionProcess = function ( action ) {
	var self = this;

	if ( action === 'insert' ) {
		this.close( this.uploadDetails );
	}
	if ( action === 'upload' ) {
		self.uploader.initFileUpload();
		self.actions.setMode( 'save' );
	}
	if ( action === 'save' ) {
		self.actions.setMode( 'insert' );
		self.uploader.saveFile()
	}
	if ( action === 'cancel' ) {
		self.close();
	}

	return UW.UploadDialog.super.prototype.getActionProcess.call( this, action );
};
