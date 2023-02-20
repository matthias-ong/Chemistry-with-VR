import {ArcRotateCamera, Color3, CubeTexture, Engine, HemisphericLight, MeshBuilder, PointLight, Scene, StandardMaterial, Texture, UniversalCamera, Vector3} from "babylonjs"
import { AdvancedDynamicTexture, TextBlock } from "babylonjs-gui"

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

    constructor() {
        console.log("app is init")
    }

    /**
     * Renders the interactive AR/VR scene when user clicks the "XR Format" button in the
     * XRAuthor interface
     * @param canvasID is the string ID of the HTMLCanvasElement target to render the scene into
     * @param authoringData is a dict of dicts that contains various information from other XRAuthor
     *                      components, e.g. dicts of recordingData, editingData, etc.
     */
    createXRScene(canvasID : string, authoringData : {[data : string] : {[key : string] : any}}) {
        this.canvas = document.getElementById(canvasID) as HTMLCanvasElement
        this.engine = new Engine(this.canvas, true)

        // const ctx = canvas.getContext('2d')
        // ctx.font = "50px Arial"
        // ctx.fillText("Hello XR!", 50, 50)

        const scenePromise = this.createScene()
        //async createScene returns a promise not an actual scene obj
        //We need to create a callback function to run when the result is actually returned, after promise is fulfilled
        scenePromise.then(scene => { 
            this.engine.runRenderLoop(() => {
            scene.render()
            })
        })
    }

    /**
     * Async helper function that is used to create the scene by initialising everything in the scene.
     * @returns Promise<Scene>
     */
    private async createScene() : Promise<Scene> {
        const scene = new Scene(this.engine)
        //scene.createDefaultCameraOrLight()
        //create custom camera to see our skybox w/ rotation
        this.createCamera(scene)
        this.createLights(scene)
        const sphere = MeshBuilder.CreateSphere('sphere', {diameter: 1.3}, scene)
        sphere.position.y = 1;
        sphere.position.z = 5;

        // sphere.actionManager = new ActionManager(scene);
        // sphere.actionManager.registerAction(
        //     new ExecuteCodeAction(ActionManager.OnPickTrigger, 
        //     function (event) {
        //         const moveSphere = event.meshUnderPointer;
        //         moveSphere.position.x += 0.2;
        //         moveSphere.position.y += 0.2;
        //     }));

        // CREATE GROUND/TABLE
        const ground = MeshBuilder.CreateGround('ground', {width: 8, height: 8}, scene);

        //FONT RENDERING
        const helloPlane = MeshBuilder.CreatePlane('hello plane', {size: 15})
        helloPlane.position.y = 0;
        helloPlane.position.z = 5;
        
        //create the texture for the helloPlane as text needs texture in babylon
        const helloTexture = AdvancedDynamicTexture.CreateForMesh(helloPlane) 
        const helloText = new TextBlock("hello")
        helloText.text = "Hello XR"
        helloText.color = "purple"
        helloText.fontSize = 50
        //pass the textBlock to show as texture
        helloTexture.addControl(helloText)

        this.createSkybox(scene)

        //Enable XR to see the scene in VR/AR mode
        //async means you can run subsequent code even before this function returns (cos it may take a while)
        const xr = await scene.createDefaultXRExperienceAsync({
            uiOptions: {
                sessionMode: "immersive-vr" //create scene in VR mode
            }
        });
        //if you want to call xr's member functions, you need to await to wait for async function to actually return sth before calling it

        //2 solutions, using await or declare a callback function to the promise e.g in index.ts

        //only for debugging - pass xr to window object
        //Add properties to Window object to access them in the console
        (window as any).xr = xr //cast the window obj to be any


        return scene
    }

    createCamera(scene : Scene) {
        //Think of this camera as one orbiting its target position. relative position to the target 
        //can be set by three parameters, alpha (radians) the longitudinal rotation, beta (radians) the latitudinal 
        //rotation and the distance from the target position.
        //const camera = new ArcRotateCamera("arcCamera", -Math.PI/5, Math.PI/2, 5, Vector3.Zero(), scene)
        //Arc rotate camera cannot MOVE, if we want FPS style we need UniversalCamera
        const camera = new UniversalCamera('uniCam', new Vector3(0, 0, -5), scene)
        //attach control to enable user inputs from canvas
        camera.attachControl(this.canvas, true)
    }

    createLights(scene : Scene) {
        const hemiLight = new HemisphericLight('hemLight', new Vector3(-1, 1, 0), scene)
        hemiLight.intensity = 0.5
        hemiLight.diffuse = new Color3(0, 0, 1)

        const pointLight = new PointLight('pointLight', new Vector3(0, 1.5, 2), scene)
        pointLight.intensity = 1
        pointLight.diffuse = new Color3(1, 0, 0)
    }

    createSkybox(scene : Scene) {
        const skybox = MeshBuilder.CreateBox('skybox', {size: 1000}, scene)
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
}