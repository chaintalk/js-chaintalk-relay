import chalk from "chalk";
import { PubSubBase } from "./PubSubBase.js";


class Subscriber extends PubSubBase
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
				await super.start( ( param ) =>
				{
					console.log( `received a new message >>>>>>>>>>>>>>>>>>>>>>>>>>>>>> :` );
					console.log( `- type :`, param.type );
					console.log( `- topic :`, param.topic );
					console.log( `- msgId :`, param.msgId );
					console.log( `- from :`, param.from ? param.from.toString() : null );
					console.log( `- sequenceNumber :`, param.sequenceNumber );
					console.log( `- body :`, param.body );
				});

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
new Subscriber().start().then( result =>{}).catch( err => console.error );
