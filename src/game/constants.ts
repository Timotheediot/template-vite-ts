// Tunable constants for the pseudo-3D road renderer and gameplay.
// Values loosely follow the classic OutRun-style racer formulas
// (segment-based road, camera projection, curve accumulation).

export const SCREEN_WIDTH = 1024;
export const SCREEN_HEIGHT = 768;

export const ROAD = {
    segmentLength: 200,        // length of one road segment (world units)
    rumbleLength: 3,           // segments per rumble strip stripe
    roadWidth: 2000,           // half-width of the road in world units
    lanes: 3,
    cameraHeight: 1000,
    cameraDepth: 0.84,         // ~1 / tan(fieldOfView / 2)
    drawDistance: 300,         // segments rendered each frame
    fogDensity: 5
};

export const GAMEPLAY = {
    startTime: 60,             // seconds on the clock at start
    stageDistance: 24000,      // world units per "stage" (bonus time + ramp)
    stageBonusTime: 12,
    maxSpeed: 22000,           // world units / second at full throttle
    accel: 9000,               // units/sec^2 while accelerating
    braking: -14000,
    decel: -3200,              // natural decel when coasting
    offRoadDecel: -9000,
    offRoadMaxSpeed: 9000,
    centrifugal: 0.3,          // how much curves pull the car sideways
    playerSteerSpeed: 3.2,     // horizontal player movement speed (-1..1 units/sec)
    crashPenaltyTime: 3,
    crashSpeedFactor: 0.35
};

export const HIGH_SCORE_KEY = 'nightdrive-highscore';
