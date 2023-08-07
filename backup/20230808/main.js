// Usage: $0 [--peerId <jsonFilePath>] [--listenMultiaddrs <ma> ... <ma>] [--announceMultiaddrs <ma> ... <ma>]
//           [--metricsPort <port>] [--disableMetrics] [--disablePubsubDiscovery]
import minimist from 'minimist';
import chalk from 'chalk';

import CommonUtil from './utils/CommonUtil.js';
import RelayNode from './providers/RelayNode.js';
import SwarmKeyStorage from './utils/SwarmKeyStorage.js';
import LogUtil from "./utils/LogUtil.js";

const argv = minimist( process.argv.slice( 2 ) );


/**
 * 	command line args:
 * 	--n				: [required] e.g.: 9911
 *
 * 	--peerId			: e.g.: /etc/chaintalk-boot/.peerId
 * 		env.PEER_ID
 * 	--listenMultiaddrs		: e.g.: /ip4/0.0.0.0/tcp/10000/ws
 * 		env.LISTEN_MULTIADDRS
 * 	--announceMultiaddrs		:
 * 		env.ANNOUNCE_MULTIADDRS
 * 	--disablePubsubDiscovery	: e.g.: false
 *		env.DISABLE_PUBSUB_DISCOVERY
 */
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

	LogUtil.say( `listenAddresses: ${ listenAddresses.map( ( a ) => a ) }` )
	announceAddresses.length && LogUtil.say( `announceAddresses: ${ announceAddresses.map( ( a ) => a ) }` )

	//	Discovery
	const pubsubDiscoveryEnabled = ! (
		argv.disablePubsubDiscovery || process.env.DISABLE_PUBSUB_DISCOVERY
	)

	//	argv.peerId is the full filename of the file where the peerId object is stored
	const peerIdFilename = argv.peerId || process.env.PEER_ID || undefined;
	let basePeerIdObject = await RelayNode.recoverPeerId( peerIdFilename );
	if ( basePeerIdObject )
	{
		LogUtil.say( 'peerId provided was loaded.' );
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
		LogUtil.say( 'You are using an automatically generated peer.' )
		LogUtil.say( `If you want to keep the same address for the server you should provide a peerId with --peerId <jsonFilePath>` )
	}

	//	swarm key
	const swarmKey = await SwarmKeyStorage.loadSwarmKey();
	const swarmKeyObject = SwarmKeyStorage.swarmKeyToObject( swarmKey );
	if ( ! SwarmKeyStorage.isValidSwarmKeyToObject( swarmKeyObject ) )
	{
		LogUtil.say( `invalid swarm key. Please first create a new swarm key with command <npm run swarm-key>` );
		return;
	}
	LogUtil.say( `swarm key: ${ chalk.bold( swarmKeyObject.key ) }` );

	//	Create Relay
	const relay = await RelayNode.create( {
		peerId : basePeerIdObject,
		swarmKey : swarmKey,
		listenAddresses : listenAddresses,
		announceAddresses : announceAddresses,
		pubsubDiscoveryEnabled : pubsubDiscoveryEnabled
	} );
	await relay.start()
	LogUtil.say( 'Bootstrap Relay Server listening on:' );
	const multiaddrs = relay.getMultiaddrs();
	multiaddrs.forEach( ( ma ) => {
		LogUtil.say( `${ ma.toString() }` );
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
		LogUtil.say( 'Stopping...' )
		await relay.stop()

		//metricsServer && await metricsServer.close()

		process.exit( 0 )
	}

	process.on( 'SIGTERM', stop )
	process.on( 'SIGINT', stop )
}


main().then( () => {} );
