import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  Nothing to load from disk yet — all game art is generated
        //  procedurally in the Preloader (see assets/TextureFactory.ts).
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
