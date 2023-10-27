import { LogUtil, TypeUtil } from 'chaintalk-utils';
import { P2pService } from "./P2pService.js";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { PeerUtil } from "../utils/PeerUtil.js";
import { PrepareUtil } from "../utils/PrepareUtil.js";
import { enable, logger } from "@libp2p/logger";
import _ from 'lodash';
import { CreateP2pOptionsBuilder } from "../models/CreateP2pOptionsBuilder.js";

const log = logger( 'chaintalk:RelayService' )
enable( 'chaintalk:RelayService' );


/**
 *	class SwarmRelay
 */
export class RelayService
{
	/**
	 * @typedef {import('@libp2p/interface').Libp2p} Libp2p
	 *
	 * @typedef {import('@libp2p/interface/peer-id').PeerId} PeerId
	 * @typedef {import('@libp2p/interface/peer-id').RSAPeerId} RSAPeerId
	 * @typedef {import('@libp2p/interface/peer-id').Ed25519PeerId} Ed25519PeerId
	 * @typedef {import('@libp2p/interface/peer-id').Secp256k1PeerId} Secp256k1PeerId
	 */


	/**
	 *	@type {P2pService}
	 */
	p2pService = null;

	/**
	 *	@type {Libp2p|null}
	 */
	p2pNode = null;

	/**
	 *	@type {any}
	 */
	subscribes = {};



	constructor()
	{
		if ( this.p2pNode || this.p2pService )
		{
			throw new Error( `SwarmRelay already created` );
		}

		//	...
		this.p2pService = new P2pService();
	}



	/**
	 * 	@typedef {import('@libp2p/interface-pubsub/src')} PublishResult
	 */
	/**
	 * 	@public
	 * 	@param options {CreateRelayOptions}
	 *	@returns {Promise<Libp2p>}
	 */
	async createRelay( options )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( options.port < 1024 || options.port > 65535 )
				{
					return reject( `invalid port` );
				}

				//	...
				const peerIdObject = await PrepareUtil.preparePeerId( options.peerIdFilename );
				if ( null === peerIdObject )
				{
					return reject( `failed to create/load peerId. Create a new peerId using [chaintalk-utils]` );
				}

				//	...
				const swarmKey = await PrepareUtil.prepareSwarmKey( options.swarmKeyFilename );
				if ( null === swarmKey )
				{
					return reject( `invalid swarm key. Create a new swarm key using [chaintalk-utils]` );
				}

				//	multiaddrs
				const listenAddresses	= PeerUtil.getListenAddresses( options.port );
				LogUtil.say( `listenAddresses: ${ listenAddresses.map( ( a ) => a ) }` )
				if ( Array.isArray( options.announceAddresses ) && options.announceAddresses.length > 0 )
				{
					LogUtil.say( `announceAddresses: ${ options.announceAddresses.map( ( a ) => a ) }` );
				}

				//	Create Relay
				const createP2pOptions = CreateP2pOptionsBuilder.builder()
					.setPeerId( peerIdObject )
					.setSwarmKey( swarmKey )
					.setListenAddresses( listenAddresses )
					.setAnnounceAddresses( options.announceAddresses )
					.setBootstrapperAddresses( options.bootstrapperAddresses )
					.setCallbackMessage( ( param ) =>
					{
						this.onReceivedMessage( param );
					} )
					.build();
				this.p2pNode = await this.p2pService.createP2pNode( createP2pOptions );
				await this.p2pNode.start();

				//	...
				LogUtil.say( 'Relay Server listening on:' );
				const multiaddrs = this.p2pNode.getMultiaddrs();
				multiaddrs.forEach( ( ma ) => {
					LogUtil.say( `${ ma.toString() }` );
				} );

				//	setup stop
				process.on( 'SIGTERM', this.stop );
				process.on( 'SIGINT', this.stop );

				//	...
				resolve( this.p2pNode );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@return {Promise<void>}
	 */
	async stop()
	{
		LogUtil.say( 'Stopping...' )
		if ( this.p2pNode )
		{
			await this.p2pNode.stop()
		}

		//metricsServer && await metricsServer.close()
		process.exit( 0 );
	}


