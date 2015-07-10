var UW = UW || {};

/**
 * Uploader interface for a single file. Can be used in a larger list of
 * uploads to control bulk edits.
 *
 * @class
 * @param {Object} [config] Configuration options
 * @cfg {string} [container] ID of the container element
 * @cfg {string} [containerType] Type of container - single, dialog or bulk
 */
UW.Uploader = function UWUploader ( config ) {
	// Config stuff
	// TODO: Does the config have a container?
	// TODO: Fill config with defauls
	this.container = config.container;
	this.$container = $( '#' + this.container ).addClass( 'uw-uploader' );
	this.containerType = config.containerType || 'single';
	this.bulk = config.bulk || undefined;

	// Mixin constructors
	OO.EventEmitter.call( this );

	// Create elements
	this.$uploadForm = $( '<div>' )
		.addClass( 'uw-upload-form' )
		.appendTo( this.$container );
	this.$detailsForm = $( '<div>' )
		.addClass( 'uw-details-form' )
		.appendTo( this.$container )
		.hide();
	this.$detailsFormUpload = $( '<div>' )
		.addClass( 'uw-details-form-upload' )
		.appendTo( this.$detailsForm );
	this.$detailsFormMetadata = $( '<div>' )
		.addClass( 'uw-details-form-metadata' )
		.appendTo( this.$detailsForm );
	this.$detailsFormLicense = $( '<div>' )
		.addClass( 'uw-details-form-license' )
		.appendTo( this.$detailsForm );
	this.$waitForSave = $( '<div>' )
		.addClass( 'uw-wait-for-save' )
		.appendTo( this.$container )
		.hide();
	this.$usage = $( '<div>' )
		.addClass( 'uw-usage' )
		.appendTo( this.$container )
		.hide();

	this.renderUploadForm();
}

/* Setup */
OO.mixinClass( UW.Uploader, OO.EventEmitter );

/* Properties */

/**
 * @property state {string} Current state
 */
UW.Uploader.prototype.state = 'upload';

/**
 * @property containerType {string} This could be - single, dialog or bulk
 */
UW.Uploader.prototype.containerType = 'single';

/**
 * @property api
 */
UW.Uploader.prototype.api = new mw.Api();


/* Events */

/**
 * @event fileUploaded
 *
 * Emitted when the file is uploaded
 */

/**
 * @event fileSaved
 *
 * Emitted when the file is saved
 *
 * @param {Object} details of where the file was uploaded etc.
 */

/**
 * @event stateChange
 *
 * Emitted when the state of the uploader changes.
 * Could be -
 * * upload
 * * details
 * * usage
 *
 * @param {String} name of the state
 */

/**
 * @event select
 *
 * Emitted when the file is selected or unselected in a bulk containerType
 *
 * @param {Boolean} Whether or not the uploader was selected.
 */

/* Methods */

/**
 * Renders the file upload form
 * @returns {OO.ui.FormLayout} element
 */
UW.Uploader.prototype.renderUploadForm = function () {
	var self = this;

	self.uploadForm = {}
	self.uploadForm.file = new OO.ui.SelectFileWidget();

	self.uploadForm.submit = new OO.ui.Widget();
	if ( self.containerType !== 'dialog' ) {
		self.uploadForm.submit = new OO.ui.ButtonWidget( {
			label: 'Upload',
			flags: [ 'constructive', 'primary' ]
		} );
	}

	if ( self.containerType === 'dialog' ) {
		self.uploadForm.fieldset = new OO.ui.FieldLayout(
			self.uploadForm.file,
			{
				label: 'Select file…',
				align: 'top'
			}
		);
	} else {
		self.uploadForm.fieldset = new OO.ui.ActionFieldLayout(
			self.uploadForm.file,
			self.uploadForm.submit,
			{
				label: 'Select file…',
				align: 'top'
			}
		);
	}

	self.uploadForm.form = new OO.ui.FormLayout( { items: [ self.uploadForm.fieldset ] } );

	// TODO: How do I get the form to submit?
	// TODO: Can I do anything buth .bind()?
	self.uploadForm.submit.on( 'click', self.initFileUpload.bind( self ) );

	this.$uploadForm.append( self.uploadForm.form.$element );
	return self.uploadForm.form;
};

