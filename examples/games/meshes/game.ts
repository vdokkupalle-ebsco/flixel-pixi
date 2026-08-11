import {
  FlxG,
  FlxGraphic,
  FlxSprite,
  FlxState,
  FlxStrip,
  FlxText,
  makeGraphicPixels,
  type FlxStripGeometry,
} from '../../../src';

export interface MeshShowcaseSnapshot {
  animating: boolean;
  chainRevision: number;
  chainTopology: string;
  waterRevision: number;
}

const WATER_COLUMNS = 16;
const WATER_ROWS = 3;
const WATER_WIDTH = 640;
const WATER_HEIGHT = 140;
const CHAIN_SEGMENTS = 20;
const CHAIN_WIDTH = 12;
const CHAIN_START_X = 430;
const CHAIN_START_Y = 92;

/** Game-like showcase for an animated water surface and crane chain. */
export class MeshShowcaseState extends FlxState {
  readonly water: FlxStrip;
  readonly chain: FlxStrip;
  readonly weight = new FlxSprite();
  readonly #waterTexture = createWaterTexture();
  readonly #chainTexture = createChainTexture();
  #time = 0;
  animating = true;

  constructor() {
    super();
    this.water = new FlxStrip(0, 240, this.#waterTexture).setGeometry(
      createWaterGeometry(),
    );
    this.chain = new FlxStrip(0, 0, this.#chainTexture).setGeometry(
      createChainGeometry(),
    );
    this.weight.makeGraphic(38, 38, 0x475569ff);
    this.weight.setOriginToCorner();
  }

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff7dd3fc;
    this.add(new FlxSprite(52, 104).makeGraphic(20, 142, 0x78350fff));
    this.add(new FlxSprite(52, 104).makeGraphic(390, 18, 0x92400eff));
    this.add(new FlxSprite(414, 76).makeGraphic(32, 32, 0xf59e0bff));
    this.add(this.chain);
    this.add(this.weight);
    this.add(this.water);

