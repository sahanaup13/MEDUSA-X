import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import {
  Activity,
  Users,
  Stethoscope,
  FileText
} from "lucide-react";
import "./MedusaHospital3D.css";

function createCharacter(type, x, z, scale = 1) {
  const person = new THREE.Group();

  const colors = {
    doctor: { body: 0xf0f5fa, legs: 0x243b59, skin: 0xd9a17c, detail: 0x20c9e8 },
    patient: { body: 0x3b82f6, legs: 0x263b58, skin: 0xd9a17c, detail: 0xffffff },
    nurse: { body: 0x16b8b0, legs: 0x173d5b, skin: 0xd9a17c, detail: 0xffffff }
  };

  const c = colors[type];

  const makeMaterial = (color, roughness = 0.65) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });

  const skin = makeMaterial(c.skin);
  const bodyMat = makeMaterial(c.body);
  const legMat = makeMaterial(c.legs);
  const detailMat = makeMaterial(c.detail);

  const sphere = (radius, material, position, segments = 20) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, segments),
      material
    );
    mesh.position.set(...position);
    mesh.castShadow = true;
    person.add(mesh);
    return mesh;
  };

  const cylinder = (radiusTop, radiusBottom, height, material, position) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16),
      material
    );
    mesh.position.set(...position);
    mesh.castShadow = true;
    person.add(mesh);
    return mesh;
  };

  cylinder(0.12, 0.14, 0.75, legMat, [-0.17, 0.38, 0]);
  cylinder(0.12, 0.14, 0.75, legMat, [0.17, 0.38, 0]);

  sphere(0.15, legMat, [-0.17, 0.04, 0.07]);
  sphere(0.15, legMat, [0.17, 0.04, 0.07]);

  const torso = cylinder(0.32, 0.25, 0.95, bodyMat, [0, 1.18, 0]);
  torso.scale.z = 0.7;

  cylinder(0.09, 0.09, 0.2, skin, [0, 1.75, 0]);
  sphere(0.25, skin, [0, 2.02, 0]);

  if (type !== "nurse") {
    sphere(0.255, makeMaterial(0x263344), [0, 2.15, -0.025]);
  } else {
    sphere(0.26, makeMaterial(0x25354a), [0, 2.12, -0.03]);
  }

  const eyeMat = makeMaterial(0x172638);
  sphere(0.025, eyeMat, [-0.09, 2.04, 0.22], 10);
  sphere(0.025, eyeMat, [0.09, 2.04, 0.22], 10);

  const leftArm = cylinder(0.09, 0.075, 0.75, bodyMat, [-0.39, 1.35, 0]);
  leftArm.rotation.z = -0.2;

  const rightArm = cylinder(0.09, 0.075, 0.75, bodyMat, [0.39, 1.35, 0]);
  rightArm.rotation.z = 0.2;

  sphere(0.09, skin, [-0.46, 0.97, 0]);
  sphere(0.09, skin, [0.46, 0.97, 0]);

  if (type === "doctor") {
    cylinder(0.018, 0.018, 0.8, detailMat, [0, 1.2, 0.18]);

    const tube = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.018, 8, 32, Math.PI),
      makeMaterial(0x263d55)
    );
    tube.position.set(0, 1.55, 0.23);
    tube.rotation.z = Math.PI;
    person.add(tube);

    sphere(0.055, detailMat, [0, 1.43, 0.24]);
  }

  if (type === "nurse") {
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.17, 0.035),
      detailMat
    );
    badge.position.set(0.16, 1.43, 0.2);
    person.add(badge);
  }

  if (type === "patient") {
    sphere(0.045, detailMat, [0, 1.48, 0.21]);
  }

  person.position.set(x, -1, z);
  person.scale.setScalar(scale);
  person.userData.floatOffset = Math.random() * Math.PI * 2;

  return person;
}

