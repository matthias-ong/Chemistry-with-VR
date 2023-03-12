import { AbstractMesh, Animation, AnimationGroup, Color3, Color4, CubeTexture, Engine, HemisphericLight, Matrix, MeshBuilder, ParticleSystem, PointerEventTypes, PointLight, Scene, SceneLoader, Sound, StandardMaterial, Texture, UniversalCamera, Vector3, VideoDome, VideoTexture } from "babylonjs"
import { AuthoringData } from "xrauthor-loader"
import 'babylonjs-loaders'
import { Mesh } from "babylonjs/Meshes/mesh"
import { Lights, TextPlane, XRAuthorTutorialAnimation, XRAuthorVideoPlane } from "./components/meshes"
/**
 * Comments follow Google's JSDOC guide at:
 * http://google.github.io/styleguide/tsguide.html#comments-documentation
 * 
 * This is the App class that will be exported as a module. It contains all the implementation
 * of the scene that will be used with the XRAuthor interface.
 */
export class App {
    private engine: Engine /** Contains the Babylon Engine instance */
    private canvas: HTMLCanvasElement /** Contains the HTMLCanvasElement that will be rendered into */
    private sound: Sound
    private data: AuthoringData /** Authoring data from  XRAuthor */

    public modelIDs: string[] = ["m3", "m4", "m6", "m9", "m11"]

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
        this.createCamera(scene)
        this.createLights(scene)
        //this.createParticles(scene)
        this.loadModel(scene)
        this.setUpTutorialVideo(scene)

        // CREATE GROUND/TABLE
        //const ground = MeshBuilder.CreateGround('ground', { width: 8, height: 8 }, scene);

        //this.createSkybox(scene)
        //this.createVideoSkyDome(scene)

        this.addInspectorKeyboardShortcut(scene) //enable debug tools

        //async means you can run subsequent code even before this function returns (cos it may take a while)
        const xr = await scene.createDefaultXRExperienceAsync({
            uiOptions: {
                sessionMode: "immersive-vr" //Enable XR to see the scene in VR/AR mode
            }
        });
        /*if you want to call xr's member functions, you need to await for async function to actually return before calling it, 
        using await or declare a callback function to the promise e.g then()
    
        /*for debugging on browser console - pass xr to window object*/
        (window as any).xr = xr //cast the window obj to be any
        return scene
    }

    /**
     * This function will play the instruction video and ANIMATIONS on the videoPlane using the abstracted component classes
     * XRAuthorVideoPlane and XRAuthorTutorialAnimation, it also implements video controls to pause and play
     * @param scene 
     */
    setUpTutorialVideo(scene: Scene) {
        const tutorialVideoPlane = new XRAuthorVideoPlane("tutorial", 5, new Vector3(0, 0, 6), false, this.data, scene)
        const tutorialAnimation = new XRAuthorTutorialAnimation("tutorial", this.modelIDs, this.data, tutorialVideoPlane.videoPlane, scene)

        const tutorialText = new TextPlane("Can't remember? Click on the video to play/pause", "white", 50, "tutorial", 15, 1, tutorialVideoPlane.pos.x, tutorialVideoPlane.pos.y + 3, tutorialVideoPlane.pos.z, "", scene)

        // ---------------- VIDEO CONTROLS (PAUSE PLAY) ----------------
        //VideoTexture is not part of gui need implement controls manually as observers of scene
        scene.onPointerObservable.add(eventData => {
            if (eventData.pickInfo?.pickedMesh === tutorialVideoPlane.videoPlane) {
                if (tutorialVideoPlane.videoTexture.video.paused) {
                    tutorialVideoPlane.videoTexture.video.play()
                    tutorialAnimation.animationGroup.play(true)
                }
                else {
                    tutorialVideoPlane.videoTexture.video.pause()
                    tutorialAnimation.animationGroup.pause()
                }
                console.log(tutorialVideoPlane.videoTexture.video.paused ? "paused" : "playing")
            }
            else {
                console.log(eventData.pickInfo?.pickedMesh)
            }
        }, PointerEventTypes.POINTERPICK //filter ONLY pick events calls this callback (by mouse or any pointer)
        )
    }

    createCamera(scene: Scene) {
        //Think of this camera as one orbiting its target position. relative position to the target 
        //can be set by three parameters, alpha (radians) the longitudinal rotation, beta (radians) the latitudinal 
        //rotation and the distance from the target position.
        //const camera = new ArcRotateCamera("arcCamera", -Math.PI/5, Math.PI/2, 5, Vector3.Zero(), scene)
        //Arc rotate camera cannot MOVE, if we want FPS style we need UniversalCamera
        //const camera = new UniversalCamera('uniCam', new Vector3(0, 0, -5), scene)
        // Targets the camera to a particular position. In this case the scene origin
        //camera.attachControl(this.canvas, true) //attach control to enable user inputs from canvas
        scene.createDefaultCamera(false, true, true)
    }

    loadModel(scene: Scene) {
        //async so the loading doesnt stall
        SceneLoader.ImportMeshAsync("", "assets/synthesisDecompBalanced/models/", "classroom.glb", scene).then(result => {
            const root = result.meshes[0]
            root.id = "h2oRoot"
            root.name = "h2oRoot"
            root.position.y = -3.5
            root.position.z = -3.5
            root.rotation = new Vector3(0, Math.PI / 2, 0) //rotation around z
            root.scaling.setAll(2.5)
            //this.createAnimation(scene, root) //need call animation here during callback in anonymous function

        })
        //async functions are basically a promise so if you want to do transformation you need callback functions instead
        //of calling transforms/anims after the importMesh function
    }

    // createAnimation(scene: Scene, model: AbstractMesh) {
    //     const animation = new Animation(
    //         "rotationAnima", "rotation", 30,
    //         Animation.ANIMATIONTYPE_VECTOR3,
    //         Animation.ANIMATIONLOOPMODE_CYCLE
    //     )
    //     //define the keyframes for the animation
    //     const keyframes = [
    //         { frame: 0, value: new Vector3(0, 0, 0) },
    //         { frame: 30, value: new Vector3(0, 2 * Math.PI, 0) }
    //     ]
    //     animation.setKeys(keyframes)
    //     model.animations = []
    //     model.animations.push(animation) //1 model can have more than 1 animations
    //     scene.beginAnimation(model, 0, 30, true)
    // }

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

    /**
     * Unused function to play music
     * @param scene 
     */
    addSounds(scene: Scene) {
        const music = new Sound("music", "assets/sounds/music.mp3", scene, null, {
            loop: true, autoplay: false
        })
        this.sound = music
    }

    createLights(scene: Scene) {
        const lights = new Lights(scene);
        lights.addHemisphericLight("first", new Vector3(-1, 1, 0), 0.3, new Color3(1, 1, 1))

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

    // createVideoSkyDome(scene: Scene) {
    //     //create a Dome to encapsulate the video
    //     const dome = new VideoDome(
    //         "videoDome",
    //         "assets/videos/bridge-360.mp4",
    //         {
    //             resolution: 32,
    //             size: 1000
    //         },
    //         scene
    //     )
    // }

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