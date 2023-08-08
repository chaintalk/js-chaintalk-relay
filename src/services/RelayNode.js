import { createLibp2p } from 'libp2p';
import { preSharedKey } from 'libp2p/pnet';
import { createRSAPeerId, createFromJSON } from '@libp2p/peer-id-factory'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { bootstrap } from '@libp2p/bootstrap'
//import { verifySignature } from '@libp2p/pubsub';
import { floodsub } from '@libp2p/floodsub'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { circuitRelayTransport, circuitRelayServer } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'

import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import { PeerIdStorageService } from './storage/PeerIdStorageService.js';
import { _bootstrappers } from "../../_bootstrappers.js";
import { _swarmPeers } from "../../_swarmPeers.js";
//import { RSAPeerId } from "@libp2p/interface-peer-id";


export class RelayNode
{
	/**
	 * @typedef {import('peer-id')} PeerId
	 */

	/**
	 * @typedef {Object} HopRelayOptions
	 * @property {PeerId} [peerId]
	 * @property {string[]} [listenAddresses = []]
	 * @property {string[]} [announceAddresses = []]
	 * @property {boolean} [pubsubDiscoveryEnabled = true]
	 * @property {string[]} [pubsubDiscoveryTopics = ['_peer-discovery._p2p._pubsub']] uses discovery default
	 */

