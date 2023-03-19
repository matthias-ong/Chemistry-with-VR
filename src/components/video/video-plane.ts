/**
 * This file is used to abstract away the setting up of the VideoPlane to play the tutorial video from XRAuthor using component architecture
 */
import { MeshBuilder, VideoTexture, StandardMaterial, Color3, Scene, AnimationGroup, Vector3 } from "babylonjs"
import { Mesh } from "babylonjs/Meshes/mesh"
import { AuthoringData } from "xrauthor-loader"

/**
 * This class abstracts playing the tutorial video from XRAuthor
 */
export class XRAuthorVideoPlane {
    public videoPlane: Mesh
    public videoTexture: VideoTexture //public for callbacks
    public pos: Vector3
    constructor(
        name: string,
        height: number,
        pos: Vector3,
        autoPlay: boolean,
        data: AuthoringData,
        scene: Scene,
    ) {
        this.pos = pos
        const videoHeight = height
        const videoWidth = videoHeight * data.recordingData.aspectRatio
        this.videoPlane = MeshBuilder.CreatePlane(name + " video plane", {
            height: videoHeight,
            width: videoWidth
        }, scene)
        this.videoPlane.position.z = pos.z //put plane behind the text

        this.videoTexture = new VideoTexture(name + " video texture", data.video, scene)
        this.videoTexture.video.autoplay = autoPlay
        //prevents the video from playing a split second even if autoplay is false, as that may cause browser to mute the video
        this.videoTexture.onUserActionRequestedObservable.add(() => { })

        const videoMaterial = new StandardMaterial(name + " video material", scene)
        videoMaterial.diffuseTexture = this.videoTexture
        videoMaterial.roughness = 1
        videoMaterial.emissiveColor = Color3.White()
        this.videoPlane.material = videoMaterial

    }
}