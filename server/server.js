const express = require('express');
const path = require('path');
const http = require('http');
const webSocket = require('ws');

const app = express();
app.use(express.static(path.join(__dirname, "..", "client")));
app.listen(3000);

const httpServer = http.createServer();
const wss = new webSocket.Server({ server: httpServer });
httpServer.listen(8080);

const clientConnections = {};
const opponents = [];
let clientIdsWaitingMatch = [];
let clientConnectionsList = [];

wss.on("connection", connection => {
	const clientId = createClientId();
	clientConnections[clientId] = connection;

	clientConnectionsList.push(clientId);

	clientConnectionsList.forEach(cId => {
		clientConnections[cId].send(JSON.stringify({
			method: "online",
			counter: clientConnectionsList.length
		}))
	})

	connection.on("message", message => {
		const result = JSON.parse(message);
		
		if (result.method === "start") {
			matchClients(clientId);
		}

		if (result.method === "move") {
			moveHandler(result, clientId);
		}

		if (result.method === "reset") {
			matchClients(clientId);
		}
	});

	connection.on("close", () => {
		closeClient(connection, clientId);
		clientConnectionsList = clientConnectionsList.filter(newList => newList !== clientId)

		clientConnectionsList.forEach(cId => {
			clientConnections[cId].send(JSON.stringify({
				method: "online",
				counter: clientConnectionsList.length
			}))
		})
	});
});

function matchClients(clientId) {
	clientIdsWaitingMatch.push(clientId);

	clientConnections[clientId].send(JSON.stringify({
		method: "search",
		message: "Поиск игры"
	}))

	setTimeout(() => {
		if (clientIdsWaitingMatch.length < 2) return;
	
		const firstClientId = clientIdsWaitingMatch.shift();
		const secondClientId = clientIdsWaitingMatch.shift();
	
		opponents[firstClientId] = secondClientId;
		opponents[secondClientId] = firstClientId;
	
		clientConnections[firstClientId].send(JSON.stringify({
			method: "join",
			symbol: "X",
			symbolName: "Крестик",
			turn: "X",
			opponentName: "Нулик"
		}));
	
		clientConnections[secondClientId].send(JSON.stringify({
			method: "join",
			symbol: "O",
			symbolName: "Нулик",
			turn: "X",
			opponentName: "Крестик"
		}))
	}, 600);
}

function moveHandler(result, clientId) {
	const opponentClientId = opponents[clientId];

	if (checkWin(result.field)) {
		[clientId, opponentClientId].forEach(cId => {
			clientConnections[cId].send(JSON.stringify({
				method: "result",
				message: "Новая игра",
				messageStatus: `${result.symbolName} победил!`,
				field: result.field
			}));
		});
		return
	}

	if (checkDraw(result.field)) {
		[clientId, opponentClientId].forEach(cId => {
			clientConnections[cId].send(JSON.stringify({
				method: "result",
				message: "Новая игра",
				messageStatus: "Ничья!",
				field: result.field
			}));
		});
		return
	}

	[clientId, opponentClientId].forEach(cId => {
		clientConnections[cId].send(JSON.stringify({
			method: "update",
			turn: result.symbol === "X" ? "O" : "X",
			field: result.field
		}));
	});
}

function closeClient(connection, clientId) {
  connection.close();
  const isLeftUnmatchedClient = clientIdsWaitingMatch.some(unmatchedClientId => unmatchedClientId === clientId);
	const isOpponent = opponents.some(opponent => opponent === clientId);

  if (isLeftUnmatchedClient) {
    clientIdsWaitingMatch = clientIdsWaitingMatch.filter(unmatchedClientId => unmatchedClientId !== clientId);
  }

	if (isOpponent) {
		const opponentClientId = opponents[clientId];
		clientConnections[opponentClientId].send(JSON.stringify({
			method: "left",
			message: "Новая игра",
			messageStatus: "Противник отключился",
		}));
	}
}

const winningCombos = [
	[0, 1, 2], [3, 4, 5], [6, 7, 8], //Строки
	[0, 3, 6], [1, 4, 7], [2, 5, 8], //Столбцы
	[0, 4, 8], [2, 4, 6] 						 //Диагонали
]

function checkWin(field) {
	return winningCombos.some(combo => {
		const [first, second, third] = combo;
		return field[first] !== "" && field[first] === field[second] && field[first] === field[third];
	})
}

function checkDraw(field) {
	return field.every(symbol => symbol === "X" || symbol === "O");
}

let clientIdCounter = 0;

function createClientId() {
	clientIdCounter ++;
	return clientIdCounter;
};