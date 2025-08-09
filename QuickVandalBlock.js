// Copied content from https://en.wikipedia.org/wiki/User:Enterprisey/quick-vand-block.js. Please see that page's history for attribution.

//<nowiki>
$.when( mw.loader.using( [ "mediawiki.api", "mediawiki.util" ] ), $.ready ).then( function () {
    var MONTHS = mw.config.get( "wgMonthNames" ).slice( 1 ); // theirs starts with the empty string
    var api = new mw.Api();
    var IP_BLOCK_LENGTH = "31 hours";

    function deliverBlockTemplate( username, isAnon ) {
        var now = new Date();
        var sectionName = MONTHS[now.getMonth()] + " " + now.getFullYear();
        api.get( {
            prop: "revisions",
            rvprop: "content",
            rvlimit: "1",
            rvslots: "main",
            titles: "User talk:" + username,
            formatversion: "2"
        } ).then( function ( data ) {
            var existingText;
            if( data.query.pages[0].missing ) {
                existingText = "";
            } else {
                existingText = data.query.pages[0].revisions[0].slots.main.content;
            }
            var shouldAddSectionHeader = !( new RegExp( /==\s*/.source +
                sectionName.replace( " ", "\\s*" ) + /\s*==/.source ).test( existingText ) );

            var textToAdd = "\n\n" +
                ( shouldAddSectionHeader
                    ? "== " + sectionName + " ==\n\n"
                    : ""
                ) +
                "{{subst:uw-vblock|" +
                ( isAnon
                    ? "anon=yes|time=" + IP_BLOCK_LENGTH + "|"
                    : "indef=yes|"
                ) +
                "sig=yes" +
                ( ( mw.config.get( "wgNamespaceNumber" ) >= 0 )
                    ? "|page=" + mw.config.get( "wgPageName" )
                    : ""
                ) + "}}";

            return api.postWithToken( "csrf", {
                action: "edit",
                title: "User talk:" + username,
                appendtext: textToAdd,
                summary: "You have been blocked from editing for persistent vandalism."
            } );
        } ).then( function () {
            mw.notify( "Notification sent." );
        } );
    }

    function go( obj ) {
        obj.find( "span.mw-usertoollinks" ).each( function( idx, element ) {
            var isAnon = this.previousElementSibling.className.indexOf( "mw-anonuserlink" ) >= 0;
            $( element ).contents().last().before( " | ",
                $( "<a>" ).attr( "href", "#" )
                    .text( isAnon ? "31h" : "indef" )
                    .click( function () {
                        var username = $( this ).parent().get( 0 ).previousElementSibling.textContent;
                        if( confirm( "Block " + username ) ) {
                            
                            new mw.Api().postWithToken( "csrf", {
                                action: "block",
                                user: username,
                                expiry: isAnon ? "31 hours" : "never",
                                reason: "[[Wikipedia:Vandalism|Vandalism]]",
                                nocreate: "true",
                                autoblock: "true",
                                watchuser: "true",
                                allowusertalk: "true"
                            } ).then( function () {
                                mw.notify( "Blocked " + username + "; sending notification..." );
                                deliverBlockTemplate( username, isAnon );
                            } );
                            return false;
                        }
                    } ) );
        } ) // end .each
    } // end function go()

    mw.hook( "wikipage.content" ).add( function ( obj ) { go( obj ); } );
} ); // end $.when handler
//</nowiki>
