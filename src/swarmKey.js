const Libp2p = require( 'libp2p' );
const path = require( "path" );
const fs = require( 'fs' );
const uint8ArrayFromString = require( 'uint8arrays/from-string' )
const uint8ArrayToString = require( 'uint8arrays/to-string' )
const Storage = require( './utils/Storage' );
const SwarmKeyStorage = require( './utils/SwarmKeyStorage' );


async function swarmKeyFunc()
{
// Create a Uint8Array and write the swarm key to it
//const swarmKey = new Uint8Array(95)
	const swarmKey = await SwarmKeyStorage.generateSwarmKey();

	//
	//	read the result
	//
	setTimeout( async () =>
	{
		const swarmKeyString = uint8ArrayToString.toString( swarmKey );
		console.log( `swarmKey in file ${ SwarmKeyStorage.getSwarmKeyFilename() }:` )
		console.log( `------------------------------------------------------------` )
		console.log( swarmKeyString );
		console.log( `------------------------------------------------------------` )

	}, 100 );
}


swarmKeyFunc().then( r => {} );
