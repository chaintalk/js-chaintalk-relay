import TypeUtil from "./TypeUtil.js";
import { _peerIds } from "../../_peerIds.js";
import { createFromJSON } from "@libp2p/peer-id-factory";

export class PeerIdLoader
{
	static async loadPeerIdById( num )
	{
		const obj = this.loadPeerIdJsonObjectById( num );
		if ( obj )
		{
			return await createFromJSON( obj );
		}

		return null;
	}

	static loadPeerIdJsonObjectById( num )
	{
		if ( _peerIds.hasOwnProperty( num ) )
		{
			return _peerIds[ num ];
		}

		return null;
	}
}
