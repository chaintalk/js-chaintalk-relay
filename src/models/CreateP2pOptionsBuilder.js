import _ from 'lodash';
import { ParamUtil } from "../utils/ParamUtil.js";
import { PeerUtil } from "../utils/PeerUtil.js";


/**
 *	@typedef  CreateP2pOptions {object}
 *	@property peerId {PeerId}
 *	@property swarmKey {Uint8Array}
 *	@property port {number}
 *	@property listenAddresses {string[]}
 *	@property announceAddresses {string[]}
 *	@property bootstrapperAddresses {string[]}
 *	@property callbackMessage {CallbackMessage}
 */



/**
 * 	@class
 */
export class CreateP2pOptionsBuilder
{
	/**
	 *	@type {PeerId}
	 */
	peerId = null;

	/**
	 *	@type {Uint8Array}
	 */
	swarmKey = null;

	/**
	 *	@type {string[]}
	 */
	listenAddresses = [];

	/**
	 *	@type {string[]}
	 */
	announceAddresses = [];

	/**
	 *	@type {string[]}
	 */
	bootstrapperAddresses = [];

	/**
	 *	@type {CallbackMessage}
	 */
	callbackMessage = null;


	constructor()
	{
	}

	/**
	 *	@returns {CreateP2pOptionsBuilder}
	 */
	static builder()
	{
		return new CreateP2pOptionsBuilder();
	}




	/**
	 *	@returns {this}
	 */
	setPeerId( /** @type {PeerId} */ value )
	{
		this.peerId = value;
		return this;
	}

	/**
	 *	@returns {this}
	 */
	setSwarmKey( /** @type {Uint8Array} */ value )
	{
		this.swarmKey = value;
		return this;
	}

	/**
	 *	@returns {this}
	 */
	setListenAddresses( /** @type {string[]} */ value )
	{
		this.listenAddresses = value;
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
	 *	@returns {this}
	 */
	setCallbackMessage( /** @type {CallbackMessage} */ value )
	{
		this.callbackMessage = value;
		return this;
	}

	/**
	 *	@returns {CreateP2pOptions}
	 */
	build()
	{
		if ( ! PeerUtil.isValidPeerId( this.peerId ) )
		{
			throw new Error( `invalid peerId` );
		}
		if ( ! this.swarmKey )
		{
			throw new Error( `invalid swarmKey` );
		}
		if ( ! Array.isArray( this.listenAddresses ) )
		{
			throw new Error( `invalid listenAddresses` );
		}
		if ( ! Array.isArray( this.announceAddresses ) )
		{
			throw new Error( `invalid announceAddresses` );
		}
		if ( ! Array.isArray( this.bootstrapperAddresses ) )
		{
			throw new Error( `invalid bootstrapperAddresses` );
		}
		if ( ! _.isFunction( this.callbackMessage ) )
		{
			throw new Error( `invalid callbackMessage` );
		}

		return {
			peerId : this.peerId,
			swarmKey : this.swarmKey,
			listenAddresses : this.listenAddresses,
			announceAddresses : this.announceAddresses,
			bootstrapperAddresses : this.bootstrapperAddresses,
			callbackMessage : this.callbackMessage,
		}
	}
}
