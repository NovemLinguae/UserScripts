import { GARCloserController } from './GARCloserController';
import { MassGARWikicodeGenerator } from './MassGARWikicodeGenerator';
import { GARCloserWikicodeGenerator } from './GARCloserWikicodeGenerator';

/**
 * Run the MassGAR tool by visiting https://en.wikipedia.org/wiki/User:Novem_Linguae/Scripts/GANReviewTool/MassGAR.
 */
export class MassGARController {
	/**
	 * @param {jQuery} $ jQuery
	 * @param {mw} mw mediawiki, https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw
	 * @param {MassGARWikicodeGenerator} mgwg
	 * @param {GARCloserController} gcc
	 * @param {GARCloserWikicodeGenerator} gcwg
	 */
	async execute( $, mw, mgwg, gcc, gcwg ) {
		// TODO: delete any of these that are unused
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $; // used
		this.mw = mw; // used
		this.mgwg = mgwg; // used
		this.gcc = gcc;
		this.gcwg = gcwg;

		// API etiquette. 10 second delay between edits.
		this.editThrottleInSeconds = 10;

		if ( !this.isCorrectPage() ) {
			return;
		}

		if ( !this.isAuthorizedUser() ) {
			mw.notify( 'Sorry. You are not currently authorized to run mass GARs.' );
			return;
		}

		this.showHTMLForm();

		this.$( '#MassGARTool-Run' ).on( 'click', async () => {
			try {
				await this.clickRun();
			} catch ( err ) {
				this.error = err;
				console.error( err );
				this.pushStatus( `<span class="MassGARTool-ErrorNotice">An error occurred :( Details: ${ this.error }</span>` );
			}
		} );

	}

	async clickRun() {
		this.pushStatus( '<br>Run button was clicked. Starting new run.' );

		const listOfMainArticleTitles = this.$( '#MassGARTool-ListOfGARs' ).val().trim().split( '\n' );
		this.reassessmentPageWikicode = this.$( '#MassGARTool-IndividualReassessmentPageWikicode' ).val();
		this.editSummary = this.$( '#MassGARTool-EditSummary' ).val();

		for ( const mainArticleTitle of listOfMainArticleTitles ) {
			this.mainArticleTitle = mainArticleTitle;

			this.pushStatus( `${ this.mainArticleTitle }: Started this article.` );

			// getting these here to minimize API queries
			this.mainArticleWikicode = await this.getWikicode( this.mainArticleTitle );
			this.talkPageTitle = new this.mw.Title( this.mainArticleTitle ).getTalkPage().getPrefixedText();
			this.talkPageWikicode = await this.getWikicode( this.talkPageTitle );

			this.verifyGoodArticleStatus();
			this.verifyNoOpenGAR();
			await this.placeGARTemplateOnTalkPage();
			await this.createIndividualReassessmentPage();

			await this.gcc.delistAPI( this.reassessmentPageTitle, this.editSummary, this.editThrottleInSeconds, '', this.$, this.mw, this.gcwg );

			this.pushStatus( `${ this.mainArticleTitle }: Completed this article.` );
		}

		this.pushStatus( 'Run complete.' );
	}

	verifyGoodArticleStatus() {
		this.pushStatus( `${ this.mainArticleTitle }: Checking to make sure that it's a good article.` );

		if ( !this.mgwg.hasGoodArticleTemplate( this.mainArticleWikicode ) ) {
			throw new Error( `${ this.mainArticleTitle }: doesn't appear to be a good article. The main article page is missing a GA topicon.` );
		}

		if ( !this.mgwg.talkPageIndicatesGA( this.talkPageWikicode ) ) {
			throw new Error( `${ this.mainArticleTitle }: doesn't appear to be a good article. The article talk page does not indicate that this is a good article.` );
		}
	}

	verifyNoOpenGAR() {
		this.pushStatus( `${ this.mainArticleTitle }: Checking to make sure that there isn't an open GAR.` );

		if ( this.mgwg.hasOpenGAR( this.talkPageWikicode ) ) {
			throw new Error( `${ this.mainArticleTitle }: someone appears to have already opened a GAR. The talk page contains the template {{GAR/link}}.` );
		}
	}