	/**
	 * Create a Libp2p Relay with HOP service
	 *
	 * @param {HopRelayOptions} options
	 * @returns {Promise<Libp2p>}
	 */
	static async create(
		{
			peerId = undefined,
			swarmKey = undefined,
			listenAddresses = [],
			announceAddresses = [],
			pubsubDiscoveryEnabled = true,
			pubsubDiscoveryTopics = [ '_peer-discovery._p2p._pubsub' ]
		}
	)
	{
		// let options = {
		// 	peerId : peerId,
		// 	modules : {
		// 		transport : [ Websockets, TCP ],
		// 		streamMuxer : [ MPLEX ],
		// 		connEncryption : [ NOISE ],
		// 		pubsub : GossipSub,
		// 		peerDiscovery : [ pubsubPeerDiscovery({
		// 			interval: 1000
		// 		}) ]
		// 	},
		// 	addresses : {
		// 		listen : listenAddresses,
		// 		announce : announceAddresses
		// 	},
		// 	config : {
		// 		pubsub : {
		// 			enabled : pubsubDiscoveryEnabled
		// 		},
		// 		peerDiscovery : {
		// 			[ PubsubPeerDiscovery.tag ] : {
		// 				topics : pubsubDiscoveryTopics,
		// 				enabled : pubsubDiscoveryEnabled
		// 			}
		// 		},
		// 		relay : {
		// 			enabled : true, // Allows you to dial and accept relayed connections. Does not make you a relay.
		// 			hop : {
		// 				enabled : true // Allows you to be a relay for other peers
		// 			}
		// 		}
		// 	}
		// };

		//
		//   connectionGater: ConnectionGater
		//
		//   /**
		//    * libp2p transport manager configuration
		//    */
		//   transportManager: TransportManagerInit
		//
		//   /**
		//    * An optional datastore to persist peer information, DHT records, etc.
		//    *
		//    * An in-memory datastore will be used if one is not provided.
		//    */
		//   datastore: Datastore
		//
		//   /**
		//    * libp2p PeerStore configuration
		//    */
		//   peerStore: PersistentPeerStoreInit
		//
		//   /**
		//    * keychain configuration
		//    */
		//   keychain: KeyChainInit
		//
		//
		let options = {
			peerId: peerId,
			addresses : {
				listen : listenAddresses,
				//announce: ['/dns4/auto-relay.libp2p.io/tcp/443/wss/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdgQc3']
				announce : announceAddresses,
			},
			transports : [
				tcp(),
				webSockets(),
				circuitRelayTransport()
			],
			streamMuxers : [
				yamux(), mplex()
			],
			connectionEncryption : [
				noise()
			],
			peerDiscovery: [
				bootstrap({
					list: _bootstrappers
				}),
				pubsubPeerDiscovery({
					interval: 1000
				})
			],
			services : {
				relay : circuitRelayServer(),
				identify : identifyService(),
				pubsub: floodsub({
					enabled: true,

					//	handle this many incoming pubsub messages concurrently
					messageProcessingConcurrency: 32,

					//	How many parallel incoming streams to allow on the pubsub protocol per-connection
					maxInboundStreams: 32,

					//	How many parallel outgoing streams to allow on the pubsub protocol per-connection
					maxOutboundStreams: 32,

					//		const {
					// 			multicodecs = [],
					// 			globalSignaturePolicy = 'StrictSign',
					// 			canRelayMessage = false,
					// 			emitSelf = false,
					// 			messageProcessingConcurrency = 10,
					// 			maxInboundStreams = 1,
					// 			maxOutboundStreams = 1
					// 		} = props
				}),
			},
			connectionManager: {
				maxConnections: 1024,
				minConnections: 2
			}
		};
		if ( swarmKey )
		{
			options.connectionProtector = preSharedKey( {
				psk : swarmKey
			} );
		}

		const node = await createLibp2p( options );
		node.addEventListener( 'peer:connect', ( evt ) =>
		{
			try
			{
				const peerId = evt.detail;
				console.log( 'Connection established to:', peerId.toString() ) // Emitted when a peer has been found
			}
			catch ( err )
			{
				console.error( err );
			}
		} );
		node.addEventListener( 'peer:discovery', ( evt ) =>
		{
			try
			{
				const peerInfo = evt.detail;
				//console.log( `peerInfo : `, peerInfo );
				//node.dial( peerInfo.id );
				console.log( `Discovered: ${ peerInfo.id.toString() }` )

				//
				//	Notifies the router that a peer has been connected
				//		addPeer( peerId : PeerId, protocol : string ) : PeerStreams
				//
				const newPeerStreams = node.services.pubsub.addPeer( peerInfo.id, 'ws' );
			}
			catch ( err )
			{
				console.error( err );
			}
		} );

		const allSwarmPeers = Object.values( _swarmPeers ).map( item => item.id );
		console.log( `allSwarmPeers : `, allSwarmPeers );

		//
		//	pub/sub
		//
		const topic = 'news';
		node.services.pubsub.subscribe( topic )
		node.services.pubsub.addEventListener('message', (evt) =>
		{
			try
			{
				//
				//	evt:
				//	CustomEventPolyfill {
				//   		type: 'message',
				//   		defaultPrevented: false,
				//   		cancelable: false,
				//   		timeStamp: 126177.69412505627
				// 	}
				//
				//
				//	evt.detail:
				//{
				//   type: 'signed',
				//   from: PeerId(QmV7tUHJnYD2PbDCiUo6g57SRKbeGYKuvj1Th16hFvLa3U),
				//   topic: 'news',
				//   sequenceNumber: 17497035497166456225n,
				//   data: Uint8Array(64) [
				//     123,  34, 100,  97, 116, 101, 116, 105, 109, 101,  34,
				//      58,  34,  50,  48,  50,  51,  45,  48,  56,  45,  48,
				//      56,  84,  49,  56,  58,  53,  53,  58,  51,  54,  46,
				//      48,  54,  55,  90,  34,  44,  34, 109, 101, 115, 115,
				//      97, 103, 101,  34,  58,  34, 104, 101, 108, 108, 111,
				//      32, 119, 111, 114, 108, 100,  33,  34, 125
				//   ],
				//   signature: Uint8Array(256) [
				//     104,  34, 164, 251, 106, 191, 215, 238, 244, 136, 162, 179,
				//     208,  44,  95,  22, 175, 199,  67, 174,  95, 254, 149, 158,
				//      39,  63, 175, 227, 126,  51,  87, 125, 162, 146, 107,  89,
				//     224, 154,   8,  46, 242,  48,  71, 223, 171,  77, 225,  62,
				//     144, 129, 170, 248, 243, 105, 220, 213,  44, 228, 104, 103,
				//      88, 164, 154,  30, 130, 148, 115,  42,  27, 233, 152, 144,
				//      59, 231,   4,  82,  12, 215, 190,  75,  94, 115, 232,  36,
				//      67,  73,  87,  52, 241, 146, 227,  93,  20, 185, 128, 221,
				//      88, 179, 243,  29,
				//     ... 156 more items
				//   ],
				//   key: Uint8Array(299) [
				//       8,   0,  18, 166,   2,  48, 130,   1,  34,  48,  13,   6,
				//       9,  42, 134,  72, 134, 247,  13,   1,   1,   1,   5,   0,
				//       3, 130,   1,  15,   0,  48, 130,   1,  10,   2, 130,   1,
				//       1,   0, 192, 115,  33,  36,  22,  25, 113, 212,  49, 115,
				//     255, 119,  22, 136,   5, 164, 102, 222, 109,  73,   5, 248,
				//     239, 106, 235, 210, 211,  20, 114,  62,  91, 195,   3, 158,
				//     251, 102, 242,  27, 185,  44,  68,  63,  21, 255, 247, 244,
				//     208,  52,  37, 137, 174,  28, 131,  99,  94,  88,  40,  12,
				//     210, 123, 110, 128,
				//     ... 199 more items
				//   ]
				// }

				const recType = evt.detail.type;
				const recTopic = evt.detail.topic;
				if ( 'signed' !== recType || topic !== recTopic )
				{
					//console.log( `- receivedIrrelevant topics are received and discarded voluntarily` );
					return;
				}

				//
				//	check peer exists in our swarm peer list
				//
				if ( ! allSwarmPeers.includes( evt.detail.from ) )
				{
					console.error( `invalid swarm peer : ${ evt.detail.from }` );
					return;
				}

				//	...
				const allSubscribers = node.services.pubsub.getSubscribers( topic );
				const allTopics = node.services.pubsub.getTopics();
				const allPeers = node.services.pubsub.getPeers();
				console.log( `allSubscribers : `, allSubscribers );
				console.log( `allTopics : `, allTopics );
				console.log( `allPeers : `, allPeers );

				//
				//	Validates the given message. The signature will be checked for authenticity.
				//	Throws an error on invalid messages
				//
				try
				{
					node.services.pubsub.validate( evt.detail.from, evt.detail );
				}
				catch ( errValidate )
				{
					console.error( errValidate );
					return;
				}

				//		getMsgId( msg : Message ) : Promise<Uint8Array> | Uint8Array
				const msgIdUInt8Arr = node.services.pubsub.getMsgId( evt.detail );
				if ( msgIdUInt8Arr instanceof Uint8Array )
				{
					const msgId = uint8ArrayToString( msgIdUInt8Arr );
					console.log( `msgId : ${ msgIdUInt8Arr }` );
				}

				//
				//	....
				//
				const recFrom = evt.detail.from;
				const recSequence = evt.detail.sequenceNumber;
				const recData = uint8ArrayToString( evt.detail.data );
				// let recObject	= null;
				// if ( 'string' === typeof recData )
				// {
				// 	recObject = JSON.parse( recData.trim() );
				// }
				const signature = uint8ArrayToString( evt.detail.signature );
				console.log( `received [${ recSequence }] \n- from: ${ recFrom }\n- type: ${ recType }\n- topic ${ recTopic }` );
				console.log( `- data: ${ recData }` );
				//console.log( `- signature: ${ signature }` );
				console.log( `\n` );
			}
			catch ( err )
			{
				console.error( err );
			}
		});

		// node2 publishes "news" every second
		setInterval(() =>
		{
			const datetime = new Date().toISOString();
			console.log( `[${ datetime }] publish a news` );
			const pubObject = {
				datetime : datetime,
				message : 'hello world!',
			};
			//const pubString = `[${ new Date().toLocaleString() }] Bird bird bird, bird is the word!`;
			const pubString = JSON.stringify( pubObject );
			const pubData = uint8ArrayFromString( pubString );
			node.services.pubsub
				.publish( topic, pubData )
				.catch( err => {
					console.error(err)
				} );

		}, 3e3 );


		return node;
	}

