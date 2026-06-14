"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { cn } from "@/lib/utils";
import type {
  TwoDimensionalKinematics,
  TwoDimensionalParameters,
} from "@/types/origami";

export type SimulationSurfaceProps = {
  parameters: TwoDimensionalParameters;
  kinematics: TwoDimensionalKinematics;
  className?: string;
};

type ThreeRuntime = {
  animationId: number;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  modelGroup: THREE.Group;
  resizeObserver: ResizeObserver;
};

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function makeTube(
  points: THREE.Vector3[],
  radius: number,
  color: number,
  name: string
) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 32, radius, 18, false);
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.08,
    roughness: 0.38,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

function makeJoint(position: THREE.Vector3, labelColor: number) {
  const geometry = new THREE.SphereGeometry(0.08, 24, 16);
  const material = new THREE.MeshStandardMaterial({
    color: labelColor,
    metalness: 0.15,
    roughness: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  return mesh;
}

function makeLabel(text: string, position: THREE.Vector3, color: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 96;

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "700 42px Arial";
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(0.9, 0.34, 1);
  return sprite;
}

function orientAlongY(object: THREE.Object3D, direction: THREE.Vector3) {
  object.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );
}

function addFlange(
  group: THREE.Group,
  position: THREE.Vector3,
  direction: THREE.Vector3
) {
  const geometry = new THREE.CylinderGeometry(0.44, 0.44, 0.11, 40, 1, true);
  const material = new THREE.MeshStandardMaterial({
    color: 0x6f7d88,
    metalness: 0.55,
    roughness: 0.24,
    side: THREE.DoubleSide,
  });
  const flange = new THREE.Mesh(geometry, material);
  flange.position.copy(position);
  orientAlongY(flange, direction);
  group.add(flange);
}

function addBellows(
  group: THREE.Group,
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  tubeRadius: number
) {
  const curve = new THREE.CatmullRomCurve3([a, b, c], false, "centripetal");
  const tubeGeometry = new THREE.TubeGeometry(curve, 80, tubeRadius, 32, false);
  const tubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8c1c8,
    metalness: 0.35,
    roughness: 0.34,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.84,
  });
  const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
  tube.name = "corrugated-tube-body";
  group.add(tube);

  const lumenGeometry = new THREE.TubeGeometry(
    curve,
    80,
    tubeRadius * 0.72,
    32,
    false
  );
  const lumenMaterial = new THREE.MeshStandardMaterial({
    color: 0x26343e,
    metalness: 0.05,
    roughness: 0.62,
    side: THREE.BackSide,
  });
  const lumen = new THREE.Mesh(lumenGeometry, lumenMaterial);
  lumen.name = "bellows-lumen-surface";
  group.add(lumen);

  const ribMaterial = new THREE.MeshStandardMaterial({
    color: 0x778691,
    metalness: 0.45,
    roughness: 0.28,
  });
  const ribCount = 34;

  for (let index = 1; index < ribCount - 1; index += 1) {
    const t = index / (ribCount - 1);
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const ribGeometry = new THREE.TorusGeometry(tubeRadius + 0.035, 0.025, 10, 36);
    const rib = new THREE.Mesh(ribGeometry, ribMaterial);
    rib.position.copy(center);
    rib.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      tangent.normalize()
    );
    group.add(rib);
  }

  addFlange(group, a, curve.getTangentAt(0));
  addFlange(group, c, curve.getTangentAt(1));
}

function makeSurfacePath(
  curve: THREE.CatmullRomCurve3,
  radius: number,
  side: 1 | -1
) {
  const frontFraction = 0.35;
  const lateralFraction = Math.sqrt(1 - frontFraction ** 2);
  const surfaceRadius = radius + 0.085;

  return Array.from({ length: 49 }, (_, index) => {
    const t = index / 48;
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const planarNormal = new THREE.Vector3(tangent.y, -tangent.x, 0).normalize();

    return center
      .clone()
      .addScaledVector(planarNormal, side * surfaceRadius * lateralFraction)
      .add(new THREE.Vector3(0, 0, surfaceRadius * frontFraction));
  });
}

