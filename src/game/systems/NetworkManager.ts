import { Vector2 } from '../physics/Vector2';

export interface MultiplayerCallbacks {
  onRoomCreated?: (roomCode: string, playerId: string) => void;
  onRoomJoined?: (roomCode: string, playerId: string) => void;
  onLobbyState?: (data: any) => void;
  onJoinError?: (error: string) => void;
  onRaceStarting?: (trackId: string, countdown: number) => void;
  onRemoteKartUpdate?: (data: any) => void;
  onPlayerFinished?: (playerId: string, rank: number) => void;
  onRaceCompleted?: (winnerId: string, results: any[]) => void;
  onPlayerDisconnected?: (playerId: string, isDNF: boolean) => void;
}

/**
 * NetworkManager
 * Client-side networking manager handling room matchmaking, deposit verification,
 * and real-time transform sync with the multiplayer server.
 */
export class NetworkManager {
  private static instance: NetworkManager | null = null;
  private ws: WebSocket | null = null;
  private serverUrl: string = 'ws://localhost:8080';
  private callbacks: MultiplayerCallbacks = {};
  public currentRoomCode: string | null = null;
  public localPlayerId: string | null = null;
  public isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public setCallbacks(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  public connect(serverUrl?: string): Promise<boolean> {
    if (serverUrl) this.serverUrl = serverUrl;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          console.log('Connected to Pixel-War Multiplayer Server:', this.serverUrl);
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.handleServerMessage(msg);
          } catch (e) {
            console.error('Error parsing server message:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('WebSocket connection error:', err);
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          console.log('Disconnected from Multiplayer Server');
        };
      } catch {
        resolve(false);
      }
    });
  }

  private handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'ROOM_CREATED':
        this.currentRoomCode = msg.roomCode;
        this.localPlayerId = msg.playerId;
        this.callbacks.onRoomCreated?.(msg.roomCode, msg.playerId);
        break;
      case 'ROOM_JOINED':
        this.currentRoomCode = msg.roomCode;
        this.localPlayerId = msg.playerId;
        this.callbacks.onRoomJoined?.(msg.roomCode, msg.playerId);
        break;
      case 'JOIN_ERROR':
        this.callbacks.onJoinError?.(msg.error);
        break;
      case 'LOBBY_STATE':
        this.callbacks.onLobbyState?.(msg);
        break;
      case 'RACE_STARTING':
        this.callbacks.onRaceStarting?.(msg.trackId, msg.countdown);
        break;
      case 'REMOTE_KART_UPDATE':
        this.callbacks.onRemoteKartUpdate?.(msg);
        break;
      case 'PLAYER_FINISHED':
        this.callbacks.onPlayerFinished?.(msg.playerId, msg.rank);
        break;
      case 'RACE_COMPLETED':
        this.callbacks.onRaceCompleted?.(msg.winnerId, msg.results);
        break;
      case 'PLAYER_DISCONNECTED':
        this.callbacks.onPlayerDisconnected?.(msg.playerId, msg.isDNF);
        break;
    }
  }

  public createRoom(options: { trackId: string; wagerAmount: string; maxPlayers: number; playerName: string; walletAddress?: string; skin?: string; onChainMatchId?: string }) {
    this.send({
      type: 'CREATE_ROOM',
      ...options,
    });
  }

  public joinRoom(roomCode: string, options: { playerName: string; walletAddress?: string; skin?: string }) {
    this.send({
      type: 'JOIN_ROOM',
      roomCode,
      ...options,
    });
  }

  public confirmDeposit(walletAddress: string) {
    this.send({
      type: 'CONFIRM_DEPOSIT',
      walletAddress,
    });
  }

  public startRace() {
    this.send({
      type: 'START_RACE',
    });
  }

  public sendTransform(data: { x: number; y: number; angle: number; speed: number; steer: number; drift: boolean; lap: number; waypoint: number; finishTime?: number }) {
    this.send({
      type: 'SYNC_TRANSFORM',
      ...data,
    });
  }

  private send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentRoomCode = null;
    this.localPlayerId = null;
  }
}
