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


// Render
function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}
animate()