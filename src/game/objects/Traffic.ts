import { GameObjects, Scene } from 'phaser';
import { Road } from '../road/Road';
import { ROAD, SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants';

export interface TrafficCar {
    z: number;      // position along the track (world units)
    offset: number; // lane position, -1 (left edge) .. 1 (right edge)
    speed: number;  // world units / second
    key: string;
}

const CAR_KEYS = ['car-traffic-a', 'car-traffic-b', 'car-traffic-c'];

// Manages AI traffic cars: spawning along the endless track, advancing them
// each frame, projecting them through the same pseudo-3D camera as the road,
// and exposing simple lane/z data for the player collision check in Game.ts.
export class Traffic {
    cars: TrafficCar[] = [];
    private road: Road;

    constructor(_scene: Scene, road: Road, count: number) {
        this.road = road;

        for (let i = 0; i < count; i++) {
            this.cars.push(this.spawn((i / count) * road.trackLength));
        }
    }

    private spawn(z: number): TrafficCar {
        const lanes = [-0.55, 0, 0.55];
        return {
            z,
            offset: lanes[Math.floor(Math.random() * lanes.length)],
            speed: 3000 + Math.random() * 3500,
            key: CAR_KEYS[Math.floor(Math.random() * CAR_KEYS.length)]
        };
    }

    setDensity(count: number) {
        while (this.cars.length < count) {
            this.cars.push(this.spawn(Math.random() * this.road.trackLength));
        }
        while (this.cars.length > count) {
            this.cars.pop();
        }
    }

    update(dt: number) {
        const trackLength = this.road.trackLength;
        for (const car of this.cars) {
            car.z = (car.z + car.speed * dt) % trackLength;
            if (car.z < 0) car.z += trackLength;
        }
    }

    // Draws all traffic cars currently within the draw distance ahead of
    // `playerZ`, returns nothing; collisions are checked separately via
    // `findCollision`.
    render(layer: GameObjects.Container, playerZ: number, playerX: number) {
        const maxZ = ROAD.drawDistance * ROAD.segmentLength;

        for (const car of this.cars) {
            let relativeZ = car.z - playerZ;
            if (relativeZ < -this.road.trackLength / 2) relativeZ += this.road.trackLength;
            if (relativeZ < 0 || relativeZ > maxZ) continue;

            const point = {
                world: { x: 0, y: 0, z: car.z < playerZ ? car.z + this.road.trackLength : car.z },
                camera: { x: 0, y: 0, z: 0 },
                screen: { x: 0, y: 0, w: 0, scale: 0 }
            };
            this.road.project(point, playerX * ROAD.roadWidth, ROAD.cameraHeight, playerZ, SCREEN_WIDTH, SCREEN_HEIGHT, ROAD.roadWidth);
            if (point.screen.scale <= 0 || point.screen.y > SCREEN_HEIGHT || point.screen.y < SCREEN_HEIGHT * 0.5) continue;

            const tex = layer.scene.textures.get(car.key).getSourceImage() as HTMLImageElement;
            const destW = tex.width * point.screen.scale * SCREEN_WIDTH * 0.5;
            const destH = tex.height * point.screen.scale * SCREEN_WIDTH * 0.5;
            const destX = point.screen.x + point.screen.scale * car.offset * ROAD.roadWidth * SCREEN_WIDTH * 0.5;

            const img = layer.scene.add.image(destX, point.screen.y, car.key)
                .setOrigin(0.5, 1)
                .setDisplaySize(destW, destH)
                .setDepth(-relativeZ);
            layer.add(img);
        }
    }

    // Returns the first traffic car close enough (world Z + lane offset) to
    // count as a collision with the player.
    findCollision(playerZ: number, playerX: number): TrafficCar | null {
        for (const car of this.cars) {
            const dz = Math.abs(car.z - playerZ);
            const wrapped = Math.min(dz, this.road.trackLength - dz);
            if (wrapped < ROAD.segmentLength * 1.2 && Math.abs(car.offset - playerX) < 0.42) {
                return car;
            }
        }
        return null;
    }
}
