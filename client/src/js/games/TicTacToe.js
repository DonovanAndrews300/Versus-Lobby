import Game from './Game.js';

export default class TicTacToe extends Game {
    constructor(dataClient) {
        super(dataClient);
        console.log('Constructing TicTacToe now');

        this._dataClient.onGameStateUpdate = (newGameState) => {
            this.mergePartialState(newGameState);

            if (newGameState.gameStarted && !this.gameStarted) {
                this.handleStartGameFromSync?.();
            }

            this.updateUI();
        };
    }

    initializeGameState() {
        return {
            game: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X'
        };
    }

    mergePartialState(newGameState) {
        if (!newGameState) return;

        if (newGameState.game) {
            this.gameState.game = this.gameState.game.map((cell, i) =>
                newGameState.game[i] !== undefined ? newGameState.game[i] : cell
            );
        }

        if (newGameState.currentPlayer !== undefined) {
            this.gameState.currentPlayer = newGameState.currentPlayer;
        }
    }

    updateUI() {
        this.updateGrid();
    }

    updateGrid() {
        const gridCells = document.querySelectorAll('.cell');
        gridCells.forEach(cell => {
            const cellIndex = parseInt(cell.getAttribute('data-cell-index'));
            if (cell.innerHTML !== this.gameState.game[cellIndex]) {
                cell.innerHTML = this.gameState.game[cellIndex];
            }
        });
    }

    handleCellClick(clickedCellEvent) {
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

        if (this.gameState.game[clickedCellIndex] !== '') return;

        this.gameState.game[clickedCellIndex] = this.gameState.currentPlayer;
        this.handleResult();
        this.handlePlayerChange();
        this.updateGrid();
        this.saveGameState();
    }

    handlePlayerChange() {
        this.gameState.currentPlayer =
            this.gameState.currentPlayer === 'X' ? 'O' : 'X';
    }

    handleResult() {
        let roundWon = false;
        const roundDraw = !this.gameState.game.includes('');

        const winConditions = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];

        winConditions.forEach(([a,b,c]) => {
            if (
                this.gameState.game[a] &&
                this.gameState.game[a] === this.gameState.game[b] &&
                this.gameState.game[a] === this.gameState.game[c]
            ) {
                roundWon = true;
            }
        });

        if (roundWon) {
            setTimeout(() => alert(`${this.gameState.currentPlayer} has won!`), 10);
            return;
        }

        if (roundDraw) {
            setTimeout(() => alert('Draw!'), 10);
        }
    }

    renderGame() {
        document.querySelector('#gameArea').innerHTML = `
            <div class="grid">
                ${Array.from({ length: 9 })
                    .map((_, i) => `<div data-cell-index="${i}" class="cell"></div>`)
                    .join('')}
            </div>
            <div class="buttons">
                <button class="game--restart">Restart Game</button>
            </div>
        `;

        this.updateGrid();
        this.handleClickEvents();
    }

    handleClickEvents() {
        document.querySelectorAll('.cell').forEach(cell =>
            cell.addEventListener('click', event => this.handleCellClick(event))
        );

        document.querySelector('.game--restart')
            .addEventListener('click', event => this.handleRestartGame(event));
    }
}