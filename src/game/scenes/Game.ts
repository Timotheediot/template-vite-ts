import { Scene } from 'phaser';
import { Road } from '../road/Road';
import { Traffic } from '../objects/Traffic';
import { GAMEPLAY, SCREEN_WIDTH, SCREEN_HEIGHT, HIGH_SCORE_KEY } from '../constants';

const FONT_FAMILY = '"Press Start 2P", monospace';

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export class Game extends Scene
{
    private road!: Road;
    private traffic!: Traffic;
    private roadGfx!: Phaser.GameObjects.Graphics;
    private spriteLayer!: Phaser.GameObjects.Container;
    private trafficLayer!: Phaser.GameObjects.Container;
    private playerCar!: Phaser.GameObjects.Image;
    private sky!: Phaser.GameObjects.Graphics;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private touchLeft = false;
    private touchRight = false;
    private touchGas = false;
    private touchBrake = false;

    // Simulation state
    private position = 0;   // camera Z (distance driven, world units)
    private speed = 0;      // world units / second
    private playerX = 0;    // -1 (left edge) .. 1 (right edge)
    private stage = 1;
    private timeLeft = GAMEPLAY.startTime;
    private score = 0;
    private crashTimer = 0;
    private gameOverTriggered = false;

    private timeText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private stageText!: Phaser.GameObjects.Text;
    private banner!: Phaser.GameObjects.Text;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.position = 0;
        this.speed = 0;
        this.playerX = 0;
        this.stage = 1;
        this.timeLeft = GAMEPLAY.startTime;
        this.score = 0;
        this.crashTimer = 0;
        this.gameOverTriggered = false;

        this.road = new Road();
        this.traffic = new Traffic(this, this.road, 10);

        this.sky = this.add.graphics();
        this.drawSky();

        this.roadGfx = this.add.graphics();
        this.spriteLayer = this.add.container(0, 0);
        this.trafficLayer = this.add.container(0, 0);

        this.playerCar = this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 90, 'car-player')
            .setScale(2.1)
            .setDepth(10);

        this.cursors = this.input.keyboard!.createCursorKeys();

        this.buildHud();
        this.buildTouchControls();
    }

    private drawSky()
    {
        this.sky.clear();
        this.sky.fillGradientStyle(0x1a0a3d, 0x1a0a3d, 0xff3d7a, 0xff8a3d, 1);
        this.sky.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT * 0.5);
        this.sky.fillStyle(0x0a0016, 1);
        this.sky.fillRect(0, SCREEN_HEIGHT * 0.5, SCREEN_WIDTH, SCREEN_HEIGHT * 0.5);
        const sun = this.add.circle(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.32, 90, 0xffb020, 0.85);
        this.sky.setDepth(-1000);
        sun.setDepth(-999);
    }

    private buildHud()
    {
        const style = { fontFamily: FONT_FAMILY, fontSize: 16, color: '#ffffff' };

        this.add.rectangle(SCREEN_WIDTH / 2, 26, SCREEN_WIDTH, 52, 0x000000, 0.45).setDepth(20);

        this.timeText = this.add.text(24, 12, '', { ...style, color: '#ffd400' }).setDepth(21);
        this.scoreText = this.add.text(SCREEN_WIDTH / 2, 12, '', style).setOrigin(0.5, 0).setDepth(21);
        this.stageText = this.add.text(SCREEN_WIDTH - 24, 12, '', { ...style, color: '#38f2ff' }).setOrigin(1, 0).setDepth(21);

        this.banner = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.3, '', {
            fontFamily: FONT_FAMILY, fontSize: 26, color: '#ff2d95'
        }).setOrigin(0.5).setDepth(30).setAlpha(0);

        this.updateHud();
    }

    private buildTouchControls()
    {
        if (!this.sys.game.device.input.touch) return;

        const makeButton = (x: number, y: number, label: string, onDown: () => void, onUp: () => void) => {
            const btn = this.add.rectangle(x, y, 90, 90, 0x38f2ff, 0.18).setStrokeStyle(2, 0x38f2ff).setDepth(40).setScrollFactor(0);
            this.add.text(x, y, label, { fontFamily: FONT_FAMILY, fontSize: 20, color: '#ffffff' }).setOrigin(0.5).setDepth(41);
            btn.setInteractive();
            btn.on('pointerdown', onDown);
            btn.on('pointerup', onUp);
            btn.on('pointerout', onUp);
        };

        makeButton(70, SCREEN_HEIGHT - 80, '<', () => this.touchLeft = true, () => this.touchLeft = false);
        makeButton(180, SCREEN_HEIGHT - 80, '>', () => this.touchRight = true, () => this.touchRight = false);
        makeButton(SCREEN_WIDTH - 180, SCREEN_HEIGHT - 80, 'v', () => this.touchBrake = true, () => this.touchBrake = false);
        makeButton(SCREEN_WIDTH - 70, SCREEN_HEIGHT - 80, '^', () => this.touchGas = true, () => this.touchGas = false);
    }

    private updateHud()
    {
        this.timeText.setText(`TIME ${Math.max(0, Math.ceil(this.timeLeft)).toString().padStart(3, '0')}`);
        this.scoreText.setText(`SCORE ${Math.floor(this.score).toString().padStart(6, '0')}`);
        this.stageText.setText(`STAGE ${this.stage}`);
    }

    private showBanner(text: string)
    {
        this.banner.setText(text).setAlpha(1);
        this.tweens.add({ targets: this.banner, alpha: 0, duration: 1600, delay: 700 });
    }

    update (_time: number, delta: number)
    {
        if (this.gameOverTriggered) return;

        const dt = Math.min(delta, 50) / 1000;

        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.triggerGameOver();
            return;
        }

        this.handleInput(dt);
        this.traffic.update(dt);

        const collision = this.traffic.findCollision(this.position, this.playerX);
        if (collision && this.crashTimer <= 0) {
            this.crashTimer = 0.6;
            this.timeLeft = Math.max(0, this.timeLeft - GAMEPLAY.crashPenaltyTime);
            this.speed *= GAMEPLAY.crashSpeedFactor;
            this.cameras.main.shake(200, 0.01);
        }
        if (this.crashTimer > 0) this.crashTimer -= dt;

        this.position += this.speed * dt;
        if (this.position < 0) this.position += this.road.trackLength;

        this.score += (this.speed / GAMEPLAY.maxSpeed) * dt * 120;

        const newStage = Math.floor(this.position / GAMEPLAY.stageDistance) + 1;
        if (newStage > this.stage) {
            this.stage = newStage;
            this.timeLeft += GAMEPLAY.stageBonusTime;
            this.traffic.setDensity(Math.min(24, 10 + this.stage * 2));
            this.showBanner(`STAGE ${this.stage}  +${GAMEPLAY.stageBonusTime}s`);
        }

        this.updateHud();

        this.road.render(this.roadGfx, this.position, this.playerX, this.spriteLayer);
        this.trafficLayer.removeAll(true);
        this.traffic.render(this.trafficLayer, this.position, this.playerX);

        const lean = clamp(this.playerX, -1, 1);
        this.playerCar.x = SCREEN_WIDTH / 2 + lean * 160;
        this.playerCar.setRotation(lean * -0.08);
    }

    private handleInput(dt: number)
    {
        const left = this.cursors.left.isDown || this.touchLeft;
        const right = this.cursors.right.isDown || this.touchRight;
        const up = this.cursors.up.isDown || this.touchGas;
        const down = this.cursors.down.isDown || this.touchBrake;

        const segment = this.road.findSegment(this.position);
        const offRoad = Math.abs(this.playerX) > 1;

        if (up) {
            this.speed += GAMEPLAY.accel * dt;
        }
        else if (down) {
            this.speed += GAMEPLAY.braking * dt;
        }
        else {
            this.speed += GAMEPLAY.decel * dt * 0.4;
            this.speed = Math.max(this.speed, GAMEPLAY.maxSpeed * 0.35);
        }

        if (offRoad && this.speed > GAMEPLAY.offRoadMaxSpeed) {
            this.speed += GAMEPLAY.offRoadDecel * dt;
        }

        const speedCap = GAMEPLAY.maxSpeed * (1 + this.stage * 0.03);
        this.speed = clamp(this.speed, 0, speedCap);

        const steerAmount = GAMEPLAY.playerSteerSpeed * dt * (this.speed / GAMEPLAY.maxSpeed + 0.3);
        if (left) this.playerX -= steerAmount;
        if (right) this.playerX += steerAmount;

        // Curve pulls the car sideways (centrifugal force), like OutRun.
        this.playerX -= (segment.curve * GAMEPLAY.centrifugal * (this.speed / GAMEPLAY.maxSpeed)) * dt;

        // Hitting the grass shoulder acts like a soft wall: it saps speed
        // (handled above) and gently resists further sideways drift instead
        // of letting the car wander indefinitely off-screen.
        if (Math.abs(this.playerX) > 1) {
            const over = Math.abs(this.playerX) - 1;
            this.playerX -= Math.sign(this.playerX) * Math.min(over, over * 2.5 * dt);
        }
        this.playerX = clamp(this.playerX, -1.3, 1.3);
    }

    private triggerGameOver()
    {
        this.gameOverTriggered = true;

        const highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
        const finalScore = Math.floor(this.score);
        if (finalScore > highScore) {
            localStorage.setItem(HIGH_SCORE_KEY, String(finalScore));
        }

        this.time.delayedCall(300, () => {
            this.scene.start('GameOver', { score: finalScore, stage: this.stage });
        });
    }
}
