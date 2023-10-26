import { peerIdFromPeerId } from "@libp2p/peer-id";

export class PeerUtil
{
	/**
	 * @typedef {import('@libp2p/interface/peer-id').PeerId} PeerId
	 */

	/**
	 * @param peerId {PeerId}
	 * @return {boolean}
	 */
	static isValidPeerId( peerId )
	{
		try
		{
			const newPeerId = peerIdFromPeerId( peerId );
			return true;
		}
		catch ( err )
		{
		}

		return false;
	}

	/**
	 *	@param port	{number} port number
	 *	@returns {string[]}
	 */
	static getListenAddresses( port )
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
		return [ `/ip4/0.0.0.0/tcp/${ port }` ];
	}
}
