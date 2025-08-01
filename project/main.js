const guiControls = {
  gravity: -9.82,
  ballFrequency: 1000, // Frequência em milissegundos
};

const gui = new dat.GUI();

// Controle de Gravidade
gui.add(guiControls, 'gravity', -20, 0).name('Gravidade (Y)').onChange(value => {
  if (world) {
    world.gravity.y = value;
  }
});

// Inicialização do jogo
let gameStarted = false;
let countdownStarted = false;
let countdownTimer = null;
let countdownValue = 3;
let bolinhaInterval = null;

const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.width = "100%";
overlay.style.height = "100%";
overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
overlay.style.color = "white";
overlay.style.display = "flex";
overlay.style.flexDirection = "column";
overlay.style.alignItems = "center";
overlay.style.justifyContent = "center";
overlay.style.fontSize = "48px";
overlay.style.fontFamily = "sans-serif";
overlay.style.zIndex = "9999";
overlay.innerText = "Pressione qualquer tecla ou clique para iniciar";
document.body.appendChild(overlay);

const gameSong = new Audio("./sounds/tema.mp3");
gameSong.volume = 0.4

let audioContext;
let bubbleSoundBuffer;

function initAudio() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            loadBubbleSound('./sounds/bubble-pop.mp3');
        } catch (e) {
            console.warn("Web Audio API não é suportada neste navegador.");
        }
    }
}

function loadBubbleSound(url) {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
        audioContext.decodeAudioData(request.response, function(buffer) {
            bubbleSoundBuffer = buffer;
        }, function(e) {
            console.error("Erro ao decodificar dados de áudio:", e);
        });
    };
    request.onerror = function() {
        console.error("Erro ao carregar o arquivo de áudio.");
    };
    request.send();
}

window.addEventListener('click', initAudio);

function playBubbleSound() {
    if (bubbleSoundBuffer && audioContext) {
        const source = audioContext.createBufferSource();
        source.buffer = bubbleSoundBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }
}

function handleStartKey() {
  if (countdownStarted || gameStarted) return;
  countdownStarted = true;
  
  let current = countdownValue;

  setTimeout(() => gameSong.play(), 1000)

  overlay.innerText = `Bolinhas caindo em ${current}...`;
  countdownTimer = setInterval(() => {
    current--;
    if (current > 0) {
      overlay.innerText = `Bolinhas caindo em ${current}...`;
    } else {
      clearInterval(countdownTimer);
      startGame();
    }
  }, 1000);
}

window.addEventListener("keydown", handleStartKey);
window.addEventListener("mousedown", handleStartKey);

function startGame() {
  if (gameStarted) return;

  gameStarted = true;
  overlay.remove();
  document.body.style.cursor = "none";

  score = 0;
  scoreDisplay.innerText = `Pontos: ${score}`;
  scoreDisplay.style.display = "block";

  gameTimeRemaining = gameDuration;
  timerDisplay.style.display = "block";
  timerDisplay.innerText = `${gameTimeRemaining}s`;

  gameTimerInterval = setInterval(() => {
    gameTimeRemaining--;
    timerDisplay.innerText = `${gameTimeRemaining}s`;

    if (gameTimeRemaining <= 0) {
      clearInterval(gameTimerInterval);
      endGame();
    }
  }, 1000);

  bolinhaInterval = setInterval(() => {
    createEsferasCaindo();
  }, 1000);
}

// Reiniciar jogo
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") {
    resetGame();
  }
});

function resetGame() {
  // Para geração de bolinhas
  gameSong.pause()
  gameSong.currentTime = 0;
  clearInterval(bolinhaInterval);

  // Remove bolinhas da cena e do mundo físico
  for (let i = spheres.length - 1; i >= 0; i--) {
    scene.remove(spheres[i]);
    world.removeBody(sphereBodies[i]);
    spheres.splice(i, 1);
    sphereBodies.splice(i, 1);
  }

  // Reseta posição da cesta
  basket.position.set(-1, -1.5, 0);

  // Reseta variáveis
  gameStarted = false;
  countdownStarted = false;
  countdownValue = 3;

  // Exibe overlay de início novamente
  overlay.innerText = "Pressione qualquer tecla ou clique para iniciar";
  document.body.appendChild(overlay);
  document.body.style.cursor = "default";
}

