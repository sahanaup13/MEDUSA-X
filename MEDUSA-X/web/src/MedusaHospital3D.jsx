
import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Activity, Users, Stethoscope, FileText, Globe } from "lucide-react";
import "./MedusaHospital3D.css";

function HospitalScene() {
  const mount = useRef(null);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#061426");
    scene.fog = new THREE.Fog("#061426", 12, 38);

    const camera = new THREE.PerspectiveCamera(
      45, host.clientWidth / host.clientHeight, 0.1, 100
    );
    camera.position.set(0, 5, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xb9e8ff, 0x14213b, 2));

    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(5, 10, 7);
    key.castShadow = true;
    scene.add(key);

    const blueLight = new THREE.PointLight(0x00bfff, 40, 20);
    blueLight.position.set(-5, 4, 2);
    scene.add(blueLight);

    // Reflective hospital floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({
        color: "#102b43", metalness: 0.5, roughness: 0.28
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Hospital architectural walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#17344e", metalness: 0.25, roughness: 0.35
    });

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(18, 8, 0.5), wallMaterial
    );
    backWall.position.set(0, 3, -5);
    scene.add(backWall);

    // Glass panels
    const glass = new THREE.MeshStandardMaterial({
      color: "#3ba8ca", transparent: true,
      opacity: 0.16, metalness: 0.4, roughness: 0.1
    });

    for (let i = -7; i <= 7; i += 3.5) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 5, 0.12), glass
      );
      panel.position.set(i, 1.5, -4.65);
      scene.add(panel);
    }

    // Animated intelligence core
    const core = new THREE.Group();
    scene.add(core);
    core.position.set(0, 1.3, 0);

    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.15, 2),
      new THREE.MeshStandardMaterial({
        color: "#12cfff", emissive: "#007cae",
        emissiveIntensity: 1.5, wireframe: true
      })
    );
    core.add(orb);

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.8 + i * 0.3, 0.018, 8, 120),
        new THREE.MeshBasicMaterial({
          color: i === 1 ? "#a78bfa" : "#27dfff"
        })
      );
      ring.rotation.x = Math.PI / 2 + i * 0.5;
      core.add(ring);
    }

    // Floating particles
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(900);
    for (let i = 0; i < positions.length; i++) {
      positions[i] = (Math.random() - 0.5) * 25;
    }
    particleGeometry.setAttribute(
      "position", new THREE.BufferAttribute(positions, 3)
    );
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: "#55dfff", size: 0.045, transparent: true, opacity: 0.7
      })
    );
    scene.add(particles);

    // Load real animated human models from local GLB files.
    const loader = new GLTFLoader();
    const mixers = [];

    const characters = [
      { file: "/models/doctor.glb", x: -4, z: 1, scale: 1.3 },
      { file: "/models/patient.glb", x: 3.5, z: 1, scale: 1.3 },
      { file: "/models/nurse.glb", x: -1.8, z: -2, scale: 1.2 }
    ];

    characters.forEach(({ file, x, z, scale }) => {
      loader.load(file, gltf => {
        const person = gltf.scene;
        person.position.set(x, -1, z);
        person.scale.setScalar(scale);
        person.traverse(obj => {
          if (obj.isMesh) obj.castShadow = true;
        });
        scene.add(person);

        if (gltf.animations.length) {
          const mixer = new THREE.AnimationMixer(person);
          mixer.clipAction(gltf.animations[0]).play();
          mixers.push(mixer);
        }
      }, undefined, error => {
        console.warn("3D model unavailable:", file, error);
      });
    });

    const clock = new THREE.Clock();
    let frame;
    let pointerX = 0;

    const onMove = e => {
      const rect = host.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.3;
    };

    host.addEventListener("pointermove", onMove);

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      core.rotation.y += delta * 0.25;
      core.rotation.x = Math.sin(elapsed * 0.35) * 0.12;
      core.position.y = 1.3 + Math.sin(elapsed) * 0.13;
      particles.rotation.y += delta * 0.025;
      camera.position.x += (pointerX - camera.position.x * 0.025) * 0.03;

      mixers.forEach(mixer => mixer.update(delta));
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointermove", onMove);
      mixers.forEach(m => m.stopAllAction());
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material])
            .forEach(m => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mount} className="medusa-3d-scene" />;
}

export default function MedusaHospital3D() {
  const [language, setLanguage] = useState("en");
  const [portal, setPortal] = useState("home");

  const text = {
    en: ["Welcome to MEDUSA-X", "Doctor Workspace", "Patient Portal", "Medical Records"],
    hi: ["MEDUSA-X में आपका स्वागत है", "डॉक्टर कार्यक्षेत्र", "मरीज पोर्टल", "मेडिकल रिकॉर्ड"],
    kn: ["MEDUSA-X ಗೆ ಸ್ವಾಗತ", "ವೈದ್ಯರ ಕಾರ್ಯಕ್ಷೇತ್ರ", "ರೋಗಿ ಪೋರ್ಟಲ್", "ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು"]
  }[language];

  return (
    <main className="medusa-cinematic">
      <header className="medusa-topbar">
        <h2>MEDUSA<span>-X</span></h2>
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="kn">ಕನ್ನಡ</option>
        </select>
      </header>

      <section className="medusa-intro">
        <div>
          <small><Activity size={15}/> CLINICAL INTELLIGENCE PLATFORM</small>
          <h1>{text[0]}</h1>
          <p>Understand every patient. Connect every record.</p>
          <div className="medusa-buttons">
            <button onClick={() => setPortal("doctor")}><Stethoscope/> {text[1]}</button>
            <button onClick={() => setPortal("patient")}><Users/> {text[2]}</button>
          </div>
        </div>
        <HospitalScene/>
      </section>

      <section className="medusa-panels">
        <article>
          <FileText/>
          <h3>{text[3]}</h3>
          <p>Patient history, reports and clinical documents.</p>
        </article>
        <article>
          <Stethoscope/>
          <h3>{text[1]}</h3>
          <p>Clinical review and patient record management.</p>
          <button onClick={() => setPortal("doctor")}>Enter</button>
        </article>
        <article>
          <Users/>
          <h3>{text[2]}</h3>
          <p>Access your health information and reports.</p>
          <button onClick={() => setPortal("patient")}>Enter</button>
        </article>
      </section>

      {portal !== "home" && (
        <div className="medusa-modal">
          <section>
            <button onClick={() => setPortal("home")}>← Back</button>
            <h2>{portal === "doctor" ? text[1] : text[2]}</h2>
            <p>Connect this view to the existing authenticated MEDUSA-X workspace.</p>
          </section>
        </div>
      )}
    </main>
  );
}
