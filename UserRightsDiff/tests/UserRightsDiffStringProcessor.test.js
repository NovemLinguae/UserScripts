import { UserRightsDiffStringProcessor } from '../modules/UserRightsDiffStringProcessor.js';

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

const stringProcessor = new UserRightsDiffStringProcessor();

describe( 'logEntryStringToArrays( text )', () => {
	test( 'Add one', () => {
		const text = '(change visibility) 16:29, June 10, 2025 Novem Linguae talk contribs block changed group membership for Novem Linguae: granted election clerk; kept edit filter manager, interface administrator and administrator unchanged (+electionclerk. one of the election clerks for the upcoming 2025 administrator election)';
		const output = [ [], [ 'election clerk' ] ];
		expect( stringProcessor.logEntryStringToArrays( text ) ).toStrictEqual( output );
	} );

	test( 'Remove four', () => {
		const text = '(change visibility) 13:32, June 17, 2023 Maxim talk contribs block changed group membership for Novem Linguae: revoked extended confirmed user, new page reviewer, pending changes reviewer and rollbacker (Wikipedia:Requests for adminship/Novem Linguae) (thank)';
		const output = [ [ 'extended confirmed user', 'new page reviewer', 'pending changes reviewer', 'rollbacker' ], [] ];
		expect( stringProcessor.logEntryStringToArrays( text ) ).toStrictEqual( output );
	} );

	test( 'No change & temporary perms', () => {
		const text = '(change visibility) 06:58, May 13, 2019 Xaosflux talk contribs block changed group membership for ArbClerkBot: changed expiration of IP block exempt (permanent, was: until 10:21, July 14, 2019); kept extended confirmed user unchanged (+IPBE indefintie, see Wikipedia:Bots/Requests for approval/ArbClerkBot) (thank)';
		const output = [ [], [] ];
		expect( stringProcessor.logEntryStringToArrays( text ) ).toStrictEqual( output );
	} );

	test( 'Add 1, remove 6', () => {
		const text = '(change visibility) 14:06, July 31, 2025 Primefac talk contribs block changed group membership for KylieTastic: granted administrator; revoked extended confirmed user, page mover, file mover, new page reviewer, pending changes reviewer and rollbacker; kept autopatrolled unchanged (+sysop per AELECT, Special:Permalink/1303582232) (thank)';
		const output = [ [ 'extended confirmed user', 'page mover', 'file mover', 'new page reviewer', 'pending changes reviewer', 'rollbacker' ], [ 'administrator' ] ];
		expect( stringProcessor.logEntryStringToArrays( text ) ).toStrictEqual( output );
	} );

	test( 'Add 2 to a user with no previous perms', () => {
		const text = '(change visibility) 07:59, July 12, 2014 Acalamari talk contribs block changed group membership for KylieTastic: granted pending changes reviewer and rollbacker (User will make good use of these tools and can be trusted with them) (thank)';
		const output = [ [], [ 'pending changes reviewer', 'rollbacker' ] ];
		expect( stringProcessor.logEntryStringToArrays( text ) ).toStrictEqual( output );
	} );

	test( 'Automatically updated', () => {
		const text = '(change visibility) 10:52, December 11, 2021 Chemkatz talk contribs block was automatically updated from (none) to extended confirmed user';
		const output = [ [], [ 'extended confirmed user' ] ];
		expect( stringProcessor.logEntryStringToArrays( text ) ).toStrictEqual( output );
	} );

	test( 'Automatically updated & tag', () => {
		const text = '(change visibility) 10:52, December 11, 2021 Chemkatz talk contribs block was automatically updated from (none) to extended confirmed user Tag: Visual edit';
		const output = [ [], [ 'extended confirmed user' ] ];
		expect( stringProcessor.logEntryStringToArrays( text ) ).toStrictEqual( output );
	} );
} );

describe( 'permStringToArray( match )', () => {
	test( 'Null', () => {
		const match = null;
		const output = [];
		expect( stringProcessor.permStringToArray( match ) ).toStrictEqual( output );
	} );

	test( 'Four', () => {
		const match = 'extended confirmed user, new page reviewer, pending changes reviewer and rollbacker';
		const output = [ 'extended confirmed user', 'new page reviewer', 'pending changes reviewer', 'rollbacker' ];
		expect( stringProcessor.permStringToArray( match ) ).toStrictEqual( output );
	} );
} );