	async placeGARTemplateOnTalkPage() {
		this.pushStatus( `${ this.mainArticleTitle }: Placing {{subst:GAR}} template on talk page, which will transform into {{GAR/link}}.` );

		const textToPrepend = '{{subst:GAR}}\n';
		await this.prependEdit( this.talkPageTitle, this.editSummary, textToPrepend );
	}

	/**
	 * This does not notify the nominator, notify the creator, or transclude the reassessment to the talk page. This only creates the individual reassessment page.
	 */
	async createIndividualReassessmentPage() {
		this.pushStatus( `${ this.mainArticleTitle }: Creating an individual assessment page.` );

		const searchPrefixNoNamespace = this.mainArticleTitle + '/GA';
		const listOfPages = await this.getAllSubpagesStartingWith( searchPrefixNoNamespace );
		this.reassessmentPageTitle = await this.getNextUnusedGASubpageTitle( listOfPages, this.mainArticleTitle );
		this.pushStatus( `${ this.mainArticleTitle }: Decided to name the subpage ${ this.reassessmentPageTitle }.` );

		await this.makeEdit( this.reassessmentPageTitle, this.editSummary, this.reassessmentPageWikicode );
	}

	/**
	 * Manually tested. This is complicated but it works.
	 *
	 * @todo Could probably get rid of the complicated API call and math, and just read what the wikicode result of {{subst:GAR}} was in a previous step. Its |page= parameter either has the highest existing subpage # or the first empty subpage #. In other words, that template does the same calculation, so no reason to do it twice.
	 */
	getNextUnusedGASubpageTitle( listOfPages, mainArticleTitle ) {
		// delete all non-numeric characters. will make sorting easier
		listOfPages = listOfPages.map( ( v ) => {
			let number = v.match( /(\d+)$/ )[ 1 ];
			number = parseInt( number );
			return number;
		} );

		// sort the array numerically, not lexographically
		listOfPages = this.sortNumerically( listOfPages );

		const highestSubpageNumber = listOfPages.length ? listOfPages[ listOfPages.length - 1 ] : 0;
		const newSubpageNumber = highestSubpageNumber + 1;
		return `Talk:${ mainArticleTitle }/GA${ newSubpageNumber }`;
	}

	/**
	 * @param {Array} listOfNumbers
	 * @copyright aks, CC BY-SA 4.0, https://stackoverflow.com/a/1063027/3480193
	 */
	sortNumerically( listOfNumbers ) {
		return listOfNumbers.sort( ( a, b ) => a - b );
	}

	/**
	 * @return {Promise<Array>} listOfPages
	 */
	async getAllSubpagesStartingWith( searchPrefixNoNamespace ) {
		const api = new this.mw.Api();
		const params = {
			action: 'query',
			format: 'json',
			list: 'allpages',
			formatversion: '2',
			apprefix: searchPrefixNoNamespace,
			apnamespace: '1', // article talk
			aplimit: 'max'
		};
		const result = await api.post( params );
		const allPages = result.query.allpages;
		const listOfPages = [];
		for ( const key in allPages ) {
			listOfPages.push( allPages[ key ].title );
		}
		return listOfPages;
	}

