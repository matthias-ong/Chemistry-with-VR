import {Engine, Scene} from "babylonjs"

export class App {
    private engine: Engine
    private canvas: HTMLCanvasElement

    constructor(engine : Engine, canvas : HTMLCanvasElement) {
        this.engine = engine
        this.canvas = canvas
        console.log("app is running")
    }

    createScene() {
        const scene = new Scene(this.engine)
        scene.createDefaultCameraOrLight()
        return scene
    }
}