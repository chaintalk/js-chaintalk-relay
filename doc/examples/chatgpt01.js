const Libp2p = require('libp2p');
const WebRTCStar = require('libp2p-webrtc-star');
const MPLEX = require('libp2p-mplex');
const SECIO = require('libp2p-secio');
const Bootstrap = require('libp2p-bootstrap');
const KadDHT = require('libp2p-kad-dht');
const multiaddr = require('multiaddr');
const PeerId = require('peer-id');
const PeerInfo = require('peer-info');
const pipe = require('it-pipe');
const pushable = require('it-pushable');

async function createNode(peerId) {
	const node = await Libp2p.create({
		peerId,
		addresses: {
			listen: ['/ip4/0.0.0.0/tcp/0', '/ip4/0.0.0.0/udp/0/quic', '/ip4/0.0.0.0/tcp/4002/ws'],
		},
		modules: {
			transport: [WebRTCStar],
			streamMuxer: [MPLEX],
			connEncryption: [SECIO],
			peerDiscovery: [Bootstrap],
			dht: KadDHT,
		},
		config: {
			peerDiscovery: {
				bootstrap: {
					enabled: true,
					list: ['/ip4/127.0.0.1/tcp/63785/ws/p2p-webrtc-star/']
				}
			},
			dht: {
				enabled: true,
				randomWalk: {
					enabled: true,
				},
			},
		},
	});

	await node.start();
	console.log('Node started. ID:', node.peerId.toB58String());
	return node;
}

async function main() {
	const peerId = await PeerId.create({ bits: 2048 });
	const node = await createNode(peerId);

	node.connectionManager.on('peer:connect', (connection) => {
		console.log('Connected to:', connection.remotePeer.toB58String());
	});

	node.connectionManager.on('peer:disconnect', (connection) => {
		console.log('Disconnected from:', connection.remotePeer.toB58String());
	});

	const topic = 'my-chat-room';
	const p2pChat = pushable();

	// Handle incoming messages
	node.pubsub.subscribe(topic, (msg) => {
		console.log('Received message:', msg.data.toString());
	});

	// Function to send messages
	const sendMessage = async (message) => {
		try {
			await pipe([message], p2pChat.sink);
		} catch (err) {
			console.error('Error sending message:', err);
		}
	};

	// Example of sending a message
	sendMessage('Hello, World!');

	// Close the node when the process is terminated
	process.on('SIGTERM', async () => {
		await node.stop();
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
