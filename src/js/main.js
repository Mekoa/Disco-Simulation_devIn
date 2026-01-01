main();

function main() {

    // ---------- STATS & CLOCK ----------
    var stats = initStats();
    var clock = new THREE.Clock();
    let mixer = null;
    let elapsed = 0;

    // ---------- SETTINGS ----------
    const settings = {
        music: false,
        volume: 0.6,
        danceSpeed: 1,
        lightSpeed: 0.3,
      
    };

    // ---------- RENDERER ----------
    const canvas = document.querySelector("#c");
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.shadowMap.enabled = true;

    // ---------- CAMERA ----------
    const camera = new THREE.PerspectiveCamera(
        55,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        100
    );
    camera.position.set(0, 8, 30);

    // ---------- SCENE ----------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0.05, 0.05, 0.05);
    scene.fog = new THREE.Fog(0x808080, 1, 90);

    // ---------- FLOOR & WALLS ----------
    const planeSize = 42;
    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);

    const textureLoader = new THREE.TextureLoader();
    const planeTexture = textureLoader.load('textures/pebbles.jpg');
    const planeNormal = textureLoader.load('textures/pebbles_normal.png');

    planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
    planeTexture.repeat.set(16, 16);

    planeNormal.wrapS = planeNormal.wrapT = THREE.RepeatWrapping;
    planeNormal.repeat.set(16, 16);

    const planeMaterial = new THREE.MeshStandardMaterial({
        map: planeTexture,
        normalMap: planeNormal,
        side: THREE.DoubleSide
    });

    const floor = new THREE.Mesh(planeGeometry, planeMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    function createWall(x, y, z, ry) {
        const wall = new THREE.Mesh(planeGeometry, planeMaterial);
        wall.position.set(x, y, z);
        wall.rotation.y = ry;
        wall.receiveShadow = true;
        scene.add(wall);
    }

    createWall(0, planeSize / 2, -planeSize / 2, 0);
    createWall(-planeSize / 2, planeSize / 2, 0, Math.PI / 2);
    createWall(planeSize / 2, planeSize / 2, 0, -Math.PI / 2);

    //Discoball
    const sphereRadius =3;
    const sphereWidthSegments = 24;
    const sphereHeightSegments = 12;
    const sphereGeometry = new THREE.SphereGeometry(
        sphereRadius,
        sphereWidthSegments,
        sphereHeightSegments
    );

    const sphereNormalMap = textureLoader.load('textures/sphere_normal.png');
    sphereNormalMap.wrapS = THREE.RepeatWrapping;
    sphereNormalMap.wrapT = THREE.RepeatWrapping;
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 'tan',
        normalMap: sphereNormalMap
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(-sphereRadius - 1, sphereRadius + 22, 0);
    sphere.castShadow = true; // Enable shadow casting
    scene.add(sphere);

    // ---------- LIGHTING ----------
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight.position.set(10, 30, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(-10, 20, 10);
    spotLight.castShadow = true;
    scene.add(spotLight);

    const discoLight = new THREE.PointLight(0x00ffff, 8, 40);
    discoLight.position.set(0, 8, 0);
    scene.add(discoLight);

  
   
    const ballLights = [];
    for (let i = 0; i < 6; i++) {
        const light = new THREE.SpotLight(
            new THREE.Color().setHSL(i / 6, 1, 0.5),
            8,
            40,
            Math.PI / 10
        );
        light.position.set(10, 8, 10);
        light.angle = Math.PI / 6;
        light.penumbra = 1;
		light.decay = 1;
		light.distance = 0;

		light.castShadow = true;
		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;
		light.shadow.camera.near = 2;
		light.shadow.camera.far = 10;
		light.shadow.focus = 1;
		light.shadow.bias = - .003;
		light.shadow.intensity = 1;
        sphere.add(light);
        light.lightHelper = new THREE.SpotLightHelper( light );
		light.lightHelper.visible = false;
        sphere.add(light.target);
        ballLights.push(light);
    }

    // ---------- AUDIO ----------
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("macarena_sound.mp3", buffer => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(settings.volume);
    });

    // ---------- FBX LOADER ----------
    var loader = new THREE.FBXLoader();

    loader.load(
        'Macarena.fbx',
        function (object) {
            object.scale.set(0.07, 0.07, 0.07);
            object.position.set(-15, 0, 0);

            object.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            mixer = new THREE.AnimationMixer(object);
            if (object.animations.length > 0) {
                const action = mixer.clipAction(object.animations[0]);
                action.play();
            } else {
                console.warn('FBX has no animations');
            }
            scene.add(object);
        },
        undefined,
        function (error) {
            console.error('FBX loading error:', error);
        }
    );

    // ---------- CONTROLS ----------
    var trackballControls = initTrackballControls(camera, renderer);

    // ---------- GUI ----------
    const gui = new dat.GUI();
    gui.add(settings, "music").onChange(v => v ? sound.play() : sound.pause());
    gui.add(settings, "volume", 0, 1).onChange(v => sound.setVolume(v));
    gui.add(settings, "danceSpeed", 0.2, 3);
    gui.add(settings, "lightSpeed", 0.1, 2);
   

    // ---------- RENDER LOOP ----------
    function render() {
        const delta = clock.getDelta();
        elapsed += delta;

        if (mixer) {
            mixer.timeScale = settings.danceSpeed;
            mixer.update(delta);
        }

        // Disco light cycle + strobe
        discoLight.color.setHSL((elapsed * settings.lightSpeed) % 1, 1, 0.5);
       

       

        trackballControls.update(delta);
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

// ---------- RESIZE HELPER ----------
function resizeGLToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}
