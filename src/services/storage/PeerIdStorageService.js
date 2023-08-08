import path from "path";
import fs from 'fs';
import { fromString as uint8ArrayFromString, toString as uint8ArrayToString } from 'uint8arrays'

import { StorageService } from './StorageService.js';
import { LogUtil } from '../../utils/LogUtil.js';
import { TypeUtil } from '../../utils/TypeUtil.js';



export class PeerIdStorageService
{
	static getPeerIdDataFilename()
	{
		return `${ StorageService.getRootDirectory() }/.peerId`;
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
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const peerIdDataFilename = filename || PeerIdStorageService.getPeerIdDataFilename();
				if ( ! fs.existsSync( peerIdDataFilename ) )
				{
					LogUtil.debug( `peerId data file not found` );
					return resolve( null );
				}

				const jsonString = await StorageService.loadDataFromFile( peerIdDataFilename );
				const peerIdObject = this.peerIdObjectFromJson( jsonString );
				resolve( peerIdObject );
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
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! TypeUtil.isNotNullObject( peerIdObject ) )
				{
					return reject( `invalid peerIdData` );
				}

				const peerIdJson = this.basePeerIdObjectToPeerIdJson( peerIdObject );
				const peerIdJsonString = JSON.stringify( peerIdJson );
				const filename = PeerIdStorageService.getPeerIdDataFilename();
				await StorageService.saveDataToFile( filename, peerIdJsonString );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}
}
