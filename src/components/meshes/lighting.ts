import { HemisphericLight, Vector3, Color3, Light, PointLight } from "babylonjs"
import { Scene } from "babylonjs/scene"

export class Lights {
    private scene: Scene
    constructor(scene: Scene) { this.scene = scene }
    public lights: LightSource[] = []

    addHemisphericLight(
        name: string,
        direction: Vector3,
        intensity: number,
        diffuseColor: Color3) {
        const hemiLight = new HemisphericLight(name + ' hemLight', direction, this.scene)
        hemiLight.intensity = intensity
        hemiLight.diffuse = diffuseColor
        this.lights.push(new LightSource(name, hemiLight))
    }

    addPointLight(
        name: string,
        direction: Vector3,
        intensity: number,
        diffuseColor: Color3
    ) {
        const pointLight = new PointLight(name + ' pointLight', direction, this.scene)
        pointLight.intensity = intensity
        pointLight.diffuse = diffuseColor
        this.lights.push(new LightSource(name, pointLight))
    }

    changeColor(name: string, color: Color3) {
        for (let i = 0; i < this.lights.length; i++) {
            if (this.lights[i].id === name) {
                this.lights[i].light.diffuse = color;
                break;
            }
        }
    }

    /**
     * This function provides more customisation by returning the LightSource
     * @param name name of Light to retrieve
     * @returns LightSource instance
     */
    getLightSource(name: string): LightSource {
        for (let i = 0; i < this.lights.length; i++) {
            if (this.lights[i].id === name) {
                return this.lights[i]
            }
        }
        return null
    }
}

class LightSource {
    public id: string
    public light: Light
    constructor(
        id: string,
        light: Light) {
        this.id = id
        this.light = light
    }

}