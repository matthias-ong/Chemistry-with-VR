import { AbstractMesh, ActionManager, Camera, Color3, Color4, CubeTexture, Engine, HemisphericLight, InterpolateValueAction, Matrix, Mesh, MeshBuilder, Observable, ParticleSystem, PointerEventTypes, PointLight, Scene, SceneLoader, Sound, StandardMaterial, Texture, TransformNode, UniversalCamera, Vector3, VideoDome, VideoTexture, WebXRDefaultExperience, WebXRFeatureName, WebXRFeaturesManager, WebXRMotionControllerTeleportation } from "babylonjs"
import { AuthoringData } from "xrauthor-loader"
import 'babylonjs-loaders'
import { Lights, MeshExt, TextPlane, XRAuthorTutorialAnimation, XRAuthorVideoPlane } from "./components"

enum MovementMode {
    Teleportation,
    Controller,
    Walk
}

/**
 * Comments follow Google's JSDOC guide at:
 * http://google.github.io/styleguide/tsguide.html#comments-documentation
 * 
 * This is the App class that will be exported as an extension or standalone. It contains all the implementation
 * of the scene that will be used with the XRAuthor interface.
 */
export class App {
    private engine: Engine /** Contains the Babylon Engine instance */
    private canvas: HTMLCanvasElement /** Contains the HTMLCanvasElement that will be rendered into */
    private sound: Sound
    private data: AuthoringData /** Authoring data from  XRAuthor */
    private molecules: AbstractMesh[] = []
    private ground: AbstractMesh[] = []
    //private xr: WebXRDefaultExperience


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

        // setup babylonjs scene
        const scene = new Scene(this.engine)
        scene.actionManager = new ActionManager(scene) //init actionManager for action interactions

        // set up camera
        this.createCamera(scene)

        // set up lights
        this.createLights(scene)
        //this.createParticles(scene)

        // set up skybox
        this.createSkybox(scene)

        // set up classroom
        await this.loadClassroom(scene)

        // set up tutorial video
        this.setUpTutorialVideo(scene)

        // set up interactable section
        this.setUpInteractableSection(scene)

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

        const ground = MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene)
        ground.position.y = -2.6
        ground.position.z = -5.5
        const groundMaterial = new StandardMaterial("groundMaterial", scene);
        ground.material = groundMaterial;

        const featureManager = (await xr).baseExperience.featuresManager
        console.log(WebXRFeaturesManager.GetAvailableFeatures())
        // locomotion
        const movement = MovementMode.Teleportation;
        this.initLocomotion(movement, await xr, featureManager, [ground], scene)

        //hand tracking
        try {
            featureManager.enableFeature(WebXRFeatureName.HAND_TRACKING, "latest", {
                xrInput: xr.input,
                jointMeshes: {
                    disabledDefaultHandMesh: false,
                }
            })
        } catch (error) {
            console.log(error)
        }

        //enabled features
        console.log(featureManager.getEnabledFeatures())

        return scene
    }

    /**
     * This function will play the instruction video and ANIMATIONS on the videoPlane using the abstracted component classes
     * XRAuthorVideoPlane and XRAuthorTutorialAnimation, it also implements video controls to pause and play
     * @param scene 
     */
    setUpTutorialVideo(scene: Scene) {
        const tutorialVideoPlane = new XRAuthorVideoPlane("tutorial", 5, new Vector3(0, 3, 6), false, this.data, scene)
        const tutorialAnimation = new XRAuthorTutorialAnimation()
        tutorialAnimation.loadTutorialAnimAsync("tutorial", this.modelIDs, this.data, tutorialVideoPlane.videoPlane, scene)

        //tutorialAnimation.initCollisionAction("m3: H2O", "m4: H2")

        const tutorialText = new TextPlane("Can't remember? Click on the video to play/pause", "white", 50, "tutorial", 15, 1, tutorialVideoPlane.pos.x, tutorialVideoPlane.pos.y, tutorialVideoPlane.pos.z, "", scene)

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
        // just default camera for now
        scene.createDefaultCamera(false, true, true)
        const defaultCamera = scene.activeCamera;
        defaultCamera.position = new Vector3(0, 1, -15)

    }

    async loadClassroom(scene: Scene) {
        //async so the loading doesnt stall
        return SceneLoader.ImportMeshAsync("", "assets/extra_models/", "classroom.glb", scene).then(result => {
            const root = result.meshes[0]
            root.id = "classroom"
            root.name = "classroom"
            root.position.y = -3.5
            root.position.z = -3.5
            root.rotation = new Vector3(0, Math.PI / 2, 0) //rotation around z
            root.scaling.setAll(2.5)
            this.ground.push(root)
        })
        //async functions are basically a promise so if you want to do transformation you need callback functions instead
        //of calling transforms/anims after the importMesh function
    }

    async setUpInteractableSection(scene: Scene) {
        const promises: Promise<MeshExt>[] = []
        for (const id of this.modelIDs) {
            promises.push(MeshExt.CreateExtModel(new MeshExt(id, scene), id, this.data))
        }

        await Promise.all(promises).then(meshes => {
            this.molecules = promises.map((promise, index) => meshes[index].mesh)
        })
        this.molecules[0].position.set(0, 1, 5)

        //use observables
        // 1. create an observable for detecing intersections
        const onIntersectionObservable = new Observable<Boolean>()
        scene.registerBeforeRender(function () {
            if (scene.activeCamera.position.y < 0.4 || scene.activeCamera.position.y > 0.6) //threshold for height
                scene.activeCamera.position.y = 0.5
            //const isIntersecting = 
        })
    }

    initLocomotion(movement: MovementMode, xr: WebXRDefaultExperience, featureManager: WebXRFeaturesManager, ground: AbstractMesh[], scene: Scene) {
        switch (movement) {
            case MovementMode.Teleportation:
                console.log("movement mode: " + movement.toString())
                const teleport = featureManager.enableFeature(
                    WebXRFeatureName.TELEPORTATION, "stable",
                    {
                        xrInput: xr.input,
                        floorMeshes: ground,
                        timeToTeleport: 1000, //wait 1 second
                        useMainComponentOnly: true,
                        defaultTargetMesgOptions: { //specify indicator
                            teleportationFillColor: "#55FF99",
                            teleportationBorderColor: "blue",
                            torusArrowMaterial: ground[0].material, //we reuse material of ground

                        },
                    },
                    true,
                    true
                ) as WebXRMotionControllerTeleportation
                teleport.parabolicRayEnabled = true
                teleport.parabolicCheckRadius = 2
                break
            case MovementMode.Controller:
                console.log("movement mode: " + movement.toString())
                featureManager.disableFeature(WebXRFeatureName.TELEPORTATION)
                featureManager.enableFeature(WebXRFeatureName.MOVEMENT, "latest",
                    {
                        xrInput: xr.input,
                    })
                break
            case MovementMode.Walk: //WIP (experimental)
                console.log("movement mode: " + movement.toString())
                featureManager.disableFeature(WebXRFeatureName.TELEPORTATION)
                const xrRoot = new TransformNode("xr root", scene) //TransformNode is parent class of Abstract Mesh, node containing transforming info
                xr.baseExperience.camera.parent = xrRoot
                featureManager.enableFeature(
                    WebXRFeatureName.WALKING_LOCOMOTION,
                    "latest", //or stable
                    {
                        locomotionTarget: xrRoot, //target for walking locomotion
                    }
                )
                break
        }
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
        //lights.addPointLight("2", new Vector3(1, 1, 1), new Vector3(0, 4, 5), 10, new Color3(0, 1, 0))
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