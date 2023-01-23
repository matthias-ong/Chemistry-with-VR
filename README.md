# CSD3120 IPA
IPA for CSD3120 VR
By: Matthias Ong Si En (2000987)

## Introduction
The source files of the project are included in the src folder, it contains the base HTML file (`index.html`) that contains the canvas that we will use BabylonJS to render to. The entry point of the project is (`index.ts`) which will initialize the BabylonJS engine, the App and create the scene with the main render loop. I have chosen to split the main app logic in another file (`app.ts`), which will be imported by (`index.ts`) as a simple abstraction and organisation.

### Installing the dependencies:
After cloning this git repository, it is already a NodeJS project and all dependencies are currently in the (`node_modules`) folder, so no further action is needed.

If not, you can use [*NodeJS's NPM*](https://nodejs.org/en/) to setup the project and install the dependencies.
Production dependencies:
1) babylonjs
2) babylonjs-gui

Development dependencies:
1) html-webpack-plugin
2) ts-loader
3) typescript
4) webpack
5) webpack-cli
6) webpack-dev-server

Just run the npm command, `npm install` with `--save` for production dependencies and `--save-dev` for development/test dependencies.
Typescript and Webpack should be setup according to the files (`tsconfig.json`) and (`webpack.config.js`) respectively.

<!--- a README.md describing the software architecture of the project, along with instructions for obtaining any dependencies required -->

## How to import?
To import the module containing the immersive learning experience. Ensure that the correct path was used to the file (`app.ts`).
```
import {App} from "./app"   //replace "./" with the correct path
```

Initialise an instance of the app and pass in the Babylon Engine instance and HTML Canvas element as parameters
```
const app = new App(engine, canvas)
```

Create the scene using the app instance. Note that because createScene() is an async function it only returns a promise.
```
const scenePromise = app.createScene()
```

Create a callback function when createScene() returns an instance of the XR scene, we will then call the render function during the engine's render loop.
```
scenePromise.then(scene => {
    engine.runRenderLoop(() => {
        scene.render()
    })
})
```
<!-- provide a code snippet of how the main.js file in the XRAuthor project can import your module and call the required function(s) to launch the immersive learning experience -->

<!-- ## Link to video tutorial -->
<!-- include a link to the video tutorial you recorded below -->



