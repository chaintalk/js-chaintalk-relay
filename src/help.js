import chalk from 'chalk';

const usage = `
npm run <command> included in ${ chalk.bold( process.env.npm_package_name ) }:

Usage:

npm run ${ chalk.bold( 'help' ) }\t\t\t\t\t- this usage page
npm run ${ chalk.bold( 'dev -- --p {port}' ) }\t\t\t- run the program in development mode
npm run ${ chalk.bold( 'start -- --p {port}' ) }\t\t\t- run the program in production mode
npm run ${ chalk.bold( 'swarm-key-generator' ) }\t\t\t- create a new .swarmKey file if it does not exist
npm run ${ chalk.bold( 'swarm-peers-generator -- --max {count}' ) }\t- generate swarm peers(/_swarmPeers.js, /_bootstrappers.js), default 20
npm run ${ chalk.bold( 'swarm-peers-view' ) }\t\t\t- view all available swarm peers

`

console.log( '%s', usage );
