// <nowiki>
// Requested by Pharos for metawiki
// Generates some Special:CentralNoticeBanner geolocation code that otherwise has to be copy/pasted and then manually adjusted

class CentralNoticeHelper {
	constructor( mw, $ ) {
		this.mw = mw;
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $;
	}

	async execute() {
		this.mw.util.addPortletLink( 'p-cactions', '#', 'CentralNotice Helper', 'central-notice-code-helper' );

		this.$( '#central-notice-code-helper' ).on( 'click', () => {
			this.loadForm();
		} );
	}

	loadForm() {
		const states = [ 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY' ];
		const provinces = [ 'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT' ];
		const statesAndProvinces = states.concat( provinces ).sort();
		const statesHtml = statesAndProvinces.map( ( state ) => `<option value="${ state }">${ state }</option>` ).join( '' );

		this.$( '#firstHeading' ).html( 'CentralNotice Helper' );
		this.$( '#bodyContent' ).html( `
		
			State:
			<select>
				${ statesHtml }
			</select>
			<br />

			<select name="where">
				<option value="north-of">north-of</option>
				<option value="south-of">south-of</option>
				<option value="east-of">east-of</option>
				<option value="west-of">west-of</option>
			</select>
			<input type="text" name="latitude-or-longitude" placeholder="36.5" /><br />

			<input type="button" value="Generate code" id="generate-code-button">

			<div id="central-notice-helper-result"></div>

		` );

		this.$( '#generate-code-button' ).on( 'click', () => {
			if ( this.$( '[name="latitude-or-longitude"]' ).val() === '' ) {
				this.$( '#central-notice-helper-result' ).html( 'Please enter a latitude or longitude.' );
				return;
			} else {
				this.loadResult();
			}
		} );
	}

	loadResult() {
		const state = this.$( '#bodyContent select' ).val();
		const type = [ 'north-of', 'south-of' ].includes( this.$( '[name="where"]' ).val() ) ? 'lat' : 'lon';
		const decimal = this.$( '[name="latitude-or-longitude"]' ).val();

		const html = `<div class="cnotice georegion georegion-${ state }-subregion" id="${ state }-subregion" dir="ltr">`;
		const javaScript =
`<script type="text/javascript">
(function(){
  var region = mw.centralNotice.data.region;
  if( region == '${ state }' && Geo.${ type } <= ${ decimal } ) {
    region = '${ state }-subregion';
  }
  var div = $( 'div.georegion.georegion-' + region )
  if( div.length ) {
    div.addClass('georegionselected');
    $( 'div#${ state }-subregion' ).show();
  } else {
      mw.centralNotice.bannerData.hideResult = true;
      mw.centralNotice.bannerData.hideReason = 'outofscope';
  }
})()
</script>`;

		this.$( '#central-notice-helper-result' ).html( `
		
			<br /><br />

			HTML:<br />
			<textarea>${ html }</textarea>

			JavaScript:<br />
			<textarea style="height:20em;">${ javaScript }</textarea>

		` );
	}
}

$( async () => {
	await mw.loader.using( [ 'mediawiki.util' ], async () => {
		await ( new CentralNoticeHelper( mw, $ ) ).execute();
	} );
} );

// </nowiki>
