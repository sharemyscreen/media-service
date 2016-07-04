'use strict';

function Session(socket, user) {
	socket.client.user = user;
	socket.client.outgoingMedia = null;
	socket.client.incomingMedia = {};
	socket.client.iceCandidateQueue = {};

	console.log(`Opening Session: ${socket.id}, ${JSON.stringify(socket.client, null, 2)}`);

	socket.client.addIceCandidate = function (data, candidate) {
		if (data.sender === socket.client.socket.id) {
			if (socket.client.outgoingMedia) {
				socket.client.outgoingMedia.addIceCandidate(candidate);
				return;
			}
		} else {
			const webRtc = socket.client.incomingMedia[data.sender];

			if (webRtc) {
				webRtc.addIceCandidate(candidate);
				return;
			}
		}

		if (!socket.client.iceCandidateQueue[data.sender]) {
			socket.client.iceCandidateQueue[data.sender] = [];
		}
		socket.client.iceCandidateQueue[data.sender].push({
			data, candidate
		});
	};

	socket.client.sendMessage = function (data) {
		socket.emit('message', data);
	};
}

module.exports = Session;