// Timer
let gameDuration = 40; // segundos
let gameTimeRemaining = gameDuration;
let gameTimerInterval = null;

let score = 0;

const scoreDisplay = document.createElement("div");
scoreDisplay.style.position = "fixed";
scoreDisplay.style.top = "60px";
scoreDisplay.style.left = "50%";
scoreDisplay.style.transform = "translateX(-50%)";
scoreDisplay.style.color = "white";
scoreDisplay.style.backgroundColor = "black";
scoreDisplay.style.padding = "4px";
scoreDisplay.style.fontSize = "32px";
scoreDisplay.style.fontFamily = "sans-serif";
scoreDisplay.style.zIndex = "9998";
scoreDisplay.style.display = "none";
document.body.appendChild(scoreDisplay);


const timerDisplay = document.createElement("div");
timerDisplay.style.position = "fixed";
timerDisplay.style.top = "20px";
timerDisplay.style.left = "50%";
timerDisplay.style.transform = "translateX(-50%)";
timerDisplay.style.color = "white";
timerDisplay.style.backgroundColor = "black";
timerDisplay.style.padding = "4px";
timerDisplay.style.fontSize = "32px";
timerDisplay.style.fontFamily = "sans-serif";
timerDisplay.style.zIndex = "9998";
timerDisplay.style.display = "none";
document.body.appendChild(timerDisplay);

// Finalizar jogo
function endGame() {
  gameSong.pause()
  gameSong.currentTime = 0;

  clearInterval(bolinhaInterval);
  timerDisplay.style.display = "none";
  scoreDisplay.style.display = "none";

  overlay.innerText = `Fim do jogo! Pressione R para reiniciar \n Pontos: ${score}`;
  document.body.appendChild(overlay);
  document.body.style.cursor = "default";

  gameStarted = false;
}

// Init
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(2, 0, 0);
camera.lookAt(new THREE.Vector3(0, 0, 0));
renderer.shadowMapEnabled = true;
renderer.shadowMapType = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0x666666));

const light = new THREE.DirectionalLight(0x666666, 3);
light.position.set(2, 8, 0);
light.castShadow = true;
scene.add(light);

light.shadowMapSizeWidth = 1024;
light.shadowMapSizeHeight = 1024;
light.shadowCameraNear = 0.5;
light.shadowCameraFar = 20;
light.shadowCameraLeft = -5;
light.shadowCameraRight = 5;
light.shadowCameraTop = 5;
light.shadowCameraBottom = -5;

// world
var world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // gravidade da terra em m/s²

var groundBody = new CANNON.Body({
  mass: 0,
});

var groundShape = new CANNON.Plane();

const skyBoxGeo = new THREE.SphereGeometry(38, 32, 32)
const skyBoxMaterial = new THREE.MeshBasicMaterial({
    map: THREE.ImageUtils.loadTexture('./textures/background.png'),
    side: 2
})

scene.add(new THREE.Mesh(skyBoxGeo, skyBoxMaterial))

const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const spherePhysicsMaterial = new CANNON.Material("sphereMaterial");

let sTexture = THREE.ImageUtils.loadTexture('./textures/grape.png')

const specialSphereMaterial = new THREE.MeshPhongMaterial({      
  emissive: 0xffff00,    
  emissiveIntensity: 10,  
  specular: 0xdddddd,
  reflectivity: 2,
  map: sTexture,
  shininess: 150         
});

groundBody.addShape(groundShape);

groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
groundBody.position.y = -2;
groundBody.material = spherePhysicsMaterial;
world.addBody(groundBody);

var fixedTimeStep = 1.0 / 120.0; // 60 atualizações por segundo (60 Hz).
var maxSubSteps = 3;

const now = performance.now() / 1000; // em segundos
const deltaTime = lastTime ? now - lastTime : fixedTimeStep;
lastTime = now;

// *** bolinhas ***

const spheres = [];
const sphereBodies = [];

