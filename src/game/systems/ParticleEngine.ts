import { Vector2 } from '../physics/Vector2';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  startSize: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'square' | 'spark' | 'ring' | 'shard';
  glow?: boolean;
}

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  life: number;
  color: string;
}

export class ParticleEngine {
  private particles: Particle[] = [];
  private skidMarks: SkidMark[] = [];
  private readonly maxParticles = 600;
  private readonly maxSkidMarks = 400;

  public update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Friction
      p.vx *= 0.96;
      p.vy *= 0.96;

      const progress = p.life / p.maxLife;
      p.alpha = Math.max(0, 1 - progress);

      if (p.shape === 'ring') {
        p.size = p.startSize + progress * 60;
      } else {
        p.size = Math.max(0.5, p.startSize * (1 - progress * 0.7));
      }
    }

    // Fade skid marks
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const sm = this.skidMarks[i];
      sm.life += dt;
      if (sm.life > 12) {
        sm.alpha -= dt * 0.2;
        if (sm.alpha <= 0) {
          this.skidMarks.splice(i, 1);
        }
      }
    }
  }

  public renderSkidMarks(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (const sm of this.skidMarks) {
      ctx.strokeStyle = sm.color.replace('ALPHA', sm.alpha.toString());
      ctx.beginPath();
      ctx.moveTo(sm.x1, sm.y1);
      ctx.lineTo(sm.x2, sm.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;

      if (p.glow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ring') {
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      } else if (p.shape === 'shard') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size * 0.8, p.y + p.size * 0.6);
        ctx.lineTo(p.x - p.size * 0.8, p.y + p.size * 0.6);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  public addSkidMark(x1: number, y1: number, x2: number, y2: number, color: string = 'rgba(20, 20, 25, ALPHA)') {
    if (this.skidMarks.length >= this.maxSkidMarks) {
      this.skidMarks.shift();
    }
    this.skidMarks.push({
      x1,
      y1,
      x2,
      y2,
      alpha: 0.45,
      life: 0,
      color,
    });
  }

  public emitDriftSparks(pos: Vector2, angle: number, stage: 1 | 2 | 3) {
    const colors = {
      1: ['#00f0ff', '#38bdf8', '#ffffff'], // Blue Tier 1
      2: ['#ff8800', '#fbbf24', '#ffffff'], // Orange Tier 2
      3: ['#a855f7', '#d946ef', '#00f0ff'], // Purple Supreme Tier 3
    };
    const palette = colors[stage];
    const count = stage * 2;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const sparkAngle = angle + Math.PI + (Math.random() - 0.5) * 1.2;
      const speed = 40 + Math.random() * 100 * stage;
      this.particles.push({
        x: pos.x + (Math.random() - 0.5) * 8,
        y: pos.y + (Math.random() - 0.5) * 8,
        vx: Math.cos(sparkAngle) * speed,
        vy: Math.sin(sparkAngle) * speed,
        size: 2.5 + Math.random() * 2 * stage,
        startSize: 2.5 + Math.random() * 2 * stage,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.2 + Math.random() * 0.25,
        shape: 'spark',
        glow: true,
      });
    }
  }

  public emitBoostFlames(pos: Vector2, angle: number) {
    const count = 3;
    const colors = ['#8354FE', '#00f0ff', '#ffffff'];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const flameAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = 120 + Math.random() * 80;
      this.particles.push({
        x: pos.x + (Math.random() - 0.5) * 6,
        y: pos.y + (Math.random() - 0.5) * 6,
        vx: Math.cos(flameAngle) * speed,
        vy: Math.sin(flameAngle) * speed,
        size: 4 + Math.random() * 4,
        startSize: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        life: 0,
        maxLife: 0.15 + Math.random() * 0.15,
        shape: 'circle',
        glow: true,
      });
    }
  }

  public emitExhaustSmoke(pos: Vector2, angle: number) {
    if (this.particles.length >= this.maxParticles || Math.random() > 0.4) return;
    const smokeAngle = angle + Math.PI + (Math.random() - 0.5) * 0.6;
    const speed = 25 + Math.random() * 30;
    this.particles.push({
      x: pos.x,
      y: pos.y,
      vx: Math.cos(smokeAngle) * speed,
      vy: Math.sin(smokeAngle) * speed,
      size: 3 + Math.random() * 3,
      startSize: 3 + Math.random() * 3,
      color: '#475569',
      alpha: 0.5,
      life: 0,
      maxLife: 0.35 + Math.random() * 0.2,
      shape: 'circle',
    });
  }

  public emitExplosion(pos: Vector2, radius: number = 30) {
    // Flash ring
    this.particles.push({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      size: 5,
      startSize: 5,
      color: '#ff6600',
      alpha: 1,
      life: 0,
      maxLife: 0.35,
      shape: 'ring',
      glow: true,
    });

    // Fireball debris
    const colors = ['#ff0055', '#ff6600', '#ffea00', '#8354fe', '#ffffff'];
    for (let i = 0; i < 35; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const ang = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 220;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 3 + Math.random() * 6,
        startSize: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.45,
        shape: Math.random() > 0.4 ? 'circle' : 'spark',
        glow: true,
      });
    }
  }

  public emitSparks(pos: Vector2, count: number = 6) {
    const colors = ['#fef08a', '#fde047', '#f97316', '#ffffff'];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const ang = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 2 + Math.random() * 3,
        startSize: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.2 + Math.random() * 0.2,
        shape: 'spark',
        glow: true,
      });
    }
  }

  public emitShockwave(pos: Vector2, radius: number = 100) {
    this.particles.push({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      size: 10,
      startSize: 10,
      color: '#00f0ff',
      alpha: 1,
      life: 0,
      maxLife: 0.4,
      shape: 'ring',
      glow: true,
    });

    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const speed = 180;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 3,
        startSize: 3,
        color: '#00f0ff',
        alpha: 0.9,
        life: 0,
        maxLife: 0.35,
        shape: 'spark',
        glow: true,
      });
    }
  }

  public emitIceShatter(pos: Vector2) {
    const colors = ['#a5f3fc', '#38bdf8', '#ffffff'];
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 120;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 3 + Math.random() * 4,
        startSize: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        shape: 'shard',
        glow: true,
      });
    }
  }

  public emitCoinSparkles(pos: Vector2) {
    const colors = ['#fde047', '#eab308', '#ffffff'];
    for (let i = 0; i < 15; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 90;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 2.5 + Math.random() * 2.5,
        startSize: 2.5 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.3,
        shape: 'spark',
        glow: true,
      });
    }
  }

  public clear() {
    this.particles = [];
    this.skidMarks = [];
  }
}
