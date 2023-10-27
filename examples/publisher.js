import minimist from "minimist";
import { RelayService } from "../src/index.js";
const argv = minimist( process.argv.slice( 2 ) );
import { bootstrappers } from "./bootstrappers.js";
import chalk from "chalk";
import { CreateRelayOptionsBuilder } from "../src/models/CreateRelayOptionsBuilder.js";
import { TimerUtil } from "../src/utils/TimerUtil.js";

/**
 *	@type {string}
 */
const syncTopic = 'sync-topic';

async function publisher()
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
	/**
	 *	@type {RelayService}
	 */
	const relayService = new RelayService();
	const relayNode = await relayService.createRelay( createRelayOptions );
	await relayService.subscribe( syncTopic, ( _param ) => {} );

	const pfnNetworkHealthChecker = () =>
	{
		const allPeers = relayService.getPeers();
		if ( ! Array.isArray( allPeers ) || 0 === allPeers.length )
		{
			return `no connected peer`;
		}

		const allSubscribers = relayService.getSubscribers( syncTopic );
		if ( ! Array.isArray( allSubscribers ) || 0 === allSubscribers.length )
		{
			return `no connected subscribers`;
		}

		const allTopics = relayService.getTopics();
		if ( ! Array.isArray( allTopics ) || 0 === allTopics.length )
		{
			return `no subscribed topics`;
		}

		return null;
	};
	const pfnPrintNetworkInfo = () =>
	{
		const allPeers = relayService.getPeers();
		console.log( `)))))))))) allPeers :`, allPeers );

		const allSubscribers = relayService.getSubscribers( syncTopic );
		console.log( `)))))))))) allSubscribers :`, allSubscribers );

		const allTopics = relayService.getTopics();
		console.log( `)))))))))) allTopics :`, allTopics );
	};

	await TimerUtil.waitForDelay( 1000 );
	console.log( `${ chalk.cyan( 'Waiting for network connection to be ready ...' ) } ` );

	await TimerUtil.waitUntilCondition( () =>
	{
		const networkError = pfnNetworkHealthChecker();
		if ( null !== networkError )
		{
			console.log( `${ chalk.bgYellow( 'WAITING : ' ) }`, networkError );
			return false;
		}

		return true;
	}, 1000 );
	console.log( `${ chalk.bgGreen( 'Network connection is ready :)' ) } ` );
	pfnPrintNetworkInfo();

	setInterval(async () =>
	{
		const networkError = pfnNetworkHealthChecker();
		if ( null !== networkError )
		{
			console.log( `${ chalk.bgRed( 'Network error' ) } : `, networkError );
			return false;
		}

		//	...
		pfnPrintNetworkInfo();

		const datetime = new Date().toISOString();
		const pubObject = {
			peerId : relayService.getPeerId() ? relayService.getPeerId().toString() : null,
			datetime : datetime,
			message : 'hello world!',
		};
		const publishResult = await relayService.publish( syncTopic, pubObject );
		console.log( `[${ datetime }] publish a data, publishResult: `, publishResult );

	}, 100 );
}

publisher().then();
