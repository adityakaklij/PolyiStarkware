
let scene, camera, renderer;
let character;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();


// Initialize the provider to connect to the local RPC server
// const provider = new Provider({ sequencer: 'http://localhost:5050' }); // Use the local RPC URL from torii

// Load the ABI (assumed to be available in your project)
// import dojoAbi from './dojoAbi.json'; // Replace with actual path to ABI


function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6; // Average human height

    // Create renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Create character (simple cylinder)
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 1.6, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    character = new THREE.Mesh(geometry, material);
    character.position.y = 0.8;
    scene.add(character);

    // Create ground and walls
    createEnvironment();

    // Add event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize, false);

    // Add event listener for prompt input
    document.getElementById('prompt-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !isLoading) {
            generateWorld(this.value);
        }
    });

    animate();
}

function createEnvironment() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    scene.add(ground);

    // Walls
    const wallGeometry = new THREE.PlaneGeometry(20, 10);
    const wallMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        side: THREE.DoubleSide
    });

    // Front wall
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.z = -10;
    frontWall.position.y = 5;
    scene.add(frontWall);

    // Back wall
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.z = 10;
    backWall.position.y = 5;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -10;
    leftWall.position.y = 5;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.x = 10;
    rightWall.position.y = 5;
    scene.add(rightWall);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyA':
            moveLeft = true;
            break;
        // case 'ArrowRight':
        case 'ArrowLeft':
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyA':
            moveLeft = false;
            break;
        // case 'ArrowRight':
        case 'ArrowLeft':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

async function generateWorld(prompt) {
    if (isLoading) return;
    
    isLoading = true;
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').textContent = 'Generating your world...';

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Load the generated image as a texture
        document.getElementById('loading').textContent = 'Loading image into world...';
        const textureLoader = new THREE.TextureLoader();
        
        // Load textures for all walls
        const texture = await new Promise((resolve, reject) => {
            textureLoader.load(
                data.imageUrl,
                (texture) => {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    resolve(texture);
                },
                undefined,
                (error) => reject(new Error('Failed to load image: ' + error.message))
            );
        });

        // Apply texture to all walls
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh && object !== character) {
                object.material.map = texture;
                object.material.needsUpdate = true;
            }
        });

    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    } finally {
        isLoading = false;
        document.getElementById('loading').style.display = 'none';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    velocity.x = 0;
    velocity.z = 0;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    const speed = 5;
    if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

    // Update character and camera position
    character.position.x += velocity.x;
    character.position.z += velocity.z;
    
    // Keep character within bounds
    character.position.x = Math.max(-9, Math.min(9, character.position.x));
    character.position.z = Math.max(-9, Math.min(9, character.position.z));

    // Update camera position to follow character
    camera.position.x = character.position.x;
    camera.position.z = character.position.z + 2;

    prevTime = time;
    renderer.render(scene, camera);
}

// const playerAddress = '0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec';  // Replace with actual player address
const playerAddress = '0x33246ce85ebdc292e6a5c5b4dd51fab2757be34b8ffda847ca6925edf31cb67';  // Replace with actual player address

async function sendMoveToBlockchainold(direction) {
    try {
        const response = await fetch('http://localhost:3000/proxy', {  // Proxy endpoint on your backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'move',  // The method to invoke in the contract
                params: [playerAddress, direction],  // Pass player address and direction
            }),
            mode: 'no-cors'  // Disable CORS for testing (not recommended for production)
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Player move sent to blockchain: ', data);
        } else {
            console.error('Error sending move to blockchain: ', data);
        }
    } catch (error) {
        console.error('Error invoking move:', error);
    }
}

async function sendMoveToBlockchain(direction) {
    try {
        const response = await fetch('http://localhost:3000/proxy', {  // Proxy endpoint on your backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",     // Correct JSON-RPC version
                method: 'move',     // The method to invoke in the contract (should match the function in the Dojo contract)
                params: [playerAddress, direction],  // The parameters for the move method: player address and direction
                id: 1                // An ID for the request (can be any unique number)
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Player move sent to blockchain sdf:', data);
        } else {
            console.error('Error sending move to blockchain sdf:', data);
        }
    } catch (error) {
        console.error('Error invoking move:', error);
    }
}





// Keydown handler to move player
function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            sendMoveToBlockchain(3); // Move Up (Direction::Up)
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            sendMoveToBlockchain(4); // Move Down (Direction::Down)
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            sendMoveToBlockchain(1); // Move Left (Direction::Left)
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            sendMoveToBlockchain(2); // Move Right (Direction::Right)
            break;
    }
}

// Keyup handler to stop player movement (if necessary)
function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// Add event listeners for keydown and keyup events
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
let isLoading = false;
init();
