import { createLibp2p } from 'libp2p';
import { preSharedKey } from 'libp2p/pnet';

//import { NOISE } from 'libp2p-noise';
//import GossipSub from 'libp2p-gossipsub';
//import TCP from 'libp2p-tcp';
//import MPLEX from 'libp2p-mplex';
//import Websockets from 'libp2p-websockets';
//import PubsubPeerDiscovery from 'libp2p-pubsub-peer-discovery';

import { peerIdFromString } from '@libp2p/peer-id'
//import { PeerIdType, type PeerId } from '@libp2p/interface-peer-id';
import { createRSAPeerId, createFromJSON, exportToProtobuf } from '@libp2p/peer-id-factory'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { bootstrap } from '@libp2p/bootstrap'
import { floodsub } from '@libp2p/floodsub'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { circuitRelayTransport, circuitRelayServer } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'

import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import PeerIdStorage from '../utils/PeerIdStorage.js';
import { _bootstrappers } from "../../_bootstrappers.js";
//import { RSAPeerId } from "@libp2p/interface-peer-id";


export default class RelayNode
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
				console.log( `peerInfo : `, peerInfo );
				//node.dial( peerInfo.id );
				console.log( `Discovered: ${ peerInfo.id.toString() }` )
			}
			catch ( err )
			{
				console.error( err );
			}
		} );

		//
		//	pub/sub
		//
		const topic = 'news';
		node.services.pubsub.subscribe( topic )
		node.services.pubsub.addEventListener('message', (evt) =>
		{
			try
			{
				const recType = evt.detail.type;
				const recTopic = evt.detail.topic;
				if ( 'signed' !== recType || topic !== recTopic )
				{
					//console.log( `- receivedIrrelevant topics are received and discarded voluntarily` );
					return;
				}

				const recFrom = evt.detail.from;
				const recSequence = evt.detail.sequenceNumber;
				const recData = new TextDecoder().decode( evt.detail.data );
				// let recObject	= null;
				// if ( 'string' === typeof recData )
				// {
				// 	recObject = JSON.parse( recData.trim() );
				// }
				const signature = new TextDecoder().decode( evt.detail.signature );
				console.log( `received [${ recSequence }] \n- from: ${ recFrom }\n- type: ${ recType }\n- topic ${ recTopic }` );
				console.log( `- data: ${ recData }` );
				// console.log( `signature: ${ signature }` );
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
			const pubData = new TextEncoder().encode( pubString );
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
		const peerData = await PeerIdStorage.loadPeerIdData( peerIdDataFilename );
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
		return await PeerIdStorage.savePeerIdData( peerIdObject );
	}
}
