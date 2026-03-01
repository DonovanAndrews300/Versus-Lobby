import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataClient from '../DataClient.js';
import Game from '../games/Game.js';
import TicTacToe from '../games/TicTacToe.js';
import PingPong from '../games/PingPong.js';

describe('TicTacToe', () => {
  let ticTacToe;

  beforeEach(() => {
    const mockDataClient = new DataClient('https://mock-api-url.com', 'wss://mock-ws-url.com', 'player1');
    vi.spyOn(mockDataClient, 'connectWebSocket').mockImplementation(() => {});
    vi.spyOn(document, 'addEventListener').mockReturnValue({ innerHTML: 'Mocked content' });
    ticTacToe = new TicTacToe(mockDataClient);
  });

  it('should initialize with a log message', () => {
    console.log = vi.fn();
    new TicTacToe(ticTacToe._dataClient);
    expect(console.log).toHaveBeenCalledWith('Constructing TicTacToe now');
  });

  it('should handle merging partial game states', () => {
    const partialState = { moves: ['X', 'O'] };
    ticTacToe.mergePartialState = vi.fn();
    ticTacToe._dataClient.onGameStateUpdate(partialState);
    expect(ticTacToe.mergePartialState).toHaveBeenCalledWith(partialState);
  });
});

describe('PingPong', () => {
  let mockDataClient;
  let pingPong;

  beforeEach(() => {
    mockDataClient = {
      onGameStateUpdate: vi.fn(),
      saveGameState: vi.fn(),
      initializeGameState: vi.fn(),
      connectWebSocket: vi.fn(),
      sendGameStateUpdate: vi.fn(),
    };
    pingPong = new PingPong(mockDataClient);
  });

  it('should initialize correctly', () => {
    expect(pingPong).toBeDefined();
    expect(pingPong.gameState).toBeDefined();
    expect(pingPong.player).toBeNull();
    expect(pingPong.gameStarted).toBe(false);
  });

  it('should call saveGameState when initializing game state', () => {
    const gameStateMock = {
      ball: {
        dx: 1,
        dy: 1,
        size: 10,
        x: 300,
        y: 200,
      },
      gameStarted: false,
      isRestarted: false,
      paddle1: {
        height: 100,
        width: 10,
        y: 150,
      },
      paddle2: {
        height: 100,
        width: 10,
        y: 150,
      },
      score1: 0,
      score2: 0,
    };

    const saveGameState = vi.spyOn(pingPong, 'saveGameState');
    pingPong.initializeGameState();
    expect(saveGameState).toHaveBeenCalledWith(gameStateMock);
  });

  it('should handle game start correctly', () => {
    const startButton = { style: { display: 'block' } };
    const restartButton = { style: { display: 'none' } };

    document.querySelector = vi.fn().mockImplementation((selector) => {
      if (selector === '.game--start') return startButton;
      if (selector === '.game--restart') return restartButton;
    });

    const saveGameState = vi.spyOn(pingPong, 'saveGameState');
    pingPong.handleStartGame(startButton, restartButton);

    expect(saveGameState).toHaveBeenCalledWith({ gameStarted: true });
    expect(startButton.style.display).toBe('none');
    expect(restartButton.style.display).toBe('inline');
  });
});
