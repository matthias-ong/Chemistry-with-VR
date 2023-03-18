import { Vector3, Matrix, AnimationGroup, SceneLoader, Animation, PointerDragBehavior, ActionManager, InterpolateValueAction, Color3, PredicateCondition, SetValueAction, AbstractMesh, ExecuteCodeAction, Behavior } from "babylonjs";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { AuthoringData } from "xrauthor-loader";
import { MeshExt } from ".."

/**
 * This class abstracts animating XRAuthor's tutorial 3D molecules such that they follow the QRCode markers
 * It extracts animation data from AuthoringData and plays the animation using BabylonJS, all this is abstracted
 * in the component architecture
 */
export class XRAuthorTutorialAnimation {
    public animationGroup: AnimationGroup //set public for callbacks to stop anim
    private scene: Scene
    private promises: Promise<MeshExt>[] = []
    //private pointerDragBehaviour: PointerDragBehavior

    public async loadTutorialAnimAsync(
        name: string,
        ids: string[],
        data: AuthoringData,
        videoPlane: Mesh,
        scene: Scene,): Promise<void> {

        this.scene = scene
        this.animationGroup = new AnimationGroup(name + " animation group", scene)
        this.scene.actionManager = new ActionManager(this.scene)
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
            this.promises.push(MeshExt.CreateExtModel(new MeshExt(id, this.scene), url, label, this.animationGroup, animation))
        }

        await Promise.all(this.promises);

        //this.initMoveAction("m3: H2O", "m4: H2") //using scene actionManager
    }

    private initMoveAction(firstID: string, secondID: string) {
        // Get the meshes
        const firstMesh = this.scene.getMeshById(firstID);
        const secondMesh = this.scene.getMeshById(secondID);
        console.log(firstMesh)
        console.log(secondMesh)

        // Register an action for the first mesh
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    // Trigger the action when the first mesh is approaching the second mesh
                    trigger: ActionManager.OnEveryFrameTrigger,
                    parameter: null
                },
                () => {
                    // Get the distance between the two meshes
                    const distance = firstMesh.position.subtract(secondMesh.position).length();
                    //console.log(distance)

                    // If the distance is less than a threshold value, move the first mesh to (1,1,1)
                    if (distance < 2) { // Change the threshold value to suit your needs
                        //firstMesh.position = secondMesh.position;
                        //secondMesh.removeBehavior(this.pointerDragBehaviour)
                        secondMesh.setParent(firstMesh)
                    }
                }
            )
        );
    }


}