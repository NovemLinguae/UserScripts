// STATUS CHANGER
// Creator: Misza13
// Modified by Cyberpower678 to simply use /Statussig as a one word indicator
// Only compatible with Cyberpower678's Userspace setup
// Forked by Enterprisey on 2019 Feb 24 to use a "top menu" instead

$.when( mw.loader.using( [ 'mediawiki.util', 'mediawiki.api' ] ), $.ready ).done( () => {
	// Check if the config is defined
	if ( typeof ( statusChangerConfig ) == 'undefined' ) {
		statusChangerConfig = {};
	}
	if ( typeof ( stressChangerConfig ) == 'undefined' ) {
		stressChangerConfig = {};
	}

	statusChangerConfig.statusList = [ 'auto', 'green', 'olive', 'darkorange', 'red', 'brown', 'black', 'grey' ];
	statusChangerConfig.statusText = { auto: 'Automatic', green: 'Huggling', olive: 'Online', darkorange: 'Lurking', red: 'Offline', brown: 'Quick Peek', black: 'Absent', grey: 'Retired' };
	statusChangerConfig.statusPage = 'User:' + mw.config.get( 'wgUserName' ) + '/Statussig/sub';

	stressChangerConfig.statusList = [ 'nul', '-1', '0', '0.01', '1', 'NoPants', 'numb', '2', '3', '4', '4a', '5', '6', '6.5', '7', '8', '9', '10', '11', '∞' ];
	stressChangerConfig.statusText = { nul: 'No status', '-1': 'Polluted', 0: 'Went insane', 0.01: 'Having a life', 1: 'Just fine', NoPants: 'No pants on', numb: 'Numb', 2: 'Tense', 3: 'Stressed', 4: 'Need vacation', '4a': 'On break', 5: 'Run', 6: 'Hospitalized', 6.5: 'Bye Bye', 7: 'Recovering', 8: 'Able to edit', 9: 'Meter fixed', 10: 'Broke again', 11: 'Dead', '∞': 'Nearly die' };
	stressChangerConfig.statusPage = 'User:' + mw.config.get( 'wgUserName' ) + '/StressLevel';

	const STATUSES = {
		auto: 'switching his status to automatically change',
		green: 'Huggling',
		olive: 'Online',
		darkorange: 'Partially Online',
		red: 'Offline',
		brown: 'Online during absence',
		black: 'taking extended absence',
		grey: 'retiring or quiting from Wikipedia'
	};
	const STRESSES = {
		nul: 'shut off his meter',
		'-1': 'polluted his meter or is about to go insane',
		0: 'went insane',
		0.01: 'is having a life and you can\'t be part of it :P',
		1: 'is feeling fine',
		NoPants: 'is not wearing any pants',
		numb: 'is feeling numb',
		2: 'is feeling a bit tense',
		3: 'is pretty stressed right now.  Please don\'t push it',
		4: 'is about to blow a gasket.  He believes he needs a Wikibreak before he quits Wikipedia',
		'4a': 'is on a Wikibreak',
		5: 'is about to explode and may destroy half of Wikipedia',
		6: 'has landed in the hospital',
		6.5: 'is about to be injured in some way',
		7: 'is recovering',
		8: 'is able to start editing again',
		9: 'managed to fix his meter and will be back to full time editing soon',
		10: 'broke his meter again',
		11: 'died.  This is NOT a joke.',
		'∞': 'is close to dying or just witnessed a nuclear explosion'
	};

	mw.util.addPortlet( 'p-status', 'Status', '#p-cactions' );
	mw.util.addPortlet( 'p-stress', 'Stress', '#p-cactions' );

	// Add the links
	for ( var i = 0; i < statusChangerConfig.statusList.length; i++ ) {
		var stat = statusChangerConfig.statusList[ i ];
		mw.util.addPortletLink(
			'p-status', // target tab - new "status" menu
			'#',
			statusChangerConfig.statusText[ stat ], // link text
			'pt-status-' + stat // id of new button
		).addEventListener( 'click', makeStatusListener( stat ) );
	}
	for ( var i = 0; i < stressChangerConfig.statusList.length; i++ ) {
		var stat = stressChangerConfig.statusList[ i ];
		mw.util.addPortletLink(
			'p-stress', // target tab - new "status" menu
			'#',
			stressChangerConfig.statusText[ stat ], // link text
			'pt-stress-' + stat // id of new button
		).addEventListener( 'click', makeStressListener( stat ) );
	}

	function makeStatusListener( stat ) {
		return function ( evt ) {
			if ( evt ) {
				evt.preventDefault();
			}
			( new mw.Api() ).postWithToken( 'csrf', {
				action: 'edit',
				title: statusChangerConfig.statusPage,
				summary: mw.config.get( 'wgUserName' ) + ' is ' + STATUSES[ stat ] + '.',
				text: stat,
				minor: 'true'
			} ).done( ( d ) => {
				if ( d && d.edit && d.edit.result && d.edit.result == 'Success' ) {
					window.location.reload( true );
				} else {
					console.error( d );
				}
			} ).fail( ( code, result ) => {
				console.error( code, result );
			} );
		};
	}
	function makeStressListener( stat ) {
		return function ( evt ) {
			if ( evt ) {
				evt.preventDefault();
			}
			( new mw.Api() ).postWithToken( 'csrf', {
				action: 'edit',
				title: stressChangerConfig.statusPage,
				summary: mw.config.get( 'wgUserName' ) + ' ' + STRESSES[ stat ] + '.',
				text: stat,
				minor: 'true'
			} ).done( ( d ) => {
				if ( d && d.edit && d.edit.result && d.edit.result == 'Success' ) {
					window.location.reload( true );
				} else {
					console.error( d );
				}
			} ).fail( ( code, result ) => {
				console.error( code, result );
			} );
		};
	}
} );

// [[Category:Wikipedia scripts|statusChanger]]
