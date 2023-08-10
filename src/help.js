import chalk from 'chalk';

const usage = `
npm run <command> included in ${ chalk.bold( process.env.npm_package_name ) }:

Usage:

npm run ${ chalk.bold( 'help' ) }\t\t\t\t\t\t- this usage page
npm run ${ chalk.bold( 'dev -- --p {port} --peerId {filename}' ) }\t\t- run the program in development mode
npm run ${ chalk.bold( 'start -- --p {port} --peerId {filename}' ) }\t\t- run the program in production mode



`

console.log( '%s', usage );
