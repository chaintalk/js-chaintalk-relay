import { PeerIdStorageService } from "../services/storage/PeerIdStorageService.js";
import { RelayNode } from "../services/RelayNode.js";
import { StorageService } from "../services/storage/StorageService.js";
import { TypeUtil } from "../utils/TypeUtil.js";
import minimist from "minimist";
const argv = minimist( process.argv.slice( 2 ) );


/**
 * 	command line args:
 * 	--max	: e.g.: 10
 */
async function swarmPeersGenerator()
{
	const start = 9911;
	const max = ( TypeUtil.isNumeric( argv.max ) && argv.max > 0 ) ? argv.max : 20;
	const end = start + max;

	//	...
	let peerIdsOutputList		= [];
	let bootstrappersOutputList	= [];
	for ( let i = start; i <= end; i ++ )
	{
		const port = i;
		const peerIdObject = await RelayNode.createPeerId();
		const peerIdJson = PeerIdStorageService.basePeerIdObjectToPeerIdJson( peerIdObject );
		const peerIdJsonString = JSON.stringify( peerIdJson );

		//	...
		peerIdsOutputList.push( `\t${ port } : ${ peerIdJsonString },` );
		bootstrappersOutputList.push( `\t'/ip4/127.0.0.1/tcp/${ port }/ws/p2p/${ peerIdJson.id }',` );
	}

	//
	//	peerIds
	//
	const swarmPeersOutput = `export const _swarmPeers = {\n${ peerIdsOutputList.join( `\n` ) }\n};`;
	console.log( swarmPeersOutput );

	const filenameSwarmPeers = `${ StorageService.getRootDirectory() }/_swarmPeers.js`;
	await StorageService.saveDataToFile( filenameSwarmPeers, swarmPeersOutput );
	console.log( `` );
	console.log( `${ max } swarm peers were wrote to ${ filenameSwarmPeers }` );
	console.log( `` );

	//
	//	bootstrappers
	//
	const bootstrappersOutput = `export const _bootstrappers = [\n${ bootstrappersOutputList.join( `\n` ) }\n];`;
	console.log( bootstrappersOutput );

	const filenameBootstrappers = `${ StorageService.getRootDirectory() }/_bootstrappers.js`;
	await StorageService.saveDataToFile( filenameBootstrappers, bootstrappersOutput );
	console.log( `` );
	console.log( `${ max } bootstrappers were wrote to ${ filenameBootstrappers }` );
	console.log( `` );
}

swarmPeersGenerator().then();
