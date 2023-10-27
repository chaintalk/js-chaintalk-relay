import minimist from "minimist";
import { RelayService } from "../src/index.js";
import { bootstrappers } from "./bootstrappers.js";
import chalk from "chalk";
import { CreateRelayOptionsBuilder } from "../src/models/CreateRelayOptionsBuilder.js";

const argv = minimist( process.argv.slice( 2 ) );

/**
 *	@type {string}
 */
const syncTopic = 'sync-topic';

/**
 *	@type {RelayService}
 */
const relayService = new RelayService();
let relayNode = null;


async function subscriber()
{
	const port = argv.port || process.env.PORT || undefined;
	const peerIdFilename = argv.peerId || process.env.PEER_ID || undefined;
	const swarmKeyFilename = argv.swarmKey || process.env.SWARM_KEY || undefined;
	const createRelayOptions = CreateRelayOptionsBuilder.builder()
		.setPeerIdFilename( peerIdFilename )
		.setSwarmKeyFilename( swarmKeyFilename )
		.setPort( port )
		.setAnnounceAddresses( [] )
		.setBootstrapperAddresses( bootstrappers )
		.build();
	relayNode = await relayService.createRelay( createRelayOptions );
	await relayService.subscribe( syncTopic, ( param ) =>
	{
		console.log( `received a new message >>>>>>>>>>>>>>>>>>>>>>>>>>>>>> :` );
		console.log( `- type :`, param.type );
		console.log( `- topic :`, param.topic );
		console.log( `- msgId :`, param.msgId );
		console.log( `- from :`, param.from ? param.from.toString() : null );
		console.log( `- sequenceNumber :`, param.sequenceNumber );
		console.log( `- body :`, param.body );
	} );

	// setInterval(async () =>
	// {
	// 	const allPeers = relayService.getPeers();
	// 	if ( Array.isArray( allPeers ) && allPeers.length > 0 )
	// 	{
	// 		console.log( `${ chalk.bgGreen( ')))))))))) )))))))))) allPeers' ) } : `, allPeers );
	// 	}
	// 	else
	// 	{
	// 		console.log( `${ chalk.bgRed( ')))))))))) )))))))))) allPeers' ) } : `, allPeers );
	// 	}
	//
	// 	const allSubscribers = relayService.getSubscribers( syncTopic );
	// 	if ( Array.isArray( allSubscribers ) && allSubscribers.length > 0 )
	// 	{
	// 		console.log( `${ chalk.bgGreen( ')))))))))) )))))))))) allSubscribers' ) } : `, allSubscribers );
	// 	}
	// 	else
	// 	{
	// 		console.log( `${ chalk.bgRed( ')))))))))) )))))))))) allSubscribers' ) } : `, allSubscribers );
	// 	}
	//
	// 	const allTopics = relayService.getTopics();
	// 	if ( Array.isArray( allTopics ) && allTopics.length > 0 )
	// 	{
	// 		console.log( `${ chalk.bgGreen( ')))))))))) )))))))))) allTopics' ) } : `, allTopics );
	// 	}
	// 	else
	// 	{
	// 		console.log( `${ chalk.bgRed( ')))))))))) )))))))))) allTopics' ) } : `, allTopics );
	// 	}
	//
	// 	const datetime = new Date().toISOString();
	// 	const pubObject = {
	// 		peerId : relayService.getPeerId() ? relayService.getPeerId().toString() : null,
	// 		datetime : datetime,
	// 		message : 'hello world!',
	// 	};
	// 	const publishResult = await relayService.publish( syncTopic, pubObject );
	// 	console.log( `[${ datetime }] publish a data, publishResult: `, publishResult );
	//
	// }, 100 );
}

subscriber().then();
