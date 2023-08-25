import minimist from "minimist";
import { RelayNode } from "./RelayNode.js";
const argv = minimist( process.argv.slice( 2 ) );
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { bootstrappers } from "./bootstrappers.js";


async function testRelayNode()
{
	const port = argv.port || process.env.PORT || undefined;
	const peerIdFilename = argv.peerId || process.env.PEER_ID || undefined;
	const swarmKeyFilename = argv.swarmKey || process.env.SWARM_KEY || undefined;

	const callbackMessageReceiver = ( { allPeers = [], msgId = null, data = null } ) =>
	{
		try
		{
			let recFrom = null;
			let recSequenceNumber = 0;
			let recBody = null;
			if ( data )
			{
				recFrom = data.from.toString();
				recSequenceNumber = data.sequenceNumber;
				recBody = JSON.parse( uint8ArrayToString( data.data ) );
			}

			console.log( `Received: >>>>>>>>>>` );
			console.log( `- allPeers :`, allPeers );
			//console.log( `- msgId :`, msgId );
			console.log( `- from :`, recFrom );
			console.log( `- sequenceNumber :`, recSequenceNumber );
			console.log( `- body :`, recBody );
		}
		catch ( err )
		{
			console.error( err );
		}
	};
	const node = await new RelayNode().createNode({
		peerIdFilename : peerIdFilename,
		swarmKeyFilename : swarmKeyFilename,
		port : port,
		announceAddresses : [],
		bootstrapperAddresses : bootstrappers,
		pubsubDiscoveryEnabled : true,
		subscribedTopics : [],
		callbackMessageReceiver : callbackMessageReceiver
	});
	setInterval(() =>
	{
		const datetime = new Date().toISOString();
		console.log( `[${ datetime }] publish a data` );
		const pubObject = {
			datetime : datetime,
			message : 'hello world!',
		};
		// //const pubString = `[${ new Date().toLocaleString() }] Bird bird bird, bird is the word!`;
		// const pubString = JSON.stringify( pubObject );
		// const pubData = uint8ArrayFromString( pubString );
		// //	async publish (topic: string, data?: Uint8Array): Promise<PublishResult>
		node.publish( pubObject )
			.then( ( result ) => {
			})
			.catch( err => {
				console.error(err)
			});
	}, 3e3 );
}

testRelayNode().then();
