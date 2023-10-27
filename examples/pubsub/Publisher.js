import chalk from "chalk";
import { PubSubBase } from "./PubSubBase.js";


class Publisher extends PubSubBase
{
	constructor()
	{
		super();
	}

	async start()
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				await super.start( ( _param ) =>
				{
					//	message
				});

				//	...
				setInterval(async () =>
				{
					const networkError = this.checkerHealth();
					if ( null !== networkError )
					{
						console.log( `${ chalk.bgRed( 'Network error' ) } : `, networkError );
						return false;
					}

					//	...
					this.printNetworkInfo();

					const datetime = new Date().toISOString();
					const pubObject = {
						peerId : this.relayService.getPeerId() ? this.relayService.getPeerId().toString() : null,
						datetime : datetime,
						message : 'hello world!',
					};
					const publishResult = await this.relayService.publish( this.subTopic, pubObject );
					console.log( `[${ datetime }] publish data to topic(${ this.subTopic }): `, pubObject );
					console.log( `publishResult: `, publishResult );

				}, 100 );

				//	...
				resolve( true );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}
}

//	...
new Publisher().start().then( _result =>{}).catch( _err => console.error );
