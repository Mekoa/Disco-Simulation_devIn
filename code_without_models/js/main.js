//setup the animation clips and model configurations
const AllClips = [
    { file: 'DancingWave.fbx', name: 'Wave' },
    { file: 'MacarenaDance.fbx', name: 'Macarena' },
    { file: 'pushpush.fbx', name: 'PushPush' },
    { file: 'SnakeHipHopDance.fbx', name: 'Snake' },
    { file: 'StepHipHopDance.fbx', name: 'Step' }
];

//3 models positioned in the scenes, also scaled to have the same height
const modelConfig = [
    { file: 'Dana.fbx', x: -15, z: 5, scale: 0.07 },
    { file: 'Josh.fbx', x: 10, z: -10, scale: 0.07 },
    { file: 'Dana.fbx', x: 15, z: 0, scale: 0.07 },
    { file: 'Dana.fbx', x: 0, z: -10, scale: 0.07 },
    { file: 'Josh.fbx', x: 0, z: 8, scale: 0.07 },
    { file: 'Michelle.fbx', x: 15, z: 9, scale: 0.07 },
    { file: 'Josh.fbx', x: -10, z: 0, scale: 0.07 },
    { file: 'Michelle.fbx', x: -10, z: -10, scale: 0.07 },
];

// global variables
let scene, camera, renderer, clock, stats;
let controls;
let skeletons = [];
let ballGroup, ballLights, discoLight;
let sound, audioAnalyzer;
let models = [];
let mixers = [];
let activeActions = [];
let animationNames = [];
let currentAudioFile = "macarena_sound.mp3"; // default audio

// UI Settings
let settings = {
    music: false,
    volume: 0.6,
    danceSpeed: 1,
    lightSpeed: 0.5,
    strobeEnabled: false,
    animation: "Default",
    resetScene: false,
    audioFile: currentAudioFile
};

// helper function to create quaternion tracks
function initStats() {
    if (typeof Stats !== 'undefined') {
        const s = new Stats();
        document.body.appendChild(s.dom);
        return s;
    }
    return { update: () => {} };
}

function initControls(cam, ren) {
    if (typeof THREE.OrbitControls !== 'undefined') {
        const c = new THREE.OrbitControls(cam, ren.domElement);
        c.enableDamping = true;
        return c;
    }
    console.warn("OrbitControls not found.");
    return { update: () => {}, reset: () => {} };
}

// loads the base models and sets up their mixers and initial animations
function loadBaseModels() {
    const loader = new THREE.FBXLoader();
    let loadedCount = 0;

    // Set initial animation names from config
    animationNames = AllClips.map(c => c.name);
    settings.animation = animationNames.length > 0 ? animationNames[0] : "Idle";

    modelConfig.forEach((config, index) => {
        loader.load(config.file, (object) => {
            object.scale.set(config.scale, config.scale, config.scale);
            object.position.set(config.x, 0, config.z);
            
            object.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(object);
            models.push(object);

            // Create Mixer
            const mixer = new THREE.AnimationMixer(object);
            mixers.push(mixer);
            activeActions.push(null);

            if (object.animations && object.animations.length > 0) {
                // Load the first animation (T-pose) but do not play it yet
                const idleClip = object.animations[0]; 
                const action = mixer.clipAction(idleClip);
                action.play();
                activeActions[index] = action;
            }

            loadedCount++;

            if (loadedCount === modelConfig.length) {
                setupGUI();
                // Load default audio and set up music toggle
                setupAudio(currentAudioFile);
            }
        }, undefined, (error) => {
            console.error(`Failed to load model ${config.file}:`, error);
        });
    });
}

// function to load and set up audio
function setupAudio(audioPath) {
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(audioPath, (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(settings.volume);
        
        // Do not play automatically; wait for user to enable music
        if (settings.music) {
            sound.play().catch(e => console.log("Audio play blocked until user interaction"));
        }
    }, undefined, (err) => console.error("Audio load error:", err));
}

