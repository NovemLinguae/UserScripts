// Changes diff colors from yellow for removal and purple for addition, back to yellow for removal and blue for addition.
// Fixes diff "black dot" bug when interacting with some user scripts.
// Changes DiscussionTools published comment color from teal to light blue.

// Forked from code by https://en.wikipedia.org/wiki/User:Hgzh, CC BY-SA 4.0, https://en.wikipedia.org/wiki/Wikipedia:Village_pump_(technical)/Archive_213#Heads-up%3A_Diff_colour

mw.util.addCSS( `

.diff-deletedline {
  border-color: #FFE49C;
}
.diff-addedline {
  border-color: #A3D3FF;
}
.diff-deletedline .diffchange,
.mw-diff-inline-deleted del, .mw-diff-inline-changed del, .mw-diff-inline-moved del {
  background: #FEEEC8;
}
.diff-addedline .diffchange,
.mw-diff-inline-added ins, .mw-diff-inline-changed ins, .mw-diff-inline-moved ins {
  background: #D8ECFF;
}

/* fix black dot bug */
a.mw-diff-movedpara-left,
a.mw-diff-movedpara-right {
	 color: transparent;
}

.ext-discussiontools-init-targetcomment {
	background-color: #eaf3ff;
}
.ext-discussiontools-init-publishedcomment {
	background-color: #eaf3ff; /* not #d5fdf4 */
}

` );
