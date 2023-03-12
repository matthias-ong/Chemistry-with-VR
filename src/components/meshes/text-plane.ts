import { MeshBuilder } from "babylonjs"
import { AdvancedDynamicTexture, TextBlock } from "babylonjs-gui"
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh"
import { Scene } from "babylonjs/scene"

/**
 * This class abstracts text rendering using BabylonJS in the component architecture
 */
export class TextPlane {
    public textBlock: TextBlock //public to insert callbacks
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
        this.textBlock = planeText
        //Add interaction to make it into a button
        // this.textBlock.onPointerUpObservable.add(eventData => {
        //     //alert("Hello Text at:\n x: " + eventData.x + " y:" + eventData)
        // })
        // //Works for VR controls too
        // this.textBlock.onPointerDownObservable.add(() => {
        //     this.sound.play()
        // })
    }

}