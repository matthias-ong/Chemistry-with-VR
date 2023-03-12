import { Vector3, Matrix, AnimationGroup, SceneLoader, Animation, PointerDragBehavior } from "babylonjs";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { AuthoringData } from "xrauthor-loader";
import { TextPlane } from "../meshes"

/**
 * This class abstracts animating XRAuthor's tutorial 3D molecules such that they follow the QRCode markers
 * It extracts animation data from AuthoringData and plays the animation using BabylonJS, all this is abstracted
 * in the component architecture
 */
export class XRAuthorTutorialAnimation {
    public animationGroup: AnimationGroup //set public for callbacks to stop anim
    constructor(
        name: string,
        ids: string[],
        data: AuthoringData,
        videoPlane: Mesh,
        scene: Scene,) {

        this.animationGroup = new AnimationGroup(name + " animation group", scene)
        for (const id of ids) {
            const track = data.recordingData.animation.tracks[id]
            //convert A-Frame animation (matrices and time) used in XRAuthor to BabylonJS (frame idx)
            const length = track.times.length //how many frames
            const fps = length / data.recordingData.animation.duration
            //babylon js doesnt manipulate matrices directly, if we want to manipulate the pos/scale/rot, we need to extract them from the matrix and get the vector if we need them
            const keyframes: { frame: number; value: Vector3; }[] = [];
            for (let i = 0; i < length; i++) {
                //1 matrix 1 frame, stored in a json file in a simple array by Prof in XRAuthor
                const mat = Matrix.FromArray(track.matrices[i].elements)
                const position = mat.getTranslation()
                position.z = -position.z //convert position from Right handed (AFrame) to Left Handed (babylonjs)
                //moving the animation from the recorded z to the video plane's z in the current scene
                const s = videoPlane.position.z / position.z //desired depth / depth
                keyframes.push({
                    //time * fps = frame idx
                    frame: track.times[i] * fps, //gets you frame idx
                    //different sizes of the video planes used in the xrauthor scene and the babylonjs scene's videoPlane, need rescale
                    value: position.scale(s).multiplyByFloats(3, 3, 1)
                })
            }
            const animation = new Animation("animation", "position", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE)
            animation.setKeys(keyframes)
            //sphere.animations = [animation]
            //scene.beginAnimation(sphere, 0, length - 1, true)
            //Create animation group instead, for control over multiple models

            //Animating our video models
            const info = data.recordingData.modelInfo[id]
            const label = info.label
            const name = info.name
            const url = data.models[name]
            //dont need ImportMesh as its already loaded from XRAuthor authoring data, load from url
            SceneLoader.AppendAsync(url, undefined, scene, undefined, ".glb").then(result => {
                //glb or gltf models, BabylonJS will add a root object to model
                const root = result.getMeshById("__root__")
                if (root) {
                    root.id = id + ": " + label //make a unique ID instead of everybody sharing root
                    root.name = label
                    //generate label text a bit below and behind model
                    const labelPlane = new TextPlane(label, "purple", 50, root.id, 2.5, 1, 0, -0.5, -0.1, "", scene, root)
                    this.animationGroup.addTargetedAnimation(animation, root)
                    //init starting pos
                    this.animationGroup.reset() //reset to first frame

                    //interactions
                    // use behaviours
                    const pointerDragBehaviour = new PointerDragBehavior({
                        dragPlaneNormal: new Vector3(0, 0, 1), // pointing in positive z direction,
                    })
                    //behaviours are abstraction over observables, use observables for more specific control (onStart, onEnd)
                    pointerDragBehaviour.onDragStartObservable.add(evtData => {
                        console.log("Drag start: pointer id = " + evtData.pointerId)
                        console.log(evtData)
                    })
                    root.addBehavior(pointerDragBehaviour)
                }
                else {
                    console.log("TutorialAnimation: Root is NULL!")
                }
            })
        }

    }
}