// function to apply the clips to the models
function applyAnimationToAll(clipName) {
    const clipConfig = AllClips.find(c => c.name === clipName);
    if (!clipConfig) {
        console.warn("Animation config not found:", clipName);
        return;
    }

    const loader = new THREE.FBXLoader();

    loader.load(clipConfig.file, (animationObject) => {
        const clips = animationObject.animations;
        if (!clips || clips.length === 0) {
            console.error("No animations found in FBX:", clipConfig.file);
            return;
        }

        const selectedClip = clips[0]; 
        console.log(`Applied animation: ${selectedClip.name} to all models`);

        models.forEach((model, index) => {
            const mixer = mixers[index];
            
            if (activeActions[index]) {
                activeActions[index].stop();
            }

            const action = mixer.clipAction(selectedClip);
            action.reset();
            activeActions[index] = action;
            action.play();
        });
    }, undefined, (error) => {
        console.error("Error loading animation file:", error);
    });
}

function main() {
    //Initialize Clock & Stats
    clock = new THREE.Clock();
    stats = initStats();

    //Setup Canvas & Renderer 
    const canvas = document.querySelector("#c");
    if (!canvas) {
        console.error("Canvas element #c not found!");
        return;
    }

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    //Setup Camera
    camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 8, 30);

    // Setup Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050508, 40, 80);

    //Setup Controls
    controls = initControls(camera, renderer);

    //Environment (Floor & Walls)
    const planeSize = 42;
    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const textureLoader = new THREE.TextureLoader();
    
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 1.2,// For the mirror effect 
        metalness: 0.4,
        side: THREE.DoubleSide
    });

    textureLoader.load('textures/pebbles.jpg', (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(16, 16);
        planeMaterial.map = tex;
        planeMaterial.needsUpdate = true;
    }, undefined, () => console.warn("Floor texture missing."));

    const floor = new THREE.Mesh(planeGeometry, planeMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

    function createWall(x, y, z, ry) {
        const wall = new THREE.Mesh(planeGeometry, wallMat);
        wall.position.set(x, y, z);
        wall.rotation.y = ry;
        wall.receiveShadow = true;
        scene.add(wall);
    }
    createWall(0, planeSize / 2, -planeSize / 2, 0);
    createWall(-planeSize / 2, planeSize / 2, 0, Math.PI / 2);
    createWall(planeSize / 2, planeSize / 2, 0, -Math.PI / 2);

    //Disco Ball
    const sphereRadius = 2.8;
    const tileCount = 28;
    ballGroup = new THREE.Group();
    const tileMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1.2,
        roughness: 0.4,
        envMapIntensity: 1.0,
        emissive: 0x222222,
        emissiveIntensity: 0.5
    });
    const tileGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);

    for (let lat = 0; lat < tileCount; lat++) {
        const theta = (lat * Math.PI) / tileCount - Math.PI / 2;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let lon = 0; lon < tileCount; lon++) {
            const phi = (lon * 2 * Math.PI) / tileCount;
            const x = sphereRadius * cosTheta * Math.cos(phi);
            const y = sphereRadius * sinTheta;
            const z = sphereRadius * cosTheta * Math.sin(phi);
            const tile = new THREE.Mesh(tileGeometry, tileMaterial);
            tile.position.set(x, y, z);
            tile.lookAt(0, 0, 0);
            tile.rotation.x += (Math.random() - 0.5) * 0.2;
            tile.rotation.y += (Math.random() - 0.5) * 0.2;
            tile.castShadow = true;
            tile.receiveShadow = true;
            ballGroup.add(tile);
        }
    }
    ballGroup.position.set(0, 26.5, -10); 
    scene.add(ballGroup);

    // lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.2);
    dirLight.position.set(10, 30, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.05));

    discoLight = new THREE.PointLight(0x00ffff, 5, 50);
    discoLight.position.set(0, 10, 0);
    scene.add(discoLight);

    ballLights = [];
    for (let i = 0; i < 8; i++) {
        const light = new THREE.SpotLight(0xffffff, 10, 50, Math.PI / 6, 0.5, 1);
        const angle = (i / 8) * Math.PI * 2;
        light.position.set(Math.cos(angle) * 2, 2, Math.sin(angle) * 2);
        light.target.position.set(0, -10, 0);
        light.castShadow = true;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        ballGroup.add(light);
        ballGroup.add(light.target);
        ballLights.push(light);
    }

    // audio
    const listener = new THREE.AudioListener();
    camera.add(listener);
    sound = new THREE.Audio(listener);
    audioAnalyzer = new THREE.AudioAnalyser(sound, 32);

    loadBaseModels();
    
    //Animation loop
    let strobeTimer = 0;// for strobe effect timing

    function render() {
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Audio Beat Detection
        let beatFactor = 0;
        if (sound && sound.isPlaying) {
            const data = audioAnalyzer.getAverageFrequency();
            beatFactor = Math.min(data / 100, 1.0); 
        }

        // Disco Ball Rotation
        ballGroup.rotation.y += 0.005 * settings.lightSpeed;
        ballGroup.rotation.z = Math.sin(elapsed * 0.5) * 0.05;

        // Dynamic Lighting
        const hue = (elapsed * settings.lightSpeed) % 1;
        const baseColor = new THREE.Color().setHSL(hue, 1, 0.5);
        
        if (settings.strobeEnabled) {
            strobeTimer += delta * 15;
            const isFlash = Math.floor(strobeTimer) % 2 === 0;
            discoLight.intensity = isFlash ? 20 : 0;
            discoLight.color.setHSL((elapsed * 5) % 1, 1, 0.5);
        } else {
            const pulse = 2 + Math.sin(elapsed * 2) * 1;
            discoLight.intensity = pulse + (beatFactor * 5);
            discoLight.color.copy(baseColor);
        }

        // Ball Lights
        ballLights.forEach((light, index) => {
            const phase = elapsed * settings.lightSpeed * 2 + index;
            light.intensity = (5 + Math.sin(phase) * 3) + (beatFactor * 5);
        });

        // Update Mixers
        mixers.forEach((mixer) => {
            mixer.timeScale = settings.danceSpeed;
            mixer.update(delta);
        });

        // Controls & Render
        controls.update(delta);
        stats.update();
        
        if (resizeGLToDisplaySize(renderer)) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();
}

function resizeGLToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        return true;
    }
    return false;
}

function setupGUI() {
    const gui = new dat.GUI();
    
    const folderAnim = gui.addFolder('Animation');
    folderAnim.add(settings, 'animation', animationNames)
        .name('Dance Move')
        .onChange((name) => applyAnimationToAll(name));
    
    const folderLight = gui.addFolder('Lighting');
    folderLight.add(settings, 'lightSpeed', 0.1, 2).name('Cycle Speed');
    folderLight.add(settings, 'strobeEnabled').name('Strobe Effect');

    const folderAudio = gui.addFolder('Audio');
    folderAudio.add(settings, 'music').name('Play/Pause').onChange((enabled) => {
        if (!sound) return;
        if (enabled) {
            if (!sound.isPlaying) sound.play();
        } else {
            if (sound.isPlaying) sound.stop();
        }

    });

    folderAudio.add(settings, 'volume', 0, 1).name('Volume').onChange((value) => {
        if (sound) sound.setVolume(value);
    });

    // Add music upload field
   folderAudio.add({ triggerUpload: () => document.getElementById('music-upload').click() }, 'triggerUpload')
        .name('Upload Music');
    // Listen for file selection
    document.getElementById('music-upload').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            if (!sound) return;

            // Decode the audio data
            const audioContext = sound.context;
            audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                sound.setBuffer(buffer);
                sound.setLoop(true);
                sound.setVolume(settings.volume);
                settings.music = false; // reset music toggle
                console.log(`Loaded audio: ${file.name}`);
            }).catch(err => console.error("Audio decode error:", err));
        };

        reader.readAsArrayBuffer(file);
        // Reset input so the same file can be selected again
        event.target.value = '';
    });


    const folderSys = gui.addFolder('System');
    folderSys.add(settings, 'danceSpeed', 0.2, 3).name('Dance Speed');
    folderSys.add(settings, 'resetScene').name('Reset Scene').onChange(() => {
        window.location.reload(true);
        camera.position.set(0, 8, 30);
        camera.lookAt(0, 0, 0);
        if (controls) controls.reset();
        settings.resetScene = false; // reset the flag
    });
    
    gui.close();
}


// Start the application
main();