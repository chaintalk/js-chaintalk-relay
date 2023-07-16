const fs = require( 'fs' );
const pnet = require( 'libp2p-pnet' );

const Storage = require( './Storage' );
const LogUtil = require( "./LogUtil" );
const TypeUtil = require( "./TypeUtil" );


class SwarmKeyStorage
{
	static getSwarmKeyFilename()
	{
		return `${ Storage.getRootDirectory() }/.swarmKey`;
	}

	static async generateSwarmKey()
	{
		//	load from local file .swarmKey
		const swarmKey = await SwarmKeyStorage.loadSwarmKey();
		if ( swarmKey )
		{
			return swarmKey;
		}

		//	generate a new swarmKey
		const writer = fs.createWriteStream( SwarmKeyStorage.getSwarmKeyFilename(), {
			encoding : "utf8",
			flag : "w",
			mode : 0o666
		} );
		pnet.generate( writer );
		writer.close();

		//	load and return
		return await SwarmKeyStorage.loadSwarmKey();
	}

	static async loadSwarmKey( filename )
	{
		return new Promise( ( resolve, reject ) =>
		{
			try
			{
				const swarmKeyFilename = filename || SwarmKeyStorage.getSwarmKeyFilename();
				if ( ! fs.existsSync( swarmKeyFilename ) )
				{
					LogUtil.debug( `swarmKey file not found` );
					return resolve( null );
				}

				//	...
				fs.readFile( swarmKeyFilename, ( err, data ) =>
				{
					if ( err )
					{
						throw err;
					}

					if ( ! data instanceof Uint8Array ||
						0 === data.byteLength ||
						0 === data.length )
					{
						LogUtil.debug( `invalid swarmKey file` );
						return resolve( null );
					}

					resolve( data );
				} );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}
}

module.exports = SwarmKeyStorage;
