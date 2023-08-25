import chalk from 'chalk';

const usage = `
npm run <command> included in ${ chalk.bold( process.env.npm_package_name ) }:

Usage:

npm run ${ chalk.bold( 'help' ) }\t\t\t\t\t\t- this usage page
npm run ${ chalk.bold( 'demo -- --p {port} --peerId {filename}' ) }\t\t- run the demonstration


`

console.log( '%s', usage );