function createEsferasCaindo() {
    const materiais = [
        new THREE.MeshPhongMaterial(
            { opacity: 0.3, transparent: true, map: sTexture }
        ), // Vidro
        new THREE.MeshPhongMaterial(
            { shininess: 150, map: sTexture, specular: 0x222222 }
        ), // Polida 
        new THREE.MeshPhongMaterial({ emissive: 0x660066, map: sTexture }) // Brilhante
  ];

  // Determina se a bolinha será especial (20% de chance)
  const isSpecial = Math.random() < 0.2; 

  const material = isSpecial ? specialSphereMaterial : materiais[Math.floor(Math.random() * materiais.length)];
  const points = isSpecial ? 50 : 10; // Define os pontos

  const mesh = new THREE.Mesh(sphereGeometry, material);

  mesh.position.set(
    -1 + (Math.random() - 0.5) * 0.2,
    5 + Math.random() * 2,
    (Math.random() - 0.5) * 8
  );
  mesh.castShadow = true;
  scene.add(mesh);
  spheres.push(mesh);

  const radius = 0.1;
  const sphereBody = new CANNON.Body({
    mass: 5,
    material: spherePhysicsMaterial,
    shape: new CANNON.Sphere(radius),
  });

  // Anexamos os pontos ao corpo físico da bolinha
  sphereBody.userData = { points: points };

  const contactMaterial = new CANNON.ContactMaterial(
    spherePhysicsMaterial,
    spherePhysicsMaterial,
    {
      friction: 0.2,
      restitution: 0.7,
    }
  );

  sphereBody.position.copy(mesh.position);
  sphereBody.linearDamping = 0.5;
  sphereBody.angularDamping = 0.5;
  world.addBody(sphereBody);
  world.addContactMaterial(contactMaterial);
  sphereBodies.push(sphereBody);
}

const basketWidth = 1;  // Diâmetro
const basketDepth = 1;
const wallThickness = 0.05;
const wallHeight = 0.75;
const bottomThickness = 0.05;
const initialPosition = new CANNON.Vec3(-1, -1.5, 0);

const basketMaterial = new CANNON.Material("basketMaterial");

const contactMaterial = new CANNON.ContactMaterial(
  basketMaterial,
  spherePhysicsMaterial,
  {
    friction: 1.0,      // mais atrito
    restitution: 0.3,   // menos quique
  }
);

world.addContactMaterial(contactMaterial);

// Corpo físico unificado da cesta
const basketBody = new CANNON.Body({
  mass: 0,
  material: basketMaterial,
  position: initialPosition.clone(),
  type: CANNON.Body.KINEMATIC,
});

basketBody.name = "cesta";
basketBody.updateMassProperties();
let targetBasketPos = initialPosition.clone();

// Fundo
const basketBottom = new CANNON.Box(new CANNON.Vec3(basketWidth / 2, bottomThickness, basketDepth / 2))

basketBody.addShape(
  basketBottom,
  new CANNON.Vec3(0, -wallHeight / 2, 0)
);

// Bloquear o fundo
basketBody.addShape(
  new CANNON.Box(new CANNON.Vec3(basketWidth / 2, 0.05, basketDepth / 2)),
  new CANNON.Vec3(0, -wallHeight / 2 -0.05, 0),
);

// Paredes
basketBody.addShape(
  new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight / 2, basketDepth / 2)),
  new CANNON.Vec3(-basketWidth / 2 + wallThickness, 0, 0)
);

basketBody.addShape(
  new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight / 2, basketDepth / 2)),
  new CANNON.Vec3(basketWidth / 2 - wallThickness, 0, 0)
);

basketBody.addShape(
  new CANNON.Box(new CANNON.Vec3(basketWidth / 2, wallHeight / 2, wallThickness)),
  new CANNON.Vec3(0, 0, basketDepth / 2 - wallThickness)
);

basketBody.addShape(
  new CANNON.Box(new CANNON.Vec3(basketWidth / 2, wallHeight / 2, wallThickness)),
  new CANNON.Vec3(0, 0, -basketDepth / 2 + wallThickness)
);

world.addBody(basketBody);

const basket = new THREE.Object3D();

