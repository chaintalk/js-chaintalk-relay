// Usage: $0 [--peerId <jsonFilePath>] [--listenMultiaddrs <ma> ... <ma>] [--announceMultiaddrs <ma> ... <ma>]
//           [--metricsPort <port>] [--disableMetrics] [--disablePubsubDiscovery]
const debug = require( 'debug' );
const log = debug( 'libp2p:relay:bin' )

const path = require( 'path' )
const fs = require( 'fs' )
const PeerId = require( 'peer-id' )

const CommonUtil = require( './utils/CommonUtil' );
const Storage = require( './utils/Storage' );
const RelayNode = require( './RelayNode' );
const minimist = require( 'minimist' );

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

	log( `listenAddresses: ${ listenAddresses.map( ( a ) => a ) }` )
	announceAddresses.length && log( `announceAddresses: ${ announceAddresses.map( ( a ) => a ) }` )

	//	Discovery
	const pubsubDiscoveryEnabled = !(
		argv.disablePubsubDiscovery || process.env.DISABLE_PUBSUB_DISCOVERY
	)

	//	PeerId
	let peerId
	if ( argv.peerId || process.env.PEER_ID )
	{
		//	argv.peerId is the full filename of
		const peerIdFilename = argv.peerId || process.env.PEER_ID;
		peerId = await RelayNode.recoverPeerId( peerIdFilename );
		log( 'PeerId provided was loaded.' )
	}
	else
	{
		peerId = await RelayNode.recoverPeerId();
		if ( ! peerId )
		{
			peerId = await PeerId.create()
			log( 'You are using an automatically generated peer.' )
			log( 'If you want to keep the same address for the server you should provide a peerId with --peerId <jsonFilePath>' )

			//	save peerId(json format) data
			await Storage.savePeerIdData( peerId );
		}
	}

	//	Create Relay
	const relay = await RelayNode.create( {
		peerId,
		listenAddresses,
		announceAddresses,
		pubsubDiscoveryEnabled
	} );

	await relay.start()
	console.log( 'Relay server listening on:' )
	relay.multiaddrs.forEach( ( m ) => console.log( `${ m }/p2p/${ relay.peerId.toB58String() }` ) )

	// if ( metrics )
	// {
	// 	log( 'enabling metrics' )
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
	// 		console.log( `metrics server listening on ${ metricsPort }` )
	// 	} )
	// }

	const stop = async () =>
	{
		console.log( 'Stopping...' )
		await relay.stop()

		//metricsServer && await metricsServer.close()

		process.exit( 0 )
	}

	process.on( 'SIGTERM', stop )
	process.on( 'SIGINT', stop )
}


main().then( r => {} );