function HospitalScene() {
  const mount = useRef(null);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#061426");
    scene.fog = new THREE.Fog("#061426", 12, 38);

    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({
        color: "#102b43",
        metalness: 0.5,
        roughness: 0.28
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#17344e",
      metalness: 0.25,
      roughness: 0.35
    });

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(18, 8, 0.5),
      wallMaterial
    );
    backWall.position.set(0, 3, -5);
    scene.add(backWall);

    const glass = new THREE.MeshStandardMaterial({
      color: "#3ba8ca",
      transparent: true,
      opacity: 0.16,
      metalness: 0.4,
      roughness: 0.1
    });

    for (let i = -7; i <= 7; i += 3.5) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5, 0.12), glass);
      panel.position.set(i, 1.5, -4.65);
      scene.add(panel);
    }

    const core = new THREE.Group();
    scene.add(core);
    core.position.set(0, 1.3, 0);

    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.15, 2),
      new THREE.MeshStandardMaterial({
        color: "#12cfff",
        emissive: "#007cae",
        emissiveIntensity: 1.5,
        wireframe: true
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

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(900);

    for (let i = 0; i < positions.length; i++) {
      positions[i] = (Math.random() - 0.5) * 25;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: "#55dfff",
        size: 0.045,
        transparent: true,
        opacity: 0.7
      })
    );
    scene.add(particles);

    const characters = [
      createCharacter("doctor", -4, 1, 1.3),
      createCharacter("patient", 3.5, 1, 1.3),
      createCharacter("nurse", -1.8, -2, 1.2)
    ];

    characters.forEach(person => scene.add(person));

    let frame;
    let pointerX = 0;
    let previousTime = performance.now();

    const onMove = e => {
      const rect = host.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.3;
    };

    host.addEventListener("pointermove", onMove);

    const animate = now => {
      frame = requestAnimationFrame(animate);

      const delta = Math.min((now - previousTime) / 1000, 0.05);
      previousTime = now;

      const elapsed = now / 1000;

      core.rotation.y += delta * 0.25;
      core.rotation.x = Math.sin(elapsed * 0.35) * 0.12;
      core.position.y = 1.3 + Math.sin(elapsed) * 0.13;

      particles.rotation.y += delta * 0.025;

      camera.position.x += (pointerX - camera.position.x * 0.025) * 0.03;

      characters.forEach((person, index) => {
        const offset = person.userData.floatOffset;
        person.position.y = -1 + Math.sin(elapsed * 1.2 + offset) * 0.035;
        person.rotation.y = Math.sin(elapsed * 0.5 + index) * 0.04;
      });

      renderer.render(scene, camera);
    };

    animate(performance.now());

    const resize = () => {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);

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

      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();

        if (obj.material) {
          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          materials.forEach(material => material.dispose());
        }
      });

      renderer.dispose();

      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mount} className="medusa-3d-scene" />;
}

export default function MedusaHospital3D() {
  const [language, setLanguage] = useState("en");
  const [portal, setPortal] = useState("home");

  const text = {
    en: [
      "Welcome to MEDUSA-X",
      "Doctor Workspace",
      "Patient Portal",
      "Medical Records"
    ],
    hi: [
      "MEDUSA-X में आपका स्वागत है",
      "डॉक्टर कार्यक्षेत्र",
      "मरीज पोर्टल",
      "मेडिकल रिकॉर्ड"
    ],
    kn: [
      "MEDUSA-X ಗೆ ಸ್ವಾಗತ",
      "ವೈದ್ಯರ ಕಾರ್ಯಕ್ಷೇತ್ರ",
      "ರೋಗಿ ಪೋರ್ಟಲ್",
      "ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು"
    ]
  }[language];

  return (
    <div className="medusa-cinematic">

      <div className="medusa-topbar">
        <span />

        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="kn">ಕನ್ನಡ</option>
        </select>
      </div>

      <section className="medusa-intro">

        <div>
          <small>
            <Activity size={15} />
            CLINICAL INTELLIGENCE PLATFORM
          </small>

          <h1>{text[0]}</h1>

          <p>Understand every patient. Connect every record.</p>

          <div className="medusa-buttons">
            <button onClick={() => setPortal("doctor")}>
              <Stethoscope size={18} />
              {text[1]}
            </button>

            <button onClick={() => setPortal("patient")}>
              <Users size={18} />
              {text[2]}
            </button>
          </div>
        </div>

        <HospitalScene />

      </section>

      <section className="medusa-panels">

        <article>
          <FileText />
          <h3>{text[3]}</h3>
          <p>Patient history, reports and clinical documents.</p>
        </article>

        <article>
          <Stethoscope />
          <h3>{text[1]}</h3>
          <p>Clinical review and patient record management.</p>
          <button onClick={() => setPortal("doctor")}>Enter</button>
        </article>

        <article>
          <Users />
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

            <p>
              Connect this view to the existing authenticated
              MEDUSA-X workspace.
            </p>
          </section>
        </div>
      )}

    </div>
  );
}
