import { Scene } from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT, HIGH_SCORE_KEY } from '../constants';

const FONT_FAMILY = '"Press Start 2P", monospace';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create (data: { score?: number; stage?: number })
    {
        const cx = SCREEN_WIDTH / 2;
        const score = data?.score ?? 0;
        const stage = data?.stage ?? 1;
        const highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
        const isNewHighScore = score >= highScore && score > 0;

        this.cameras.main.setBackgroundColor('#0a0016');

        const g = this.add.graphics();
        g.fillGradientStyle(0x1a0a3d, 0x1a0a3d, 0x2d0a52, 0x2d0a52, 1);
        g.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        this.add.text(cx, SCREEN_HEIGHT * 0.28, 'GAME OVER', {
            fontFamily: FONT_FAMILY, fontSize: 44, color: '#ff2d95'
        }).setOrigin(0.5).setShadow(0, 0, '#38f2ff', 10, true, true);

        this.add.text(cx, SCREEN_HEIGHT * 0.42, `SCORE  ${String(score).padStart(6, '0')}`, {
            fontFamily: FONT_FAMILY, fontSize: 22, color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(cx, SCREEN_HEIGHT * 0.48, `STAGE REACHED  ${stage}`, {
            fontFamily: FONT_FAMILY, fontSize: 16, color: '#38f2ff'
        }).setOrigin(0.5);

        if (isNewHighScore) {
            const t = this.add.text(cx, SCREEN_HEIGHT * 0.56, 'NEW HIGH SCORE!', {
                fontFamily: FONT_FAMILY, fontSize: 18, color: '#ffd400'
            }).setOrigin(0.5);
            this.tweens.add({ targets: t, alpha: 0.2, yoyo: true, repeat: -1, duration: 400 });
        }
        else {
            this.add.text(cx, SCREEN_HEIGHT * 0.56, `HIGH SCORE  ${String(highScore).padStart(6, '0')}`, {
                fontFamily: FONT_FAMILY, fontSize: 16, color: '#ffffff'
            }).setOrigin(0.5);
        }

        const prompt = this.add.text(cx, SCREEN_HEIGHT * 0.72, 'PRESS START TO RETRY', {
            fontFamily: FONT_FAMILY, fontSize: 16, color: '#ffffff'
        }).setOrigin(0.5);
        this.tweens.add({ targets: prompt, alpha: 0.1, yoyo: true, repeat: -1, duration: 500 });

        const restart = () => this.scene.start('MainMenu');
        this.time.delayedCall(300, () => {
            this.input.once('pointerdown', restart);
            this.input.keyboard?.once('keydown-SPACE', restart);
            this.input.keyboard?.once('keydown-ENTER', restart);
        });
    }
}