/**
 * Initialize file upload
 */
UW.Uploader.prototype.initFileUpload = function () {
	var self = this;

	self.getFileData();
	self.uploadFile();

	self.$uploadForm.hide();
	self.renderDetailsForm();

	self.emit( 'stateChange', 'details' );
};


/**
 * Upload file
 * TODO: Should use mw.UploadWizardUpload.js
 */
UW.Uploader.prototype.uploadFile = function () {
	var self = this;


	var file = self.uploadForm.file.getValue();
	self.api.uploadToStash( file, { filename: file.name } ).then( function ( cb ) {
		self.finishUpload = cb;
		self.emit( 'fileUploaded' );
	} );
};

/**
 * Get the file's meta data
 * TODO: Should use mw.UploadWizardUpload.js
 */
UW.Uploader.prototype.getFileData = function () {
	var fileDisplayElement = this.getFileDisplayElement();
	return {
		name: this.uploadForm.file.getValue().name,
		date: this.uploadForm.file.getValue().lastModified,
		$el: fileDisplayElement
	};
};

/**
 * Get the file's display element
 * A canvas element with the file rendered or something
 * TODO: Should use mw.UploadWizardUpload.js
 */
UW.Uploader.prototype.getFileDisplayElement = function () {
	return $( '<img>' ).attr( 'src', 'cat.png' );
};

/**
 * Renders the details form
 * @returns {OO.ui.FormLayout} element
 */
