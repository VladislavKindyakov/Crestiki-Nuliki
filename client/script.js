let ws = new WebSocket("ws://213.171.15.15:8080");

const logo = document.querySelector('.logo');
const boardContainer = document.querySelector('.board__container');
const button = document.querySelector('.button');
const buttonLoader = document.querySelector('.button__loader');
const buttonText = document.querySelector('.button__text');
const resultContainer = document.querySelector('.result__container');
const resultText = document.querySelector('.result__text');
const onlineCounter = document.querySelector('.online-counter__count');
const cellElements = document.querySelectorAll('.cell');
let field = ["", "", "", "", "", "", "", "", ""];
let symbol = null;
let symbolName = null;
let turn = null;
let isGameActive = false;

let opponentName = null;


ws.onopen = function() {
	buttonText.textContent = "Начать игру";
	button.onclick = function() {
	
		ws.send(JSON.stringify({
			"method": "start"
		}));
	}
}

ws.onmessage = message => {
	const response = JSON.parse(message.data);

	if (response.method === "online") {
		onlineCounter.textContent = response.counter;
	}

	if (response.method === "search") {
		field = ["", "", "", "", "", "", "", "", ""];
		updateBoard();
		boardContainer.classList.remove('board__container_open');
		logo.classList.remove('logo_active');
		logo.querySelector('.logo__X').classList.remove("logo__X_disabled");
		logo.querySelector('.logo__O').classList.remove("logo__O_disabled");

		buttonLoader.classList.add("button__loader_active");
		buttonText.textContent = response.message;
		button.classList.add("button_disabled");
		button.onclick = function() {
			return
		}
	}
	
	if (response.method === "join") {
		symbol = response.symbol;
		symbolName = response.symbolName;
		turn = response.turn;
		opponentName = response.opponentName;
		message = response.message;
		isGameActive = symbol === turn;
		updateMessage();
		boardContainer.classList.add('board__container_open');
		logo.classList.add('logo_active');
	}

	if (response.method === "update") {
		turn = response.turn;
		field = response.field;
		isGameActive = symbol === turn;
		updateBoard();
		updateMessage();
	}

	if (response.method === "result") {
		field = response.field;
		updateBoard();
		isGameActive = false;
		button.classList.remove("button_disabled");
		buttonLoader.classList.remove("button__loader_active");
		buttonText.textContent = response.message;
		resultText.textContent = response.messageStatus;
		resultContainer.classList.add("result__container_open");

		button.onclick = function() {
			ws.send(JSON.stringify({
				"method": "start"
			}));

			resultContainer.classList.remove("result__container_open");
			resultText.textContent = "";
		}
	}

	if (response.method === "left") {
		isGameActive = false;
		button.classList.remove("button_disabled");
		buttonLoader.classList.remove("button__loader_active");
		buttonText.textContent = response.message;
		resultText.textContent = response.messageStatus;
		resultContainer.classList.add("result__container_open");

		button.onclick = function() {			
			ws.send(JSON.stringify({
				"method": "start"
			}));

			resultContainer.classList.remove("result__container_open");
			resultText.textContent = "";
		}
	}
};

cellElements.forEach((cell, index) => {
	cell.onclick = function(e) {
		makeMove(e.target, index);
	}
})

function makeMove(cell, index) {
	if (!isGameActive || field [index] !== "") return;

	isGameActive = false;
	cell.classList.add(symbol);
	field[index] = symbol;

	ws.send(JSON.stringify({
		"method": "move",
		"symbol": symbol,
		"symbolName": symbolName,
		"field": field
	}))
}

function updateBoard() {
	cellElements.forEach((cell, index) => {
		cell.classList.remove("X", "O");
		field[index] !== "" && cell.classList.add(field[index]);
	})
}

function updateMessage() {
	if (symbol === "X" && symbol === turn) {
		button.classList.remove("button_disabled");
		buttonText.textContent = "Твой ход";
		buttonLoader.classList.remove("button__loader_active");
		logo.querySelector('.logo__X').classList.remove("logo__X_disabled");
		logo.querySelector('.logo__O').classList.add("logo__O_disabled");
	}

	if (symbol === "X" && symbol !== turn) {
		button.classList.add("button_disabled");
		buttonText.textContent = `Ходит ${opponentName}`;
		buttonLoader.classList.add("button__loader_active");
		logo.querySelector('.logo__X').classList.add("logo__X_disabled");
		logo.querySelector('.logo__O').classList.remove("logo__O_disabled");
	}

	if (symbol === "O" && symbol === turn) {
		button.classList.remove("button_disabled");
		buttonText.textContent = "Твой ход";
		buttonLoader.classList.remove("button__loader_active");
		logo.querySelector('.logo__X').classList.add("logo__X_disabled");
		logo.querySelector('.logo__O').classList.remove("logo__O_disabled");
	}

	if (symbol === "O" && symbol !== turn) {
		button.classList.add("button_disabled");
		buttonText.textContent = `Ходит ${opponentName}`;
		buttonLoader.classList.add("button__loader_active");
		logo.querySelector('.logo__X').classList.remove("logo__X_disabled");
		logo.querySelector('.logo__O').classList.add("logo__O_disabled");
	}
};