	/**
	 *	@param param	{CallbackMessageParams}
	 */
	onReceivedMessage( param )
	{
		try
		{
			if ( ! param )
			{
				log( 'onReceivedMessage null param' );
				return;
			}
			if ( ! ( param.topic in this.subscribes ) )
			{
				log( 'onReceivedMessage topic(%s) has no subscribers', param.topic );
				return;
			}
			if ( ! _.isFunction( this.subscribes[ param.topic ] ) )
			{
				log( 'onReceivedMessage handler for topic(%s) is invalid', param.topic );
				return;
			}

			// console.log( `>>>>>>>>>>>>>>>>>>>> Received a message: >>>>>>>>>>>>>>>>>>>>` );
			// console.log( `- type :`, param.type );
			// console.log( `- topic :`, param.topic );
			// console.log( `- msgId :`, param.msgId );
			// console.log( `- from :`, param.from ? param.from.toString() : null );
			// console.log( `- sequenceNumber :`, param.sequenceNumber );
			// console.log( `- body :`, param.body );

			//	callback
			this.subscribes[ param.topic ]( param );
		}
		catch ( err )
		{
			console.error( err );
		}
	}

	/**
	 *	@param topic	{string}
	 *	@param callback	{CallbackMessage}
	 *	@returns {Promise<PublishResult>}
	 */
	async subscribe( topic, callback )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! this.p2pNode )
				{
					return reject( `p2pNode was not created` );
				}
				if ( ! TypeUtil.isNotEmptyString( topic ) )
				{
					return reject( `invalid topic` );
				}
				if ( ! TypeUtil.isFunction( callback ) )
				{
					return reject( `invalid callback` );
				}

				//	...
				await this.p2pNode.services.pubsub.subscribe( topic );
				this.subscribes[ topic ] = callback;
				resolve( true );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param topic	{string}
	 *	@param data	{object|string}
	 *	@returns {Promise<PublishResult>}
	 */
	async publish( topic, data )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! this.p2pNode )
				{
					return reject( `p2pNode was not created` );
				}
				if ( ! TypeUtil.isNotEmptyString( topic ) )
				{
					return reject( `invalid topic` );
				}

				let pubString= '';
				let pubData= null;
				if ( TypeUtil.isObject( data ) )
				{
					pubString = JSON.stringify( data );
					pubData = uint8ArrayFromString( pubString );
				}
				else if ( TypeUtil.isString( data ) )
				{
					pubString = String( data );
					pubData = uint8ArrayFromString( pubString );
				}
				else
				{
					return reject( `invalid data` );
				}

				const publishResult = await this.p2pNode.services.pubsub.publish( topic, pubData );
				// if ( Array.isArray( publishResult ) && publishResult.length > 0 )
				// {
				// 	console.log( `|||||||| publishResult : ${ pubString }, ${ JSON.stringify( publishResult ) }`,  );
				// }
				// else
				// {
				// 	console.log( `${ chalk.bgGreen( '|||||||| publishResult' ) } : ${ pubString }, ${ JSON.stringify( publishResult ) }`,  );
				// }

				//	...
				resolve( publishResult );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 * 	@returns { PeerId | undefined }
	 */
	getPeerId()
	{
		if ( ! this.p2pNode )
		{
			throw new Error( `p2pNode was not created` );
		}
		return this.p2pNode.peerId;
	}

	/**
	 * 	@returns { PeerId[] }
	 */
	getPeers()
	{
		if ( ! this.p2pNode )
		{
			throw new Error( `p2pNode was not created` );
		}
		return this.p2pNode.services.pubsub.getPeers();
	}

	/**
	 *	@param topic	{ string }
	 *	@returns { PeerId[] }
	 */
	getSubscribers( topic )
	{
		if ( ! this.p2pNode )
		{
			throw new Error( `p2pNode was not created` );
		}
		return this.p2pNode.services.pubsub.getSubscribers( topic );
	}

	/**
	 * 	Gets a list of topics the node is subscribed to.
	 *	@returns { string[] }
	 */
	getTopics()
	{
		if ( ! this.p2pNode )
		{
			throw new Error( `p2pNode was not created` );
		}
		return this.p2pNode.services.pubsub.getTopics();
	}


}
