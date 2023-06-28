// <nowiki>

// There are various hidden messages onwiki that can be targeted to extended confirmed users, admins, checkusers, template editors, etc. This user script 1) shows these messages and 2) highlights them yellow so you can recognize them.

mw.util.addCSS(`

div.sysop-show,
div.checkuser-show,
div.sysop-show,
div.abusefilter-show,
div.abusefilter-helper-show,
div.patroller-show,
div.templateeditor-show,
div.extendedmover-show {
  display: block !important;
  background: yellow;
}
p.sysop-show,
p.checkuser-show,
p.sysop-show,
p.abusefilter-show,
p.abusefilter-helper-show,
p.patroller-show,
p.templateeditor-show,
p.extendedmover-show {
  display: block !important;
  background: yellow;
}
span.sysop-show,
span.checkuser-show,
span.sysop-show,
span.abusefilter-show,
span.abusefilter-helper-show,
span.patroller-show,
span.templateeditor-show,
span.extendedmover-show {
  display: inline !important;
  background: yellow;
}
small.sysop-show,
small.checkuser-show,
small.sysop-show,
small.abusefilter-show,
small.abusefilter-helper-show,
small.patroller-show,
small.templateeditor-show,
small.extendedmover-show {
  display: inline !important;
  background: yellow;
}
table.sysop-show,
table.checkuser-show,
table.sysop-show,
table.abusefilter-show,
table.abusefilter-helper-show,
table.patroller-show,
table.templateeditor-show,
table.extendedmover-show {
  display: table !important;
  background: yellow;
}
li.sysop-show,
li.checkuser-show,
li.sysop-show,
li.abusefilter-show,
li.abusefilter-helper-show,
li.patroller-show,
li.templateeditor-show,
li.extendedmover-show {
  display: list-item !important;
  background: yellow;
}

`);

// </nowiki>