const wallMaterial = new THREE.MeshPhongMaterial({ 
    map: THREE.ImageUtils.loadTexture('./textures/wood.png')
});

// Fundo
const bottom = new THREE.Mesh(
  new THREE.BoxGeometry(basketWidth, bottomThickness * 2, basketDepth),
  wallMaterial
);
bottom.position.set(0, -wallHeight / 2, 0);
basket.add(bottom);

// Laterais
const frontMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  depthWrite: false,
  opacity: 0.1,
});

const front = new THREE.Mesh(
  new THREE.BoxGeometry(wallThickness * 2, wallHeight, basketDepth),
  frontMaterial
);
front.position.set(basketWidth / 2 - wallThickness, 0, 0);
basket.add(front);

const back = new THREE.Mesh(
  new THREE.BoxGeometry(wallThickness * 2, wallHeight, basketDepth),
  wallMaterial
);
back.position.set(-basketWidth / 2 + wallThickness, 0, 0);
basket.add(back);

const left = new THREE.Mesh(
  new THREE.BoxGeometry(basketWidth, wallHeight, wallThickness * 2),
  wallMaterial
);
left.position.set(0, 0, basketDepth / 2 - wallThickness);
basket.add(left);

const right = new THREE.Mesh(
  new THREE.BoxGeometry(basketWidth, wallHeight, wallThickness * 2),
  wallMaterial
);
right.position.set(0, 0, -basketDepth / 2 + wallThickness);
basket.add(right);

basket.position.copy(basketBody.position);
scene.add(basket);

const planeGeo = new THREE.PlaneGeometry(25, 40);
const planeMaterial = new THREE.MeshPhongMaterial({
    opacity: 0.4, 
    color: 0x000000,
    transparent: true,
});

const plane = new THREE.Mesh(planeGeo, planeMaterial);
plane.position.copy(new THREE.Vector3(0, -2, 0));
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Plano extra para compensar a mudança de Cor
const planeGeo2 = new THREE.PlaneGeometry(60, 20)
const plane2 = new THREE.Mesh(planeGeo2, planeMaterial.clone())
plane2.position.copy(new THREE.Vector3(-15, 7.65, 0))
plane2.rotation.y = Math.PI / 2
scene.add(plane2)
//

plane.castShadow = true;
plane.receiveShadow = true;

// Mover Cesta
const mouse = new THREE.Vector3(0, 0, 0.5);
const grabPlane = new THREE.Plane();
const intersection = new THREE.Vector3();
const projector = new THREE.Projector();

