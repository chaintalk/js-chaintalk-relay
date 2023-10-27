import _ from 'lodash';

/**
 * 	@class
 */
export class TimerUtil
{
	/**
	 *	@param delayInMillisecond	{number}
	 *	@returns {Promise<void>}
	 */
	static waitForDelay( delayInMillisecond )
	{
		return new Promise( ( resolve, reject ) =>
		{
			try
			{
				if ( delayInMillisecond < 0 )
				{
					return reject( `invalid delayInMillisecond` );
				}
				setTimeout( () =>
				{
					resolve();

				}, delayInMillisecond );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param pfnCondition		{function}
	 *	@param intervalInMillisecond	{number}
	 *	@returns {Promise<void>}
	 */
	static waitUntilCondition( pfnCondition, intervalInMillisecond )
	{
		return new Promise( ( resolve, reject ) =>
		{
			try
			{
				if ( ! _.isFunction( pfnCondition ) )
				{
					return reject( `invalid pfnCondition` );
				}

				const pfnCheckCondition = () =>
				{
					if ( pfnCondition() )
					{
						resolve();
					}
					else
					{
						//	check the condition every 100 milliseconds
						setTimeout
						(
							pfnCheckCondition,
							( _.isNumber( intervalInMillisecond ) && intervalInMillisecond ) > 0 ? intervalInMillisecond : 100
						);
					}
				};

				pfnCheckCondition();
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}
}
