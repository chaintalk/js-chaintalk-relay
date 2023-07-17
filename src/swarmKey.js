import { fromString as uint8ArrayFromString, toString as uint8ArrayToString } from 'uint8arrays'
import SwarmKeyStorage from './utils/SwarmKeyStorage.js';


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
		const swarmKeyString = SwarmKeyStorage.swarmKeyToString( swarmKey );
		console.log( `swarmKey in file ${ SwarmKeyStorage.getSwarmKeyFilename() }:` )
		console.log( `------------------------------------------------------------` )
		console.log( swarmKeyString );
		console.log( `------------------------------------------------------------` )

	}, 100 );
}


swarmKeyFunc().then( r => {} );