function normalizeMousePosition(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

function onMouseMove(e) {
  if (!gameStarted) return;
  normalizeMousePosition(e);

  const raycast = projector.pickingRay(mouse, camera);

  // Plano sempre perpendicular à câmera, passando pela cesta
  let normal = new THREE.Vector3(0, 0, -1);
  normal.applyQuaternion(camera.quaternion);

  grabPlane.setFromNormalAndCoplanarPoint(normal, basket.position);

  if (raycast.ray.intersectPlane(grabPlane, intersection)) {
    // Limita posição
    intersection.x = Math.min(1, Math.max(-1, intersection.x));
    intersection.y = Math.min(-0.2, Math.max(-1.3, intersection.y));
    intersection.z = Math.min(3.4, Math.max(-3.4, intersection.z));

    moveBasketTo(intersection);
  }
}

function moveBasketTo(targetPos) {
  targetBasketPos.copy(targetPos);
}

window.addEventListener("mousemove", onMouseMove);

var lastTime;

// Criar Particulas da Bolinha
let activeParticles = []

function createStarParticle(position, isSpecial) {
  const particlesCount = isSpecial ? 100 : 50;
  const maxVelocity = 1.5
  const particles = new THREE.Geometry();
  const velocities = []
  const pText = `./textures/${isSpecial ? "star" : "bubble"}.png`

  const material = new THREE.PointCloudMaterial({
      map:THREE.ImageUtils.loadTexture(pText),
      transparent: true,
      depthWrite: false,
      size: 0.1
  });

  for(let i=0; i < particlesCount; i++) {
    const x = (0.8 + Math.random() * 0.4) * position.x;
    const y = (0.8 + Math.random() * 0.4) * position.y;
    const z = (0.8 + Math.random() * 0.4) * position.z;

    let particle = new THREE.Vector3(x,y,z);

    particles.vertices.push(particle);

    let vel = new THREE.Vector3(
      (Math.random() - 0.5),
      (Math.random() - 0.5),
      (Math.random() - 0.5)
    ).normalize().multiplyScalar(0.5 + Math.random() * maxVelocity)

    velocities.push(vel.multiplyScalar(1 / 200))
  }

  const particleSystem = new THREE.PointCloud(particles, material);

  const particlesData = {
    particles,
    velocities,
  }

  activeParticles.push(particlesData)

  scene.add(particleSystem);

  // Remove as particulas 
  setTimeout(() => {
    scene.remove(particleSystem)
    activeParticles = activeParticles.filter(p => p !== particlesData)
  }, 1000)
}

basketBody.addEventListener("collide", function (e) {
  const bola = e.body;
  const i = sphereBodies.indexOf(bola);

  const contact = e.contact;

  const wasWithBottom = contact.bi === basketBody && contact.si === basketBottom ||
                        contact.bj === basketBody && contact.sj === basketBottom;

  if (i !== -1 && wasWithBottom) {
    playBubbleSound()
    createStarParticle(bola.position, bola.userData?.points == 50 || false)

    // Lê os pontos do userData da bolinha. Se não existir, soma 10 por padrão.
    score += bola.userData?.points || 10; 
    scoreDisplay.innerText = `Pontos: ${score}`;

    // O resto da lógica para remover a bolinha permanece igual
    scene.remove(spheres[i]);
    world.removeBody(bola);
    spheres.splice(i, 1);
    sphereBodies.splice(i, 1);
  }
});

// Render
function animate() {
  // Start the simulation loop
  requestAnimationFrame(animate);

  if (gameStarted) {
    const delta = new CANNON.Vec3();
    targetBasketPos.vsub(basketBody.position, delta);

    // Limitar velocidade (distância máxima por frame)
    const maxSpeed = 0.1; // ajuste o valor conforme desejado
    if (delta.length() > maxSpeed) {
      delta.normalize();
      delta.scale(maxSpeed, delta);
    }

    // Atualizar posição com delta limitado
    basketBody.position.vadd(delta, basketBody.position);

    // Zerar velocidades para corpo kinematic
    basketBody.velocity.set(0, 0, 0);
    basketBody.angularVelocity.set(0, 0, 0);
    world.step(fixedTimeStep, deltaTime, maxSubSteps); // Atualiza a simulação física
    

    // Sincronizar as meshes (Three.js) com os corpos físicos (Cannon.js)
    for (let i = 0; i < spheres.length; i++) {
      spheres[i].position.copy(sphereBodies[i].position);
      spheres[i].quaternion.copy(sphereBodies[i].quaternion);

      const pos = spheres[i].position;
      // Remover bolinhas que ficaram fora do plano ao cair
      if (pos.y < -5 || pos.x < -5 || pos.x > 5 || pos.z < -10 || pos.z > 10) {
        scene.remove(spheres[i]); // Remove a mesh da cena
        world.removeBody(sphereBodies[i]); // Remove o corpo físico do mundo
        spheres.splice(i, 1); // Remove do array de meshes
        sphereBodies.splice(i, 1); // Remove do array de corpos físicos
        i--; // Ajusta o índice do loop após a remoção
      }

      // limita o número de bolinhas em cena, no máximo 15 no chão
      if (spheres.length > 30) {
        scene.remove(spheres[0]);
        world.removeBody(sphereBodies[0]);
        spheres.shift();
        sphereBodies.shift();
      }
    }
  }

  if(activeParticles) {
    activeParticles.forEach(pSystem => {
      pSystem.particles.verticesNeedUpdate = true;
      pSystem.particles.vertices.forEach((particle, i) => {
        particle.add(pSystem.velocities[i])
      });
    })
  }

  basket.position.copy(basketBody.position);
  basket.quaternion.copy(basketBody.quaternion);

  renderer.render(scene, camera);
}
animate();
