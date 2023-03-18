import { AbstractMesh, ActionManager, AnimationGroup, Animation, Mesh, Observable, PointerDragBehavior, SceneLoader, Vector3, InterpolateValueAction, Color3, PredicateCondition, StringDictionary } from "babylonjs";
import { Scene } from "babylonjs/scene"
import { TextPlane } from "../../components"

export interface TheMesh {
    scene: Scene;
    mesh: AbstractMesh;
    boundingbox: Mesh;
    label: TextPlane;
    onInterectObservable: Observable<boolean>;
}

export class MeshExt extends AbstractMesh implements TheMesh {
    scene: Scene;
    mesh: AbstractMesh;
    boundingbox: Mesh;
    label: TextPlane;
    onInterectObservable: Observable<boolean>;
    name: string
    constructor(id: string, scene: Scene) {
        super(id, scene);
        this.scene = scene;
        this.name = id
    }

    public static CreateExtModel(meshExt: MeshExt, url: string, label: string, animationGrp: AnimationGroup, animation: Animation): Promise<MeshExt> {
        //dont need ImportMesh as its already loaded from XRAuthor authoring data, load from url
        return SceneLoader.AppendAsync(url, undefined, meshExt.scene, undefined, ".glb").then(result => {
            //glb or gltf models, BabylonJS will add a root object to model
            const root = result.getMeshById("__root__")
            if (root) {
                root.checkCollisions = true;
                root.id = root.id + ": " + label //make a unique ID instead of everybody sharing root
                root.name = label

                //generate label text a bit below and behind model
                const labelPlane = new TextPlane(label, "purple", 50, root.id, 2.5, 1, 0, -0.5, -0.1, "", meshExt.scene, root)
                animationGrp.addTargetedAnimation(animation, root)
                //init starting pos
                animationGrp.reset() //reset to first frame

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
                meshExt.initActions()

            }
            else {
                console.log("TutorialAnimation: Root is NULL!")
            }
            return meshExt //resolve the promise with the MeshExt object
        })

    }
    public initActions() {
        console.log(this)
        const actionManager = this.mesh.actionManager = new ActionManager(this.scene)
        actionManager.isRecursive = true //actions to recurse down children mesh if any
        // const light = this.scene.getLightById("first hemLight")
        // actionManager.registerAction(
        //     new InterpolateValueAction(
        //         ActionManager.OnPickDownTrigger,
        //         light,
        //         "diffuse",
        //         Color3.Black(),
        //         1000
        //     )
        // ).then( //chain 2nd action to be performed after 1st action occurs
        //     new InterpolateValueAction(
        //         ActionManager.OnPickDownTrigger,
        //         light,
        //         "diffuse",
        //         Color3.White(),
        //         1000
        //     )
        // )
        // //can also give custom conditions to actions
        // actionManager.registerAction(
        //     new InterpolateValueAction(
        //         ActionManager.OnPickDownTrigger,
        //         this.mesh,
        //         "scaling",
        //         new Vector3(2, 2, 2),
        //         1000,
        //         new PredicateCondition(
        //             actionManager,
        //             () => { //perform this action when Black
        //                 return light.diffuse.equals(Color3.Black())
        //             }
        //         )
        //     )
        // )

    }

}