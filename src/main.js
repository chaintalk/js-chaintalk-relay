// Usage: $0 [--peerId <jsonFilePath>] [--listenMultiaddrs <ma> ... <ma>] [--announceMultiaddrs <ma> ... <ma>]
//           [--metricsPort <port>] [--disableMetrics] [--disablePubsubDiscovery]
import minimist from 'minimist';
import chalk from 'chalk';

import CommonUtil from './utils/CommonUtil.js';
import RelayNode from './providers/RelayNode.js';
import SwarmKeyStorage from './utils/SwarmKeyStorage.js';
import LogUtil from "./utils/LogUtil.js";
import { PeerIdLoader } from "./utils/PeerIdLoader.js";

const argv = minimist( process.argv.slice( 2 ) );


/**
 * 	command line args:
 * 	--p				: [required] e.g.: 9911
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
	const port = argv.p;
	const peerIdObject = await PeerIdLoader.loadPeerIdById( port );
	if ( null === peerIdObject )
	{
		throw new Error( `Please specify port via the --p` );
	}

	//	multiaddrs
	const listenAddresses	= CommonUtil.getListenAddresses( port );
	const announceAddresses	= CommonUtil.getAnnounceAddresses( argv )

	LogUtil.say( `listenAddresses: ${ listenAddresses.map( ( a ) => a ) }` )
	announceAddresses.length && LogUtil.say( `announceAddresses: ${ announceAddresses.map( ( a ) => a ) }` )

	//	Discovery
	const pubsubDiscoveryEnabled = ! (
		argv.disablePubsubDiscovery || process.env.DISABLE_PUBSUB_DISCOVERY
	)

	//	swarm key
	const swarmKey = await SwarmKeyStorage.loadSwarmKey();
	const swarmKeyObject = SwarmKeyStorage.swarmKeyToObject( swarmKey );
	if ( ! SwarmKeyStorage.isValidSwarmObject( swarmKeyObject ) )
	{
		LogUtil.say( `invalid swarm key. Please first create a new swarm key with command <npm run swarm-key>` );
		return;
	}
	LogUtil.say( `swarm key: ${ swarmKeyObject.key }` );

	//	Create Relay
	const relay = await RelayNode.create( {
		peerId : peerIdObject,
		swarmKey : swarmKey,
		listenAddresses : listenAddresses,
		announceAddresses : announceAddresses,
		pubsubDiscoveryEnabled : pubsubDiscoveryEnabled
	} );
	await relay.start();
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
