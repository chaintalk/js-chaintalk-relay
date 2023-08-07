import chalk from 'chalk';
import { _peerIds } from '../_peerIds.js';

const usage = `
npm run <command> included in ${ chalk.bold( process.env.npm_package_name ) }:

Usage:

npm run ${ chalk.bold( 'help' ) }\t\t\t\t\t- this usage page
npm run ${ chalk.bold( 'dev -- --p {id}' ) }\t\t\t\t- run the program in development mode
npm run ${ chalk.bold( 'start -- --p {id}' ) }\t\t\t- run the program in production mode
npm run ${ chalk.bold( 'swarm-key-generator' ) }\t\t\t- create a new .swarmKey file if it does not exist
npm run ${ chalk.bold( 'peer-id-generator -- --max {maxCount}' ) }\t- generate peer ids(/_peerIds.js)
npm run ${ chalk.bold( 'bootstrappers-generator -- --ip {ip}' ) }\t- generate bootstrappers(/_bootstrappers.js)


All available {id} list:
${ Object.keys( _peerIds ).join( ', ' ) }

`

console.log( '%s', usage );
