import { PlayerKart } from './entities/PlayerKart';
import { BotKart } from './entities/BotKart';
import { Kart, KartInput } from './entities/Kart';
import { Projectile } from './entities/Projectile';
import { Pickup } from './entities/Pickup';
import { Hazard } from './entities/Hazard';
import { ParticleEngine } from './systems/ParticleEngine';
import { SoundEngine } from './systems/SoundEngine';
import { MAPS } from './maps/MapData';
import { Collision } from './physics/Collision';
import { Vector2 } from './physics/Vector2';
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

    // Spawn Bots
    this.initBots();

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

    const count = Math.min(this.options.botCount || 4, this.map.playerSpawns.length - 1);

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
    // Pickups (Mystery Crates, Nitros, Health, Shields, Coins)
    for (const p of this.map.pickupSpawns) {
      this.pickups.push(new Pickup(p.type, new Vector2(p.x, p.y)));
    }

    // Boost Pads & Hazards
    for (const h of this.map.hazards) {
      this.hazards.push(new Hazard(h));
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.soundEngine.resume();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.player.destroy();
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

    const allKarts: Kart[] = [this.player, ...this.bots];

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
        const resolution = Collision.resolveCircleBox(proj.position, proj.radius, obs.x, obs.y, obs.width, obs.height);
        if (resolution.collided) {
          proj.isDead = true;
          this.particleEngine.emitExplosion(proj.position, 15);
          this.soundEngine.playHit();
          break;
        }
      }

      if (proj.isDead) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check Projectile vs Kart Collisions
      for (const kart of allKarts) {
        if (kart.isDead) continue;
        if (proj.ownerId === kart.id && !proj.isMine && proj.distanceTraveled < 40) continue;
        if (proj.isMine && !proj.mineArmed) continue;

        if (Collision.circleCircle(proj.position, proj.radius, kart.position, kart.radius)) {
          proj.isDead = true;

          const attacker = allKarts.find((k) => k.id === proj.ownerId);
          const wasFatal = kart.takeDamage(proj.def.damage, attacker);

          // Status effects
          if (proj.type === 'cryo') {
            kart.applyStatus('freeze', 2.0);
            this.particleEngine.emitIceShatter(kart.position);
          } else if (proj.type === 'emp') {
            kart.applyStatus('emp', 2.5);
          }

          // FX
          this.particleEngine.emitExplosion(proj.position, 25);
          this.soundEngine.playExplosion();

          if (kart.isPlayer || proj.ownerId === this.player.id) {
            this.screenShake = 12;
          }

          // Record Combat Feed Event
          if (this.options.onCombatEvent) {
            this.options.onCombatEvent({
              id: Math.random().toString(36).substring(2, 9),
              killerName: proj.ownerName,
              victimName: kart.name,
              weapon: proj.type,
              timestamp: Date.now(),
            });
          }

          break;
        }
      }

      if (proj.isDead) {
        this.projectiles.splice(i, 1);
      }
    }

    // 6. Kart vs Pickup Collisions
    for (const kart of allKarts) {
      if (kart.isDead) continue;

      for (const pickup of this.pickups) {
        if (!pickup.isActive) continue;

        if (Collision.circleCircle(kart.position, kart.radius, pickup.position, pickup.radius)) {
          pickup.isActive = false;
          pickup.respawnTimer = 0;

          if (pickup.type === 'mystery_box') {
            const weapons: WeaponType[] = ['blaster', 'vulcan', 'laser', 'mine', 'shockwave', 'emp', 'cryo', 'rocket'];
            const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
            kart.giveWeapon(randomWeapon);
            this.particleEngine.emitShockwave(pickup.position, 40);
          } else if (pickup.type === 'nitro') {
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

      // Clamp to arena
      kart.position.x = Math.max(kart.radius, Math.min(this.map.width - kart.radius, kart.position.x));
      kart.position.y = Math.max(kart.radius, Math.min(this.map.height - kart.radius, kart.position.y));
    }

    // 9. Update Particles
    this.particleEngine.update(dt);

    // 10. Dynamic Camera with Screen Shake
    const shakeOffsetX = (Math.random() - 0.5) * this.screenShake;
    const shakeOffsetY = (Math.random() - 0.5) * this.screenShake;
    const targetCamX = this.player.position.x + Math.cos(this.player.angle) * this.player.speed * 0.25 + shakeOffsetX;
    const targetCamY = this.player.position.y + Math.sin(this.player.angle) * this.player.speed * 0.25 + shakeOffsetY;
    this.cameraPos.x += (targetCamX - this.cameraPos.x) * dt * 5.5;
    this.cameraPos.y += (targetCamY - this.cameraPos.y) * dt * 5.5;

    // 11. Position Tracking & Scoring Update
    this.scoreUpdateTimer += dt;
    if (this.scoreUpdateTimer >= 0.2) {
      this.scoreUpdateTimer = 0;

      if (isBattleMode) {
        allKarts.sort((a, b) => b.score - a.score || b.kills - a.kills);
      } else {
        const wp = this.map.waypoints;
        allKarts.sort((a, b) => {
          const aTargetWp = wp[a.currentWaypointIndex % wp.length];
          const bTargetWp = wp[b.currentWaypointIndex % wp.length];
          const aDist = a.position.distanceTo(new Vector2(aTargetWp.x, aTargetWp.y));
          const bDist = b.position.distanceTo(new Vector2(bTargetWp.x, bTargetWp.y));
          const aScore = a.currentLap * 100000 + a.currentWaypointIndex * 1000 - aDist;
          const bScore = b.currentLap * 100000 + b.currentWaypointIndex * 1000 - bDist;
          return bScore - aScore;
        });
      }

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

    const allKarts = [this.player, ...this.bots];
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

    // 1. Map Grid & Starting Line
    this.renderMapGrid(ctx);

    // 2. Track Markings & Scenery
    this.renderTrackMarkingsAndScenery(ctx);

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

    // 6. Obstacles & Buildings
    this.renderObstacles(ctx);

    // 7. Projectiles (Lasers, Blasters, Mines, Ice Missiles)
    for (const proj of this.projectiles) {
      proj.render(ctx);
    }

    // 8. Karts
    for (const bot of this.bots) {
      bot.render(ctx);
    }
    this.player.render(ctx);

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
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 14;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      if (this.map.theme === 'volcano') {
        // 3D Obsidian Magma Crag
        ctx.fillStyle = '#0c0a09';
        ctx.fillRect(obs.x - 6, obs.y - 6, obs.width + 12, obs.height + 12);

        const cragGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y + obs.height);
        cragGrad.addColorStop(0, '#450a0a');
        cragGrad.addColorStop(0.5, '#1c1917');
        cragGrad.addColorStop(1, '#0c0a09');
        ctx.fillStyle = cragGrad;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Glowing Magma Fissure
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(obs.x + 20, obs.y + 20);
        ctx.lineTo(obs.x + obs.width * 0.5, obs.y + obs.height * 0.5);
        ctx.lineTo(obs.x + obs.width - 20, obs.y + obs.height - 20);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // 3D Elevated Terracotta Plaza Building (matching Pixel Wheels screenshot 5)
        const wallGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
        wallGrad.addColorStop(0, '#94a3b8');
        wallGrad.addColorStop(1, '#475569');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(obs.x - 6, obs.y - 6, obs.width + 12, obs.height + 12);

        // Clay Terracotta Roof Surface
        const roofGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y);
        roofGrad.addColorStop(0, '#b91c1c');
        roofGrad.addColorStop(0.3, '#dc2626');
        roofGrad.addColorStop(0.7, '#b91c1c');
        roofGrad.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = obs.color || roofGrad;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Roof Tile Grooves
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        for (let ty = obs.y + 10; ty < obs.y + obs.height; ty += 14) {
          ctx.fillRect(obs.x, ty, obs.width, 2.5);
        }

        // 3D Bevel Edge
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      }

      ctx.restore();
    }
  }

  private renderTrackMarkingsAndScenery(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. 3D Alternating Red-and-White Corner Curbs / Rumble Strips
    if (this.map.waypoints && this.map.waypoints.length > 2) {
      const wp = this.map.waypoints;
      for (let i = 0; i < wp.length; i++) {
        const p1 = wp[i];
        const p2 = wp[(i + 1) % wp.length];
        const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const count = Math.floor(segDist / 40);
        const dx = (p2.x - p1.x) / count;
        const dy = (p2.y - p1.y) / count;
        const normX = -dy / Math.hypot(dx, dy);
        const normY = dx / Math.hypot(dx, dy);

        // Render Outer 3D Curbs
        for (let j = 0; j < count; j++) {
          const cx = p1.x + dx * j + normX * 90;
          const cy = p1.y + dy * j + normY * 90;
          ctx.fillStyle = j % 2 === 0 ? '#ef4444' : '#f8fafc';
          ctx.fillRect(cx - 6, cy - 6, 12, 12);
        }
      }
    }

    // 2. Center Dashed Road Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([26, 22]);

    if (this.map.waypoints && this.map.waypoints.length > 2) {
      ctx.beginPath();
      const wp = this.map.waypoints;
      ctx.moveTo(wp[0].x, wp[0].y);
      for (let i = 1; i < wp.length; i++) {
        ctx.lineTo(wp[i].x, wp[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Painted 3D Road Turn Arrows
    for (let i = 0; i < this.map.waypoints.length; i++) {
      const p1 = this.map.waypoints[i];
      const p2 = this.map.waypoints[(i + 1) % this.map.waypoints.length];
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      ctx.save();
      ctx.translate(p1.x, p1.y);
      ctx.rotate(angle);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(0, -12);
      ctx.lineTo(0, -5);
      ctx.lineTo(-16, -5);
      ctx.lineTo(-16, 5);
      ctx.lineTo(0, 5);
      ctx.lineTo(0, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // 3. Volcanic Canyon Lava River
    if (this.map.theme === 'volcano' || this.map.id === 'volcano_canyon') {
      const time = Date.now() * 0.003;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';

      ctx.beginPath();
      for (let x = 100; x < this.map.width; x += 180) {
        const wave = Math.sin(time + x * 0.04) * 12;
        ctx.arc(x, 150 + wave, 30, 0, Math.PI);
        ctx.arc(x, this.map.height - 150 + wave, 30, Math.PI, 0);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 4. Snowy Peak Shoreline & Pine Trees
    if (this.map.theme === 'cryo' || this.map.id === 'cryo_colosseum') {
      const time = Date.now() * 0.002;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      for (let x = 100; x < this.map.width; x += 160) {
        const wave = Math.sin(time + x * 0.05) * 8;
        ctx.arc(x, 180 + wave, 24, 0, Math.PI);
        ctx.arc(x, this.map.height - 180 + wave, 24, Math.PI, 0);
      }
      ctx.stroke();

      const treeClusters = [
        { x: 300, y: 300 },
        { x: 360, y: 280 },
        { x: 420, y: 310 },
        { x: 480, y: 270 },
        { x: 540, y: 300 },
        { x: 1800, y: 300 },
        { x: 1860, y: 270 },
        { x: 1920, y: 310 },
        { x: 1980, y: 280 },
        { x: 300, y: 1900 },
        { x: 360, y: 1870 },
        { x: 420, y: 1910 },
        { x: 1800, y: 1900 },
        { x: 1860, y: 1870 },
        { x: 1920, y: 1910 },
      ];

      for (const t of treeClusters) {
        this.renderFrostedPineTree(ctx, t.x, t.y);
      }
    }

    ctx.restore();
  }

  private renderFrostedPineTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.beginPath();
    ctx.ellipse(4, 8, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5eead4';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(0, -2, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#99f6e4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(0, -4, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
