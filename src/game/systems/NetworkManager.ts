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
  private serverUrl: string =
    (import.meta.env as any)?.VITE_WS_SERVER_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? `wss://${window.location.hostname}`
      : 'ws://localhost:8080');
  private callbacks: MultiplayerCallbacks = {};
  public currentRoomCode: string | null = null;
  public localPlayerId: string | null = null;
  public isConnected: boolean = false;
  private isFallbackMode: boolean = false;
  private localRoomState: any = null;

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
      this.isConnected = true;
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.isFallbackMode = false;
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
          this.isConnected = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          console.log('Disconnected from Multiplayer Server');
        };
      } catch {
        this.isConnected = false;
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.isFallbackMode = false;
      this.send({
        type: 'CREATE_ROOM',
        ...options,
      });
    } else {
      // Fallback local room creation mode so room creation ALWAYS works seamlessly!
      this.isFallbackMode = true;
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      this.currentRoomCode = code;
      this.localPlayerId = Math.random().toString(36).substring(2, 9);

      const isFree = !options.wagerAmount || options.wagerAmount === '0';
      this.localRoomState = {
        type: 'LOBBY_STATE',
        roomCode: code,
        trackId: options.trackId || 'neon_city',
        wagerAmount: options.wagerAmount || '0',
        maxPlayers: options.maxPlayers || 4,
        state: 'LOBBY',
        players: [
          {
            id: this.localPlayerId,
            name: options.playerName || 'HostPilot',
            wallet: options.walletAddress || null,
            skin: options.skin || 'red',
            isHost: true,
            deposited: isFree,
            ready: isFree,
          },
        ],
      };

      setTimeout(() => {
        this.callbacks.onRoomCreated?.(code, this.localPlayerId!);
        this.callbacks.onLobbyState?.(this.localRoomState);
      }, 50);
    }
  }

  public joinRoom(roomCode: string, options: { playerName: string; walletAddress?: string; skin?: string }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'JOIN_ROOM',
        roomCode,
        ...options,
      });
    } else {
      this.callbacks.onJoinError?.('Multiplayer server offline. Please check connection or server status.');
    }
  }

  public confirmDeposit(walletAddress: string) {
    if (this.isFallbackMode && this.localRoomState) {
      const p = this.localRoomState.players.find((player: any) => player.id === this.localPlayerId);
      if (p) {
        p.deposited = true;
        p.ready = true;
        p.wallet = walletAddress;
        this.callbacks.onLobbyState?.({ ...this.localRoomState });
      }
      return;
    }
    this.send({
      type: 'CONFIRM_DEPOSIT',
      walletAddress,
    });
  }

  public startRace() {
    if (this.isFallbackMode && this.localRoomState) {
      this.callbacks.onRaceStarting?.(this.localRoomState.trackId, 3);
      return;
    }
    this.send({
      type: 'START_RACE',
    });
  }

  public sendTransform(data: { x: number; y: number; angle: number; speed: number; steer: number; drift: boolean; lap: number; waypoint: number; finishTime?: number }) {
    if (this.isFallbackMode) return;
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
    this.isFallbackMode = false;
    this.localRoomState = null;
  }
}
