/**
 * This file extends the AbstractMesh class to suit Meshes loaded directly from XRAuthor, this is part of the component architecture
 */
import { AbstractMesh, ActionManager, AnimationGroup, Animation, Mesh, Observable, PointerDragBehavior, SceneLoader, Vector3, InterpolateValueAction, Color3, PredicateCondition, StringDictionary, ExecuteCodeAction, Quaternion } from "babylonjs";
import { Scene } from "babylonjs/scene"
import { AuthoringData } from "xrauthor-loader";
import { TextPlane } from "../../components"

/**
 * An interface (optional usage here) but I used it, it has the label text and stores the scene
 */
export interface TheMesh {
    scene: Scene;
    mesh: AbstractMesh;
    label: TextPlane;
}

/**
 * MeshExt class that contains all the features needed to make it appear like XRAuthor models as much as possible, with labels, etc
 */
export class MeshExt extends AbstractMesh implements TheMesh {
    scene: Scene;
    mesh: AbstractMesh;
    label: TextPlane;
    name: string
    constructor(name: string, scene: Scene) {
        super(name, scene);
        this.scene = scene;
        this.name = name
    }

    /**
     * This function creates MeshExt without any video animation data
     * @param meshExt 
     * @param id 
     * @param data AuthoringData to retrieve models and other info from XRAuthor
     * @returns 
     */
    public static CreateExtModel(meshExt: MeshExt, id: string, data: AuthoringData): Promise<MeshExt> {
        const info = data.recordingData.modelInfo[id]
        const label = info.label
        const name = info.name
        const url = data.models[name]
        //dont need ImportMesh as its already loaded from XRAuthor authoring data, load from url
        return SceneLoader.AppendAsync(url, undefined, meshExt.scene, undefined, ".glb").then(result => {
            //glb or gltf models, BabylonJS will add a root object to model
            const root = result.getMeshById("__root__")
            if (root) {
                root.checkCollisions = true;
                root.id = id + ": " + label //make a unique ID instead of everybody sharing root
                root.name = label

                //generate label text a bit below and behind model
                const labelPlane = new TextPlane(label, "purple", 50, root.id, 2.5, 1, 0, -0.5, -0.1, "", meshExt.scene, root)
                meshExt.mesh = root
                meshExt.addChild(root);

                // set the rotationQuaternion to a non-null value
                meshExt.rotationQuaternion = Quaternion.RotationYawPitchRoll(0, 0, 0);

            }
            else {
                console.log("TutorialAnimation: Root is NULL!")
            }
            return meshExt //resolve the promise with the MeshExt object
        })
    }

    /**
     * This is a specialised function that creates an extension model that has animation that matches the animation of the video tutorial
     * @param meshExt 
     * @param id id of the model
     * @param data Authoringdata
     * @param animationGrp 
     * @param animation 
     * @returns 
     */
    public static CreateExtModelAnim(meshExt: MeshExt, id: string, data: AuthoringData, animationGrp: AnimationGroup, animation: Animation): Promise<MeshExt> {

        const info = data.recordingData.modelInfo[id]
        const label = info.label
        const name = info.name
        const url = data.models[name]
        //dont need ImportMesh as its already loaded from XRAuthor authoring data, load from url
        return SceneLoader.AppendAsync(url, undefined, meshExt.scene, undefined, ".glb").then(result => {
            //glb or gltf models, BabylonJS will add a root object to model
            const root = result.getMeshById("__root__")
            if (root) {
                root.checkCollisions = true;
                root.id = id + ": " + label //make a unique ID instead of everybody sharing root
                root.name = label

                //generate label text a bit below and behind model
                const labelPlane = new TextPlane(label, "purple", 50, root.id, 2.5, 1, 0, -0.5, -0.1, "", meshExt.scene, root)


                //INTERACTIONS
                // Method 1: use behaviours
                const pointerDragBehaviour = new PointerDragBehavior({
                    dragPlaneNormal: new Vector3(0, 0, 1), // pointing in positive z direction,
                })
                //behaviours are abstraction over observables, use observables for more specific control (onStart, onEnd)
                pointerDragBehaviour.onDragStartObservable.add(evtData => {
                    console.log("Drag start: object id = " + root.id)
                    console.log(evtData)
                })

                meshExt.mesh = root
                meshExt.mesh.addBehavior(pointerDragBehaviour)
                //Method 2: use actions for modifying game objects
                //meshExt.initActions()
                animationGrp.addTargetedAnimation(animation, root)
                //init starting pos
                animationGrp.reset() //reset to first frame
                //Method 3: use custom observables

            }
            else {
                console.log("TutorialAnimation: Root is NULL!")
            }
            return meshExt //resolve the promise with the MeshExt object
        })

    }

    /**
     * Unused custom actions function
     */
    private initActions() {
        console.log(this)
        const actionManager = this.mesh.actionManager = new ActionManager(this.scene)
        actionManager.isRecursive = true //actions to recurse down children mesh if any
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnKeyUpTrigger,
                    parameter: "r",
                },
                () => {
                    this.scaling.setAll(1)
                    console.log("r was pressed!")
                }
            )
        )
        const light = this.scene.getLightById("first hemLight")
        actionManager.registerAction(
            new InterpolateValueAction(
                ActionManager.OnPickDownTrigger,
                light,
                "diffuse",
                Color3.Black(),
                1000
            )
        ).then( //chain 2nd action to be performed after 1st action occurs
            new InterpolateValueAction(
                ActionManager.OnPickDownTrigger,
                light,
                "diffuse",
                Color3.White(),
                1000
            )
        )
        //can also give custom conditions to actions
        actionManager.registerAction(
            new InterpolateValueAction(
                ActionManager.OnPickDownTrigger,
                this.mesh,
                "scaling",
                new Vector3(2, 2, 2),
                1000,
                new PredicateCondition(
                    actionManager,
                    () => { //perform this action when Black
                        return light.diffuse.equals(Color3.Black())
                    }
                )
            )
        )
    }

}