function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function isDraw(board) {
  return board.every(cell => cell !== null);
}

module.exports = (state, action, playerId) => {
  console.log("handler", state, action, playerId);


  if (!state || !state.board) {
    state = {
      board: Array(9).fill(null),
      players: { X: null, O: null },
      turn: "X",
      winner: null,
      isDraw: false
    };
  }

  const { X, O } = state.players;

  // already assigned → do nothing
  if (X !== playerId && O !== playerId) {
    if (!X) {
      state.players.X = playerId;
    } else if (!O) {
      state.players.O = playerId;
    }
  }


  if (action.type === "MOVE") {
    const { index } = action;

    // game over lock
    if (state.winner || state.isDraw) return state;

    const symbol =
      state.players.X === playerId ? "X" :
      state.players.O === playerId ? "O" :
      null;

    if (!symbol) return state;
    if (state.turn !== symbol) return state;
    if (state.board[index] !== null) return state;

    const newBoard = [...state.board];
    newBoard[index] = symbol;

  
    const winner = checkWinner(newBoard);
    const draw = !winner && isDraw(newBoard);

    return {
      ...state,
      board: newBoard,
      turn: winner || draw ? state.turn : (symbol === "X" ? "O" : "X"),
      winner,
      isDraw: draw
    };
  }

  return state;
};