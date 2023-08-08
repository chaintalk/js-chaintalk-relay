import chalk from 'chalk';
import { _swarmPeers } from '../../_swarmPeers.js';

const peers = `
All available swarm peers:
${ Object.keys( _swarmPeers ).join( ', ' ) }

`

console.log( '%s', peers );
