import { Engine } from "babylonjs"
import { App } from "./app" //Import App from app.ts file
/**
 * This file servers as a common entry point to initialise the app either as 
 * XRAuthor Extension or standalone for debugging
 */

/**
     * Renders the interactive AR/VR scene when user clicks the "XR Format" button in the
     * XRAuthor interface
     * @param canvasID is the string ID of the HTMLCanvasElement target to render the scene into
     * @param authoringData is a dict of dicts that contains various information from other XRAuthor
     *                      components, e.g. dicts of recordingData, editingData, etc.
     */
export function createXRScene(canvasID: string, authoringData: { [data: string]: { [key: string]: any } }) {
    console.log("Init!")
    const canvas = document.getElementById(canvasID) as HTMLCanvasElement
    const engine = new Engine(canvas, true)

    //Instantiate the imported App
    const app = new App(engine, canvas, authoringData)


    // const ctx = canvas.getContext('2d')
    // ctx.font = "50px Arial"
    // ctx.fillText("Hello XR!", 50, 50)

    const scenePromise = app.createScene()
    //async createScene returns a promise not an actual scene obj
    //We need to create a callback function to run when the result is actually returned, after promise is fulfilled
    scenePromise.then(scene => {
        engine.runRenderLoop(() => {
            scene.render()
        })
    })

    window.addEventListener("resize", () => {
        engine.resize()
    })
}