UW.Uploader.prototype.renderDetailsForm = function () {
	var self = this,
		fileDetails = self.getFileData();

	self.detailsForm = {};

	// File preview and actions
	self.detailsForm.filePreview = fileDetails.$el;
	self.detailsForm.fileProgress = new OO.ui.ProgressBarWidget();

	self.detailsForm.fileCancel = new OO.ui.Widget();
	self.detailsForm.fileSave = new OO.ui.Widget();

	if ( self.containerType !== 'dialog' ) {
		self.detailsForm.fileCancel = new OO.ui.ButtonWidget( {
			label: 'Cancel',
			flags: 'destructive',
			framed: true
		} ).on( 'click', self.showCancelDialog.bind( self ) );
		self.detailsForm.fileSave = new OO.ui.ButtonWidget( {
			label: 'Save',
			flags: [ 'constructive', 'primary' ],
			disabled: true
		} ).on( 'click', self.saveFile.bind( self ) );
	}

	self.detailsForm.bulkToggleLabel = new OO.ui.Widget();
	self.detailsForm.bulkToggle = new OO.ui.Widget();
	if ( self.containerType === 'bulk' ) {
		self.detailsForm.bulkToggle = new OO.ui.ToggleSwitchWidget().on( 'change', self.select.bind( self ) );
		self.detailsForm.bulkToggleLabel = new OO.ui.LabelWidget( { label: 'Bulk Edit' });
	}



	self.$detailsFormUpload.append(
		self.detailsForm.filePreview,
		self.detailsForm.fileProgress.$element,
		'<br>',
		self.detailsForm.fileCancel.$element,
		self.detailsForm.fileSave.$element,
		self.detailsForm.bulkToggleLabel.$element,
		self.detailsForm.bulkToggle.$element

	);

	self.on( 'fileUploaded', function ( d ) {
		self.detailsForm.fileProgress.setProgress( 100 );
		self.detailsForm.fileSave.setDisabled( false );
	} );


	// File metadata
	self.detailsForm.name = new OO.ui.TextInputWidget( {
		value: fileDetails.name,
		indicator: 'required',
		required: true,
		validate: /.+/
	} );

	self.detailsForm.date = new OO.ui.TextInputWidget( {
		value: new Date( fileDetails.date ).toDateString(),
		indicator: 'required',
		required: true,
		validate: /.+/
	} );
	self.detailsForm.language = new OO.ui.DropdownInputWidget( {
		label: 'Pick langauge',
		options: [
			{ data: 'en', label: 'English' },
			{ data: 'hi', label: 'Hindi' },
		]
	} );
	self.detailsForm.description = new OO.ui.TextInputWidget( {
		indicator: 'required',
		required: true,
		validate: /.+/,
		multiline: true,
		autosize: true
	} );
	self.detailsForm.addDescription = new OO.ui.ButtonWidget( {
		label: 'Add another language',
		icon: 'add',
		flags: 'constructive',
	} );
	self.detailsForm.categories = new OO.ui.ComboBoxWidget( {
		icon: 'tag',
		label: 'Pick langauge',
		menu: {
			items: [
				new OO.ui.MenuOptionWidget( {
					data: 'wm-pres',
					label: 'Wikimedia Presentation'
				} ),
				new OO.ui.MenuOptionWidget( {
					data: 'animals',
					label: 'Wild Animals'
				} ),
			]
		}
	} );


	self.detailsForm.metadataFieldset = new OO.ui.FieldsetLayout( { label: 'Details' } );
	self.detailsForm.metadataFieldset.addItems( [
		new OO.ui.FieldLayout( self.detailsForm.name, {
			label: 'Name',
			align: 'top'
		} ),
		new OO.ui.FieldLayout( self.detailsForm.date, {
			label: 'Date',
			align: 'top'
		} ),
		new OO.ui.FieldLayout( self.detailsForm.language, {
			label: 'Language',
			align: 'top'
		} ),
		self.detailsForm.description,
		new OO.ui.FieldLayout( self.detailsForm.addDescription ),
		new OO.ui.FieldLayout( self.detailsForm.categories, {
			label: 'Categories',
			align: 'top'
		} )
	] );
	self.detailsForm.metadataForm = new OO.ui.FormLayout( {
		items: [ self.detailsForm.metadataFieldset ]
	} );

	self.$detailsFormMetadata.append( self.detailsForm.metadataForm.$element );


	// License
	self.detailsForm.ownerType = new OO.ui.ToggleSwitchWidget( { value: true } );
	self.detailsForm.ownerTypeLabel = new OO.ui.LabelWidget( { label: 'This file is my own work' } );
	self.detailsForm.ownerName = new OO.ui.TextInputWidget( {
		indicator: 'required',
		required: true,
		validate: /.+/,
		classes: [ 'license_name_input' ],
		value: 'Prtksxna'
	} );
	self.detailsForm.license = new OO.ui.ComboBoxWidget( {
		icon: 'tag',
		label: 'Pick a license',
		classes: [ 'license_name_license' ],
		menu: {
			items: [
				new OO.ui.MenuOptionWidget( {
					data: 'CC-BY-SA',
					label: 'Creative Commons Attribution Share Alike'
				} ),
				new OO.ui.MenuOptionWidget( {
					data: 'CC-BY',
					label: 'Creative Commons Attribution'
				} ),
			]
		}
	} );
	self.$detailsFormLicense.append(
		$( '<h4>' ).text( 'License' ),
		self.detailsForm.ownerType.$element,
		self.detailsForm.ownerTypeLabel.$element,
		'<br>',
		'<br>',
		'I',
		self.detailsForm.ownerName.$element,
		', the copyright holder of this work, irrevocably grant anyone the right to use this work under the',
		self.detailsForm.license.$element
	);


	self.$detailsForm.show();
};

/**
 * Confirm whether or not to cancel the upload
 */
