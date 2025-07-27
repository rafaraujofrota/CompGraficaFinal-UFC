// Init
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setSize(window.innerWidth, window.innerHeight)
camera.position.set(2, 0, 0)
camera.lookAt(new THREE.Vector3(0, 0, 0))
renderer.shadowMapEnabled = true
renderer.shadowMapType = THREE.PCFSoftShadowMap

document.body.appendChild(renderer.domElement)
scene.add(new THREE.AmbientLight(0x666666))

const light = new THREE.DirectionalLight(0x666666, 0.5)
light.position.set(2, 8, 0)
light.castShadow = true
scene.add(light)

light.shadowMapSizeWidth = 1024
light.shadowMapSizeHeight = 1024
light.shadowCameraNear = 0.5
light.shadowCameraFar = 20
light.shadowCameraLeft = -5
light.shadowCameraRight = 5
light.shadowCameraTop = 5
light.shadowCameraBottom = -5


// world
var world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // gravidade da terra em m/s²

var groundBody = new CANNON.Body({
    mass: 0
});


var groundShape = new CANNON.Plane();

const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16); 
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff }); 
const spherePhysicsMaterial = new CANNON.Material('sphereMaterial');

groundBody.addShape(groundShape);

groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI / 2);
groundBody.position.y = -2;
groundBody.material = spherePhysicsMaterial;
world.addBody(groundBody);

var fixedTimeStep = 1.0 / 60.0; // 60 atualizações por segundo (60 Hz).
var maxSubSteps = 3;

// *** bolinhas ***

const spheres = [];
const sphereBodies = [];

function createEsferasCaindo(){
    
    const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    // Posição inicial das bolas caindo
    mesh.position.set(-1 + (Math.random() - 0.5) * 0.2, 5 + Math.random() * 2, (Math.random() - 0.5) * 8);
    mesh.castShadow = true;
    scene.add(mesh);
    spheres.push(mesh); // Adiciona ao array de meshes

    const radius = 0.1; // Raio igual ao da geometria
    const sphereBody = new CANNON.Body({
        mass: 5, // Massa para a bolinha cair
        material: spherePhysicsMaterial,
        shape: new CANNON.Sphere(radius)
    });

    // Define contato entre bolinha e chão
    const contactMaterial = new CANNON.ContactMaterial(
        spherePhysicsMaterial,
        spherePhysicsMaterial,
        {
            friction: 0.2,        // atrito (baixo para escorregar um pouco)
            restitution: 0.7      // quique (0 = sem quique, 1 = quique perfeito)
        }
    );

    sphereBody.position.copy(mesh.position);
    sphereBody.linearDamping = 0.5;  // resistência ao movimento linear
    sphereBody.angularDamping = 0.5; // resistência à rotação
    world.addBody(sphereBody);
    world.addContactMaterial(contactMaterial);
    sphereBodies.push(sphereBody); // Adiciona ao array de corpos físicos
}

setInterval(() => {
  createEsferasCaindo(); // sua função de criação de bolinhas
}, 1000); // uma nova a cada 1 segundo


// Plano e Cesta ( Mudar a Cesta Depois )
const basketGeo = new THREE.CylinderGeometry(0.4, 0.1, 0.3, 32, 32)
const basketMaterial = new THREE.MeshNormalMaterial()
const basket = new THREE.Mesh(basketGeo, basketMaterial)
basket.position.copy(new THREE.Vector3(-1, -1.5, 0))
scene.add(basket);

basket.castShadow = true
basket.receiveShadow = true

const planeGeo = new THREE.PlaneGeometry(10, 20)
const planeMaterial = new THREE.MeshPhongMaterial()
const plane = new THREE.Mesh(planeGeo, planeMaterial)
plane.position.copy(new THREE.Vector3(0, -2, 0))
plane.rotation.x = -Math.PI / 2
scene.add(plane)

plane.castShadow = true
plane.receiveShadow = true

// Mover Cesta
const mouse = new THREE.Vector3(0, 0, 0.5)
const grabPlane = new THREE.Plane()
const grabOffset = new THREE.Vector3()
const intersection = new THREE.Vector3()
const projector = new THREE.Projector()
let raycast = null
let holding = false


function normalizeMousePosition(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

function onMouseDown(e){
    normalizeMousePosition(e)
    raycast = projector.pickingRay(mouse, camera)
    const intersections = raycast.intersectObjects(scene.children, false)

    if(intersections.length > 0) {
        if(intersections[0].object == basket) {
            holding = true

            let normal = new THREE.Vector3(0, 0, -1);
            normal.applyQuaternion(camera.quaternion);

            grabPlane.setFromNormalAndCoplanarPoint(
                normal,
                intersections[0].point
            )

            grabOffset.copy(intersections[0].point).sub(basket.position)
        }
    }
}

function onMouseMove(e){
    if(!holding) return

    normalizeMousePosition(e)
    raycast = projector.pickingRay(mouse, camera)
    if(raycast.ray.intersectPlane(grabPlane, intersection)) {
        let newPos = intersection.clone().sub(grabOffset)

        // Limitando o Grab
        newPos.x = Math.min(1, Math.max(-1, newPos.x));
        newPos.y = Math.min(-0.2, Math.max(-1.5, newPos.y));
        newPos.z = Math.min(3.4, Math.max(-3.4, newPos.z));

        basket.position.copy(newPos)
    }
}

function onMouseUp(){
    holding = false
}

window.addEventListener("mousemove", onMouseMove)
window.addEventListener("mousedown", onMouseDown)
window.addEventListener("mouseup", onMouseUp)

var lastTime;
// Render
function animate() {
    // Start the simulation loop
    requestAnimationFrame(animate)

    
    world.step(fixedTimeStep); // Atualiza a simulação física

    // Sincronizar as meshes (Three.js) com os corpos físicos (Cannon.js)
    for (let i = 0; i < spheres.length; i++) {

        spheres[i].position.copy(sphereBodies[i].position);
        spheres[i].quaternion.copy(sphereBodies[i].quaternion);

        const pos = spheres[i].position;
        // Remover bolinhas que ficaram fora do plano ao cair 
        if (pos.y < -5 || pos.x < -5 || pos.x > 5 ||pos.z < -10 || pos.z > 10 ) 
        { 
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
    
    renderer.render(scene, camera)
}
animate()