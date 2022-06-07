// Pure functions

export function isGASubPage(title) {
	return Boolean(title.match(/\/GA\d{1,2}$/));
}

export function getGATitle(title) {
	title = title.replace('Talk:', '');
	//title = title.replace('User:', '');
	title = title.replace('_', ' ');
	title = title.match(/^[^\/]*/)[0];
	return title;
}

export function getGATalkTitle(gaTitle) {
	if ( gaTitle.includes(':') ) {
		return gaTitle.replace(/^([^:]*)(:.*)$/gm, '$1 talk$2');
	} else {
		return 'Talk:' + gaTitle;
	}
}

// https://stackoverflow.com/a/6234804/3480193
// CC BY-SA 4.0
export function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }