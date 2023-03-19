import { AbstractMesh, ActionManager, Camera, Color3, Color4, CubeTexture, Engine, ExecuteCodeAction, GizmoManager, HemisphericLight, InterpolateValueAction, Matrix, Mesh, MeshBuilder, MultiPointerScaleBehavior, Observable, ParticleSystem, PointerDragBehavior, PointerEventTypes, PointLight, Quaternion, Scene, SceneLoader, Sound, StandardMaterial, Texture, TransformNode, UniversalCamera, Vector3, VideoDome, VideoTexture, WebXRDefaultExperience, WebXRFeatureName, WebXRFeaturesManager, WebXRMotionControllerTeleportation } from "babylonjs"
import { AuthoringData } from "xrauthor-loader"
import 'babylonjs-loaders'
import { Lights, MeshExt, TextPlane, XRAuthorTutorialAnimation, XRAuthorVideoPlane } from "./components"

/**
 * This contains all the XR locomotive modes supported for this app
 */
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
    //private sound: Sound
    private data: AuthoringData /** Authoring data from  XRAuthor */
    private molecules: AbstractMesh[] = []
    private gizmoManager: GizmoManager

    //None / Rotation / Scale (0, 1, 2)
    private isRotating: number = 0;

    //activity bools
    private initialLoad: boolean = false
    private completed: boolean = false

    public modelIDs: string[] =
        ["m3", //h2o
            "m4", //h2
            "m6", //o2
            "m9", //h2o
            "m11"] //h2

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

        const featureManager = (await xr).baseExperience.featuresManager
        console.log(WebXRFeaturesManager.GetAvailableFeatures())
        // locomotion
        const movement = MovementMode.Teleportation;
        this.initLocomotion(movement, await xr, featureManager, scene)

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

        //Gizmo support
        this.gizmoManager = new GizmoManager(scene)
        this.gizmoManager.scaleRatio = 0.5

        //Keyboard support!
        this.addGlobalInputs(scene)

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

        const synthesis = new TextPlane("Synthesis", "black", 40, "tutorial", 16, 1, tutorialVideoPlane.pos.x - 4.5, tutorialVideoPlane.pos.y - 1, tutorialVideoPlane.pos.z + 0.5, "", scene)

        const tutorialText = new TextPlane("Tutorial: Can't remember? Click on the video to play/pause", "white", 40, "tutorial", 16, 1, tutorialVideoPlane.pos.x, tutorialVideoPlane.pos.y, tutorialVideoPlane.pos.z, "", scene)

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

    /** This function creates the default camera for the scene */
    createCamera(scene: Scene) {
        // just default camera for now
        scene.createDefaultCamera(false, true, true)
        const defaultCamera = scene.activeCamera;
        defaultCamera.position = new Vector3(0, 1, -15)

    }

    /**
     * This function loads the Classroom model, it is an async function
     * @param scene 
     * @returns Promise<void>
     */
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
        })
        //async functions are basically a promise so if you want to do transformation you need callback functions instead
        //of calling transforms/anims after the importMesh function
    }

    /**
     * This function resets the main interaction activity
     * @param scene 
     */
    resetInteractableSection(scene: Scene) {
        this.completed = false
        this.initialLoad = false
        for (const mesh of this.molecules) {
            mesh.dispose();
        }
        this.molecules = []
        this.setUpInteractableSection(scene)

        console.log("Reset practice area")
    }

    /**
     * 
     * @param scene This function sets up the main interaction activity
     */
    async setUpInteractableSection(scene: Scene) {

        const interactableText = new TextPlane("Practice here ('R' to reset for keyboard), refer to tutorial if you are lost", "white", 40, "interactable", 18, 1, -9, 3, -7, "", scene)
        interactableText.setRotation(new Vector3(0, -Math.PI / 2, 0))

        const hint = new TextPlane("Synthesize Water! Turn on audio!", "lightblue", 40, "hint", 15, 1, -9, 2, -7, "", scene)
        hint.setRotation(new Vector3(0, -Math.PI / 2, 0))

        const reset = new TextPlane("Click to Reset", "red", 50, "reset", 5, 1, -9, 1, -15, "", scene)
        reset.setRotation(new Vector3(0, -Math.PI / 2, 0))
        reset.addButton(() => { this.resetInteractableSection(scene) })

        const H2 = await MeshExt.CreateExtModel(new MeshExt("m4", scene), "m4", this.data);
        const O2 = await MeshExt.CreateExtModel(new MeshExt("m6", scene), "m6", this.data);
        const H2O = await MeshExt.CreateExtModel(new MeshExt("m3", scene), "m3", this.data);

        H2.position = new Vector3(-7, 1, -4)
        O2.position = new Vector3(-7, 1, 0)
        H2O.position.z = -20 //out of map first

        H2.computeWorldMatrix(); //fully set the new positions before continuing
        O2.computeWorldMatrix();
        H2O.computeWorldMatrix();

        this.molecules.push(H2)
        this.molecules.push(O2)
        this.molecules.push(H2O)


        this.initialLoad = true

        //this.createParticles(H2.position, scene)

        this.gizmoManager.attachableMeshes = this.molecules

        for (const mesh of this.molecules) {
            // Method 1: use behaviours
            const pointerDragBehaviour = new PointerDragBehavior({
                dragPlaneNormal: new Vector3(1, 0, 0), // pointing in positive z direction,
            })
            //behaviours are abstraction over observables, use observables for more specific control (onStart, onEnd)
            pointerDragBehaviour.onDragStartObservable.add(evtData => {
                if (this.isRotating != 0) {
                    // Handle rotation
                    this.gizmoManager.attachableMeshes = this.molecules
                    console.log("Rotate start: object id = " + mesh.id)
                    this.gizmoManager.positionGizmoEnabled = false
                    this.gizmoManager.rotationGizmoEnabled = true
                    if (this.isRotating === 2) {
                        this.gizmoManager.rotationGizmoEnabled = false
                        this.gizmoManager.scaleGizmoEnabled = true
                    }

                    //gizmoManager.dispose();

                }
                else {
                    // Handle dragging
                    console.log("Drag start: object id = " + mesh.id)
                    this.gizmoManager.rotationGizmoEnabled = false
                    this.gizmoManager.scaleGizmoEnabled = false
                    this.gizmoManager.attachableMeshes = [];
                }
                console.log(evtData);

            })

            mesh.addBehavior(pointerDragBehaviour)

            //both pointers scaling (pinch)
            const multiPointerScaleBehaviour = new MultiPointerScaleBehavior()
            mesh.addBehavior(multiPointerScaleBehaviour)

            //more behaviours
            //default gizmo
            //const gizmoManager = new GizmoManager(scene)
            //gizmoManager.positionGizmoEnabled = true
            //gizmoManager.rotationGizmoEnabled = true
            //gizmoManager.boundingBoxGizmoEnabled = true
        }

        //use observables
        // 1. create an observable for detecing intersections
        // Register a callback function to be called before rendering each frame

        scene.registerBeforeRender(function () {
            //if (scene.activeCamera.position.y < 0.4 || scene.activeCamera.position.y > 0.6) //threshold for height
            scene.activeCamera.position.y = 0.5
        })
    }

    /**
     * This function loads the Ground mesh and sets up the various locomotion options based on parameters
     * @param movement The MovementMode chosen for the app
     * @param xr WebXRDefaultExperience
     * @param featureManager WebXRFeaturesManager
     * @param ground The ground mesh used for locomotion only
     * @param scene 
     */
    initLocomotion(movement: MovementMode, xr: WebXRDefaultExperience, featureManager: WebXRFeaturesManager, scene: Scene) {
        const ground = MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene)
        ground.position.y = -2.6
        ground.position.z = -5.5
        const groundMaterial = new StandardMaterial("groundMaterial", scene);
        ground.material = groundMaterial;

        switch (movement) {
            case MovementMode.Teleportation:
                console.log("movement mode: " + movement.toString())
                const teleport = featureManager.enableFeature(
                    WebXRFeatureName.TELEPORTATION, "stable",
                    {
                        xrInput: xr.input,
                        floorMeshes: [ground],
                        timeToTeleport: 1000, //wait 1 second
                        useMainComponentOnly: true,
                        defaultTargetMesgOptions: { //specify indicator
                            teleportationFillColor: "#55FF99",
                            teleportationBorderColor: "blue",
                            torusArrowMaterial: ground.material, //we reuse material of ground

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

    /**
     * This function creates particles, it is used for the winning condition
     * @param pos Position of the particles
     * @param scene 
     */
    async createParticles(pos: Vector3, scene: Scene) {
        const particleSystem = new ParticleSystem("particles", 5000, scene)
        particleSystem.particleTexture = new Texture("assets/textures/flare.png", scene)

        particleSystem.emitter = pos
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

        // Wait for a brief period to allow the models to settle
        await new Promise(resolve => setTimeout(resolve, 2500));
        particleSystem.stop()
    }

    /**
     * Unused function to play music
     * @param scene 
     */
    addSounds(scene: Scene) {
        const music = new Sound("music", "assets/sounds/music.mp3", scene, null, {
            loop: true, autoplay: false
        })
        //this.sound = music
    }

    /**
     * This function is used to create all the light in the scene, it uses the abstracted custom Lights class
     * @param scene 
     */
    createLights(scene: Scene) {
        const lights = new Lights(scene);
        lights.addHemisphericLight("first", new Vector3(-1, 1, 0), 0.3, new Color3(1, 1, 1))
        //lights.addPointLight("2", new Vector3(1, 1, 1), new Vector3(0, 4, 5), 10, new Color3(0, 1, 0))
    }

    /**
     * This function creates a skybox to surround the scene with
     * @param scene 
     */
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

    /**
     * This function is used to setup any global observables and keyboard inputs that should
     * last the entire runtime of the app
     * @param scene 
     */
    addGlobalInputs(scene: Scene) {

        // Listen for double-tap events to change to rotate mode
        scene.onPointerObservable.add((pointerInfo) => {
            if (
                pointerInfo.type === PointerEventTypes.POINTERDOUBLETAP &&
                pointerInfo.event.button === 0
            ) {
                // Toggle rotation mode
                this.isRotating = this.isRotating + 1;
                if (this.isRotating > 2)
                    this.isRotating = 0
                //reset gizmo
                this.gizmoManager.attachableMeshes = [];
                this.gizmoManager.rotationGizmoEnabled = false
                this.gizmoManager.scaleGizmoEnabled = false
                console.log("Gizmo mode: " + this.isRotating);
            }
        });

        const onBeforeRenderObservable = scene.onBeforeRenderObservable.add(() => {
            // Only call updateCollider() if the molecules array has 3 elements
            if (this.molecules.length === 3) {
                if (this.initialLoad && !this.completed) {
                    //console.log(this.initialLoad)
                    this.updateCollider(scene);
                }

            }
        });

        //KEYBOARD SUPPORT!
        scene.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnKeyUpTrigger,
                    parameter: "r",
                },
                () => {
                    console.log("Reset was pressed!")
                    this.resetInteractableSection(scene)
                }
            )
        )
    }

    /**
     * This function handles the collision logic of molecules and plays the victory feedback
     * @param scene 
     */
    async updateCollider(scene: Scene) {
        const H2 = this.molecules[0]
        const O2 = this.molecules[1]
        const H2O = this.molecules[2]
        //console.log(H2.position.y, O2.position.y)
        if (H2.intersectsMesh(O2, false, true)) {

            console.log("Intersect to form H2O")
            //H2O.setEnabled(true)
            H2O.position = this.molecules[0].position
            H2.setEnabled(false)
            O2.setEnabled(false)
            this.completed = true
            this.createParticles(this.molecules[0].position, scene)

            const bubbles = new Sound("music", "assets/sounds/bubbles.mp3", scene, null, {
                loop: true, autoplay: true
            })

            setTimeout(() => {
                bubbles.stop();
            }, 2500); // Stop after 2 seconds
        }
        else {
            //H2O.setEnabled(false)
        }
    }
}