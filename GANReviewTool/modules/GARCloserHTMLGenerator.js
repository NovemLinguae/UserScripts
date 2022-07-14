export class GARCloserHTMLGenerator {
	getHTML() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		return `

<style>
	#GARCloserTool {
		border: 1px solid black;
		padding: 1em;
	}

	#GARCloserTool h2 {
		margin-top: 0;
	}

	#GARCloserTool strong {
		text-decoration: underline;
	}

	#GARCloserTool p {
		margin-top: 1.5em;
		margin-bottom: 1.5em;
		line-height: 1.5em;
	}

	#GARCloserTool-Status {
		display: none;
	}

	.GARCloserTool-ErrorNotice {
		color: red;
		font-weight: bold;
	}

	#GARCloserTool textarea {
		height: auto;
	}
</style>

<div id="GARCloserTool">
	<div id="GARCloserTool-Form">
		<h2>
			GAR Closer Tool
		</h2>

		<p>
			<strong>Closing message</strong><br />
			If you leave this blank, it will default to "Keep" or "Delist"
			<textarea id="GARCloser-Message" rows="4"></textarea>
		</p>

		<p>
			<button id="GARCloser-Keep">Keep</button>
			<button id="GARCloser-Delist">Delist</button>
		</p>
	</div>

	<div id="GARCloserTool-Status">
		<p>
			Processing...
		</p>
	</div>
</div>

`;
	}
}