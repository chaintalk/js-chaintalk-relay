// Usage: $0 [--peerId <jsonFilePath>] [--listenMultiaddrs <ma> ... <ma>] [--announceMultiaddrs <ma> ... <ma>]
//           [--metricsPort <port>] [--disableMetrics] [--disablePubsubDiscovery]
import minimist from 'minimist';
import { CommonUtil } from './utils/CommonUtil.js';
import { RelayNode } from './services/RelayNode.js';
import { SwarmKeyStorageService } from './services/storage/SwarmKeyStorageService.js';
import { LogUtil } from "./utils/LogUtil.js";
import { PeerIdUtil } from "./utils/PeerIdUtil.js";
import fs from "fs";
import { StorageService } from "./services/storage/StorageService.js";

const argv = minimist( process.argv.slice( 2 ) );


/**
 * 	command line args:
 * 	--p				: [required] e.g.: 9911
 *
 * 	--disablePubsubDiscovery	: e.g.: false
 *		env.DISABLE_PUBSUB_DISCOVERY
 */
async function main()
{
	if ( ! preRunCheck() )
	{
		LogUtil.say( 'run `npm run help` to get help.' );
		return;
	}

	//	...
	const port = argv.p;
	const peerIdObject = await PeerIdUtil.loadPeerIdByPort( port );
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
	const swarmKey = await SwarmKeyStorageService.loadSwarmKey();
	const swarmKeyObject = SwarmKeyStorageService.swarmKeyToObject( swarmKey );
	if ( ! SwarmKeyStorageService.isValidSwarmObject( swarmKeyObject ) )
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

function preRunCheck()
{
	let returnValue = true;
	const filenameSwarmKey = `${ StorageService.getRootDirectory() }/.swarmKey`;
	const filenamePeerIds = `${ StorageService.getRootDirectory() }/_swarmPeers.js`;
	const filenameBootstrappers = `${ StorageService.getRootDirectory() }/_bootstrappers.js`;
	if ( ! fs.existsSync( filenameSwarmKey ) )
	{
		returnValue = false;
		console.error( `file not found : ${ filenameSwarmKey }` );
	}
	if ( ! fs.existsSync( filenamePeerIds ) )
	{
		returnValue = false;
		console.error( `file not found : ${ filenamePeerIds }` );
	}
	if ( ! fs.existsSync( filenameBootstrappers ) )
	{
		returnValue = false;
		console.error( `file not found : ${ filenameBootstrappers }` );
	}

	return returnValue;
}


main().then( () => {} );
