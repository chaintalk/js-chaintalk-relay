// Usage: $0 [--peerId <jsonFilePath>] [--listenMultiaddrs <ma> ... <ma>] [--announceMultiaddrs <ma> ... <ma>]
//           [--metricsPort <port>] [--disableMetrics] [--disablePubsubDiscovery]
import minimist from 'minimist';
import { CommonUtil } from './utils/CommonUtil.js';
import { RelayNode } from './services/RelayNode.js';
import { PeerIdService, PeerIdStorageService, SwarmKeyStorageService } from "chaintalk-utils";
import { LogUtil } from "chaintalk-utils";
import { SwarmKeyService } from "chaintalk-utils";

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
	//	...
	const peerIdObject = await preparePeerId( argv );
	if ( null === peerIdObject )
	{
		LogUtil.say( `failed to create/load peerId. Create a new peerId using \`chaintalk-utils\`` );
		return false;
	}

	//	...
	const swarmKey = await prepareSwarmKey( argv );
	if ( null === swarmKey )
	{
		LogUtil.say( `invalid swarm key. Create a new swarm key using \`chaintalk-utils\`` );
		return false;
	}

	//	...
	//	multiaddrs
	const listenAddresses	= CommonUtil.getListenAddresses( argv );
	const announceAddresses	= CommonUtil.getAnnounceAddresses( argv )

	LogUtil.say( `listenAddresses: ${ listenAddresses.map( ( a ) => a ) }` )
	announceAddresses.length && LogUtil.say( `announceAddresses: ${ announceAddresses.map( ( a ) => a ) }` )

	//	Discovery
	const pubsubDiscoveryEnabled = ! (
		argv.disablePubsubDiscovery || process.env.DISABLE_PUBSUB_DISCOVERY
	)

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

/**
 *	@param	argv
 *	@returns {Promise<PeerId|null>}
 */
async function preparePeerId( argv )
{
	const peerIdStorageService = new PeerIdStorageService();
	const filename = peerIdStorageService.getSafeFilename( argv.peerId || process.env.PEER_ID || undefined );
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
 *	@returns {Promise<Uint8Array|null>}
 */
async function prepareSwarmKey( argv )
{
	const swarmKeyStorageService = new SwarmKeyStorageService();
	const filename = swarmKeyStorageService.getSafeFilename( argv.swarmKey || process.env.SWARM_KEY || undefined );
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


main().then( () => {} );
