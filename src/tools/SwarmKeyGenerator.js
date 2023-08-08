import { SwarmKeyStorageService } from '../services/storage/SwarmKeyStorageService.js';


async function swarmKeyFunc()
{
// Create a Uint8Array and write the swarm key to it
//const swarmKey = new Uint8Array(95)
	const swarmKey = await SwarmKeyStorageService.generateSwarmKey();

	//
	//	read the result
	//
	setTimeout( async () =>
	{
		const swarmKeyString = SwarmKeyStorageService.swarmKeyToString( swarmKey );
		console.log( `swarmKey in file ${ SwarmKeyStorageService.getSwarmKeyFilename() }:` )
		console.log( `------------------------------------------------------------` )
		console.log( swarmKeyString );
		console.log( `------------------------------------------------------------` )

	}, 100 );
}


swarmKeyFunc().then( r => {} );
