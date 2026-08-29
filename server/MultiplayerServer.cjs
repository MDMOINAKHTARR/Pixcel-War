const { WebSocketServer, WebSocket } = require('ws');
const { ethers } = require('ethers');

/**
 * Pixel-War Dedicated Matchmaking & Real-Time Race Sync Server
 * - Handles room codes (6 chars alphanumeric)
 * - Server-authoritative lap/checkpoint tracking and race finish resolution
 * - On-chain Monad Testnet escrow verification and result reporting
 */
const PORT = process.env.PORT || 8080;
const MONAD_RPC = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
const REPORTER_PRIVATE_KEY = process.env.REPORTER_PRIVATE_KEY; // Server-side secret
const WAGER_CONTRACT_ADDRESS = process.env.VITE_RACE_WAGER_ADDRESS;

// Initialize Monad on-chain provider & reporter signer
let reporterSigner = null;
if (REPORTER_PRIVATE_KEY && WAGER_CONTRACT_ADDRESS) {
  const provider = new ethers.JsonRpcProvider(MONAD_RPC);
  reporterSigner = new ethers.Wallet(REPORTER_PRIVATE_KEY, provider);
  console.log('⛓️ Monad Server Reporter Initialized:', reporterSigner.address);
}

const wss = new WebSocketServer({ port: PORT });
console.log(`🚀 Pixel-War Multiplayer Server listening on ws://localhost:${PORT}`);

const rooms = new Map(); // roomCode -> Room

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

class Room {
  constructor(code, hostId, trackId, wagerAmount, maxPlayers) {
    this.code = code;
    this.hostId = hostId;
    this.trackId = trackId || 'neon_city';
    this.wagerAmount = wagerAmount || '0';
    this.maxPlayers = Math.min(4, Math.max(2, maxPlayers || 4));
    this.onChainMatchId = null;
    this.state = 'LOBBY'; // LOBBY, RACING, FINISHED
    this.players = new Map(); // playerId -> { id, name, wallet, skin, deposited, ready, ws, lap, waypoint, finished, finishTime }
    this.finishOrder = [];
    this.createdAt = Date.now();
    this.lastActive = Date.now();
  }

  broadcast(message, excludeId = null) {
    const payload = JSON.stringify(message);
    for (const [id, p] of this.players) {
      if (id !== excludeId && p.ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(payload);
      }
    }
  }

  getLobbyData() {
    const playerList = [];
    for (const [id, p] of this.players) {
      playerList.push({
        id: p.id,
        name: p.name,
        wallet: p.wallet,
        skin: p.skin,
        isHost: id === this.hostId,
        deposited: p.deposited,
        ready: p.ready,
      });
    }
    return {
      type: 'LOBBY_STATE',
      roomCode: this.code,
      trackId: this.trackId,
      wagerAmount: this.wagerAmount,
      maxPlayers: this.maxPlayers,
      onChainMatchId: this.onChainMatchId,
      state: this.state,
      players: playerList,
    };
  }
}

