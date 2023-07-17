export default class TypeUtil
{
	static isObject( data )
	{
		const typeOfData = typeof data;
		if ( 'object' !== typeOfData )
		{
			return false;
		}
		return ! Array.isArray( data );
	}

	static isNotNullObject( data )
	{
		if ( ! this.isObject( data ) )
		{
			return false;
		}
		return null !== data;
	}

	/**
	 *	@param data	{any}
	 *	@param keys	{Array}
	 *	@returns {boolean}
	 */
	static isNotNullObjectWithKeys( data, keys )
	{
		if ( ! this.isNotNullObject( data ) )
		{
			return false;
		}
		if ( Array.isArray( keys ) )
		{
			for ( const key of keys )
			{
				if ( ! data.hasOwnProperty( key ) )
				{
					return false;
				}
			}
		}

		return true;
	}

	static instanceOfWxEncryptedData( data )
	{
		return this.isNotNullObjectWithKeys( data, [ 'encryptedData', 'iv' ] ) &&
			'string' === typeof data.encryptedData &&
			'string' === typeof data.iv
			;
	}

	static isNumeric( str )
	{
		return 'number' === typeof str;
	}

	static getIntValue( obj )
	{
		if ( this.isNumeric( obj ) || this.isString( obj ) )
		{
			return parseInt( obj );
		}

		return 0;
	}

	static getFloatValue( obj )
	{
		if ( this.isNumeric( obj ) || this.isString( obj ) )
		{
			return parseFloat( obj );
		}

		return 0;
	}

	static isString( str )
	{
		return 'string' === typeof str;
	}

	static isNotEmptyString( str )
	{
		//	允许空格
		return this.getStringLength( str ) > 0;
	}

	static nullToEmpty( str )
	{
		if ( this.isNotEmptyString( str ) )
		{
			return str;
		}

		return '';
	}

	static getStringLength( str )
	{
		return this.isString( str ) ? str.length : 0;
	}

	static getObjectLength( object )
	{
		if ( 'string' === typeof object )
		{
			return object.length;
		}
		else if ( 'number' === typeof object )
		{
			return String( object ).length;
		}
		else if ( Array.isArray( object ) )
		{
			return  object.length;
		}

		return 0;
	}
}
