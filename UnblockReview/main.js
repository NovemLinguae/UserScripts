/*
Forked from [[User:Enterprisey/unblock-review.js]] on Oct 31, 2024.
Many many bugs fixed. And some features added :)
*/

import { UnblockReviewController } from './modules/UnblockReviewController.js';

$( async () => {
	await mw.loader.using( [ 'mediawiki.api', 'mediawiki.util', 'codex-styles' ] ).then( async () => {
		await ( new UnblockReviewController() ).execute();
	} );
} );
