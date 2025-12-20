// <nowiki>

/*
Does 2 things:
- When visiting a user script page, displays the # of users who have installed the script
- When visiting https://en.wikipedia.org/wiki/User:Novem_Linguae/Templates/Scripts, displays the # of users who have installed each script listed there (helps Novem Linguae update the list)
*/

class UserScriptUserCount {
	constructor( mw, $ ) {
		this.mw = mw;
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $;
	}

	async execute() {
		await this.doTaskPlaceCountOnSingleUserScriptPage();
		await this.doTaskPlaceCountsOnNovemsUserScriptList();
	}

	async doTaskPlaceCountOnSingleUserScriptPage() {
		const isUserspace = this.mw.config.get( 'wgNamespaceNumber' ) === 2;
		const title = this.mw.config.get( 'wgTitle' );
		const titleEndsWithJs = title.endsWith( '.js' );
		if ( !isUserspace || !titleEndsWithJs ) {
			return;
		}

		const count = await this.getUserCount( title );
		this.displayCount( count, title );
	}

	async doTaskPlaceCountsOnNovemsUserScriptList() {
		const isUserspace = this.mw.config.get( 'wgNamespaceNumber' ) === 2;
		const title = this.mw.config.get( 'wgTitle' );
		if ( !isUserspace || title !== 'Novem Linguae/Templates/Scripts' ) {
			return;
		}

		const $scriptLinks = this.$( 'a[href^="/wiki/User:Novem_Linguae/Scripts/"]' );
		for ( let i = 0; i < $scriptLinks.length; i++ ) {
			const $link = this.$( $scriptLinks[ i ] );
			const href = $link.attr( 'href' );
			const scriptTitle = decodeURIComponent( href.replace( '/wiki/', '' ) );
			// serial instead of parallel to follow API etiquette
			const count = await this.getUserCount( scriptTitle );
			const countHtml = ` <span style="background-color: lightgray; padding: 2px 4px; border-radius: 4px; font-size: 90%; font-weight: normal !important;">${ count } ${ count === 1 ? 'user' : 'users' }</span>`;
			$link.after( countHtml );
		}
	}

	async getUserCount( title ) {
		// remove .js from the end of the title
		title = title.replace( /\.js$/, '' );
		const api = new this.mw.Api();
		const response = await api.get( {
			action: 'query',
			format: 'json',
			list: 'search',
			formatversion: '2',
			srsearch: `"${ title }" intitle:"common.js"`,
			srnamespace: '2' // Userspace
		} );
		const count = response.query.searchinfo.totalhits;
		return count;
	}

	displayCount( count, title ) {
		// remove .js from the end of the title
		title = title.replace( /\.js$/, '' );
		title = encodeURIComponent( title.replace( /_/g, ' ' ) );
		const html = `<b>${ count }</b> ${ count === 1 ? 'user has' : 'users have' } installed this script. <a href="https://en.wikipedia.org/w/index.php?search=%22${ title }%22+intitle%3A%22common.js%22&title=Special%3ASearch&profile=advanced&fulltext=1&ns2=1&limit=1000">See whom.</a>`;
		this.$( '#contentSub' ).before( `<div class="UserScriptUserCount" style="background-color: lightgray; margin-bottom: 5px;">${ html }</div>` );
	}
}

$( async () => {
	await mw.loader.using( [ 'mediawiki.api' ], async () => {
		await ( new UserScriptUserCount( mw, $ ) ).execute();
	} );
} );

// </nowiki>
