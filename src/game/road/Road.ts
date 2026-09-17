import { GameObjects } from 'phaser';
import { ROAD, SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants';

// Classic pseudo-3D "OutRun style" road: a strip of fixed-length segments
// laid out along Z, each with an optional curve and hill (y) offset. Every
// frame we project the segments visible from the camera into 2D screen
// trapezoids and draw them far-to-near, producing the pinched-horizon look
// with curves and rolling hills, without any real 3D geometry.

export interface RoadPoint {
    world: { x: number; y: number; z: number };
    camera: { x: number; y: number; z: number };
    screen: { x: number; y: number; w: number; scale: number };
}

export interface RoadSegment {
    index: number;
    p1: RoadPoint;
    p2: RoadPoint;
    curve: number;
    y: number;
    looped: boolean;
    clip?: number;
    sprites: { key: string; offset: number }[];
    cars: number[]; // indices into traffic array currently occupying this segment
}

function makePoint(): RoadPoint {
    return {
        world: { x: 0, y: 0, z: 0 },
        camera: { x: 0, y: 0, z: 0 },
        screen: { x: 0, y: 0, w: 0, scale: 0 }
    };
}

export class Road {
    segments: RoadSegment[] = [];
    trackLength = 0;

    constructor() {
        this.build();
    }

    private addSegment(curve: number, y: number) {
        const n = this.segments.length;
        this.segments.push({
            index: n,
            p1: makePoint(),
            p2: makePoint(),
            curve,
            y,
            looped: false,
            sprites: [],
            cars: []
        });
    }

    private addRoad(enterLen: number, holdLen: number, leaveLen: number, curve: number, y0: number, y1: number) {
        const startY = this.lastY();
        const total = enterLen + holdLen + leaveLen;
        for (let i = 0; i < enterLen; i++) {
            this.addSegment(easeIn(0, curve, i / enterLen), easeInOut(startY, y0, i / enterLen));
        }
        for (let i = 0; i < holdLen; i++) {
            this.addSegment(curve, y0);
        }
        for (let i = 0; i < leaveLen; i++) {
            this.addSegment(easeInOut(curve, 0, i / leaveLen), easeInOut(y0, y1, i / leaveLen));
        }
        void total;
    }

    private lastY() {
        return this.segments.length ? this.segments[this.segments.length - 1].y : 0;
    }

    // Builds one long procedurally varied stretch of road (straights, curves,
    // hills) that is treated as a seamless loop for the endless runner.
    private build() {
        const S = 40; // segments per "unit" of road piece

        this.addRoad(S, S, S, 0, 0, 0);
        this.addRoad(S, S * 2, S, 2.4, 0, 0);
        this.addRoad(S, S, S, 0, 0, 40);
        this.addRoad(S, S * 2, S, -3.2, 40, 40);
        this.addRoad(S, S, S, 0, 40, 0);
        this.addRoad(S, S * 3, S, 3.6, 0, 60);
        this.addRoad(S, S, S, 0, 60, 0);
        this.addRoad(S, S * 2, S, -2.0, 0, -20);
        this.addRoad(S, S * 2, S, 4.2, -20, 0);
        this.addRoad(S * 2, S * 2, S * 2, 0, 0, 0);

        // Decorate roadside with palm trees / signs deterministically.
        for (let n = 0; n < this.segments.length; n += 1) {
            const seg = this.segments[n];
            if (n % 10 === 0) {
                seg.sprites.push({ key: 'palm-tree', offset: -1.7 - Math.random() * 0.6 });
            }
            if ((n + 5) % 10 === 0) {
                seg.sprites.push({ key: 'palm-tree', offset: 1.7 + Math.random() * 0.6 });
            }
            if (n % 50 === 17) {
                seg.sprites.push({ key: 'road-sign', offset: -1.3 });
            }
        }

        this.trackLength = this.segments.length * ROAD.segmentLength;
    }

    findSegment(z: number): RoadSegment {
        const idx = Math.floor(z / ROAD.segmentLength) % this.segments.length;
        return this.segments[(idx + this.segments.length) % this.segments.length];
    }

    project(p: RoadPoint, cameraX: number, cameraY: number, cameraZ: number, width: number, height: number, roadWidth: number) {
        p.camera.x = p.world.x - cameraX;
        p.camera.y = p.world.y - cameraY;
        p.camera.z = p.world.z - cameraZ;
        const scale = ROAD.cameraDepth / (p.camera.z || 1);
        p.screen.scale = scale;
        p.screen.x = Math.round(width / 2 + (scale * p.camera.x * width) / 2);
        p.screen.y = Math.round(height / 2 - (scale * p.camera.y * height) / 2);
        p.screen.w = Math.round((scale * roadWidth * width) / 2);
    }

    // Renders the road, ground and roadside sprites for the visible draw
    // distance ahead of the camera. `position` is the camera's Z position
    // (how far the player has driven, in world units).
    render(gfx: GameObjects.Graphics, position: number, playerX: number, spriteLayer: GameObjects.Container) {
        gfx.clear();
        spriteLayer.removeAll(true);

        const baseSegment = this.findSegment(position);
        const basePercent = percentRemaining(position, ROAD.segmentLength);
        const playerSegment = this.findSegment(position + ROAD.cameraHeight * 0);
        void playerSegment;

        let x = 0;
        let dx = -(baseSegment.curve * basePercent);
        let maxY = SCREEN_HEIGHT;

        const cameraHeight = ROAD.cameraHeight;
        const cameraZ = position;

        for (let n = 0; n < ROAD.drawDistance; n++) {
            const segment = this.segments[(baseSegment.index + n) % this.segments.length];
            const looped = baseSegment.index + n >= this.segments.length;
            const segLoopOffset = looped ? this.trackLength : 0;

            segment.p1.world.y = segment.y;
            segment.p2.world.y = this.segments[(segment.index + 1) % this.segments.length].y;
            segment.p1.world.z = segment.index * ROAD.segmentLength + segLoopOffset;
            segment.p2.world.z = (segment.index + 1) * ROAD.segmentLength + segLoopOffset;
            segment.p1.world.x = 0;
            segment.p2.world.x = 0;

            this.project(segment.p1, playerX * ROAD.roadWidth - x, cameraHeight, cameraZ, SCREEN_WIDTH, SCREEN_HEIGHT, ROAD.roadWidth);
            this.project(segment.p2, playerX * ROAD.roadWidth - x - dx, cameraHeight, cameraZ, SCREEN_WIDTH, SCREEN_HEIGHT, ROAD.roadWidth);

            x += dx;
            dx += segment.curve;

            if (segment.p1.camera.z <= ROAD.cameraDepth || segment.p2.screen.y >= maxY) {
                continue;
            }

            const grassColor = n % 3 === 0 ? 0x0a3d24 : 0x0c4429;
            const rumbleColor = Math.floor(segment.index / ROAD.rumbleLength) % 2 ? 0xf2f2f2 : 0xd6203e;
            const roadColor = Math.floor(segment.index / ROAD.rumbleLength) % 2 ? 0x36363c : 0x2c2c31;
            const laneColor = 0xe9e9e9;

            drawSegmentQuad(gfx, grassColor, 0, segment.p1.screen.y, SCREEN_WIDTH, 0, segment.p2.screen.y, SCREEN_WIDTH);

            drawSegmentQuad(gfx, rumbleColor,
                segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w * 1.2,
                segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w * 1.2);

            drawSegmentQuad(gfx, roadColor,
                segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
                segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w);

            if (Math.floor(segment.index / ROAD.rumbleLength) % 2) {
                const laneW1 = segment.p1.screen.w * 0.05;
                const laneW2 = segment.p2.screen.w * 0.05;
                for (const laneX of [-0.5, 0.5]) {
                    drawSegmentQuad(gfx, laneColor,
                        segment.p1.screen.x + segment.p1.screen.w * laneX, segment.p1.screen.y, laneW1,
                        segment.p2.screen.x + segment.p2.screen.w * laneX, segment.p2.screen.y, laneW2);
                }
            }

            maxY = segment.p2.screen.y;

            for (const s of segment.sprites) {
                const scale = segment.p1.screen.scale;
                if (scale <= 0) continue;
                const tex = spriteLayer.scene.textures.get(s.key).getSourceImage() as HTMLImageElement;
                const destW = tex.width * scale * SCREEN_WIDTH * 0.5;
                const destH = tex.height * scale * SCREEN_WIDTH * 0.5;
                const destX = segment.p1.screen.x + scale * s.offset * ROAD.roadWidth * SCREEN_WIDTH * 0.5;
                const destY = segment.p1.screen.y;
                const img = spriteLayer.scene.add.image(destX, destY, s.key)
                    .setOrigin(0.5, 1)
                    .setDisplaySize(destW, destH)
                    .setDepth(-segment.index);
                spriteLayer.add(img);
            }
        }
    }
}

function drawSegmentQuad(gfx: GameObjects.Graphics, color: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number) {
    gfx.fillStyle(color, 1);
    gfx.beginPath();
    gfx.moveTo(x1 - w1, y1);
    gfx.lineTo(x1 + w1, y1);
    gfx.lineTo(x2 + w2, y2);
    gfx.lineTo(x2 - w2, y2);
    gfx.closePath();
    gfx.fillPath();
}

function percentRemaining(n: number, total: number) {
    return (n % total) / total;
}

function easeIn(a: number, b: number, percent: number) {
    return a + (b - a) * Math.pow(percent, 2);
}

function easeInOut(a: number, b: number, percent: number) {
    return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
}
