import { PlayerKart } from './entities/PlayerKart';
import { BotKart } from './entities/BotKart';
import { RemoteKart } from './entities/RemoteKart';
import { Kart, KartInput } from './entities/Kart';
import { Projectile } from './entities/Projectile';
import { Pickup } from './entities/Pickup';
import { Hazard } from './entities/Hazard';
import { ParticleEngine } from './systems/ParticleEngine';
import { SoundEngine } from './systems/SoundEngine';
import { NetworkManager } from './systems/NetworkManager';
import { MAPS } from './maps/MapData';
import { Collision } from './physics/Collision';
import { Vector2 } from './physics/Vector2';
import { PixelCityRenderer } from './graphics/PixelCityRenderer';
import { SpawnValidator } from './physics/SpawnValidator';
import { getPositionWeightedWeapon } from './config/weapons';
import {
  MapDefinition,
  MatchScore,
  CombatFeedEvent,
  GameMode,
  BotDifficulty,
  KartClassId,
  WeaponType,
} from '../types/game';

export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
  mapId: string;
  gameMode?: GameMode;
  botCount?: number;
  botDifficulty?: BotDifficulty;
  playerClass?: KartClassId;
  playerName?: string;
  playerColors?: { body?: string; accent?: string; underglow?: string; skinId?: any };
  matchDuration?: number;
  isMultiplayer?: boolean;
  onScoreUpdate?: (scores: MatchScore[]) => void;
  onCombatEvent?: (event: CombatFeedEvent) => void;
  onMatchEnd?: (winner: MatchScore, allScores: MatchScore[]) => void;
  onTimerTick?: (timeLeft: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public options: GameEngineOptions;

  public map: MapDefinition;
  public player: PlayerKart;
  public bots: BotKart[] = [];
  public remotePlayers: Map<string, RemoteKart> = new Map();
  public projectiles: Projectile[] = [];
  public pickups: Pickup[] = [];
  public hazards: Hazard[] = [];

  public particleEngine: ParticleEngine;
  public soundEngine: SoundEngine;

  // Camera & Screen Shake
  public cameraPos: Vector2 = new Vector2(0, 0);
  public zoom: number = 1.0;
  public screenShake: number = 0;

  // Loop & Timing
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private animFrameId: number | null = null;
  private netSyncTimer: number = 0;

  public matchTimer: number = 90;
  public isMatchOver: boolean = false;
  private scoreUpdateTimer: number = 0;
  private lastReportedSecond: number = -1;

  constructor(options: GameEngineOptions) {
    this.options = options;
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not obtain 2D canvas context');
    this.ctx = ctx;

    this.map = MAPS[options.mapId] || MAPS['neon_city'];
    this.matchTimer = options.matchDuration || 90;

    this.particleEngine = new ParticleEngine();
    this.soundEngine = SoundEngine.getInstance();
    this.soundEngine.init();

    // Spawn Player
    const pSpawn = this.map.playerSpawns[0] || { x: 500, y: 500, rotation: 0 };
    this.player = new PlayerKart(
      'player_1',
      options.playerName || 'MonadPilot',
      options.playerClass || 'balanced',
      new Vector2(pSpawn.x, pSpawn.y),
      pSpawn.rotation,
      options.playerColors
    );

    // Spawn Bots ONLY in single player mode (options.isMultiplayer === false/undefined and options.botCount > 0)
    if (!options.isMultiplayer && (options.botCount ?? 4) > 0) {
      this.initBots();
    }

    // Set up real-time networking listeners if in online multiplayer mode
    if (options.isMultiplayer) {
      this.initMultiplayerSync();
    }

    // Spawn Pickups & Hazards
    this.initMapEntities();

    // Initial Camera
    this.cameraPos.copy(this.player.position);

    this.resizeCanvas();
    window.addEventListener('resize', this.onResize);

    // Resume sound on user interaction
    this.canvas.addEventListener('click', () => {
      this.soundEngine.resume();
    });
    this.canvas.addEventListener('keydown', () => {
      this.soundEngine.resume();
    });
  }

  private initMultiplayerSync() {
    const net = NetworkManager.getInstance();
    net.setCallbacks({
      onRemoteKartUpdate: (data) => {
        if (data.playerId === net.localPlayerId) return;

        let remote = this.remotePlayers.get(data.playerId);
        if (!remote) {
          const spawnIndex = (this.remotePlayers.size + 1) % this.map.playerSpawns.length;
          const spawn = this.map.playerSpawns[spawnIndex] || { x: 600, y: 600, rotation: 0 };
          remote = new RemoteKart(
            data.playerId,
            `Racer_${data.playerId.slice(0, 4)}`,
            'balanced',
            new Vector2(spawn.x, spawn.y),
            spawn.rotation,
            { skinId: 'surf' } as any
          );
          this.remotePlayers.set(data.playerId, remote);
        }

        remote.applyNetworkState(data);
      },
      onPlayerDisconnected: (playerId) => {
        this.remotePlayers.delete(playerId);
      },
    });
  }

  private onResize = () => {
    this.resizeCanvas();
  };

  private resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const w = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
    const h = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight - 64;
    this.canvas.width = Math.max(300, w);
    this.canvas.height = Math.max(300, h);
  }

  private initBots() {
    const botConfigs: { name: string; class: KartClassId; skin: any }[] = [
      { name: 'Sheriff Byte', class: 'balanced', skin: 'police' },
      { name: 'Wave Rider', class: 'drift', skin: 'surf' },
      { name: 'Red Comet', class: 'scout', skin: 'red' },
      { name: 'Lord Bigfoot', class: 'tank', skin: 'bigfoot' },
      { name: 'Shadow Ghost', class: 'cyber', skin: 'dark_m' },
      { name: 'Agro Titan', class: 'tank', skin: 'harvester' },
      { name: 'Santa Turbo', class: 'balanced', skin: 'santa' },
      { name: 'Classic Fox', class: 'drift', skin: 'roadster' },
    ];

    const targetBotCount = typeof this.options.botCount === 'number' ? this.options.botCount : 4;
    const count = Math.min(targetBotCount, this.map.playerSpawns.length - 1);

    for (let i = 0; i < count; i++) {
      const spawn = this.map.playerSpawns[i + 1] || { x: 600 + i * 200, y: 600, rotation: 0 };
      const config = botConfigs[i % botConfigs.length];

      const bot = new BotKart(
        `bot_${i + 1}`,
        config.name,
        config.class,
        new Vector2(spawn.x, spawn.y),
        spawn.rotation,
        this.options.botDifficulty || 'veteran',
        { skinId: config.skin } as any
      );
      this.bots.push(bot);
    }
  }

  private initMapEntities() {
    // Pickups (Mystery Crates, Nitros, Health, Shields, Coins) - Validated against map collision
    const validSpawns = SpawnValidator.sanitizePickupSpawns(this.map);
    for (const p of validSpawns) {
      this.pickups.push(new Pickup(p.type, new Vector2(p.x, p.y)));
    }

    // Boost Pads / Hazards
    for (const h of this.map.hazards) {
      this.hazards.push(new Hazard(h));
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.soundEngine.stopEngineSound();
    window.removeEventListener('resize', this.onResize);
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    } else {
      this.soundEngine.stopEngineSound();
    }
    return this.isPaused;
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (dt > 0.1) dt = 0.1;

    if (!this.isPaused && !this.isMatchOver) {
      this.update(dt);
    }

    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const isBattleMode = this.options.gameMode === 'battle';

    // 1. Timer countdown
    this.matchTimer -= dt;
    const currentSec = Math.ceil(this.matchTimer);
    if (currentSec !== this.lastReportedSecond) {
      this.lastReportedSecond = currentSec;
      if (this.options.onTimerTick) {
        this.options.onTimerTick(Math.max(0, currentSec));
      }
    }

    if (this.matchTimer <= 0 && !this.isMatchOver) {
      this.endMatch();
      return;
    }

    // Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    const remotesArray = Array.from(this.remotePlayers.values());
    const allKarts: Kart[] = [this.player, ...this.bots, ...remotesArray];

    // 2. Update Pickups & Hazards
    for (const p of this.pickups) {
      p.update(dt);
    }
    for (const h of this.hazards) {
      h.update(dt);
    }

    // 3. Update Player
    const playerInput = this.player.getInput();
    this.player.update(dt, playerInput, this.particleEngine, this.soundEngine);
    this.player.checkWaypointProgress(this.map.waypoints);

    // Broadcast local player transform across network in multiplayer mode (30Hz tick)
    if (this.options.isMultiplayer) {
      this.netSyncTimer += dt;
      if (this.netSyncTimer >= 0.033) {
        this.netSyncTimer = 0;
        NetworkManager.getInstance().sendTransform({
          x: this.player.position.x,
          y: this.player.position.y,
          angle: this.player.angle,
          speed: this.player.speed,
          steer: playerInput.steer,
          drift: this.player.isDrifting,
          lap: this.player.currentLap,
          waypoint: this.player.currentWaypointIndex,
          finishTime: this.player.finishTime || undefined,
        });
      }
    }

    // Player Weapon Firing
    if (playerInput.fire) {
      const shots = this.player.fireWeapon();
      if (shots && shots.length > 0) {
        this.projectiles.push(...shots);
        this.soundEngine.playWeaponFire(shots[0].type);
      }
    }

    // Engine Sound
    const maxSpeed = this.player.classDef.stats.topSpeed;
    const speedRatio = Math.min(1.0, this.player.speed / maxSpeed);
    this.soundEngine.updateEngineSound(speedRatio, playerInput.throttle > 0);

    // 4. Update Bot AI & Firing
    for (const bot of this.bots) {
      const botInput = bot.updateAI(dt, allKarts, this.pickups, this.map.waypoints, isBattleMode);
      bot.update(dt, botInput, this.particleEngine, this.soundEngine);

      if (botInput.fire) {
        const shots = bot.fireWeapon(bot.targetPos);
        if (shots && shots.length > 0) {
          this.projectiles.push(...shots);
          if (this.cameraPos.distanceTo(bot.position) < 800) {
            this.soundEngine.playWeaponFire(shots[0].type);
          }
        }
      }
    }

    // 4.5. Update Remote Human Players
    for (const remote of remotesArray) {
      remote.updateRemote(dt, this.particleEngine, this.soundEngine);
    }

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, this.particleEngine);

      if (proj.isDead) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check Projectile vs Obstacle Collisions
      for (const obs of this.map.obstacles) {
        if (Collision.pointInBox(proj.position, obs.x, obs.y, obs.width, obs.height)) {
          proj.isDead = true;
          this.particleEngine.emitExplosion(proj.position, 12, '#ff007f');
          this.soundEngine.playExplosion();
          break;
        }
      }

      if (proj.isDead) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check Projectile vs Kart Collisions
      for (const kart of allKarts) {
        if (kart.isDead || kart.id === proj.ownerId) continue;

        if (Collision.circleCircle(proj.position, proj.radius, kart.position, kart.radius)) {
          proj.isDead = true;
          const killed = kart.takeDamage(proj.damage, proj.ownerId);

          if (proj.type === 'cryo') {
            kart.applyFreeze(2.5);
            this.soundEngine.playFreeze();
          }

          this.particleEngine.emitExplosion(proj.position, 20, '#00f0ff');
          this.soundEngine.playExplosion();

          if (kart.isPlayer) {
            this.screenShake = 15;
          }

          // Combat event logging & score awards
          const attacker = allKarts.find((k) => k.id === proj.ownerId);
          if (attacker) {
            attacker.damageDealt += proj.damage;
            attacker.score += proj.damage;

            if (killed) {
              attacker.kills += 1;
              attacker.score += 100;

              const combatEvent: CombatFeedEvent = {
                id: `kill_${Date.now()}_${Math.random()}`,
                attackerId: attacker.id,
                attackerName: attacker.name,
                victimId: kart.id,
                victimName: kart.name,
                weapon: proj.type,
                timestamp: Date.now(),
              };

              if (this.options.onCombatEvent) {
                this.options.onCombatEvent(combatEvent);
              }
            }
          }

          break;
        }
      }
    }

    // 6. Kart vs Pickup Collisions
    for (const pickup of this.pickups) {
      if (!pickup.isActive) continue;

      for (const kart of allKarts) {
        if (kart.isDead) continue;

        if (Collision.circleCircle(kart.position, kart.radius, pickup.position, pickup.radius)) {
          pickup.collect();

          if (pickup.type === 'mystery_box') {
            const currentPosition = kart.racePosition || 1;
            const totalRacers = allKarts.length;
            const rolledWeapon = getPositionWeightedWeapon(currentPosition, totalRacers);
            kart.giveWeapon(rolledWeapon);
            this.particleEngine.emitSparks(pickup.position, 12);
          } else if (pickup.type === 'nitro' || pickup.type === 'nitro_tank') {
            kart.applyBoost(2.2, 1.8);
            this.particleEngine.emitBoostFlames(kart.position, kart.angle);
          } else if (pickup.type === 'repair_kit') {
            kart.heal(50);
          } else if (pickup.type === 'shield_pack') {
            kart.rechargeShield(40);
          } else if (pickup.type === 'monad_coin') {
            kart.coinsCollected += 10;
            kart.score += 25;
            this.particleEngine.emitCoinSparkles(pickup.position);
          }

          if (kart.isPlayer) {
            this.soundEngine.playPickup(pickup.type);
          }
        }
      }
    }

    // 7. Kart vs Kart Elastic Collisions
    for (let i = 0; i < allKarts.length; i++) {
      for (let j = i + 1; j < allKarts.length; j++) {
        const kA = allKarts[i];
        const kB = allKarts[j];
        if (kA.isDead || kB.isDead) continue;

        if (Collision.circleCircle(kA.position, kA.radius, kB.position, kB.radius)) {
          Collision.resolveElasticCollision(
            kA.position,
            kA.velocity,
            kA.classDef.stats.weight,
            kB.position,
            kB.velocity,
            kB.classDef.stats.weight
          );
          this.particleEngine.emitSparks(kA.position.clone().add(kB.position).multiplyScalar(0.5), 6);
          if (kA.isPlayer || kB.isPlayer) {
            this.soundEngine.playHit();
          }
        }
      }
    }

    // 8. Kart vs Obstacle & Boost Pad Triggers
    for (const kart of allKarts) {
      if (kart.isDead) {
        if (kart.respawnTimer <= 0) {
          const pSpawn = this.map.playerSpawns[Math.floor(Math.random() * this.map.playerSpawns.length)];
          kart.respawn(new Vector2(pSpawn.x, pSpawn.y), pSpawn.rotation);
        }
        continue;
      }

      for (const obs of this.map.obstacles) {
        const resolution = Collision.resolveCircleBox(kart.position, kart.radius, obs.x, obs.y, obs.width, obs.height);
        if (resolution.collided) {
          kart.position.add(resolution.penetration);
          kart.velocity.multiplyScalar(0.7);
          this.particleEngine.emitSparks(kart.position, 4);
        }
      }

      for (const hazard of this.hazards) {
        if (hazard.type === 'boost_pad' && hazard.containsPoint(kart.position)) {
          kart.applyBoost(1.4, 1.6);
          this.particleEngine.emitBoostFlames(kart.position, kart.angle);
          if (kart.isPlayer) {
            this.soundEngine.playBoost();
          }
        }
      }
    }

    // 9. Update Particles
    this.particleEngine.update(dt);

    // 10. Update Dynamic Camera Tracking
    const lookAhead = this.player.velocity.clone().multiplyScalar(0.35);
    const targetCam = this.player.position.clone().add(lookAhead);
    this.cameraPos.lerp(targetCam, 0.08);

    if (this.screenShake > 0) {
      this.cameraPos.x += (Math.random() - 0.5) * this.screenShake;
      this.cameraPos.y += (Math.random() - 0.5) * this.screenShake;
    }

    // 11. Calculate Live Racing Positions & Leaderboard
    this.scoreUpdateTimer += dt;
    if (this.scoreUpdateTimer >= 0.2) {
      this.scoreUpdateTimer = 0;

      // Sort racers by progress (lap -> waypoint index -> distance to next waypoint)
      allKarts.sort((a, b) => {
        if (a.currentLap !== b.currentLap) {
          return b.currentLap - a.currentLap;
        }
        if (a.currentWaypointIndex !== b.currentWaypointIndex) {
          return b.currentWaypointIndex - a.currentWaypointIndex;
        }
        const nextWp = this.map.waypoints[a.currentWaypointIndex % this.map.waypoints.length];
        if (nextWp) {
          const distA = a.position.distanceTo(new Vector2(nextWp.x, nextWp.y));
          const distB = b.position.distanceTo(new Vector2(nextWp.x, nextWp.y));
          return distA - distB;
        }
        return 0;
      });

      // Assign numeric ranks 1..N
      allKarts.forEach((k, idx) => {
        k.racePosition = idx + 1;
      });

      if (this.options.onScoreUpdate) {
        const scores: MatchScore[] = allKarts.map((k) => ({
          id: k.id,
          name: k.name,
          color: k.bodyColor,
          isPlayer: k.isPlayer,
          kills: k.kills,
          deaths: k.deaths,
          score: k.score,
          damageDealt: k.damageDealt,
          coinsCollected: k.coinsCollected,
          health: k.health,
          maxHealth: k.maxHealth,
          shield: k.shield,
          maxShield: k.maxShield,
        }));
        this.options.onScoreUpdate(scores);
      }
    }

    // 12. Check Win Condition for Racing mode (Player finishes 3 laps)
    if (!isBattleMode && this.player.raceFinished && !this.isMatchOver) {
      this.endMatch();
    }
  }

  private endMatch() {
    this.isMatchOver = true;
    this.soundEngine.stopEngineSound();

    const remotesArray = Array.from(this.remotePlayers.values());
    const allKarts = [this.player, ...this.bots, ...remotesArray];
    if (this.options.gameMode === 'battle') {
      allKarts.sort((a, b) => b.score - a.score || b.kills - a.kills);
    } else {
      allKarts.sort((a, b) => a.racePosition - b.racePosition);
    }

    const scores: MatchScore[] = allKarts.map((k, idx) => ({
      id: k.id,
      name: k.name,
      color: k.bodyColor,
      isPlayer: k.isPlayer,
      kills: k.kills,
      deaths: k.deaths,
      score: k.score,
      damageDealt: k.damageDealt,
      coinsCollected: idx === 0 ? 300 : idx === 1 ? 200 : idx === 2 ? 100 : 50,
      health: k.health,
      maxHealth: k.maxHealth,
      shield: k.shield,
      maxShield: k.maxShield,
    }));

    if (this.options.onMatchEnd) {
      this.options.onMatchEnd(scores[0], scores);
    }
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = this.map.bgColor;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cameraPos.x, -this.cameraPos.y);

    // 1 & 2. Ground Terrain, Road Markings, Buildings & District Scenery
    if (this.map.id === 'neon_city' || this.map.theme === 'neon') {
      PixelCityRenderer.renderCityTrack(ctx, this.map);
    } else {
      this.renderMapGrid(ctx);
      this.renderTrackMarkingsAndScenery(ctx);
      this.renderObstacles(ctx);
    }

    // 3. Skid Marks
    this.particleEngine.renderSkidMarks(ctx);

    // 4. Boost Pads
    for (const hazard of this.hazards) {
      hazard.render(ctx);
    }

    // 5. Pickups (Mystery Crates, Nitros, Medkits, Shields)
    for (const pickup of this.pickups) {
      pickup.render(ctx);
    }

    // 7. Projectiles (Lasers, Blasters, Mines, Ice Missiles)
    for (const proj of this.projectiles) {
      proj.render(ctx);
    }

    // 8. Remote Human Karts
    for (const remote of this.remotePlayers.values()) {
      remote.render(ctx);
    }

    // 8.1. Bots (if single player)
    for (const bot of this.bots) {
      bot.render(ctx);
    }

    // 8.2. Local Player
    this.player.render(ctx);

    // 8.5. Pre-Firing Lock-On Targeting Reticle Cue
    if (!this.player.isDead && (this.player.currentWeapon === 'cryo' || this.player.currentWeapon === 'blaster')) {
      let closestEnemy: Kart | null = null;
      let minEnemyDist = 650;
      const potentialTargets = [...this.bots, ...Array.from(this.remotePlayers.values())];
      for (const enemy of potentialTargets) {
        if (enemy.isDead) continue;
        const dist = this.player.position.distanceTo(enemy.position);
        if (dist < minEnemyDist) {
          const toEnemy = enemy.position.clone().subtract(this.player.position);
          const enemyAngle = Math.atan2(toEnemy.y, toEnemy.x);
          let angleDiff = enemyAngle - this.player.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          if (Math.abs(angleDiff) < 0.6) {
            minEnemyDist = dist;
            closestEnemy = enemy;
          }
        }
      }
      if (closestEnemy) {
        Projectile.renderLockOnCue(ctx, closestEnemy.position, minEnemyDist < 450);
      }
    }

    // 9. Particle FX
    this.particleEngine.render(ctx);

    // 10. Map Outer Boundary
    ctx.strokeStyle = this.map.borderColor;
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.map.borderColor;
    ctx.strokeRect(0, 0, this.map.width, this.map.height);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private renderMapGrid(ctx: CanvasRenderingContext2D) {
    const gridSize = 100;
    ctx.strokeStyle = this.map.gridColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = 0; x <= this.map.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.map.height);
    }
    for (let y = 0; y <= this.map.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.map.width, y);
    }
    ctx.stroke();

    // Draw Starting Line Grid Boxes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    for (const spawn of this.map.playerSpawns) {
      ctx.save();
      ctx.translate(spawn.x, spawn.y);
      ctx.rotate(spawn.rotation);
      ctx.strokeRect(-18, -26, 36, 52);
      ctx.restore();
    }

    // Checkered Start Banner
    const pSpawn = this.map.playerSpawns[0] || { x: 500, y: 500 };
    ctx.save();
    ctx.translate(pSpawn.x - 60, pSpawn.y);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(col * 15, row * 15, 15, 15);
      }
    }
    ctx.restore();
  }

  private renderObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.map.obstacles) {
      ctx.save();

      // 1. Cast Ambient Occlusion Drop Shadow for 3D Height
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 10;
      ctx.fillRect(obs.x - obs.width * 0.5 + 4, obs.y - obs.height * 0.5 + 6, obs.width, obs.height);
      ctx.shadowBlur = 0;

      // 2. Base Extrusion Wall (3D Bevel)
      ctx.fillStyle = this.darkenHex(obs.color, 0.5);
      ctx.fillRect(obs.x - obs.width * 0.5, obs.y - obs.height * 0.5 + 4, obs.width, obs.height);

      // 3. Top Face
      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x - obs.width * 0.5, obs.y - obs.height * 0.5, obs.width, obs.height);

      // 4. Highlight Border Edge
      ctx.strokeStyle = this.lightenHex(obs.color, 0.3);
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x - obs.width * 0.5, obs.y - obs.height * 0.5, obs.width, obs.height);

      ctx.restore();
    }
  }

  private renderTrackMarkingsAndScenery(ctx: CanvasRenderingContext2D) {
    if (!this.map.waypoints || this.map.waypoints.length === 0) return;

    ctx.save();
    ctx.strokeStyle = this.map.trackColor;
    ctx.lineWidth = 140;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    this.map.waypoints.forEach((wp, idx) => {
      if (idx === 0) ctx.moveTo(wp.x, wp.y);
      else ctx.lineTo(wp.x, wp.y);
    });
    ctx.closePath();
    ctx.stroke();

    // Inner Curbs & Center Track Dashes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private lightenHex(hex: string, percent: number): string {
    return hex;
  }

  private darkenHex(hex: string, percent: number): string {
    return hex;
  }
}
