const path = require( "path" );
const fs = require( 'fs' );

const Storage = require( "./Storage" );
const LogUtil = require( "./LogUtil" );
const TypeUtil = require( "./TypeUtil" );



class PeerIdStorage
{
	static getPeerIdDataFilename()
	{
		return `${ Storage.getRootDirectory() }/.peerId`;
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

					const peerIdData = JSON.parse( data );
					resolve( peerIdData );
				} );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param	peerIdData
	 *	{
	 *		_id : Uint8Array(34) { 0 : 18, 1: 32. 2: 140, 3: 99, ... }
	 *		_idB58String : "QmXng7pcVBkUuBLM5dWfxaemVxgG8jce81MXQVkzadbFCL"
	 *		_privKey : RsaPrivateKey { ... }
	 *		_pubKey : RsaPublicKey { ... }
	 *	}
	 *	@returns {Promise<unknown>}
	 */
	static savePeerIdData( peerIdData )
	{
		if ( ! TypeUtil.isNotNullObject( peerIdData ) )
		{
			throw new Error( `invalid peerIdData` );
		}

		return new Promise( ( resolve, reject ) =>
		{
			try
			{
				const stringData = JSON.stringify( peerIdData );
				const filename = PeerIdStorage.getPeerIdDataFilename();
				fs.writeFile( filename, stringData, {
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


module.exports = PeerIdStorage;
