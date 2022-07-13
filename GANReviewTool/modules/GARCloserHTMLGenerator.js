export class GARCloserHTMLGenerator {
	getHTML() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		return `

<button id="GARCloser-Keep">Keep</button>
<button id="GARCloser-Delist">Delist</button>
<span id="GARCloser-Status"></span>

`;
	}
}