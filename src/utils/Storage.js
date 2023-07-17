import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

/**
 * 	define constants
 */
const __filename = fileURLToPath( import.meta.url );
const __dirname = dirname( __filename );


export default class Storage
{
	static get __filename()
	{
		return __filename;
	}

	static get __dirname()
	{
		return __dirname;
	}

	static getRootDirectory()
	{
		const parentDir = resolve( __dirname, ".." );
		return resolve( parentDir, ".." );
	}
}
