import { Scene } from 'phaser';

// Procedurally generates all pixel-art textures used by the game using
// Phaser.GameObjects.Graphics baked into textures via generateTexture().
// This keeps the project asset-free while matching the chunky, flat-shaded
// look of 16-bit era racers. Swap these for real files later by loading
// images with the same texture keys in Preloader.ts instead of calling
// buildAllTextures().

const px = (n: number) => n; // small helper for readability, 1 unit = 1px

function carTexture(scene: Scene, key: string, bodyColor: number, roofColor: number, width: number, height: number) {
    const g = scene.add.graphics();

    // Simple, clear 2D car silhouette viewed from behind: flat rounded body,
    // a clean windshield block, visible wheels, and separated tail lights.
    // Kept intentionally simple/readable at small screen scale rather than
    // detailed, per design feedback.

    // Ground shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(width / 2, height - px(3), width * 0.75, px(8));

    // Wheels (peeking out from behind the body, bottom corners)
    g.fillStyle(0x111111, 1);
    g.fillRoundedRect(px(2), height - px(16), px(10), px(14), px(3));
    g.fillRoundedRect(width - px(12), height - px(16), px(10), px(14), px(3));

    // Body
    g.fillStyle(bodyColor, 1);
    g.fillRoundedRect(width * 0.08, height * 0.18, width * 0.84, height * 0.62, px(6));

    // Windshield / cabin
    g.fillStyle(roofColor, 1);
    g.fillRoundedRect(width * 0.24, px(0), width * 0.52, height * 0.34, px(4));
    g.fillStyle(0x9fdcff, 0.95);
    g.fillRoundedRect(width * 0.3, height * 0.06, width * 0.4, height * 0.16, px(2));

    // Tail lights (two clean separated bars, not a single strip)
    g.fillStyle(0xff2d55, 1);
    g.fillRoundedRect(width * 0.1, height * 0.58, width * 0.22, height * 0.14, px(2));
    g.fillRoundedRect(width * 0.68, height * 0.58, width * 0.22, height * 0.14, px(2));

    g.generateTexture(key, width, height);
    g.destroy();
}

function palmTreeTexture(scene: Scene, key: string) {
    const w = 80, h = 160;
    const g = scene.add.graphics();

    // Trunk
    g.fillStyle(0x4a3223, 1);
    g.fillRect(w / 2 - 6, h * 0.35, 12, h * 0.65);
    g.fillStyle(0x000000, 0.15);
    for (let i = 0; i < 5; i++) {
        g.fillRect(w / 2 - 6, h * 0.35 + i * (h * 0.65) / 5, 12, 2);
    }

    // Fronds (silhouette, dark against night sky, neon-rim look)
    g.fillStyle(0x0c2a1e, 1);
    const cx = w / 2, cy = h * 0.32;
    const fronds = 6;
    for (let i = 0; i < fronds; i++) {
        const angle = (Math.PI * 2 * i) / fronds - Math.PI / 2;
        const ex = cx + Math.cos(angle) * w * 0.55;
        const ey = cy + Math.sin(angle) * h * 0.28 - 10;
        g.fillTriangle(cx, cy, cx + Math.cos(angle + 0.3) * 14, cy + Math.sin(angle + 0.3) * 14, ex, ey);
    }
    g.fillStyle(0xff5fae, 0.5);
    g.fillCircle(cx, cy, 6);

    g.generateTexture(key, w, h);
    g.destroy();
}

function signTexture(scene: Scene, key: string) {
    const w = 40, h = 100;
    const g = scene.add.graphics();
    g.fillStyle(0x2b2b2b, 1);
    g.fillRect(w / 2 - 4, h * 0.3, 8, h * 0.7);
    g.fillStyle(0x38f2ff, 1);
    g.fillRoundedRect(2, 0, w - 4, h * 0.32, 4);
    g.fillStyle(0x001b1e, 1);
    g.fillRect(6, h * 0.1, w - 12, h * 0.12);
    g.generateTexture(key, w, h);
    g.destroy();
}

function cloudTexture(scene: Scene, key: string) {
    const w = 160, h = 60;
    const g = scene.add.graphics();
    g.fillStyle(0xff6fd8, 0.5);
    g.fillEllipse(w * 0.3, h * 0.6, w * 0.5, h * 0.7);
    g.fillStyle(0x7d5fff, 0.4);
    g.fillEllipse(w * 0.65, h * 0.5, w * 0.55, h * 0.8);
    g.generateTexture(key, w, h);
    g.destroy();
}

export function buildAllTextures(scene: Scene) {
    if (scene.textures.exists('car-player')) {
        return; // already generated (textures persist across scene restarts)
    }

    carTexture(scene, 'car-player', 0xe10600, 0x1a1a1a, 110, 56);
    carTexture(scene, 'car-traffic-a', 0xffd400, 0x141414, 96, 48);
    carTexture(scene, 'car-traffic-b', 0x3ad1ff, 0x141414, 96, 48);
    carTexture(scene, 'car-traffic-c', 0xffffff, 0x1a1a1a, 96, 48);
    palmTreeTexture(scene, 'palm-tree');
    signTexture(scene, 'road-sign');
    cloudTexture(scene, 'neon-cloud');
}
