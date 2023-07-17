// Usage: $0 [--peerId <jsonFilePath>] [--listenMultiaddrs <ma> ... <ma>] [--announceMultiaddrs <ma> ... <ma>]
//           [--metricsPort <port>] [--disableMetrics] [--disablePubsubDiscovery]
import minimist from 'minimist';

import debug from 'debug';
//const log = debug( 'libp2p:relay:bin' )

import CommonUtil from './utils/CommonUtil.js';
import RelayNode from './providers/RelayNode.js';
import SwarmKeyStorage from './utils/SwarmKeyStorage.js';
import LogUtil from "./utils/LogUtil.js";

const argv = minimist( process.argv.slice( 2 ) );




async function main()
{
	//	Metrics
	//let metricsServer
	// const metrics = !(
	// 	argv.disableMetrics || process.env.DISABLE_METRICS
	// )
	// const metricsPort = argv.metricsPort || argv.mp || process.env.METRICS_PORT || '8003'

	//	multiaddrs
	const listenAddresses = CommonUtil.getListenAddresses( argv )
	const announceAddresses = CommonUtil.getAnnounceAddresses( argv )

	LogUtil.broadcast( `listenAddresses: ${ listenAddresses.map( ( a ) => a ) }` )
	announceAddresses.length && LogUtil.broadcast( `announceAddresses: ${ announceAddresses.map( ( a ) => a ) }` )

	//	Discovery
	const pubsubDiscoveryEnabled = ! (
		argv.disablePubsubDiscovery || process.env.DISABLE_PUBSUB_DISCOVERY
	)

	//	argv.peerId is the full filename of the file where the peerId object is stored
	const peerIdFilename = argv.peerId || process.env.PEER_ID || undefined;
	let basePeerIdObject = await RelayNode.recoverPeerId( peerIdFilename );
	if ( basePeerIdObject )
	{
		LogUtil.broadcast( 'PeerId provided was loaded.' );
	}
	else
	{
		//	peerId
		//	{
		//		_id : Uint8Array(34) { 0 : 18, 1: 32. 2: 140, 3: 99, ... }
		//		_idB58String : "QmXng7pcVBkUuBLM5dWfxaemVxgG8jce81MXQVkzadbFCL"
		//		_privKey : RsaPrivateKey { ... }
		//		_pubKey : RsaPublicKey { ... }
		//	}
		basePeerIdObject = await RelayNode.createAndSavePeerId();
		LogUtil.broadcast( 'You are using an automatically generated peer.' )
		LogUtil.broadcast( `If you want to keep the same address for the server you should provide a peerId with --peerId <jsonFilePath>` )
	}

	//	swarm key
	const swarmKey = await SwarmKeyStorage.loadSwarmKey();
	LogUtil.broadcast( `swarm key:\n${ SwarmKeyStorage.swarmKeyToString( swarmKey ) }` );

	//	Create Relay
	const relay = await RelayNode.create( {
		peerId : basePeerIdObject,
		swarmKey,
		listenAddresses,
		announceAddresses,
		pubsubDiscoveryEnabled
	} );

	await relay.start()
	LogUtil.broadcast( 'Bootstrap Relay Server listening on:' );
	const multiaddrs = relay.getMultiaddrs();
	multiaddrs.forEach( ( ma ) => {
		LogUtil.broadcast( `${ ma.toString() }` );
	} );

	// if ( metrics )
	// {
	// 	LogUtil.info( 'enabling metrics' )
	// 	metricsServer = http.createServer( ( req, res ) =>
	// 	{
	// 		if ( req.url !== '/metrics' )
	// 		{
	// 			res.statusCode = 200
	// 			res.end()
	// 		}
	// 	} )
	//
	// 	menoetius.instrument( metricsServer )
	//
	// 	metricsServer.listen( metricsPort, '0.0.0.0', () =>
	// 	{
	// 		LogUtil.info( `metrics server listening on ${ metricsPort }` )
	// 	} )
	// }

	const stop = async () =>
	{
		LogUtil.broadcast( 'Stopping...' )
		await relay.stop()

		//metricsServer && await metricsServer.close()

		process.exit( 0 )
	}

	process.on( 'SIGTERM', stop )
	process.on( 'SIGINT', stop )
}


main().then( r => {} );
