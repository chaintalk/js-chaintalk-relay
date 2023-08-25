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
}