	/**
	 * @returns {Promise<RSAPeerId>}
	 */
	static async createPeerId()
	{
		return await createRSAPeerId();
	}

	static async createAndSavePeerId()
	{
		const peerIdObject = await this.createPeerId();
		await this.savePeerId( peerIdObject );

		//	...
		return peerIdObject;
	}

	/**
	 * 	recover peer id
	 *	@param	peerIdDataFilename	{string}	- local full filename
	 *	@returns {object}
	 */
	static async recoverPeerId( peerIdDataFilename )
	{
		const peerData = await PeerIdStorageService.loadPeerIdData( peerIdDataFilename );
		if ( peerData )
		{
			//	{ id: string, privKey?: string, pubKey?: string }
			return await createFromJSON( peerData );
		}

		return null;
	}

	/**
	 * 	save peer id
	 *	@param peerIdObject
	 *	@returns {Promise<*>}
	 */
	static async savePeerId( peerIdObject )
	{
		//
		//	peerIdObject :
		//	{
		//		_id : Uint8Array(34) { 0 : 18, 1: 32. 2: 140, 3: 99, ... }
		//		_idB58String : "QmXng7pcVBkUuBLM5dWfxaemVxgG8jce81MXQVkzadbFCL"
		//		_privKey : RsaPrivateKey { ... }
		//		_pubKey : RsaPublicKey { ... }
		//	}
		return await PeerIdStorageService.savePeerIdData( peerIdObject );
	}
}
