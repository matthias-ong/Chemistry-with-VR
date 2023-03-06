import { AbstractMesh, Animation, AnimationGroup, Color3, Color4, CubeTexture, Engine, HemisphericLight, Matrix, MeshBuilder, ParticleSystem, PointerEventTypes, PointLight, Scene, SceneLoader, Sound, StandardMaterial, Texture, Vector3, VideoDome, VideoTexture } from "babylonjs"
import { AdvancedDynamicTexture, TextBlock } from "babylonjs-gui"
import { AuthoringData } from "xrauthor-loader"
import 'babylonjs-loaders'
/**
 * Comments follow Google's JSDOC guide at:
 * http://google.github.io/styleguide/tsguide.html#comments-documentation
 * 
 * This is the App class that will be exported as a module. It contains all the implementation
 * of the scene that will be used with the XRAuthor interface.
 */
export class App {
    /** Contains the Babylon Engine instance */
    private engine: Engine
    /** Contains the HTMLCanvasElement that will be rendered into */
    private canvas: HTMLCanvasElement
    private sound: Sound
    private data: AuthoringData
    private animationGroup: AnimationGroup

    constructor(engine: Engine, canvas: HTMLCanvasElement
        , authoringData: AuthoringData) {
        console.log("app is init")
        this.engine = engine;
        this.canvas = canvas;
        this.data = authoringData
    }

    /**
     * Async helper function that is used to create the scene by initialising everything in the scene.
     * @returns Promise<Scene>
     */
    async createScene(): Promise<Scene> {
        console.log(this.data)
        const scene = new Scene(this.engine)
        //scene.createDefaultCameraOrLight()
        //create custom camera to see our skybox w/ rotation
        this.createCamera(scene)
        this.createLights(scene)

        //this.loadModel(scene)
        //this.addSounds(scene)

        this.createText(scene)
        //this.createParticles(scene)

        this.playXRAuthorAnimation(scene)
        this.playXRAuthorVideo(scene)

        // CREATE GROUND/TABLE
        const ground = MeshBuilder.CreateGround('ground', { width: 8, height: 8 }, scene);

        //this.createSkybox(scene)
        //this.createVideoSkyDome(scene)

        //enable debug tools
        this.addInspectorKeyboardShortcut(scene)

        //Enable XR to see the scene in VR/AR mode
        //async means you can run subsequent code even before this function returns (cos it may take a while)
        const xr = await scene.createDefaultXRExperienceAsync({
            uiOptions: {
                sessionMode: "immersive-vr" //create scene in VR mode
            }
        });
        /*if you want to call xr's member functions, you need to await to wait for async function to actually return sth before calling it

        2 solutions, using await or declare a callback function to the promise e.g in index.ts

        only for debugging - pass xr to window object
        Add properties to Window object to access them in the console
        */
        (window as any).xr = xr //cast the window obj to be any


        return scene
    }

    playXRAuthorVideo(scene: Scene) {
        const videoHeight = 5
        const videoWidth = videoHeight * this.data.recordingData.aspectRatio
        const videoPlane = MeshBuilder.CreatePlane("video plane", {
            height: videoHeight,
            width: videoWidth
        }, scene)
        videoPlane.position.z = 6 //put plane behind the text

        const videoTexture = new VideoTexture("video texture", this.data.video, scene)
        videoTexture.video.autoplay = false
        //prevents the video from playing a split second even if autoplay is false, as that may cause browser to mute the video
        videoTexture.onUserActionRequestedObservable.add(() => { })

        const videoMaterial = new StandardMaterial("video material", scene)
        videoMaterial.diffuseTexture = videoTexture
        videoMaterial.roughness = 1
        videoMaterial.emissiveColor = Color3.White()
        videoPlane.material = videoMaterial

        // ---------------- VIDEO CONTROLS ----------------
        //VideoTexture is not part of gui need implement controls manually
        //we add callbacks to observers of scene
        scene.onPointerObservable.add(eventData => {
            //console.log("picked")
            if (eventData.pickInfo.pickedMesh === videoPlane) {
                if (videoTexture.video.paused) {
                    videoTexture.video.play()
                    this.animationGroup.play(true)
                }
                else {
                    videoTexture.video.pause()
                    this.animationGroup.pause()
                }
                console.log(videoTexture.video.paused ? "paused" : "playing")
            }
            else {
                console.log(eventData.pickInfo.pickedMesh)
            }
        }, PointerEventTypes.POINTERPICK //filter ONLY pick events calls this callback (by mouse or any pointer)
        )
    }

