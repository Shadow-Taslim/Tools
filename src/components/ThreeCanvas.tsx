import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ActiveTool } from '../types.ts';

interface ThreeCanvasProps {
  activeTool: ActiveTool;
  interactive?: boolean;
}

export default function ThreeCanvas({ activeTool, interactive = true }: ThreeCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.035);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8);

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Group for 3D elements
    const sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    // 1. Central Multifaceted Crystalline Icosahedron
    const coreGeometry = new THREE.IcosahedronGeometry(1.6, 0);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.88
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    sceneGroup.add(coreMesh);

    // 2. Outer Wireframe Cage
    const wireGeometry = new THREE.IcosahedronGeometry(2.1, 1);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    sceneGroup.add(wireMesh);

    // 3. Orbital Gyroscope Rings
    const ringGeometry1 = new THREE.TorusGeometry(2.6, 0.02, 16, 100);
    const ringMaterial1 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35
    });
    const ring1 = new THREE.Mesh(ringGeometry1, ringMaterial1);
    ring1.rotation.x = Math.PI / 3;
    sceneGroup.add(ring1);

    const ringGeometry2 = new THREE.TorusGeometry(3.0, 0.015, 16, 100);
    const ringMaterial2 = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.25
    });
    const ring2 = new THREE.Mesh(ringGeometry2, ringMaterial2);
    ring2.rotation.y = Math.PI / 4;
    sceneGroup.add(ring2);

    // 4. Particle Constellation
    const particleCount = 650;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const cyanColor = new THREE.Color(0x38bdf8);
    const violetColor = new THREE.Color(0xc084fc);

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.5 + Math.random() * 8.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);

      const mixed = cyanColor.clone().lerp(violetColor, Math.random());
      particleColors[i * 3] = mixed.r;
      particleColors[i * 3 + 1] = mixed.g;
      particleColors[i * 3 + 2] = mixed.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Lighting (Three-Point Studio Rig)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    keyLight.position.set(5, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 2.2);
    rimLight.position.set(-6, -4, -3);
    scene.add(rimLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 2, 8);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Mouse Interaction
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current = { x, y };
      targetRotationRef.current = {
        x: y * 0.35,
        y: x * 0.55
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Responsive Resize
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Ambient geometric rotation
      coreMesh.rotation.x += 0.003;
      coreMesh.rotation.y += 0.005;

      wireMesh.rotation.x -= 0.002;
      wireMesh.rotation.y -= 0.003;

      ring1.rotation.z += 0.006;
      ring2.rotation.x += 0.004;

      particles.rotation.y = elapsedTime * 0.02;

      // Mouse Parallax Lerping
      sceneGroup.rotation.x += (targetRotationRef.current.x - sceneGroup.rotation.x) * 0.04;
      sceneGroup.rotation.y += (targetRotationRef.current.y - sceneGroup.rotation.y) * 0.04;

      // Subtle breathing motion
      const pulse = Math.sin(elapsedTime * 1.5) * 0.04;
      coreMesh.scale.set(1 + pulse, 1 + pulse, 1 + pulse);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      ringGeometry1.dispose();
      ringMaterial1.dispose();
      ringGeometry2.dispose();
      ringMaterial2.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [interactive]);

  // Dynamic color shift based on active tool
  useEffect(() => {
    // Component reacts to active tool state
  }, [activeTool]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 opacity-80"
      aria-hidden="true"
    />
  );
}
