import Game from './Game.js';

export default class TicTacToe extends Game {
    constructor(dataClient) {
        super(dataClient);

        console.log('Constructing TicTacToe now');

        this.renderGame();
    }

    // 🎮 USER INPUT → SERVER ACTION
    handleCellClick(event) {
        const index = Number(event.target.dataset.cellIndex);

        const board = this.state?.game;
        const cellValue = board?.[index];

        if (cellValue) return;


        this.dispatch({
            type: "MOVE",
            index
        });
    }

    updateUI(state) {
        if (!state) return;
        const board = state.board;
        const cells = document.querySelectorAll('.cell');

        cells.forEach((cell, i) => {
            const value = board[i];
            cell.textContent = value || "";
        });
    }

    // 🧱 INITIAL RENDER
    renderGame() {
        document.querySelector('#gameArea').innerHTML = `
            <div class="grid">
                ${Array.from({ length: 9 })
                    .map((_, i) =>
                        `<div data-cell-index="${i}" class="cell"></div>`
                    )
                    .join('')}
            </div>
            <div class="buttons">
                <button class="game--restart">Restart Game</button>
            </div>
        `;

        this.handleClickEvents();
    }

    // 🎯 EVENT BINDING
    handleClickEvents() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) =>
                this.handleCellClick(e)
            );
        });

        document
            .querySelector('.game--restart')
            .addEventListener('click', () => {
                this.dispatch({ type: "RESET_GAME" });
            });
    }
}