    playXRAuthorAnimation(scene: Scene) {

        const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 1.3 }, scene)
        sphere.position.y = 1;
        sphere.position.z = 5;

        const id = "m11"
        const track = this.data.recordingData.animation.tracks[id]
        //convert A-Frame animation (matrices and time) used in XRAuthor to BabylonJS (frame idx)
        const length = track.times.length //how many frames
        const fps = length / this.data.recordingData.animation.duration
        //babylon js doesnt manipulate matrices directly, if we want to manipulate the pos/scale/rot, we need to extract them from the matrix and get the vector if we need them
        const keyframes = []
        for (let i = 0; i < length; i++) {
            //1 matrix 1 frame, stored in a json file in a simple array by Prof
            const mat = Matrix.FromArray(track.matrices[i].elements)
            const position = mat.getTranslation()
            //convert position from Right handed (AFrame) to Left Handed (babylonjs)
            position.z = -position.z

            //move to video plane, by scaling the animation coords, like a perspective proj, the math here is not impt according to prof
            const s = 6 / position.z //desired depth / depth
            keyframes.push({
                //time * fps = frame idx
                frame: track.times[i] * fps, //gets you frame idx
                //experiment with the numbers to get the pos you want
                value: position.scale(s).multiplyByFloats(3, 3, 1)
            })
        }
        const animation = new Animation("animation", "position", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE)
        animation.setKeys(keyframes)
        //sphere.animations = [animation]
        //scene.beginAnimation(sphere, 0, length - 1, true)
        //Create animation group instead, for control over multiple models
        this.animationGroup = new AnimationGroup("animation group", scene)
        //Animating our video models
        const info = this.data.recordingData.modelInfo[id]
        const label = info.label
        const name = info.name
        const url = this.data.models[name]
        //dont need ImportMesh as its already loaded from XRAuthor authoring data, load from url
        SceneLoader.AppendAsync(url, undefined, scene, undefined, ".glb").then(result => {
            //glb or gltf models, BabylonJS will add a root object to model
            const root = result.getMeshById("__root__")
            root.id = id + ": " + label //make a unique ID instead of everybody sharing root
            root.name = label
            this.animationGroup.addTargetedAnimation(animation, root)
            //init starting pos
            this.animationGroup.reset() //reset to first frame
        })
    }

    createCamera(scene: Scene) {
        //Think of this camera as one orbiting its target position. relative position to the target 
        //can be set by three parameters, alpha (radians) the longitudinal rotation, beta (radians) the latitudinal 
        //rotation and the distance from the target position.
        //const camera = new ArcRotateCamera("arcCamera", -Math.PI/5, Math.PI/2, 5, Vector3.Zero(), scene)
        //Arc rotate camera cannot MOVE, if we want FPS style we need UniversalCamera
        //const camera = new UniversalCamera('uniCam', new Vector3(0, 0, -5), scene)
        scene.createDefaultCamera(false, true, true)
        //attach control to enable user inputs from canvas
        //camera.attachControl(this.canvas, true)
    }

    loadModel(scene: Scene) {
        //async so the loading doesnt stall
        SceneLoader.ImportMeshAsync("", "assets/synthesisDecompBalanced/models/", "H2O.glb", scene).then(result => {
            const root = result.meshes[0]
            root.id = "h2oRoot"
            root.name = "h2oRoot"
            root.position.y = -1
            root.rotation = new Vector3(0, 0, Math.PI) //rotation around z
            root.scaling.setAll(1.5)
            this.createAnimation(scene, root) //need call animation here during callback in anonymous function

        })
        //async functions are basically a promise so if you want to do transformation you need callback functions instead
        //of calling transforms/anims after the importMesh function
    }

    createAnimation(scene: Scene, model: AbstractMesh) {
        const animation = new Animation(
            "rotationAnima", "rotation", 30,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CYCLE
        )
        //define the keyframes for the animation
        const keyframes = [
            { frame: 0, value: new Vector3(0, 0, 0) },
            { frame: 30, value: new Vector3(0, 2 * Math.PI, 0) }
        ]
        animation.setKeys(keyframes)

        model.animations = []
        model.animations.push(animation) //1 model can have more than 1 animations
        scene.beginAnimation(model, 0, 30, true)
    }

    createParticles(scene: Scene) {
        const particleSystem = new ParticleSystem("particles", 5000, scene)
        particleSystem.particleTexture = new Texture("assets/textures/flare.png", scene)

        particleSystem.emitter = new Vector3(0, 0, 0)
        particleSystem.minEmitBox = new Vector3(0, 0, 0)
        particleSystem.maxEmitBox = new Vector3(0, 0, 0) //a point

        //blends the colours based on their lifecycle
        particleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0)
        particleSystem.color2 = new Color4(0.3, 0.5, 1.0, 1.0)
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE

        particleSystem.minSize = 0.01
        particleSystem.maxSize = 0.05
        particleSystem.minLifeTime = 0.3
        particleSystem.maxLifeTime = 1.5

        particleSystem.emitRate = 1500

        particleSystem.direction1 = new Vector3(-1, 8, 1)
        particleSystem.direction2 = new Vector3(1, 8, -1)

        particleSystem.minEmitPower = 0.2
        particleSystem.maxEmitPower = 0.8
        particleSystem.updateSpeed = 0.01

        particleSystem.gravity = new Vector3(0, -9.8, 0)
        particleSystem.start()
    }

    addSounds(scene: Scene) {
        const music = new Sound("music", "assets/sounds/music.mp3", scene, null, {
            loop: true, autoplay: false
        })
        this.sound = music
    }

    createLights(scene: Scene) {
        const hemiLight = new HemisphericLight('hemLight', new Vector3(-1, 1, 0), scene)
        hemiLight.intensity = 0.3
        hemiLight.diffuse = new Color3(1, 1, 1)

        const pointLight = new PointLight('pointLight', new Vector3(0, 1.5, 2), scene)
        pointLight.intensity = 1
        pointLight.diffuse = new Color3(1, 0, 0)
    }

    createText(scene: Scene) {
        //FONT RENDERING
        const helloPlane = MeshBuilder.CreatePlane('hello plane', { width: 2.5, height: 1 })
        helloPlane.position.y = 0;
        helloPlane.position.z = 5;

        //create the texture for the helloPlane as text needs texture in babylon
        const helloTexture = AdvancedDynamicTexture.CreateForMesh(helloPlane, 250, 100, false)
        helloTexture.background = "white"
        const helloText = new TextBlock("hello")
        helloText.text = "Hello XR"
        helloText.color = "purple"
        helloText.fontSize = 60
        //pass the textBlock to show as texture
        helloTexture.addControl(helloText)

        //Add interaction to make it into a button
        helloText.onPointerUpObservable.add(eventData => {
            //alert("Hello Text at:\n x: " + eventData.x + " y:" + eventData)
        })
        //Works for VR controls too
        helloText.onPointerDownObservable.add(() => {
            this.sound.play()
        })
    }

    createSkybox(scene: Scene) {
        const skybox = MeshBuilder.CreateBox('skybox', { size: 1000 }, scene)
        const skyboxMaterial = new StandardMaterial('skybox-mat')

        skyboxMaterial.backFaceCulling = false //save some computational overheads

        skyboxMaterial.reflectionTexture = new CubeTexture('assets/textures/skybox', scene)

        //allow the material to know how to map the texture to the surface
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE

        //set colours for the reflections
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial
    }

    createVideoSkyDome(scene: Scene) {
        //create a Dome to encapsulate the video
        const dome = new VideoDome(
            "videoDome",
            "assets/videos/bridge-360.mp4",
            {
                resolution: 32,
                size: 1000
            },
            scene
        )
    }

    //babylonJS has an inspector and we set a keyboard listener
    //to open the inspector when we do CTRL-ALT-I
    addInspectorKeyboardShortcut(scene: Scene) {
        //scene.debugLayer.show()
        window.addEventListener("keydown", event => {
            if (event.altKey && event.ctrlKey && event.key === "i") {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide()
                }
                else {
                    scene.debugLayer.show()
                }
            }
        })
    }
}