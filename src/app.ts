import {Engine, MeshBuilder, Scene} from "babylonjs"
import { AdvancedDynamicTexture, TextBlock } from "babylonjs-gui"

export class App {
    private engine: Engine
    private canvas: HTMLCanvasElement

    constructor(engine : Engine, canvas : HTMLCanvasElement) {
        this.engine = engine
        this.canvas = canvas
        console.log("app is running")
    }

    async createScene() {
        const scene = new Scene(this.engine)
        scene.createDefaultCameraOrLight()

        const sphere = MeshBuilder.CreateSphere('sphere', {diameter: 1.3}, scene)
        sphere.position.y = 1;
        sphere.position.z = 5;

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
}