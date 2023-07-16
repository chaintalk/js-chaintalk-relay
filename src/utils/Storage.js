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
}

module.exports = Storage;