wss.on('connection', (ws) => {
  let currentPlayerId = null;
  let currentRoomCode = null;

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // 1. CREATE ROOM
      if (msg.type === 'CREATE_ROOM') {
        const code = generateRoomCode();
        currentPlayerId = msg.playerId || Math.random().toString(36).substring(2, 9);
        currentRoomCode = code;

        const room = new Room(code, currentPlayerId, msg.trackId, msg.wagerAmount, msg.maxPlayers);
        room.onChainMatchId = msg.onChainMatchId || null;

        const isFree = !msg.wagerAmount || msg.wagerAmount === '0';
        room.players.set(currentPlayerId, {
          id: currentPlayerId,
          name: msg.playerName || 'HostPilot',
          wallet: msg.walletAddress || null,
          skin: msg.skin || 'red',
          deposited: isFree,
          ready: isFree,
          ws,
          lap: 1,
          waypoint: 0,
          finished: false,
          finishTime: 0,
        });

        rooms.set(code, room);
        ws.send(JSON.stringify({ type: 'ROOM_CREATED', roomCode: code, playerId: currentPlayerId }));
        ws.send(JSON.stringify(room.getLobbyData()));
        console.log(`[Room ${code}] Created by player ${currentPlayerId} (Wager: ${msg.wagerAmount} MON)`);
      }

      // 2. JOIN ROOM
      else if (msg.type === 'JOIN_ROOM') {
        const code = (msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(code);

        if (!room) {
          ws.send(JSON.stringify({ type: 'JOIN_ERROR', error: 'Room not found' }));
          return;
        }
        if (room.state !== 'LOBBY') {
          ws.send(JSON.stringify({ type: 'JOIN_ERROR', error: 'Race already in progress' }));
          return;
        }
        if (room.players.size >= room.maxPlayers) {
          ws.send(JSON.stringify({ type: 'JOIN_ERROR', error: 'Room is full (max 4 players)' }));
          return;
        }

        currentPlayerId = msg.playerId || Math.random().toString(36).substring(2, 9);
        currentRoomCode = code;
        room.lastActive = Date.now();

        const isFree = !room.wagerAmount || room.wagerAmount === '0';
        room.players.set(currentPlayerId, {
          id: currentPlayerId,
          name: msg.playerName || `Racer_${room.players.size + 1}`,
          wallet: msg.walletAddress || null,
          skin: msg.skin || 'surf',
          deposited: isFree,
          ready: isFree,
          ws,
          lap: 1,
          waypoint: 0,
          finished: false,
          finishTime: 0,
        });

        ws.send(JSON.stringify({ type: 'ROOM_JOINED', roomCode: code, playerId: currentPlayerId }));
        room.broadcast(room.getLobbyData());
        console.log(`[Room ${code}] Player ${currentPlayerId} joined. (${room.players.size}/${room.maxPlayers})`);
      }

      // 3. ON-CHAIN DEPOSIT CONFIRMATION
      else if (msg.type === 'CONFIRM_DEPOSIT') {
        const room = rooms.get(currentRoomCode);
        if (room && room.players.has(currentPlayerId)) {
          const p = room.players.get(currentPlayerId);
          p.deposited = true;
          p.ready = true;
          p.wallet = msg.walletAddress || p.wallet;
          room.lastActive = Date.now();
          room.broadcast(room.getLobbyData());
          console.log(`[Room ${room.code}] Player ${currentPlayerId} deposit confirmed on Monad.`);
        }
      }

      // 4. START RACE (Host only)
      else if (msg.type === 'START_RACE') {
        const room = rooms.get(currentRoomCode);
        if (room && room.hostId === currentPlayerId && room.state === 'LOBBY') {
          room.state = 'RACING';
          room.finishOrder = [];
          room.lastActive = Date.now();

          // Server locks on-chain match if wagering enabled
          if (reporterSigner && room.onChainMatchId && room.wagerAmount !== '0') {
            try {
              const wagerContract = new ethers.Contract(
                WAGER_CONTRACT_ADDRESS,
                ['function lockMatch(uint256 matchId)'],
                reporterSigner
              );
              console.log(`[Room ${room.code}] Locking Monad match #${room.onChainMatchId}...`);
              wagerContract.lockMatch(room.onChainMatchId).catch(console.warn);
            } catch (err) {
              console.warn('On-chain match lock error:', err);
            }
          }

          room.broadcast({ type: 'RACE_STARTING', countdown: 3, trackId: room.trackId });
          console.log(`[Room ${room.code}] Race started by host!`);
        }
      }

      // 5. REAL-TIME INPUT & POSITION SYNC
      else if (msg.type === 'SYNC_TRANSFORM') {
        const room = rooms.get(currentRoomCode);
        if (room && room.state === 'RACING') {
          room.lastActive = Date.now();
          // Server broadcast transforms to other clients
          room.broadcast(
            {
              type: 'REMOTE_KART_UPDATE',
              playerId: currentPlayerId,
              x: msg.x,
              y: msg.y,
              angle: msg.angle,
              speed: msg.speed,
              steer: msg.steer,
              drift: msg.drift,
              lap: msg.lap,
              waypoint: msg.waypoint,
            },
            currentPlayerId
          );

          // Server-authoritative lap finish validation
          const p = room.players.get(currentPlayerId);
          if (p && !p.finished && msg.lap > 3) {
            p.finished = true;
            p.finishTime = msg.finishTime || Date.now();
            room.finishOrder.push(p);

            room.broadcast({
              type: 'PLAYER_FINISHED',
              playerId: p.id,
              rank: room.finishOrder.length,
              finishTime: p.finishTime,
            });

            // Check if all racers finished
            if (room.finishOrder.length === room.players.size) {
              room.state = 'FINISHED';
              const winner = room.finishOrder[0];

              // Server reports result on-chain to trigger payout
              if (reporterSigner && room.onChainMatchId && winner.wallet) {
                try {
                  const rankedWallets = room.finishOrder
                    .filter((r) => r.wallet)
                    .map((r) => r.wallet);
                  const wagerContract = new ethers.Contract(
                    WAGER_CONTRACT_ADDRESS,
                    ['function reportResult(uint256 matchId, address[] calldata rankedPlayers)'],
                    reporterSigner
                  );
                  console.log(`[Room ${room.code}] Reporting winner ${winner.wallet} on Monad...`);
                  wagerContract.reportResult(room.onChainMatchId, rankedWallets).catch(console.warn);
                } catch (e) {
                  console.warn('On-chain payout report error:', e);
                }
              }

              room.broadcast({
                type: 'RACE_COMPLETED',
                winnerId: winner.id,
                winnerWallet: winner.wallet,
                results: room.finishOrder.map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, time: r.finishTime })),
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('WebSocket message processing error:', err);
    }
  });

  // Client disconnect handling
  ws.on('close', () => {
    if (currentRoomCode && rooms.has(currentRoomCode)) {
      const room = rooms.get(currentRoomCode);
      if (room.players.has(currentPlayerId)) {
        console.log(`[Room ${currentRoomCode}] Player ${currentPlayerId} disconnected.`);
        if (room.state === 'LOBBY') {
          room.players.delete(currentPlayerId);
          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          } else {
            if (room.hostId === currentPlayerId) {
              room.hostId = Array.from(room.players.keys())[0];
            }
            room.broadcast(room.getLobbyData());
          }
        } else if (room.state === 'RACING') {
          room.broadcast({ type: 'PLAYER_DISCONNECTED', playerId: currentPlayerId, isDNF: true });
        }
      }
    }
  });
});

// Periodic idle room cleanup (10 minutes timeout)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActive > 10 * 60 * 1000) {
      console.log(`[Cleanup] Room ${code} expired due to inactivity.`);
      rooms.delete(code);
    }
  }
}, 60000);
