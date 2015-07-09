<?php
/**
 * Hooks for UploadUI extension
 *
 * @file
 * @ingroup Extensions
 */

class UploadUIHooks {

	public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin ) {
		$out->addModules( 'ext.uploadui' );
		return true;
	}

}
