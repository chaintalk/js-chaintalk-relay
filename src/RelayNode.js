import { LogUtil, TypeUtil } from 'chaintalk-utils';
import { PeerIdService, PeerIdStorageService, SwarmKeyService, SwarmKeyStorageService } from 'chaintalk-lib';
import { RelayNodeService } from "./services/RelayNodeService.js";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";


/**
 *	class Relay
 */
export class RelayNode
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
	 *	@type {RelayNodeService}
	 */
	relayNodeService;

	/**
	 *	@type {Libp2p|null}
	 */
	relay = null;


	constructor()
	{
		this.relayNodeService = new RelayNodeService();
	}



	/**
	 * 	@typedef {import('@libp2p/interface-pubsub/src')} PublishResult
	 */

	/**
	 * 	@typedef CallbackMessageReceiverOptions {Object}
	 * 	@property allPeers {PeerId[]}
	 * 	@property msgId {Uint8Array[]}
	 * 	@property data {any}
	 *
	 * 	@callback CallbackMessageReceiver
	 *	@param callbackOptions {CallbackMessageReceiverOptions}
	 *	@returns {Boolean}
	 *
	 *	@typedef CreateNodeOptions {Object}
	 *	@property peerIdFilename {string}
	 *	@property swarmKeyFilename {string}
	 *	@property port {number}
	 *	@property announceAddresses {string[]}
	 *	@property pubsubDiscoveryEnabled {boolean}
	 *	@property subscribedTopics {string[]}
	 *	@property callbackMessageReceiver {CallbackMessageReceiver}
	 */

	/**
	 * 	@param options {CreateNodeOptions}
	 *	@returns {Promise<{topic: string, node: *, publish: ( data: object|string ) => Promise<PublishResult>}>}
	 */
	async createNode(
		{
			peerIdFilename = '',
			swarmKeyFilename = '',
			port = 9911,
			announceAddresses = [],
			bootstrapperAddresses = [],
			pubsubDiscoveryEnabled = true,
			subscribedTopics = [],
			callbackMessageReceiver = ( { allPeers = [], msgId = null, data = null } ) => false
		}
	)
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( port < 1024 || port > 65535 )
				{
					return reject( `invalid port` );
				}

				//	...
				const peerIdObject = await this.preparePeerId( peerIdFilename );
				if ( null === peerIdObject )
				{
					return reject( `failed to create/load peerId. Create a new peerId using [chaintalk-utils]` );
				}

				//	...
				const swarmKey = await this.prepareSwarmKey( swarmKeyFilename );
				if ( null === swarmKey )
				{
					return reject( `invalid swarm key. Create a new swarm key using [chaintalk-utils]` );
				}

				//	...
				//	multiaddrs
				const listenAddresses	= this.getListenAddresses( port );
				LogUtil.say( `listenAddresses: ${ listenAddresses.map( ( a ) => a ) }` )
				if ( Array.isArray( announceAddresses ) && announceAddresses.length > 0 )
				{
					LogUtil.say( `announceAddresses: ${ announceAddresses.map( ( a ) => a ) }` );
				}

				//	Create Relay
				this.relay = await this.relayNodeService.create( {
					peerId : peerIdObject,
					swarmKey : swarmKey,
					listenAddresses : listenAddresses,
					announceAddresses : announceAddresses,
					bootstrapperAddresses : bootstrapperAddresses,
					pubsubDiscoveryEnabled : Boolean( pubsubDiscoveryEnabled ),
					callbackMessageReceiver : callbackMessageReceiver,
				} );
				await this.relay.start();

				//	...
				LogUtil.say( 'Bootstrap Relay Server listening on:' );
				const multiaddrs = this.relay.getMultiaddrs();
				multiaddrs.forEach( ( ma ) => {
					LogUtil.say( `${ ma.toString() }` );
				} );

				const stop = async () =>
				{
					LogUtil.say( 'Stopping...' )
					if ( this.relay )
					{
						await this.relay.stop()
					}

					//metricsServer && await metricsServer.close()

					process.exit( 0 )
				}

				process.on( 'SIGTERM', stop );
				process.on( 'SIGINT', stop );

				//	...
				resolve({
					topic : this.relayNodeService.syncTopic,
					node : this.relay,
					publish : ( data ) => this.publishData( data ),
				});
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	/**
	 *	@param data	{object|string}
	 *	@returns {Promise<PublishResult>}
	 */
	async publishData( data )
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
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

				const publishResult = await this.relay.services.pubsub.publish( this.relayNodeService.syncTopic, pubData );
				console.log( `publishResult : ${ pubString }, ${ JSON.stringify( publishResult ) }`,  );

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
	 * 	@param peerIdFilename	{string|null} The full path of the file that saves the peerId
	 *	@returns {Promise<PeerId|null>}
	 */
	async preparePeerId( peerIdFilename = null )
	{
		const peerIdStorageService = new PeerIdStorageService();
		const filename = peerIdStorageService.getSafeFilename( peerIdFilename );
		let peerIdObject = null;
		try
		{
			peerIdObject = await PeerIdService.loadPeerId( filename );
		}
		catch ( err )
		{
			console.log( err )
			LogUtil.say( `failed to load peerId` );
		}

		if ( null === peerIdObject )
		{
			peerIdObject = await PeerIdService.flushPeerId( filename );
			LogUtil.say( `created a new peerId` );
		}

		const storagePeerId = peerIdStorageService.storagePeerIdFromRaw( peerIdObject );
		LogUtil.say( `peerId: ${ storagePeerId.id }, from: ${ filename }` );
		return peerIdObject;
	}

	/**
	 * 	@param	swarmKeyFilename	{string|null}	The full path of the file that saves the swarmKey
	 *	@returns {Promise<Uint8Array|null>}
	 */
	async prepareSwarmKey( swarmKeyFilename = null )
	{
		const swarmKeyStorageService = new SwarmKeyStorageService();
		const filename = swarmKeyStorageService.getSafeFilename( swarmKeyFilename );
		let swarmKey	= null;
		let swarmKeyObject	= null;

		try
		{
			swarmKey = await SwarmKeyService.loadSwarmKey( filename );
			swarmKeyObject = swarmKeyStorageService.swarmKeyToObject( swarmKey );
			LogUtil.say( `swarm key: ${ swarmKeyObject.key }, from: ${ filename }` );
		}
		catch ( err )
		{
			console.log( err )
			LogUtil.say( `failed to load swarmKey` );
		}

		if ( ! swarmKeyStorageService.isValidSwarmKeyObject( swarmKeyObject ) )
		{
			return null;
		}

		return swarmKey;
	}

	/**
	 *	@param port	{number} port number
	 *	@returns {string[]}
	 */
	getListenAddresses( port )
	{
		port = port || 9911;
		//let listenAddresses = [ '/ip4/127.0.0.1/tcp/10010/ws', '/ip4/127.0.0.1/tcp/10000' ]
		// let listenAddresses = [ '/ip4/0.0.0.0/tcp/10000/ws' ]
		// const argvAddr = argv.listenMultiaddrs || argv.lm
		//
		// if ( argvAddr )
		// {
		// 	listenAddresses = [ argvAddr ]
		//
		// 	const extraParams = this.getExtraParams( '--listenMultiaddrs', '--lm' )
		// 	extraParams.forEach( ( p ) => listenAddresses.push( p ) )
		// }
		// else if ( process.env.LISTEN_MULTIADDRS )
		// {
		// 	listenAddresses = process.env.LISTEN_MULTIADDRS.split( ',' )
		// }
		return [ `/ip4/0.0.0.0/tcp/${ port }/ws` ];
	}
}
