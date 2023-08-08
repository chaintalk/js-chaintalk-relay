import { _swarmPeers } from "../../_swarmPeers.js";
import { createFromJSON } from "@libp2p/peer-id-factory";

export class PeerIdUtil
{
	static async loadPeerIdByPort( port )
	{
		const obj = this.loadPeerIdJsonObjectByPort( port );
		if ( obj )
		{
			return await createFromJSON( obj );
		}

		return null;
	}

	static loadPeerIdJsonObjectByPort( port )
	{
		if ( _swarmPeers.hasOwnProperty( port ) )
		{
			return _swarmPeers[ port ];
		}

		return null;
	}
}
