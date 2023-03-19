/**
 * An abstraction of the lights using component architecture for organisation
 */
import { HemisphericLight, Vector3, Color3, Light, PointLight } from "babylonjs"
import { Scene } from "babylonjs/scene"

export class Lights {
    private scene: Scene
    constructor(scene: Scene) { this.scene = scene }
    public lights: LightSource[] = []

    /**
     * This function creates a HemisphericLight
     * @param name 
     * @param direction 
     * @param intensity 
     * @param diffuseColor 
     */
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

    /**
     * This function creates a PointLight
     * @param name 
     * @param position 
     * @param direction 
     * @param intensity 
     * @param diffuseColor 
     */
    addPointLight(
        name: string,
        position: Vector3,
        direction: Vector3,
        intensity: number,
        diffuseColor: Color3
    ) {
        const pointLight = new PointLight(name + ' pointLight', direction, this.scene)
        pointLight.position = position
        pointLight.intensity = intensity
        pointLight.diffuse = diffuseColor
        this.lights.push(new LightSource(name, pointLight))
    }

    /**
     * This function changes the colour of a specific light given the name of the light
     * @param name 
     * @param color 
     */
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

/**
 * A wrapper over the Babylon Light class
 */
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