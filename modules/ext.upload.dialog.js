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
 * @property api
 */
UW.UploadDialog.prototype.api = new mw.Api();

/**
 * @property
 */
UW.UploadDialog.static.actions = [
	{ flags: 'safe', action: 'cancel', label: 'Cancel', modes: [ 'upload', 'insert', 'save' ] },
	{ flags: [ 'primary', 'progressive' ], label: 'Done', action: 'insert', modes: 'insert' },
	{ flags: [ 'primary', 'progressive' ], label: 'Save', action: 'save', modes: 'save' },
	{ flags: [ 'primary', 'progressive' ], label: 'Upload', action: 'upload', modes: 'upload' }
];

/**
 * @method
 */
UW.UploadDialog.prototype.initialize = function () {
	UW.UploadDialog.super.prototype.initialize.call( this );

	this.renderUploadForm();
	this.content = new OO.ui.PanelLayout( { padded: true, expanded: false } );
	this.content.$element.append( this.$uploadForm )
	this.$body.append( this.content.$element );
};

/**
 * @method
 */
UW.UploadDialog.prototype.getBodyHeight = function () {
	return 300;
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
		return new OO.ui.Process( function () {
			self.close( self.uploadDetails );
		} );
	}
	if ( action === 'upload' ) {
		return new OO.ui.Process( function () {
			self.uploadFile();
			self.renderInfoForm();
			self.content.$element
				.html( '' )
				.append( self.$infoForm );
			self.actions.setMode( 'save' );
		} );
	}
	if ( action === 'save' ) {
		return new OO.ui.Process( self.saveFile() );
	}
	if ( action === 'cancel' ) {
		self.close();
	}

	return UW.UploadDialog.super.prototype.getActionProcess.call( this, action );
};

/**
 * @method
 */
UW.UploadDialog.prototype.renderUploadForm = function () {
	this.uploadForm = {}
	this.$uploadForm = $( '<div>' ).attr( 'id', 'upload-dialog-upload-form' );
	this.uploadForm.file = new OO.ui.SelectFileWidget();
	this.uploadForm.fieldset = new OO.ui.FieldsetLayout( { label: 'Select file' } );
	this.uploadForm.fieldset.addItems( [ this.uploadForm.file ] );
	this.uploadForm.form = new OO.ui.FormLayout( { items: [ this.uploadForm.fieldset ] } );
	this.$uploadForm.append( this.uploadForm.form.$element );
}

/**
 * @method
 */
UW.UploadDialog.prototype.renderInfoForm = function () {
	var fileName = this.uploadForm.file.getValue().name;
	this.infoForm = {};
	this.$infoForm = $( '<div>' ).attr( 'id', 'upload-dialog-info-form' );
	this.infoForm.name = new OO.ui.TextInputWidget( {
		value: fileName,
		indicator: 'required',
		required: true,
		validate: /.+/
	} );
	this.infoForm.description = new OO.ui.TextInputWidget( {
		indicator: 'required',
		required: true,
		validate: /.+/,
		multiline: true,
		autosize: true
	} );
	this.infoForm.fieldset = new OO.ui.FieldsetLayout( { label: 'Details' } );
	this.infoForm.fieldset.addItems( [
		new OO.ui.FieldLayout( this.infoForm.name, {
			label: 'Name',
			align: 'top'
		} ),
		new OO.ui.FieldLayout( this.infoForm.description, {
			label: 'Description',
			align: 'top'
		} )
	] );
	this.infoForm.form = new OO.ui.FormLayout( { items: [ this.infoForm.fieldset ] } );
	this.$infoForm.append( this.infoForm.form.$element );
}

/**
 * @method
 */
UW.UploadDialog.prototype.renderInsertForm = function () {
	var d = this.uploadDetails;
	console.log( d  );
	this.insertForm = {};
	this.$insertForm = $( '<div>' ).attr( 'id', 'upload-dialog-insert-form' );
	this.insertForm.onWiki= new OO.ui.TextInputWidget( {
		value: d.upload.imageinfo.canonicaltitle
	} );
	this.insertForm.offWiki= new OO.ui.TextInputWidget( {
		value: d.upload.imageinfo.url
	} );
	this.insertForm.fieldset = new OO.ui.FieldsetLayout( { label: 'Usage' } );
	this.insertForm.fieldset.addItems( [
		new OO.ui.FieldLayout( this.insertForm.onWiki, {
			label: 'On wiki',
			align: 'top'
		} ),
		new OO.ui.FieldLayout( this.insertForm.offWiki, {
			label: 'Off wiki',
			align: 'top'
		} )
	] );
	this.insertForm.form = new OO.ui.FormLayout( { items: [ this.insertForm.fieldset ] } );
	this.$insertForm.append( this.insertForm.form.$element );
}

/**
 * @method
 */
UW.UploadDialog.prototype.uploadFile = function () {
	var self = this,
		file = this.uploadForm.file.getValue();
	console.log( 'uploading' )
	this.uploadPromise = this.api.uploadToStash( file, { filename: file.name } );

	this.uploadPromise.then( function ( cb ) {
		self.emit( 'fileUploaded' );
		console.log( 'uploaded' );
	} );
}

/**
 * @method
 */
UW.UploadDialog.prototype.saveFile = function () {
	var self = this,
		promise = $.Deferred();
		info = this.getInfo();
	console.log( 'saving', info )

	// TODO: Validations
	this.uploadPromise.always( function ( cb ) {

		if ( cb.info !== undefined ) {
			promise.reject( new OO.ui.Error( cb.info ) );
			return false;
		}

		cb( info ).then( function ( result ) {
			if ( result.upload.result !== "Success" ) {
				promise.reject( new OO.ui.Error( 'Sorry! There was an error', { recoverable: false } ) );
				console.log( result );
				return false;
			}
			self.uploadDetails = result;
			promise.resolve();
			self.emit( 'fileSaved', result );
		} );
	} );

	self.on( 'fileSaved', function () {
		self.renderInsertForm();
		self.content.$element
			.html( '' )
			.append( self.$insertForm );
		self.actions.setMode( 'insert' )
	} );

	return promise;
}

/**
 * @method
 */
UW.UploadDialog.prototype.getInfo = function () {
	return {
		filename: this.infoForm.name.getValue(),
		text: this.infoForm.description.getValue()
	};
}
