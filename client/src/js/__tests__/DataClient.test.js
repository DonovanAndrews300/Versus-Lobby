import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataClient from '../DataClient';

describe('DataClient', () => {
    let dataClient;

    beforeEach(() => {
        vi.mock('axios', () => ({
            default: {
                get: vi.fn(() => Promise.resolve({ data: { key: 'value' } })),
                post: vi.fn(() => Promise.resolve({ status: 200 })),
            },
        }));
        
        global.WebSocket = vi.fn(() => ({
            send: vi.fn(),
            close: vi.fn(),
            onopen: vi.fn(),
            onmessage: vi.fn(),
            onerror: vi.fn(),
        }));
        dataClient = new DataClient('https://mock-api-url.com', 'wss://mock-ws-url.com', 'player1');
    });

    it('should initialize with given API and WebSocket URLs', () => {
        expect(dataClient.apiUrl).toBe('https://mock-api-url.com');
        expect(dataClient.wsUrl).toBe('wss://mock-ws-url.com');
        expect(dataClient.playerId).toBe('player1');
    });

    it('should connect to WebSocket server', () => {
        dataClient.connectWebSocket();
        expect(dataClient.ws).toBeDefined();
        expect(dataClient.ws.onopen).toBeInstanceOf(Function);
    });

    it('should handle onGameStateUpdate callback correctly', () => {
        const mockUpdate = vi.fn();
        dataClient.onGameStateUpdate = mockUpdate;
        dataClient.onGameStateUpdate({ state: 'newState' });
        expect(mockUpdate).toHaveBeenCalledWith({ state: 'newState' });
    });
});