function buildModel(
  group: THREE.Group,
  parameters: TwoDimensionalParameters,
  kinematics: TwoDimensionalKinematics
) {
  disposeObject(group);
  group.clear();
  group.position.set(0, 0, 0);

  const unit = 1 / 110;
  const linkLength = kinematics.derivedLinkLength * unit;
  const theta = kinematics.theta;
  const a = new THREE.Vector3(0, 0, 0);
  const b = new THREE.Vector3(0, linkLength, 0);
  const c = new THREE.Vector3(
    -linkLength * Math.sin(theta),
    linkLength + linkLength * Math.cos(theta),
    0
  );
  const centerCurve = new THREE.CatmullRomCurve3(
    [a, b, c],
    false,
    "centripetal"
  );
  const tubeRadius = THREE.MathUtils.clamp(
    parameters.r * unit * 0.72,
    0.16,
    0.42
  );
  const s1Path = makeSurfacePath(centerCurve, tubeRadius, 1);
  const s2Path = makeSurfacePath(centerCurve, tubeRadius, -1);
  const labelIndex = 31;

  addBellows(group, a, b, c, tubeRadius);
  group.add(makeTube([a, b, c], 0.035, 0x08a9e8, "virtual-links"));
  group.add(makeTube(s1Path, 0.022, 0xf8ba00, "s1-surface-tape"));
  group.add(makeTube(s2Path, 0.022, 0xff1f1f, "s2-surface-tape"));
  group.add(makeJoint(a, 0x111111));
  group.add(makeJoint(b, 0x111111));
  group.add(makeJoint(c, 0x111111));
  group.add(makeLabel("A", a.clone().add(new THREE.Vector3(-0.18, -0.1, 0)), "#111111"));
  group.add(makeLabel("B", b.clone().add(new THREE.Vector3(0.18, 0.08, 0)), "#111111"));
  group.add(makeLabel("C", c.clone().add(new THREE.Vector3(-0.2, 0.15, 0)), "#111111"));
  group.add(makeLabel("S1", s1Path[labelIndex], "#f8ba00"));
  group.add(makeLabel("S2", s2Path[labelIndex], "#ff1f1f"));
  group.add(makeLabel("L", b.clone().lerp(c, 0.45).add(new THREE.Vector3(0.16, 0, 0)), "#08a9e8"));

  const bounds = new THREE.Box3().setFromPoints([a, b, c]);
  bounds.expandByScalar(tubeRadius + 0.18);
  const center = bounds.getCenter(new THREE.Vector3());
  group.position.sub(center);
}

export function SimulationSurface({
  parameters,
  kinematics,
  className,
}: SimulationSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<ThreeRuntime | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f7f7);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.35, 6.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.minDistance = 2.4;
    controls.maxDistance = 8;

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9bdcff, 0.9);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(6, 18, 0x9aa6b2, 0xd6dce0);
    grid.position.y = -2.05;
    scene.add(grid);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      const animationId = window.requestAnimationFrame(animate);
      if (runtimeRef.current) {
        runtimeRef.current.animationId = animationId;
      }
    };

    const animationId = window.requestAnimationFrame(animate);
    runtimeRef.current = {
      animationId,
      camera,
      controls,
      renderer,
      scene,
      modelGroup,
      resizeObserver,
    };

    return () => {
      window.cancelAnimationFrame(runtimeRef.current?.animationId ?? animationId);
      resizeObserver.disconnect();
      controls.dispose();
      disposeObject(modelGroup);
      renderer.dispose();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

    buildModel(runtime.modelGroup, parameters, kinematics);
  }, [parameters, kinematics]);

  return (
    <section
      id="threeContainer"
      aria-label="3D bending simulation surface"
      className={cn(
        "absolute inset-0 overflow-hidden bg-[#f6f7f7]",
        className
      )}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 bottom-[150px]"
      />
      <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100vw-24px)] rounded-[6px] border border-[#34495e]/20 bg-white/75 px-4 py-3 text-[#34495e] shadow-sm backdrop-blur sm:left-8 sm:top-8 sm:px-5 sm:py-4">
        <h1 className="text-base font-black sm:text-xl">3D organ and mathematics simulator</h1>
        <p className="mt-1 text-xs text-[#526579] sm:text-sm">
          Figure 12 kinematics extruded into a 3D, orbitable bellows model.
        </p>
      </div>
      <div className="pointer-events-none absolute right-3 top-24 hidden rounded-[6px] border border-[#34495e]/20 bg-white/75 px-5 py-4 text-sm text-[#34495e] shadow-sm backdrop-blur sm:right-8 sm:top-8 sm:block">
        <div className="mb-2 text-base font-black">3D kinematics</div>
        <div>theta = {kinematics.thetaDegrees.toFixed(1)} deg</div>
        <div>x = {kinematics.endEffectorX.toFixed(1)} mm</div>
        <div>y = {kinematics.endEffectorY.toFixed(1)} mm</div>
        <div>L = {kinematics.derivedLinkLength.toFixed(1)} mm</div>
        <div className="mt-2 text-xs text-[#66798b]">Drag to orbit · Scroll to zoom</div>
      </div>
    </section>
  );
}
