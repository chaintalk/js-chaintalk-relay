import path from "path";
import fs from 'fs';
import { fromString as uint8ArrayFromString, toString as uint8ArrayToString } from 'uint8arrays'

import Storage from './Storage.js';
import LogUtil from './LogUtil.js';
import TypeUtil from './TypeUtil.js';



export default class PeerIdStorage
{
	static getPeerIdDataFilename()
	{
		return `${ Storage.getRootDirectory() }/.peerId`;
	}

	static basePeerIdObjectToPeerIdJson( basePeerIdObject )
	{
		if ( ! this.isValidBasePeerIdObject( basePeerIdObject ) )
		{
			return null;
		}

		try
		{
			return {
				id: uint8ArrayToString( basePeerIdObject.multihash.bytes, 'base58btc' ),
				privKey: uint8ArrayToString( basePeerIdObject.privateKey, 'base64pad' ),
				pubKey: uint8ArrayToString( basePeerIdObject.publicKey, 'base64pad' )
			};
		}
		catch ( err ) {}

		return null;
	}

	static peerIdObjectFromJson( peerIdJson )
	{
		try
		{
			const obj = JSON.parse( peerIdJson );
			if ( this.isValidPeerIdObject( obj ) )
			{
				return obj;
			}
		}
		catch ( err ){}
		return null;
	}

	static isValidPeerIdObject( peerIdObject )
	{
		return TypeUtil.isNotNullObjectWithKeys( peerIdObject, [ 'id', 'privKey', 'pubKey' ] );
	}

	static isValidBasePeerIdObject( peerIdObject )
	{
		return TypeUtil.isNotNullObjectWithKeys( peerIdObject, [ 'type', 'multihash', 'privateKey', 'publicKey' ] );
	}


	static generatePeerId()
	{

	}

	static async loadPeerIdData( filename )
	{
		return new Promise( ( resolve, reject ) =>
		{
			try
			{
				const peerIdDataFilename = filename || PeerIdStorage.getPeerIdDataFilename();
				if ( ! fs.existsSync( peerIdDataFilename ) )
				{
					LogUtil.debug( `peerId data file not found` );
					return resolve( null );
				}

				//	...
				fs.readFile( peerIdDataFilename, ( err, data ) =>
				{
					if ( err )
					{
						throw err;
					}

					resolve( this.peerIdObjectFromJson( data ) );
				} );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param	peerIdObject
	 *	{
	 *		_id : Uint8Array(34) { 0 : 18, 1: 32. 2: 140, 3: 99, ... }
	 *		_idB58String : "QmXng7pcVBkUuBLM5dWfxaemVxgG8jce81MXQVkzadbFCL"
	 *		_privKey : RsaPrivateKey { ... }
	 *		_pubKey : RsaPublicKey { ... }
	 *	}
	 *	@returns {Promise<unknown>}
	 */
	static savePeerIdData( peerIdObject )
	{
		if ( ! TypeUtil.isNotNullObject( peerIdObject ) )
		{
			throw new Error( `invalid peerIdData` );
		}

		return new Promise( ( resolve, reject ) =>
		{
			try
			{
				const peerIdJson = this.basePeerIdObjectToPeerIdJson( peerIdObject );
				const peerIdJsonString = JSON.stringify( peerIdJson );
				const filename = PeerIdStorage.getPeerIdDataFilename();
				fs.writeFile( filename, peerIdJsonString, {
					encoding : "utf8",
					flag : "w",
					mode : 0o666
				}, ( err ) =>
				{
					if ( err )
					{
						reject( err );
					}

					resolve( true );
				} );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}
}
