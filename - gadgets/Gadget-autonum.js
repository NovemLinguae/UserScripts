/**
 * Auto-number headings
 *
 * @source https://www.mediawiki.org/wiki/Snippets/Auto-number_headings
 * @author Krinkle
 * @version 2021-10-03
 */
var toc = document.querySelector('#toc');
if (toc) {
  document.querySelectorAll('.mw-parser-output :is(h1,h2,h3,h4,h5,h6) .mw-headline').forEach(function (headline) {
    var num = toc.querySelector('a[href="#' + CSS.escape(headline.id) + '"] .tocnumber');
    if (num) headline.prepend(num.textContent + ' ');
  });
} else {
  document.body.classList.add('tpl-autonum');
}
