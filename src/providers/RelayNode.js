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
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { circuitRelayServer } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'

import PeerIdStorage from '../utils/PeerIdStorage.js';


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
				webSockets()
			],
			connectionEncryption : [
				noise()
			],
			connectionManager: {
				maxConnections: 1024,
				minConnections: 2
			},
			streamMuxers : [
				yamux(), mplex()
			],
			services : {
				identify : identifyService(),
				relay : circuitRelayServer()
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
			const peerId = evt.detail
			console.log( 'Connection established to:', peerId.toString() ) // Emitted when a peer has been found
		} );
		node.addEventListener( 'peer:discovery', ( evt ) =>
		{
			const peerInfo = evt.detail

			console.log( 'Discovered:', peerInfo.id.toString() )
		} );

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
