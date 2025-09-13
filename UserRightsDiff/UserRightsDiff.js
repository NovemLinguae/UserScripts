// <nowiki>

/*

A typical user rights log entry might look like this:

	11:29, August 24, 2021 ExampleUser1 talk contribs changed group membership for ExampleUser2 from edit filter helper, autopatrolled, extended confirmed user, page mover, new page reviewer, pending changes reviewer, rollbacker and template editor to autopatrolled, extended confirmed user, pending changes reviewer and rollbacker (inactive 1+ years. should you return and require access again please see WP:PERM) (thank)

What the heck perms were removed? Hard to tell right? This user script adds a "DIFF" of the perms that were added or removed, on its own line, and highlights it green for added, yellow for removed.

	[ADDED template editor] [REMOVED edit filter helper, patroller]

This script works in Special:UserRights, in watchlists, and when clicking "rights" in the user script User:BradV/Scripts/SuperLinks.js

*/

$( () => {
	( new UserRightsDiffHtmlProcessor( $ ) ).execute();
} );

// </nowiki>