	showHTMLForm() {
		const formHTML = `

<style>
	#MassGARTool {
		border: 1px solid black;
		padding: 1em;
		margin-bottom: 1em;
	}

	#MassGARTool h2 {
		margin-top: 0;
	}

	#MassGARTool strong {
		text-decoration: underline;
	}

	#MassGARTool p {
		margin-top: 1.5em;
		margin-bottom: 1.5em;
		line-height: 1.5em;
	}

	#MassGARTool-Status {
		display: none;
	}

	.MassGARTool-ErrorNotice {
		color: red;
		font-weight: bold;
	}

	#MassGARTool textarea {
		height: auto;
	}

	#MassGARTool input[type="text"] {
		width: 100%;
	}
</style>

<div id="MassGARTool">
	<div id="MassGARTool-Form">
		<h2>
			Mass GAR Tool
		</h2>

		<p>
		This tool currently creates individual reassessment pages, then de-lists them all. It skips notifying creator, notifying nominator, and transcluding the assessment to the article talk page. Individual reassessment is deprecated, but is often better for mass delisting because then it won't spam the community reassessment GAR logs. Anyway, this code may need adjusting for future mass GARs.
		</p>

		<p>
		To follow API etiquette, there is a 10 second edit throttle. So this page will go a bit slow. Please leave this tab open while the bot is running. Closing this tab will stop the bot.
		</p>

		<p>
			<strong>Edit summary</strong><br />
			<input id="MassGARTool-EditSummary" type="text" />
		</p>

		<p>
			<strong>Individual reassessment page wikicode</strong><br />
			<textarea id="MassGARTool-IndividualReassessmentPageWikicode" rows="5"></textarea>
		</p>

		<p>
			<strong>List of GARs</strong><br />
			Separate with line breaks
			<textarea id="MassGARTool-ListOfGARs" rows="10"></textarea>
		</p>

		<p>
			<button id="MassGARTool-Run">Run</button>
		</p>
	</div>

	<div id="MassGARTool-Status">
		<p>
		</p>
	</div>
</div>

		`;

		const defaultEditSummary = 'mass delist certain GAs per [[Wikipedia:Good article reassessment/February 2023]] (NovemBot Task 6)';

		const defaultIndividualReassessmentPageWikicode = '{{subst:Wikipedia:Good article reassessment/February 2023/GAR notice}}';

		/*
		let defaultListOfGARs =
`Julius Kahn (inventor)
Trussed Concrete Steel Company`;

		let defaultListOfGARs =
`Julius Kahn (inventor)`;
		*/
		const defaultListOfGARs =
`Julius Kahn (inventor)
Trussed Concrete Steel Company`;

		this.$( '.mw-parser-output' ).after( formHTML );
		this.$( '#MassGARTool-EditSummary' ).val( defaultEditSummary );
		this.$( '#MassGARTool-IndividualReassessmentPageWikicode' ).val( defaultIndividualReassessmentPageWikicode );
		this.$( '#MassGARTool-ListOfGARs' ).val( defaultListOfGARs );
	}

	isCorrectPage() {
		const currentPageTitle = this.mw.config.get( 'wgPageName' ).replace( /_/g, ' ' );
		if ( currentPageTitle === 'User:Novem Linguae/Scripts/GANReviewTool/MassGAR' ) {
			return true;
		}
		return false;
	}

	isAuthorizedUser() {
		const username = this.mw.config.get( 'wgUserName' );
		if ( username === 'Novem Linguae' || username === 'NovemBot' ) {
			return true;
		}
		return false;
	}

	pushStatus( statusToAdd ) {
		this.$( '#MassGARTool-Status' ).show();
		this.$( '#MassGARTool-Status > p' ).append( '<br />' + statusToAdd );
	}

	async getWikicode( title ) {
		const api = new this.mw.Api();
		const params = {
			action: 'parse',
			page: title,
			prop: 'wikitext',
			format: 'json'
		};
		let result;
		try {
			result = await api.post( params );
		} catch ( e ) {
			if ( e === 'missingtitle' ) {
				throw new Error( `${ title }: does not appear to be created yet.` );
			} else {
				throw e;
			}
		}
		const wikicode = result.parse.wikitext[ '*' ];
		return wikicode;
	}

	async makeEdit( title, editSummary, wikicode ) {
		// API etiquette. 10 second delay between edits.
		await this.delay( this.editThrottleInSeconds );

		const api = new this.mw.Api();
		const params = {
			action: 'edit',
			format: 'json',
			title: title,
			text: wikicode,
			summary: editSummary
		};
		const result = await api.postWithToken( 'csrf', params );
		const revisionID = result.edit.newrevid;
		return revisionID;
	}

	async prependEdit( title, editSummary, wikicode ) {
		// API etiquette. 10 second delay between edits.
		await this.delay( this.editThrottleInSeconds );

		const api = new this.mw.Api();
		const params = {
			action: 'edit',
			format: 'json',
			title: title,
			prependtext: wikicode,
			summary: editSummary
		};
		const result = await api.postWithToken( 'csrf', params );
		const revisionID = result.edit.newrevid;
		return revisionID;
	}

	async delay( seconds ) {
		const milliseconds = seconds * 1000;
		return new Promise( ( res ) => {
			setTimeout( res, milliseconds );
		} );
	}
}
