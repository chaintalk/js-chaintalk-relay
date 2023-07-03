const path = require( "path" );
const fs = require( 'fs' );
const LogUtil = require( "./LogUtil" );
const TypeUtil = require( "./TypeUtil" );


class Storage
{
	static getRootDirectory()
	{
		const parentDir = path.resolve( __dirname, ".." );
		return path.resolve( parentDir, ".." );
	}

	static getPeerIdDataFilename()
	{
		return `${ Storage.getRootDirectory() }/.peerId`;
	}

	static loadPeerIdData( filename )
	{
		return new Promise( ( resolve, reject ) =>
		{
			try
			{
				const peerIdDataFilename = filename || Storage.getPeerIdDataFilename();
				if ( ! fs.existsSync( peerIdDataFilename ) )
				{
					LogUtil.debug( `peerId data file not found` );
					return resolve( null );
				}

				//	...
				fs.readFile( Storage.getPeerIdDataFilename(), ( err, data ) =>
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
				const filename = Storage.getPeerIdDataFilename();
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

module.exports = Storage;
