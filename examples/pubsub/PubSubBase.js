import { RelayService } from "../../src/index.js";
import { CreateRelayOptionsBuilder } from "../../src/models/CreateRelayOptionsBuilder.js";
import { bootstrappers } from "../bootstrappers.js";
import minimist from "minimist";
import { TimerUtil } from "../../src/utils/TimerUtil.js";
import chalk from "chalk";
import _ from "lodash";

const argv = minimist( process.argv.slice( 2 ) );

/**
 * 	@class
 */
export class PubSubBase
{
	/**
	 *	@type {string}
	 */
	subTopic = 'sync-topic';

	/**
	 *	@type {RelayService}
	 */
	relayService = new RelayService();

	/**
	 *	@type {Libp2p}
	 */
	relayNode = null;


	async start( callback )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
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
				this.relayNode = await this.relayService.createRelay( createRelayOptions );
				await this.relayService.subscribe( this.subTopic, ( param ) =>
				{
					if ( _.isFunction( callback ) )
					{
						callback( param );
					}
				} );

				//	...
				await TimerUtil.waitForDelay( 1000 );
				console.log( `${ chalk.cyan( 'Waiting for network connection to be ready ...' ) } ` );

				await TimerUtil.waitUntilCondition( () =>
				{
					const networkError = this.checkerHealth();
					if ( null !== networkError )
					{
						console.log( `${ chalk.bgYellow( 'WAITING : ' ) }`, networkError );
						return false;
					}

					return true;
				}, 1000 );
				console.log( `${ chalk.bgGreen( 'Network connection is ready :)' ) } ` );
				this.printNetworkInfo();

				//	...
				resolve();
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	checkerHealth()
	{
		const allPeers = this.relayService.getPeers();
		if ( ! Array.isArray( allPeers ) || 0 === allPeers.length )
		{
			return `no connected peer`;
		}

		const allSubscribers = this.relayService.getSubscribers( this.subTopic );
		if ( ! Array.isArray( allSubscribers ) || 0 === allSubscribers.length )
		{
			return `no connected subscribers`;
		}

		const allTopics = this.relayService.getTopics();
		if ( ! Array.isArray( allTopics ) || 0 === allTopics.length )
		{
			return `no subscribed topics`;
		}

		return null;
	}

	printNetworkInfo()
	{
		const allPeers = this.relayService.getPeers();
		console.log( `)))))))))) allPeers :`, allPeers );

		const allSubscribers = this.relayService.getSubscribers( this.subTopic );
		console.log( `)))))))))) allSubscribers :`, allSubscribers );

		const allTopics = this.relayService.getTopics();
		console.log( `)))))))))) allTopics :`, allTopics );
	}
}
