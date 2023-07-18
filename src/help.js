import chalk from 'chalk';

const usage = `
npm run <command> included in ${ chalk.bold( process.env.npm_package_name ) }:

Usage:

npm run ${ chalk.bold( 'help' ) }\t\t- this usage page
npm run ${ chalk.bold( 'dev' ) }\t\t- run the program in development mode
npm run ${ chalk.bold( 'start' ) }\t\t- run the program in production mode
npm run ${ chalk.bold( 'swarm-key' ) }\t- create a new .swarmKey file if it does not exist


`

console.log( '%s', usage );
