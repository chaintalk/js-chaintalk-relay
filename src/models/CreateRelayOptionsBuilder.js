import _ from 'lodash';
import { ParamUtil } from "../utils/ParamUtil.js";


/**
 *	@typedef  CreateRelayOptions {object}
 *	@property peerIdFilename {string}
 *	@property swarmKeyFilename {string}
 *	@property port {number}
 *	@property announceAddresses {string[]}
 *	@property bootstrapperAddresses {string[]}
 */



/**
 * 	@class
 */
export class CreateRelayOptionsBuilder
{
	/**
	 *	@type {string}
	 */
	peerIdFilename = '';

	/**
	 *	@type {string}
	 */
	swarmKeyFilename = '';

	/**
	 *	@type {number}
	 */
	port = 9911;

	/**
	 *	@type {string[]}
	 */
	announceAddresses = [];

	/**
	 *	@type {string[]}
	 */
	bootstrapperAddresses = [];


	constructor()
	{
	}

	/**
	 *	@returns {CreateRelayOptionsBuilder}
	 */
	static builder()
	{
		return new CreateRelayOptionsBuilder();
	}


	/**
	 *	@returns {this}
	 */
	setPeerIdFilename( /** @type {string} */ value )
	{
		this.peerIdFilename = value;
		return this;
	}

	/**
	 *	@returns {this}
	 */
	setSwarmKeyFilename( /** @type {string} */ value )
	{
		this.swarmKeyFilename = value;
		return this;
	}

	/**
	 *	@returns {this}
	 */
	setPort( /** @type {number} */ value )
	{
		this.port = value;
		return this;
	}

	/**
	 *	@returns {this}
	 */
	setAnnounceAddresses( /** @type {string[]} */ value )
	{
		this.announceAddresses = value;
		return this;
	}

	/**
	 *	@returns {this}
	 */
	setBootstrapperAddresses( /** @type {string[]} */ value )
	{
		this.bootstrapperAddresses = value;
		return this;
	}

	/**
	 *	@returns {CreateRelayOptions}
	 */
	build()
	{
		if ( ! _.isString( this.peerIdFilename ) || _.isEmpty( this.peerIdFilename ) )
		{
			throw new Error( `invalid peerIdFilename` );
		}
		if ( this.swarmKeyFilename )
		{
			if ( ! _.isString( this.swarmKeyFilename ) || _.isEmpty( this.swarmKeyFilename ) )
			{
				throw new Error( `invalid swarmKeyFilename` );
			}
		}
		if ( ! ParamUtil.isValidPortNumber( this.port ) )
		{
			throw new Error( `invalid port` );
		}
		if ( ! Array.isArray( this.announceAddresses ) )
		{
			throw new Error( `invalid announceAddresses` );
		}
		if ( ! Array.isArray( this.bootstrapperAddresses ) )
		{
			throw new Error( `invalid bootstrapperAddresses` );
		}

		return {
			peerIdFilename : this.peerIdFilename,
			swarmKeyFilename : this.swarmKeyFilename,
			port : this.port,
			announceAddresses : this.announceAddresses,
			bootstrapperAddresses : this.bootstrapperAddresses
		}
	}
}
