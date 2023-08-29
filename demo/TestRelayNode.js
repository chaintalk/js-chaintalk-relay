import minimist from "minimist";
import { RelayNode } from "../src/index.js";
const argv = minimist( process.argv.slice( 2 ) );
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { bootstrappers } from "./bootstrappers.js";
import chalk from "chalk";


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
	const relay = await new RelayNode().createNode({
		peerIdFilename : peerIdFilename,
		swarmKeyFilename : swarmKeyFilename,
		port : port,
		announceAddresses : [],
		bootstrapperAddresses : bootstrappers,
		pubsubDiscoveryEnabled : true,
		subscribedTopics : [],
		callbackMessageReceiver : callbackMessageReceiver
	});
	await relay.node.services.pubsub.subscribe( relay.topic );
	setInterval(() =>
	{
		const allPeers = relay.node.services.pubsub.getPeers();
		if ( Array.isArray( allPeers ) && allPeers.length > 0 )
		{
			console.log( `${ chalk.bgGreen( ')))))))))) )))))))))) allPeers' ) } : `, allPeers );
		}
		else
		{
			console.log( `${ chalk.bgRed( ')))))))))) )))))))))) allPeers' ) } : `, allPeers );
		}

		const allSubscribers = relay.node.services.pubsub.getSubscribers( relay.topic );
		if ( Array.isArray( allSubscribers ) && allSubscribers.length > 0 )
		{
			console.log( `${ chalk.bgGreen( ')))))))))) )))))))))) allSubscribers' ) } : `, allSubscribers );
		}
		else
		{
			console.log( `${ chalk.bgRed( ')))))))))) )))))))))) allSubscribers' ) } : `, allSubscribers );
		}

		const allTopics = relay.node.services.pubsub.getTopics();
		if ( Array.isArray( allTopics ) && allTopics.length > 0 )
		{
			console.log( `${ chalk.bgGreen( ')))))))))) )))))))))) allTopics' ) } : `, allTopics );
		}
		else
		{
			console.log( `${ chalk.bgRed( ')))))))))) )))))))))) allTopics' ) } : `, allTopics );
		}

		const datetime = new Date().toISOString();
		console.log( `[${ datetime }] publish a data` );
		const pubObject = {
			peerId : relay.node.peerId.toString(),
			datetime : datetime,
			message : 'hello world!',
		};
		// //const pubString = `[${ new Date().toLocaleString() }] Bird bird bird, bird is the word!`;
		// const pubString = JSON.stringify( pubObject );
		// const pubData = uint8ArrayFromString( pubString );
		// //	async publish (topic: string, data?: Uint8Array): Promise<PublishResult>
		relay.publish( pubObject )
			.then( ( result ) => {
			})
			.catch( err => {
				console.error(err)
			});
	}, 3e3 );
}

testRelayNode().then();
