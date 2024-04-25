export class GANReviewHTMLGenerator {
	getHTML( gaTitle, wikicodeOfGASubPages ) {
		let defaultDisplayText = this.getDefaultDisplayText( gaTitle );
		defaultDisplayText = this.escapeHtml( defaultDisplayText );

		const gaTopicComboBoxOptionsHTML = this.makeTopicComboBoxOptions( wikicodeOfGASubPages );

		return `
<style>
	#GANReviewTool {
		border: 1px solid black;
		padding: 1em;
		margin-bottom: 1em;
	}

	#GANReviewTool h2 {
		margin-top: 0;
	}

	#GANReviewTool strong {
		text-decoration: underline;
	}

	#GANReviewTool code {
		/* font-family: monospace; */
	}

	#GANReviewTool input[type="text"] {
		width: 50em;
	}

	#GANReviewTool p {
		margin-top: 1.5em;
		margin-bottom: 1.5em;
		line-height: 1.5em;
	}

	#GANReviewTool option:disabled {
		font-weight: bold;
		color: green;
	}

	#GANReviewTool-ProcessingMessage {
		display: none;
	}

	.GANReviewTool-ValidationError {
		display: none;
		color: red;
		font-weight: bold;
	}

	.GANReviewTool-ErrorNotice {
		color: red;
		font-weight: bold;
	}

	#GANReviewTool-MainForm {
		display: none;
	}
</style>

<div id="GANReviewTool">
	<div id="GANReviewTool-Form">
		<h2>
			GAN Review Tool
		</h2>

		<p class="GANReviewTool-Collapsed">
			<a id="GANReviewTool-Uncollapse">Click here</a> to open GANReviewTool.
		</p>

		<div id="GANReviewTool-MainForm">
			<p>
				<strong>Action</strong><br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="pass" checked /> Pass<br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="fail" /> Fail<br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="placeOnHold" /> Place On Hold<br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="askSecondOpinion" /> Ask 2nd Opinion<br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="answerSecondOpinion" /> Answer 2nd Opinion<br />
			</p>

			<!-- if pass or fail -->
			<div id="GANReviewTool-PassFailDiv">
				<p>
					<input type="checkbox" name="GANReviewTool-ATOPYesNo" value="1" checked /> Place {{<a href="/wiki/Template:Archive_top">Archive top</a>}} and {{Archive bottom}} templates on GA review page
				</p>

				<!-- if pass -->
				<div id="GANReviewTool-PassDiv">
					<p>
						<strong>Topic, subtopic, and sub-subtopic:</strong><br />
						<select name="GANReviewTool-Topic">
							<option></option>

${ gaTopicComboBoxOptionsHTML }
						</select>
					</p>

					<p>
						<strong>Wikicode to display when adding this to the list of good articles at [[<a href="/wiki/Wikipedia:Good_articles">WP:GA</a>]]</strong><br />
						People should be in format: <code>Lastname, Firstname</code><br />
						Albums, television shows, <a href="/wiki/Genus">genus</a>, <a href="/wiki/Binomial_nomenclature">species</a>, court cases should be italicized: <code>''Jeopardy''</code><br />
						Television episodes should be surrounded by double quotes: <code>"Episode name"</code><br />
						Parentheses at the end should not be formatted: <code>''Revolver'' (Beatles album)</code><br />
						Artwork, poetry, etc. may also require special formatting<br />
						More info at [[<a href="/wiki/Wikipedia:Manual_of_Style/Titles_of_works#Italics">MOS:TITLE#Italics</a>]] and [[<a href="/wiki/Wikipedia:Manual_of_Style/Titles_of_works#Quotation_marks">MOS:TITLE#Quotation marks</a>]]<br />
						<input type="text" name="GANReviewTool-DisplayWikicode" value="${ defaultDisplayText }" />
					</p>
				</div>
				<!-- endif -->
			</div>
			<!-- endif -->

			<p>
				<button id="GANReviewTool-Submit">Submit</button>
			</p>

			<div id="GANReviewTool-NoTopicMessage" class="GANReviewTool-ValidationError">
				You must select a topic from the combo box above.
			</div>

			<div id="GANReviewTool-NoPipesMessage" class="GANReviewTool-ValidationError">
				"Wikicode to display" should not contain a pipe "|"
			</div>
		</div>
	</div>

	<div id="GANReviewTool-ProcessingMessage">
		<p>
			Processing...
		</p>
	</div>
</div>
`;
	}

	/**
	 * CC BY-SA 4.0, bjornd, https://stackoverflow.com/a/6234804/3480193
	 */
	escapeHtml( unsafe ) {
		return unsafe
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#039;' );
	}

	getDefaultDisplayText( gaTitle ) {
		const endsWithParentheticalDisambiguator = gaTitle.match( /^.+ \(.+\)$/ );
		if ( !endsWithParentheticalDisambiguator ) {
			return gaTitle;
		}

		const suffixesThatTriggerItalics = [
			'album',
			'book',
			'comic',
			'comics',
			'film series',
			'film',
			'magazine',
			'manga',
			'novel',
			'painting',
			'poem',
			'sculpture',
			'season 1',
			'season 10',
			'season 2',
			'season 3',
			'season 4',
			'season 5',
			'season 6',
			'season 7',
			'season 8',
			'season 9',
			'series 1',
			'series 10',
			'series 2',
			'series 3',
			'series 4',
			'series 5',
			'series 6',
			'series 7',
			'series 8',
			'series 9',
			'soundtrack'
		];
		const suffixesThatTriggerDoubleQuotes = [
			'song'
		];
		const suffixesThatTriggerDoubleQuotesAndItalics = [
			'30 Rock',
			'Family Guy',
			'Fringe',
			'Glee',
			'Lost',
			'Parks and Recreation',
			'South Park',
			'Star Trek: Enterprise',
			'Star Trek: The Next Generation',
			'The Office',
			'The Simpsons',
			'The Walking Dead',
			'The X-Files'
		];

		const firstHalf = gaTitle.match( /^(.+) \((.+)\)$/ )[ 1 ];
		const secondHalf = gaTitle.match( /^(.+) \((.+)\)$/ )[ 2 ];

		for ( const suffixToCheck of suffixesThatTriggerItalics ) {
			if ( gaTitle.endsWith( suffixToCheck + ')' ) ) {
				return `''${ firstHalf }'' (${ secondHalf })`;
			}
		}

		for ( const suffixToCheck of suffixesThatTriggerDoubleQuotes ) {
			if ( gaTitle.endsWith( suffixToCheck + ')' ) ) {
				return `"${ firstHalf }" (${ secondHalf })`;
			}
		}

		for ( const suffixToCheck of suffixesThatTriggerDoubleQuotesAndItalics ) {
			if ( gaTitle.endsWith( suffixToCheck + ')' ) ) {
				return `"${ firstHalf }" (''${ secondHalf }'')`;
			}
		}

		return gaTitle;
	}

	makeTopicComboBoxOptions( wikicodeOfGASubPages ) {
		let html = '';
		for ( const key in wikicodeOfGASubPages ) {
			const topic = key.replace( /^Wikipedia:Good articles\//, '' );
			const wikicode = wikicodeOfGASubPages[ key ];
			html += this.makeTopicComboBoxOptionGroup( wikicode, topic );
		}
		return html;
	}

	makeTopicComboBoxOptionGroup( wikicode, topic ) {
		// delete some stuff that throws it off
		wikicode = wikicode.replace( /\s*\[\[File:[^\]]+\]\]\s*/gi, '' );
		wikicode = wikicode.replace( /\{\{(?!#invoke)[^}]+\}\}\s*\n/gi, '' );
		wikicode = wikicode.replace( /={2,}\s*Contents\s*={2,}\s*\n/gi, '' );
		wikicode = wikicode.replace( /<!--[^>]+>\s*\n/gi, '' );

		// search for `==Headings==\n` not followed by `{{#invoke`, and replace with a disabled <option>
		// <option value="Art and architecture" disabled>==Art and architecture==</option>
		wikicode = wikicode.replace(
			/(={2,}\s*[^=]+\s*={2,})\n(?!\{\{#invoke)/gi,
			`<option value="${ topic }" disabled>$1</option>\n`
		);

		// search for `==Headings==\n{{#invoke`, and replace with a non-disabled <option>
		// <option value="Art and architecture">==Art and architecture==</option>
		wikicode = wikicode.replace(
			/(={2,}\s*[^=]+\s*={2,})\n(?=\{\{#invoke)/gi,
			`<option value="${ topic }">$1</option>\n`
		);

		// delete any line that isn't an <option>
		wikicode = wikicode.replace( /^(?!\t{7}<option).*\n/gim, '' );

		// turn === Heading === into ===Heading=== (delete spaces)
		wikicode = wikicode.replace( /\s+=/gi, '=' );
		wikicode = wikicode.replace( /=\s+/gi, '=' );

		// add newline to the end of this group
		wikicode += '\n';

		return wikicode;
	}
}
