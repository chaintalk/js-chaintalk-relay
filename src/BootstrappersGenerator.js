import minimist from "minimist";
import { _peerIds } from "../_peerIds.js";

const argv = minimist( process.argv.slice( 2 ) );


async function bootstrappersGenerator()
{
	const ipAddress = argv.ip || '127.0.0.1';

	console.log( `export const _bootstrappers = [` );
	for ( const port in _peerIds )
	{
		const value = _peerIds[ port ];
		console.log( `\t'/ip4/${ ipAddress }/tcp/${ port }/ws/p2p/${ value.id }',` );
	}
	console.log( `];` );
}

bootstrappersGenerator().then();
