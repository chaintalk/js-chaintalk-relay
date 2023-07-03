class LogUtil
{
	static LEVEL_DEBUG	= 0;
	static LEVEL_INFO	= 1;
	static LEVEL_WARNING	= 2;
	static LEVEL_ERROR	= 3;
	static LEVEL_FATAL	= 4;

	//	define log level
	static logLevel		= this.LEVEL_DEBUG;

	constructor()
	{
		//	only print logs with level greater than or equal to the defined level
		LogUtil.logLevel = LogUtil.LEVEL_DEBUG;
	}

	static debug( ...args )
	{
		this.output( LogUtil.LEVEL_DEBUG, args );
	}
	static info( ...args )
	{
		this.output( LogUtil.LEVEL_INFO, args );
	}
	static warn( ...args )
	{
		this.output( LogUtil.LEVEL_WARNING, args );
	}
	static error( ...args )
	{
		this.output( LogUtil.LEVEL_ERROR, args );
	}
	static fatal( ...args )
	{
		this.output( LogUtil.LEVEL_FATAL, args );
	}

	static output( level, ...args )
	{
		if ( level >= LogUtil.logLevel )
		{
			//	使用剩余参数数组
			for ( const arg of args )
			{
				switch ( level )
				{
					case LogUtil.LEVEL_WARNING:
						console.warn( new Date() );
						console.warn( arg[ 0 ] );
						break;
					case LogUtil.LEVEL_ERROR:
					case LogUtil.LEVEL_FATAL:
						console.error( new Date() );
						console.error( arg[ 0 ] );
						break;
					default:
						console.log( `` );
						console.log( `⏰ ${ new Date() } : ` );
						console.log( arg[ 0 ] );
				}

			}
		}
	}
}

module.exports = LogUtil;