UW.Uploader.prototype.showCancelDialog = function () {
	var self = this;
	var messageDialog = new OO.ui.MessageDialog();
	var windowManager = new OO.ui.WindowManager();
	$( 'body' ).append( windowManager.$element );
	windowManager.addWindows( [ messageDialog ] );

	windowManager.openWindow( messageDialog, {
		title: 'Are you sure you want to cancel this upload?',
		message: 'This action cannot be undone.'
	} ).then( function ( opened ) {
		opened.then( function ( closing, data ) {
			if ( data.action === 'accept' ) {
				self.cancel();
			}
		} );
	} );
};

/**
 * Cancel upload
 * Removed the form and deletes the current object if its part of
 * a bulk editor, TODO: otherwise goes back to the upload state.
 */
UW.Uploader.prototype.cancel = function () {
	// If part of bulk
	this.$container.html( '' );
	delete this; // TODO: Wat?

	// If not part of bulk
	// TODO: Swtich back to upload form
};

/**
 * Save file
 */
UW.Uploader.prototype.saveFile = function () {
	var self = this;

	// TODO: Validations
	// TODO: Get all details and post to server
	// TODO: Should use mw.UploadWizardUpload.js
	self.finishUpload( { filename: self.detailsForm.name.getValue() } ).then( function ( result ) {
		console.log( result );
		self.emit( 'fileSaved', result );
	} );

	self.on( 'fileSaved', self.renderUsage.bind( self ) );
	self.renderWaitForSave();
};

/**
 * Render the waiting part
 */
UW.Uploader.prototype.renderWaitForSave = function () {
	var self = this;

	self.$detailsForm.hide();

	self.waitForSave = {};
	self.waitForSave.progress = new OO.ui.ProgressBarWidget();
	self.$waitForSave
		.show()
		.append(
			self.detailsForm.filePreview, // TODO: Dirty
			$( '<div>' ).append(
				$( '<p>' ).text( 'Saving file' ),
				self.waitForSave.progress.$element
			)
		);
};


/**
 * Render the usage
 */
UW.Uploader.prototype.renderUsage = function ( d ) {
	var self = this;

	self.emit( 'stateChange', 'usage' );

	self.$waitForSave.hide();
	self.usage = {};
	self.usage.doneLabel = new OO.ui.LabelWidget( { label: 'This file was successfully uploaded' } );
	self.usage.onWikiLabel = new OO.ui.LabelWidget( { label: 'On wiki use' } );
	self.usage.onWikiInput = new OO.ui.TextInputWidget( {
		value: '[[' + d.upload.imageinfo.canonicaltitle + ']]'
	} );
	self.usage.offWikiLabel = new OO.ui.LabelWidget( { label: 'Off wiki use' } );
	self.usage.offWikiInput = new OO.ui.TextInputWidget( {
		value: d.upload.imageinfo.url
	} );

	self.usage.dismiss = new OO.ui.Widget();
	if ( self.containerType !== 'dialog' ) {
		self.usage.dismiss = new OO.ui.ButtonWidget( {
			label: 'Dismiss',
			flags: 'destructive',
		} ).on( 'click', self.dismiss.bind( self ) );
	}

	self.$usage
		.show()
		.append(
			self.detailsForm.filePreview, // TODO: Dirty
			$( '<div>' ).append(
				self.usage.doneLabel.$element,
				'<br>',
				'<br>',
				self.usage.onWikiLabel.$element,
				self.usage.onWikiInput.$element,
				'<br>',
				self.usage.offWikiLabel.$element,
				self.usage.offWikiInput.$element,
				'<br>',
				self.usage.dismiss.$element
			)
		);

};

/**
 * Dismiss the entire thing
 */
UW.Uploader.prototype.dismiss = function () {
	// If part of bulk
	this.$container.html( '' );
	delete this; // TODO: Wat?
}


/**
 * Select this uploader if part of bulk
 */
UW.Uploader.prototype.select = function ( value ) {
	if ( this.containerType !== 'bulk' ) return false;
	if ( value ) {
		this.$container.addClass( 'uw-selected' );
	} else {
		this.$container.removeClass( 'uw-selected' );
	}
	this.emit( 'select', value );
}
