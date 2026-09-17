import { Scene } from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT, HIGH_SCORE_KEY } from '../constants';

const FONT_FAMILY = '"Press Start 2P", monospace';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const cx = SCREEN_WIDTH / 2;

        this.cameras.main.setBackgroundColor('#0a0016');

        // Sunset gradient backdrop + horizon line, synthwave style.
        const g = this.add.graphics();
        g.fillGradientStyle(0x2d0a52, 0x2d0a52, 0xff3d7a, 0xff8a3d, 1);
        g.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT * 0.55);
        g.fillStyle(0x0a0016, 1);
        g.fillRect(0, SCREEN_HEIGHT * 0.55, SCREEN_WIDTH, SCREEN_HEIGHT * 0.45);
        g.lineStyle(3, 0x38f2ff, 0.8);
        g.strokeRect(0, SCREEN_HEIGHT * 0.55 - 1, SCREEN_WIDTH, 1);

        this.add.image(SCREEN_WIDTH * 0.15, SCREEN_HEIGHT * 0.6, 'palm-tree').setOrigin(0.5, 1).setScale(1.6).setTint(0x120026);
        this.add.image(SCREEN_WIDTH * 0.88, SCREEN_HEIGHT * 0.62, 'palm-tree').setOrigin(0.5, 1).setScale(1.3).setTint(0x120026);

        const sun = this.add.circle(cx, SCREEN_HEIGHT * 0.4, 110, 0xffb020, 0.9);
        this.tweens.add({ targets: sun, alpha: 0.6, yoyo: true, repeat: -1, duration: 1600 });

        this.add.text(cx, SCREEN_HEIGHT * 0.22, 'NIGHTDRIVE', {
            fontFamily: FONT_FAMILY, fontSize: 56, color: '#ff2d95'
        }).setOrigin(0.5).setShadow(0, 0, '#38f2ff', 12, true, true);

        this.add.text(cx, SCREEN_HEIGHT * 0.22 + 56, 'NEON COAST RUN', {
            fontFamily: FONT_FAMILY, fontSize: 18, color: '#38f2ff'
        }).setOrigin(0.5);

        const car = this.add.image(cx, SCREEN_HEIGHT * 0.72, 'car-player').setScale(2.4);
        this.tweens.add({ targets: car, y: car.y - 10, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });

        const highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
        this.add.text(cx, SCREEN_HEIGHT * 0.83, `HIGH SCORE  ${String(highScore).padStart(6, '0')}`, {
            fontFamily: FONT_FAMILY, fontSize: 16, color: '#ffffff'
        }).setOrigin(0.5);

        const prompt = this.add.text(cx, SCREEN_HEIGHT * 0.9, 'PRESS START', {
            fontFamily: FONT_FAMILY, fontSize: 20, color: '#ffd400'
        }).setOrigin(0.5);
        this.tweens.add({ targets: prompt, alpha: 0.1, yoyo: true, repeat: -1, duration: 500 });

        const start = () => this.scene.start('Game');
        this.input.once('pointerdown', start);
        this.input.keyboard?.once('keydown-SPACE', start);
        this.input.keyboard?.once('keydown-ENTER', start);
    }
}
