import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  FileText,
  GitMerge,
  ShieldCheck,
  Stethoscope,
  Clock3,
  Network,
} from "lucide-react";
import "./Landing.css";

function MedicalCore() {
  const mountRef = useRef(null);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x8bdfff, 1.5));
    const cyanLight = new THREE.PointLight(0x20cfff, 38, 18);
    cyanLight.position.set(2.5, 2, 4);
    scene.add(cyanLight);
    const violetLight = new THREE.PointLight(0x765cff, 22, 16);
    violetLight.position.set(-3, -2, -2);
    scene.add(violetLight);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreGeometry = new THREE.IcosahedronGeometry(1.12, 3);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0b5474,
      emissive: 0x063d58,
      emissiveIntensity: 0.9,
      metalness: 0.35,
      roughness: 0.22,
      transparent: true,
      opacity: 0.88,
      wireframe: true,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    coreGroup.add(core);

    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.72, 2),
      new THREE.MeshBasicMaterial({
        color: 0x35d9ff,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      })
    );
    coreGroup.add(inner);

    const ringMaterial = (color, opacity) =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
      });

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.009, 8, 180),
      ringMaterial(0x38dfff, 0.8)
    );
    ringA.rotation.x = Math.PI * 0.34;
    ringA.rotation.y = Math.PI * 0.12;
    coreGroup.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.007, 8, 180),
      ringMaterial(0x8d70ff, 0.65)
    );
    ringB.rotation.x = Math.PI * 0.68;
    ringB.rotation.y = -Math.PI * 0.18;
    coreGroup.add(ringB);

    const ringC = new THREE.Mesh(
      new THREE.TorusGeometry(1.43, 0.006, 8, 180),
      ringMaterial(0x68bfff, 0.45)
    );
    ringC.rotation.y = Math.PI * 0.5;
    ringC.rotation.z = Math.PI * 0.22;
    coreGroup.add(ringC);

    const particleCount = 850;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 2.25 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x72dfff,
        size: 0.018,
        transparent: true,
        opacity: 0.78,
        sizeAttenuation: true,
      })
    );
    scene.add(particles);

    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let frameId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 520 ? 9.2 : 8;
      camera.updateProjectionMatrix();
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      if (!reducedMotion) {
        coreGroup.rotation.y = elapsed * 0.16;
        coreGroup.rotation.x = Math.sin(elapsed * 0.22) * 0.12;
        ringA.rotation.z += 0.0018;
        ringB.rotation.z -= 0.0012;
        ringC.rotation.x += 0.001;
        particles.rotation.y = elapsed * 0.018;
        particles.rotation.x = Math.sin(elapsed * 0.08) * 0.08;
        cyanLight.position.x = 2.5 + Math.sin(elapsed * 0.5) * 0.45;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      coreGeometry.dispose();
      coreMaterial.dispose();
      inner.geometry.dispose();
      inner.material.dispose();
      [ringA, ringB, ringC].forEach((ring) => {
        ring.geometry.dispose();
        ring.material.dispose();
      });
      particleGeometry.dispose();
      particles.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div className="three-core-canvas" ref={mountRef} aria-hidden="true" />;
}

const capabilities = [
  {
    icon: FileText,
    title: "Unified patient records",
    description: "Bring fragmented clinical documents into one patient-centred view.",
  },
  {
    icon: Clock3,
    title: "Clinical timeline",
    description: "Reconstruct a chronological view of documented patient history.",
  },
  {
    icon: GitMerge,
    title: "Reconciliation workspace",
    description: "Surface diagnosis and medication differences for clinician review.",
  },
  {
    icon: BrainCircuit,
    title: "Evidence-backed summaries",
    description: "Generate draft summaries grounded in available uploaded records.",
  },
];

export default function Landing({ onEnter }) {
  const [launching, setLaunching] = useState(false);

  const enterWorkspace = () => {
    if (launching) return;
    setLaunching(true);
    window.setTimeout(() => onEnter?.(), 420);
  };

  return (
    <main className={`medusa-landing${launching ? " is-launching" : ""}`}>
      <div className="landing-ambient ambient-one" />
      <div className="landing-ambient ambient-two" />

      <header className="landing-nav">
        <a className="landing-logo" href="#home" aria-label="MEDUSA-X home">
          <span className="logo-symbol"><Activity size={25} /></span>
          <span>MEDUSA<span className="logo-x">-X</span></span>
        </a>
        <div className="nav-status">
          <span className="status-dot" />
          CLINICAL INTELLIGENCE PROTOTYPE
        </div>
        <button className="nav-enter" onClick={enterWorkspace} disabled={launching}>
          Enter workspace <ArrowRight size={15} />
        </button>
      </header>

      <section className="landing-hero" id="home">
        <div className="hero-content">
          <div className="hero-tag">
            <span className="status-dot" />
            CONNECTING THE CLINICAL PICTURE
          </div>
          <p className="hero-kicker">A NEW LENS ON PATIENT INFORMATION</p>
          <h1>
            Understand every patient.
            <span> Connect every record.</span>
          </h1>
          <p className="hero-description">
            MEDUSA-X brings fragmented clinical records into a connected
            workspace—helping care teams review patient history, reconcile
            information, and work from evidence with greater clarity.
          </p>
          <div className="hero-actions">
            <button
              className="launch-button"
              onClick={enterWorkspace}
              disabled={launching}
            >
              {launching ? "Opening workspace…" : "Launch Workspace"}
              <ArrowRight size={18} />
            </button>
            <div className="security-label">
              <ShieldCheck size={17} />
              Clinician-in-the-loop by design
            </div>
          </div>
          <div className="hero-metrics">
            <div><strong>01</strong><span>CONNECTED RECORD VIEW</span></div>
            <div><strong>02</strong><span>RECONCILIATION WORKFLOWS</span></div>
            <div><strong>03</strong><span>REVIEWABLE AI DRAFTS</span></div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Animated 3D clinical intelligence visualization">
          <div className="visual-grid" />
          <MedicalCore />
          <div className="core-label">
            <span>MEDUSA-X</span>
            <small>INTELLIGENCE CORE</small>
          </div>
          <div className="scan-line" />
          <div className="floating-card card-top">
            <Network size={19} />
            <div><strong>Record connections</strong><span>Unified patient context</span></div>
          </div>
          <div className="floating-card card-left">
            <Clock3 size={19} />
            <div><strong>Clinical timeline</strong><span>Chronology reconstruction</span></div>
          </div>
          <div className="floating-card card-right">
            <Stethoscope size={19} />
            <div><strong>Clinician review</strong><span>Human decision-making</span></div>
          </div>
          <div className="floating-card card-bottom">
            <BrainCircuit size={19} />
            <div><strong>Evidence-linked drafts</strong><span>Review before use</span></div>
          </div>
          <div className="visual-caption">CONNECTED CLINICAL INTELLIGENCE <span>●</span> PROTOTYPE</div>
        </div>
      </section>

      <section className="landing-features">
        <div className="feature-heading">
          <span>ONE CONNECTED WORKSPACE</span>
          <h2>From fragmented records to a clearer clinical picture.</h2>
        </div>
        <div className="feature-grid">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <article className="landing-feature" key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span>MEDUSA-X · CLINICAL INTELLIGENCE</span>
        <span>PROTOTYPE FOR CLINICAL WORKFLOW SUPPORT</span>
        <span>NOT AN AUTONOMOUS DIAGNOSTIC SYSTEM</span>
      </footer>
    </main>
  );
}
