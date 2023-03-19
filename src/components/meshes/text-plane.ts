/**
 * This file abstracts away the details needed to create text using component architecture
 */
import { Mesh, MeshBuilder, Vector3 } from "babylonjs"
import { AdvancedDynamicTexture, TextBlock } from "babylonjs-gui"
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh"
import { Scene } from "babylonjs/scene"

/**
 * This class abstracts text rendering using BabylonJS in the component architecture
 */
export class TextPlane {
    public textBlock: TextBlock //public to insert callbacks
    private textPlane: Mesh
    constructor(
        text: string,
        textColor: string,
        fontSize: number,
        name: string,
        width: number,
        height: number,
        xPos: number,
        yPos: number,
        zPos: number,
        backgroundColor: string,
        scene: Scene,
        root: AbstractMesh = null) {

        const textPlane = MeshBuilder.CreatePlane(name + ' text plane', {
            width: width,
            height: height
        })
        textPlane.position.set(xPos, yPos, zPos)
        //create the texture for the textPlane as text needs texture in babylon
        const planeTexture = AdvancedDynamicTexture.CreateForMesh(
            textPlane,
            width * 100,
            height * 100,
            false)
        planeTexture.background = backgroundColor
        const planeText = new TextBlock(name + " plane text")
        planeText.text = text
        planeText.color = textColor
        planeText.fontSize = fontSize
        planeTexture.addControl(planeText) //pass the textBlock to show as texture
        textPlane.setParent(root)
        this.textPlane = textPlane
        this.textBlock = planeText
    }
    /**
     * This function is used to rotate the created TextPlane
     * @param rotation 
     */
    setRotation(rotation: Vector3) {
        this.textPlane.rotation.set(rotation.x, rotation.y, rotation.z)
    }

    /**
     * This function adds button functionality to TextPlane
     * @param function1 Callback function to run on click
     */
    addButton(function1: () => void) {
        //Add interaction to make it into a button
        this.textBlock.onPointerUpObservable.add(eventData => {
            //alert("Hello Text at:\n x: " + eventData.x + " y:" + eventData)
        })
        //Works for VR controls too
        this.textBlock.onPointerDownObservable.add(() => {
            function1()
        })
    }

}