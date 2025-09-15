export class UserRightsDiffStringProcessor {

	/** Returns 2 arrays. For example: [ [ 'autopatrolled' ], [ 'sysop' ] ] */
	logEntryStringToArrays( text ) {
		const fromMatches = /revoked ([^;(]+)/.exec( text );
		const fromMatch = fromMatches && fromMatches[ 1 ];
		const from = this.permStringToArray( fromMatch );

		const toMatches = /granted ([^;(]+)/.exec( text );
		const toMatch = toMatches && toMatches[ 1 ];
		let to = this.permStringToArray( toMatch );

		const autoUpdatedMatches = /automatically updated .+ to ([a-z ]+)/.exec( text );
		const autoUpdateMatch = autoUpdatedMatches && autoUpdatedMatches[ 1 ];
		const autoUpdate = this.permStringToArray( autoUpdateMatch );
		// array_merge( to, autoUpdate )
		to = to.concat( autoUpdate.filter( ( x ) => !to.includes( x ) ) );

		return [ from, to ];
	}

	permStringToArray( string ) {
		if ( string === null ) {
			return [];
		}

		string = string.replace( /^(.*) and (.*?$)/, '$1, $2' );

		const array = string.split( ', ' ).map( ( str ) => str.trim() );

		return array;
	}
}
