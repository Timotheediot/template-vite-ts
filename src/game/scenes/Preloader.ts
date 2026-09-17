import { Scene } from 'phaser';
import { buildAllTextures } from '../assets/TextureFactory';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants';

const FONT_FAMILY = '"Press Start 2P", monospace';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    create ()
    {
        const cx = SCREEN_WIDTH / 2;
        const cy = SCREEN_HEIGHT / 2;

        this.cameras.main.setBackgroundColor('#0a0016');

        this.add.text(cx, cy - 60, 'NIGHTDRIVE', {
            fontFamily: FONT_FAMILY, fontSize: 40, color: '#ff2d95'
        }).setOrigin(0.5);

        this.add.rectangle(cx, cy + 20, 420, 24).setStrokeStyle(2, 0x38f2ff);
        const bar = this.add.rectangle(cx - 206, cy + 20, 4, 18, 0x38f2ff).setOrigin(0, 0.5);

        const label = this.add.text(cx, cy + 60, 'LOADING...', {
            fontFamily: FONT_FAMILY, fontSize: 14, color: '#ffffff'
        }).setOrigin(0.5);

        // Generate all pixel-art textures, then wait for the retro webfont
        // to finish loading (it's requested via <link> in index.html) before
        // handing off to the menu, so text doesn't flash in a fallback font.
        buildAllTextures(this);

        const goNext = () => {
            label.setText('READY');
            this.time.delayedCall(150, () => this.scene.start('MainMenu'));
        };

        const fonts = (document as any).fonts;
        if (fonts && fonts.load) {
            Promise.race([
                fonts.load('16px "Press Start 2P"').then(() => fonts.ready),
                new Promise((resolve) => setTimeout(resolve, 1500))
            ]).then(goNext).catch(goNext);
        }
        else {
            this.time.delayedCall(300, goNext);
        }

        bar.width = 420;
    }
}
