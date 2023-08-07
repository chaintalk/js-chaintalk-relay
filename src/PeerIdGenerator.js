import PeerIdStorage from "./utils/PeerIdStorage.js";
import RelayNode from "./providers/RelayNode.js";
import minimist from "minimist";
import TypeUtil from "./utils/TypeUtil.js";
const argv = minimist( process.argv.slice( 2 ) );

/**
 * 	command line args:
 * 	--max	: e.g.: 10
 */
async function peerIdGenerator()
{
	const start = 9911;
	const max = ( TypeUtil.isNumeric( argv.max ) && argv.max > 0 ) ? argv.max : 20;
	const end = start + max;

	//	...
	console.log( `export const peerIds = {` );
	for ( let i = start; i <= end; i ++ )
	{
		const peerIdObject = await RelayNode.createPeerId();
		const peerIdJson = PeerIdStorage.basePeerIdObjectToPeerIdJson( peerIdObject );
		const peerIdJsonString = JSON.stringify( peerIdJson );
		console.log( `\t${ i } : ${ peerIdJsonString },` );
	}
	console.log( `}` );
}

peerIdGenerator().then();