    this.add(
      new FlxText(24, 18, 592, 'HARBOR MESH SCENE').setFormat(
        undefined,
        17,
        0xff082f49,
        'left',
      ),
    );
    this.add(
      new FlxText(
        24,
        47,
        592,
        'A triangle grid forms the water · a triangle strip forms the crane chain',
      ).setFormat(undefined, 10, 0xff075985, 'left'),
    );
    this.add(
      new FlxText(
        18,
        344,
        604,
        'WATER SURFACE · DEFORMED EVERY FRAME',
      ).setFormat(undefined, 10, 0xffe0f2fe, 'center'),
    );
    this.#animateChain();
  }

  override update(): void {
    super.update();
    if (!this.animating) return;
    this.#time += FlxG.elapsed;
    this.#animateWater();
    this.#animateChain();
  }

  override destroy(): void {
    super.destroy();
    this.#waterTexture.destroy();
    this.#chainTexture.destroy();
  }

  setAnimating(enabled: boolean): void {
    this.animating = enabled;
  }

  snapshot(): MeshShowcaseSnapshot {
    return {
      animating: this.animating,
      chainRevision: this.chain.geometryRevision,
      chainTopology: this.chain.topology,
      waterRevision: this.water.geometryRevision,
    };
  }

  #animateWater(): void {
    const vertices = this.water.vertices;
    for (let row = 0; row <= WATER_ROWS; row += 1) {
      const depth = row / WATER_ROWS;
      for (let column = 0; column <= WATER_COLUMNS; column += 1) {
        const index = (row * (WATER_COLUMNS + 1) + column) * 2;
        const wave =
          Math.sin(this.#time * 2.8 + column * 0.72) * 9 +
          Math.sin(this.#time * 1.7 - column * 0.38) * 5;
        vertices[index + 1] =
          depth * WATER_HEIGHT + wave * Math.max(0, 1 - depth * 1.4);
      }
    }
    this.water.invalidateGeometry();
  }

  #animateChain(): void {
    const endX = 505 + Math.sin(this.#time * 1.4) * 42;
    const endY = 205 + Math.cos(this.#time * 1.1) * 10;
    const centers: { x: number; y: number }[] = [];
    for (let segment = 0; segment < CHAIN_SEGMENTS; segment += 1) {
      const t = segment / (CHAIN_SEGMENTS - 1);
      centers.push({
        x: CHAIN_START_X + (endX - CHAIN_START_X) * t,
        y:
          CHAIN_START_Y +
          (endY - CHAIN_START_Y) * t +
          Math.sin(Math.PI * t) * 24,
      });
    }

    const vertices = this.chain.vertices;
    for (let segment = 0; segment < CHAIN_SEGMENTS; segment += 1) {
      const previous = centers[Math.max(0, segment - 1)] ?? centers[segment];
      const next =
        centers[Math.min(CHAIN_SEGMENTS - 1, segment + 1)] ?? centers[segment];
      const center = centers[segment];
      if (!previous || !next || !center) continue;
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      const length = Math.hypot(dx, dy) || 1;
      const normalX = (-dy / length) * (CHAIN_WIDTH / 2);
      const normalY = (dx / length) * (CHAIN_WIDTH / 2);
      const index = segment * 4;
      vertices[index] = center.x + normalX;
      vertices[index + 1] = center.y + normalY;
      vertices[index + 2] = center.x - normalX;
      vertices[index + 3] = center.y - normalY;
    }
    this.chain.invalidateGeometry();
    this.weight.x = endX - this.weight.width / 2;
    this.weight.y = endY - 2;
    this.weight.angle = Math.sin(this.#time * 1.4) * 8;
  }
}

function createWaterGeometry(): FlxStripGeometry {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= WATER_ROWS; row += 1) {
    for (let column = 0; column <= WATER_COLUMNS; column += 1) {
      const u = column / WATER_COLUMNS;
      const v = row / WATER_ROWS;
      vertices.push(u * WATER_WIDTH, v * WATER_HEIGHT);
      uvs.push(u, v);
    }
  }
  for (let row = 0; row < WATER_ROWS; row += 1) {
    for (let column = 0; column < WATER_COLUMNS; column += 1) {
      const topLeft = row * (WATER_COLUMNS + 1) + column;
      const bottomLeft = topLeft + WATER_COLUMNS + 1;
      indices.push(
        topLeft,
        topLeft + 1,
        bottomLeft + 1,
        topLeft,
        bottomLeft + 1,
        bottomLeft,
      );
    }
  }
  return { indices, uvs, vertices };
}

function createChainGeometry(): FlxStripGeometry {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let segment = 0; segment < CHAIN_SEGMENTS; segment += 1) {
    const u = segment / (CHAIN_SEGMENTS - 1);
    vertices.push(CHAIN_START_X, CHAIN_START_Y, CHAIN_START_X, CHAIN_START_Y);
    uvs.push(u, 0, u, 1);
    indices.push(segment * 2, segment * 2 + 1);
  }
  return { indices, topology: 'triangle-strip', uvs, vertices };
}

function createWaterTexture(): FlxGraphic {
  const pixels = makeGraphicPixels(64, 64, 0);
  for (let y = 0; y < pixels.height; y += 1) {
    for (let x = 0; x < pixels.width; x += 1) {
      const foam = y < 5 && (x + Math.floor(y / 2)) % 13 < 8;
      const stripe = Math.floor(y / 10) % 2 === 0;
      pixels.data[y * pixels.width + x] = foam
        ? 0xe0f2feff
        : stripe
          ? 0x0284c7ff
          : 0x0369a1ff;
    }
  }
  return FlxGraphic.fromPixels(pixels, 'mesh-water');
}

function createChainTexture(): FlxGraphic {
  const pixels = makeGraphicPixels(128, 16, 0x334155ff);
  for (let y = 0; y < pixels.height; y += 1) {
    for (let x = 0; x < pixels.width; x += 1) {
      const link = Math.floor(x / 8) % 2 === 0;
      const edge = y < 3 || y >= pixels.height - 3;
      pixels.data[y * pixels.width + x] = edge
        ? 0x0f172aff
        : link
          ? 0xf8fafcff
          : 0x94a3b8ff;
    }
  }
  return FlxGraphic.fromPixels(pixels, 'mesh-chain');
}
