// <nowiki>

// Requested by Mathglot at https://en.wikipedia.org/wiki/Wikipedia_talk:User_scripts#WAG_estimate_needed_for_attribution_edit_summary_fill-in_script and https://en.wikipedia.org/wiki/Template_talk:Uw-translation#Link_to_content_translation_tool_for_xc_editors?

// See also User:Novem Linguae/Scripts/CWWEditSummary.js
// See also User:Chlod/Scripts/Deputy/AttributionNoticeTemplateEditor

class CopiedOrTranslated {
	constructor( $, OO ) {
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $;
		this.OO = OO;
	}

	execute() {
		this.makeUntickedCheckbox();
	}

	makeUntickedCheckbox() {
		// HTML
		const checkbox = new this.OO.ui.CheckboxInputWidget( {
			value: '1'
		} );
		const label = new this.OO.ui.LabelWidget( {
			label: this.$( '<span>This content is <a href="https://en.wikipedia.org/wiki/Wikipedia:Copying_within_Wikipedia">copied or translated</a>.</span>' )
		} );
		const field = new this.OO.ui.FieldLayout( checkbox, {
			id: 'copied-or-translated-unticked',
			label: label.$element,
			align: 'inline'
		} );

		// listeners
		checkbox.onChange = ( ticked ) => {
			if ( ticked ) {
				this.makeTickedCheckbox();
				this.$( '#copied-or-translated-unticked' ).remove();
			}
		};

		// glue it all together
		checkbox.connect( checkbox, { change: 'onChange' } );
		this.$( '#mw-editpage-minoredit' ).after( field.$element );
	}

	makeTickedCheckbox() {
		// HTML
		const checkbox = new this.OO.ui.CheckboxInputWidget( {
			value: '1',
			selected: true
		} );
		const optionCopied = new this.OO.ui.RadioOptionWidget( {
			value: 'copied',
			label: this.$( '<span><a href="https://en.wikipedia.org/wiki/Wikipedia:Copying_within_Wikipedia">copied</a>' )
		} );
		const optionTranslated = new this.OO.ui.RadioOptionWidget( {
			value: 'translated',
			label: this.$( '<span><a href="https://en.wikipedia.org/w/index.php?title=Wikipedia:TFOLWP">translated</a>' )
		} );
		const $label = this.$( 'This content is ' )
			.append( optionCopied.$element )
			.append( ' or ' )
			.append( optionTranslated.$element )
			.append( '.' );
		const field = new this.OO.ui.FieldLayout( checkbox, {
			id: 'copied-or-translated-ticked',
			label: $label,
			align: 'inline'
		} );

		// listeners
		checkbox.onChange = ( ticked ) => {
			if ( !ticked ) {
				this.makeUntickedCheckbox();
				this.$( '#copied-or-translated-ticked' ).remove();
			}
		};

		// glue it all together
		checkbox.connect( checkbox, { change: 'onChange' } );
		this.$( '#mw-editpage-minoredit' ).after( field.$element );
	}
}

$( () => {
	mw.loader.using( [ 'oojs-ui-core', 'oojs-ui-widgets', 'oojs-ui.styles.icons-editing-core' ], () => {
		( new CopiedOrTranslated( $, OO ) ).execute();
	} );
} );

// </nowiki>
