import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from '../../motion/gsap';

/**
 * The landing hero's 3D scene: floating glass panels that show the app itself
 * (a flat dashboard panel, a curved monitors panel), the Vane monitor as a
 * frosted-glass object with a live LED screen, plus a few iridescent bubbles
 * and crystals. This file is the only one that imports three.js, so it's
 * loaded lazily and never reaches pages that don't use it.
 */

export interface WorldSources {
  dashboard: HTMLCanvasElement;
  rooms: HTMLCanvasElement;
  screen: HTMLCanvasElement;
}

export interface World {
  /** Run the entrance (or jump to the end state when `animate` is false). */
  enter(animate: boolean): void;
  /** Call after redrawing any of the source canvases. */
  refresh(): void;
  setTheme(dark: boolean): void;
  setRunning(running: boolean): void;
  dispose(): void;
}

interface Item {
  /** Drifts gently forever (idle motion). */
  float: THREE.Group;
  /** Animated by the entrance. */
  body: THREE.Group;
  from: { position: THREE.Vector3; rotation: THREE.Euler; scale: number };
  bob: { amp: number; speed: number; phase: number; sway: number };
}

export function createWorld(canvas: HTMLCanvasElement, sources: WorldSources, options: { dark: boolean; still: boolean }): World {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0, 9.6);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(3, 5, 6);
  scene.add(key);

  const root = new THREE.Group();
  root.position.x = -0.15;
  scene.add(root);

  // Everything we create, so dispose() can free GPU memory.
  const disposables: { dispose(): void }[] = [envMap, pmrem];
  const track = <T extends { dispose(): void }>(thing: T): T => {
    disposables.push(thing);
    return thing;
  };

  const texture = (source: HTMLCanvasElement, flip = false) => {
    const t = track(new THREE.CanvasTexture(source));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (flip) {
      t.wrapS = THREE.RepeatWrapping;
      t.repeat.x = -1;
    }
    return t;
  };
  const textures = {
    dashboard: texture(sources.dashboard),
    rooms: texture(sources.rooms, true),
    screen: texture(sources.screen),
  };

  /** Clear glass: see-through, glossy, with a faint rainbow sheen at grazing angles. */
  const glass = (opacity: number, tint = 0xffffff, iridescence = 0.5) =>
    track(
      new THREE.MeshPhysicalMaterial({
        color: tint,
        roughness: 0.1,
        metalness: 0,
        transparent: true,
        opacity,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        iridescence,
        iridescenceIOR: 1.35,
        envMapIntensity: 1.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );

  /** A rounded rectangle, extruded into a thin slab with softly beveled edges. */
  const roundedSlab = (w: number, h: number, r: number, depth: number) => {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const bevel = Math.min(0.025, depth / 2);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 16,
    });
    geo.translate(0, 0, -depth / 2);
    return track(geo);
  };

  /** White rounded rectangle on black: used as an alpha mask to round off curved glass. */
  const roundedMask = (aspect: number, radiusFraction: number) => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.round(1024 / aspect);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(0, 0, c.width, c.height, c.height * radiusFraction);
    ctx.fill();
    return track(new THREE.CanvasTexture(c));
  };

  /** The app screens: unlit so the text stays crisp and true to the theme colors. */
  const screenMaterial = (map: THREE.Texture, side: THREE.Side = THREE.FrontSide) =>
    track(new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false, side }));

  const items: Item[] = [];
  const add = (body: THREE.Group, from: Item['from'], bob: Item['bob']): Item => {
    const float = new THREE.Group();
    float.position.copy(body.position);
    body.position.set(0, 0, 0);
    float.add(body);
    root.add(float);
    const item = { float, body, from, bob };
    items.push(item);
    return item;
  };

  // --- Flat dashboard panel ---------------------------------------------------
  const dash = new THREE.Group();
  const slab = new THREE.Mesh(roundedSlab(3.3, 2.28, 0.36, 0.04), glass(0.12));
  const dashScreen = new THREE.Mesh(track(new THREE.PlaneGeometry(3.2, 2.2)), screenMaterial(textures.dashboard));
  dashScreen.position.z = 0.065;
  dashScreen.renderOrder = 2;
  dash.add(slab, dashScreen);
  dash.position.set(-0.55, 0.6, 0);
  dash.rotation.set(-0.04, 0.26, 0.02);
  add(
    dash,
    { position: new THREE.Vector3(-1.8, 1.8, -5), rotation: new THREE.Euler(0.7, 0.9, -0.2), scale: 0.7 },
    { amp: 0.06, speed: 0.7, phase: 0, sway: 0.02 },
  );

  // --- Curved monitors panel (concave, like a curved display) -----------------
  const radius = 2.6;
  const arc = 3.0 / radius; // the texture is 2.5:1 and 1.2 tall, so 3.0 wide along the arc
  const curved = new THREE.Group();
  const curveGlass = new THREE.Mesh(
    track(new THREE.CylinderGeometry(radius, radius, 1.28, 64, 1, true, Math.PI - arc / 2 - 0.03, arc + 0.06)),
    glass(0.12),
  );
  // Round the curved glass's corners: the mask's width is the arc length, its height the panel's.
  const curveMaterial = curveGlass.material as THREE.MeshPhysicalMaterial;
  curveMaterial.alphaMap = roundedMask((radius * (arc + 0.06)) / 1.28, 0.2);
  const curveScreen = new THREE.Mesh(
    track(new THREE.CylinderGeometry(radius - 0.03, radius - 0.03, 1.2, 64, 1, true, Math.PI - arc / 2, arc)),
    screenMaterial(textures.rooms, THREE.BackSide),
  );
  curveScreen.renderOrder = 2;
  // Shift so the middle of the arc sits at the group's origin.
  curveGlass.position.z = radius;
  curveScreen.position.z = radius;
  curved.add(curveGlass, curveScreen);
  curved.position.set(0.85, -1.2, 0.9);
  curved.rotation.set(0.05, -0.22, -0.03);
  add(
    curved,
    { position: new THREE.Vector3(4.5, -2.2, -1), rotation: new THREE.Euler(-0.3, -1.4, 0.2), scale: 0.6 },
    { amp: 0.05, speed: 0.6, phase: 1.7, sway: 0.015 },
  );

  // --- The Vane monitor: frosted glass body with a live LED screen ------------
  const device = new THREE.Group();
  const bodyMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: options.dark ? 0x3a423e : 0xeef3ef,
      roughness: 0.22,
      transparent: true,
      opacity: 0.66,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      iridescence: 0.65,
      iridescenceIOR: 1.4,
      envMapIntensity: 1.4,
    }),
  );
  const body = new THREE.Mesh(track(new RoundedBoxGeometry(1.06, 1.34, 0.4, 6, 0.17)), bodyMaterial);
  const bezel = new THREE.Mesh(
    roundedSlab(0.9, 0.72, 0.1, 0.012),
    track(new THREE.MeshPhysicalMaterial({ color: 0x0b100e, roughness: 0.15, clearcoat: 1 })),
  );
  bezel.position.set(0, 0.18, 0.2);
  const ledScreen = new THREE.Mesh(track(new THREE.PlaneGeometry(0.82, 0.64)), screenMaterial(textures.screen));
  ledScreen.position.set(0, 0.18, 0.222);
  ledScreen.renderOrder = 3;
  const light = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.18, 0.025, 0.01)),
    track(new THREE.MeshBasicMaterial({ color: 0xd9a21b, toneMapped: false })),
  );
  light.position.set(0, -0.5, 0.205);
  device.add(body, bezel, ledScreen, light);
  device.position.set(1.5, 0.62, 1.5);
  device.rotation.set(0.05, -0.4, 0);
  add(
    device,
    { position: new THREE.Vector3(1.5, -3.6, 1.5), rotation: new THREE.Euler(0.4, -3.2, 0.2), scale: 0.5 },
    { amp: 0.08, speed: 0.9, phase: 3.1, sway: 0.05 },
  );

  // --- Bubbles and crystals ---------------------------------------------------
  const sphere = track(new THREE.SphereGeometry(1, 48, 32));
  // Soap-film bubbles: clear in the middle, a rainbow rim at the edges, one bright highlight.
  const bubbleMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uShift: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uShift;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec3 n = normalize(vNormal);
          vec3 v = normalize(vView);
          float f = 1.0 - abs(dot(n, v));
          float rim = pow(f, 2.2);
          // A thin-film shimmer in the brand's sky, sage and soft gold (no magenta).
          vec3 sky = vec3(0.55, 0.78, 0.92);
          vec3 sage = vec3(0.62, 0.84, 0.70);
          vec3 gold = vec3(0.96, 0.86, 0.58);
          float h = fract(f * 1.3 + uShift) * 3.0;
          vec3 film = h < 1.0 ? mix(sky, sage, h) : h < 2.0 ? mix(sage, gold, h - 1.0) : mix(gold, sky, h - 2.0);
          vec3 color = mix(vec3(1.0), film, 0.7);
          vec3 light = normalize(vec3(-0.45, 0.6, 0.7));
          float spec = pow(max(dot(reflect(-light, n), v), 0.0), 70.0);
          float alpha = clamp(rim * 0.85 + spec * 0.9 + 0.025, 0.0, 1.0);
          gl_FragColor = vec4(color + spec, alpha);
        }`,
    }),
  );
  const bubbles: [number, number, number, number][] = [
    [-2.15, 1.75, 0.6, 0.24],
    [2.35, 1.75, -0.6, 0.34],
    [-1.75, -1.45, 1.3, 0.17],
    [0.25, 2.0, 1.0, 0.12],
    [2.6, -0.35, 1.7, 0.2],
  ];
  bubbles.forEach(([x, y, z, r], i) => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(sphere, bubbleMat);
    m.scale.setScalar(r);
    g.add(m);
    g.position.set(x, y, z);
    add(
      g,
      { position: new THREE.Vector3(x, y - 0.6, z), rotation: new THREE.Euler(), scale: 0.01 },
      { amp: 0.12, speed: 0.5 + i * 0.13, phase: i * 1.3, sway: 0 },
    );
  });

  const crystalGeo = track(new THREE.OctahedronGeometry(1, 0));
  const crystalMaterial = (color: number) =>
    track(
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.04,
        transparent: true,
        opacity: 0.8,
        clearcoat: 1,
        iridescence: 0.8,
        flatShading: true,
        envMapIntensity: 1.8,
        depthWrite: false,
      }),
    );
  // Sage and sky: the brand's comfort and clear colors.
  const crystalMats = [crystalMaterial(0x86b89a), crystalMaterial(0x8cc3e6)];
  const crystals: [number, number, number, number, number][] = [
    [-2.4, -0.8, -0.4, 0.8, 0.25],
    [2.35, -1.75, 0.6, 0.5, -0.35],
  ];
  crystals.forEach(([x, y, z, s, tilt], i) => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(crystalGeo, crystalMats[i]);
    m.scale.set(s * 0.36, s, s * 0.36);
    g.add(m);
    g.position.set(x, y, z);
    g.rotation.z = tilt;
    add(
      g,
      { position: new THREE.Vector3(x, y - 2.5, z), rotation: new THREE.Euler(0, 2, tilt), scale: 0.4 },
      { amp: 0.07, speed: 0.45 + i * 0.2, phase: 2 + i, sway: 0.03 },
    );
  });

  // Remember each item's resting pose; the entrance animates toward it.
  const rest = items.map((it) => ({
    rotation: it.body.rotation.clone(),
    scale: it.body.scale.x,
  }));
  const materials = new Set<THREE.Material>();
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) materials.add(o.material as THREE.Material);
  });
  const baseOpacity = new Map([...materials].map((m) => [m, m.opacity] as const));

  const render = () => renderer.render(scene, camera);

  // --- Sizing -------------------------------------------------------------------
  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull back on narrow frames so the whole arrangement stays in view.
    camera.position.z = camera.aspect < 1.05 ? 9.6 / Math.pow(camera.aspect / 1.05, 0.85) : 9.6;
    camera.updateProjectionMatrix();
    render();
  };
  const resizeObserver = new ResizeObserver(resize);
  if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

  // --- Pointer: the scene tilts a little toward the cursor ---------------------
  const pointer = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  if (!options.still) window.addEventListener('pointermove', onPointer, { passive: true });

  // --- Loop -----------------------------------------------------------------------
  const clock = new THREE.Clock();
  const tick = () => {
    const t = clock.getElapsedTime();
    for (const it of items) {
      it.float.position.y = it.float.userData['baseY'] + Math.sin(t * it.bob.speed + it.bob.phase) * it.bob.amp;
      it.float.rotation.z = Math.sin(t * it.bob.speed * 0.7 + it.bob.phase) * it.bob.sway;
    }
    bubbleMat.uniforms['uShift'].value = t * 0.05;
    root.rotation.y += (pointer.x * 0.12 - root.rotation.y) * 0.05;
    root.rotation.x += (pointer.y * 0.06 - root.rotation.x) * 0.05;
    render();
  };
  for (const it of items) it.float.userData['baseY'] = it.float.position.y;

  let running = false;
  let entered = false;

  // Start hidden in each item's "from" pose until enter() runs.
  items.forEach((it) => {
    it.body.position.copy(it.from.position).sub(it.float.position);
    it.body.rotation.copy(it.from.rotation);
    it.body.scale.setScalar(it.from.scale);
  });
  for (const m of materials) m.opacity = 0;

  return {
    enter(animate: boolean) {
      if (entered) return;
      entered = true;
      if (!animate) {
        items.forEach((it, i) => {
          it.body.position.set(0, 0, 0);
          it.body.rotation.copy(rest[i].rotation);
          it.body.scale.setScalar(rest[i].scale);
        });
        for (const m of materials) m.opacity = baseOpacity.get(m) ?? 1;
        render();
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      for (const m of materials) tl.to(m, { opacity: baseOpacity.get(m) ?? 1, duration: 0.9 }, 0.1);
      items.forEach((it, i) => {
        const at = 0.05 + i * 0.07;
        const ease = it.body === device ? 'back.out(1.3)' : 'power3.out';
        tl.to(it.body.position, { x: 0, y: 0, z: 0, duration: 1.4, ease }, at)
          .to(it.body.rotation, { x: rest[i].rotation.x, y: rest[i].rotation.y, z: rest[i].rotation.z, duration: 1.5, ease }, at)
          .to(it.body.scale, { x: rest[i].scale, y: rest[i].scale, z: rest[i].scale, duration: 1.2, ease: it.from.scale < 0.1 ? 'elastic.out(1, 0.5)' : ease }, at);
      });
    },

    refresh() {
      textures.dashboard.needsUpdate = true;
      textures.rooms.needsUpdate = true;
      textures.screen.needsUpdate = true;
      if (!running) render();
    },

    setTheme(dark: boolean) {
      bodyMaterial.color.set(dark ? 0x3a423e : 0xeef3ef);
      if (!running) render();
    },

    setRunning(on: boolean) {
      if (on === running) return;
      running = on;
      renderer.setAnimationLoop(on && !options.still ? tick : null);
      if (!on || options.still) render();
    },

    dispose() {
      gsap.killTweensOf([...materials]);
      items.forEach((it) => gsap.killTweensOf([it.body.position, it.body.rotation, it.body.scale]));
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointer);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
