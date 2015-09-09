<?php
/**
 * UploadUI extension - the thing that needs you.
 *
 * For more info see http://mediawiki.org/wiki/Extension:UploadUI
 *
 * @file
 * @ingroup Extensions
 * @author Your Name, 2015
 */

$wgExtensionCredits['other'][] = array(
	'path' => __FILE__,
	'name' => 'UploadUI',
	'author' => array(
		'Prateek Saxena',
	),
	'version'  => '0.0.0',
	'url' => 'https://www.mediawiki.org/wiki/Extension:UploadUI',
	'descriptionmsg' => 'upload-ui-desc',
	'license-name' => 'MIT',
);

/* Setup */

// Register files
$wgAutoloadClasses['UploadUIHooks'] = __DIR__ . '/UploadUI.hooks.php';
$wgMessagesDirs['UploadUI'] = __DIR__ . '/i18n';

// Register modules
$wgResourceModules['ext.uploadui'] = array(
	'scripts' => array(
		'modules/ext.upload.dialog.js',
		'modules/ext.upload.setuplink.js',
	),
	'dependencies' => array(
		'oojs-ui',
		'mediawiki.Upload',
		'mediawiki.Upload.Dialog',
		'mediawiki.ForeignStructuredUpload.Dialog',
	),

	'localBasePath' => __DIR__,
	'remoteExtPath' => 'UploadUI',
);

$wgHooks['BeforePageDisplay'][] = 'UploadUIHooks::onBeforePageDisplay';
