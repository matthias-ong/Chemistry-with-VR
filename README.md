# CSD3120 IPA
IPA for CSD3120 VR<br/>
By: Matthias Ong Si En (2000987)

## Introduction
The source files of the project are included in the src folder, it contains the base HTML file (`index.html`) that contains the canvas that we will use BabylonJS to render to. The 3D scene logic and main rendering is implemented in (`app.ts`). I have included an example as the entry point of the project, (`index.ts`) to help demonstrate how to use the project's App class and call the functions required to get the 3D scene using createXRScene().

### Installing the dependencies:
Ensure that you have the NodeJS installed as we will be using [*NodeJS's NPM*](https://nodejs.org/en/) to download all the required dependencies.

After cloning this git repository, it contains all the configuration files for this NodeJS project. All that is needed is to install the dependencies using `npm install <scope> <name>` e.g: `npm install --save-dev html-webpack-plugin` will install the html-webpack-plugin as a development dependency.

The development dependencies are necessary for running the project on a private Webpack server for testing purposes.

Here is a list of all the dependencies we need:
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
Typescript and Webpack should are already set up according to the files (`tsconfig.json`) and (`webpack.config.js`) respectively.

<!--- a README.md describing the software architecture of the project, along with instructions for obtaining any dependencies required -->

## How to import?
An example is provided in (`index.ts`) which will demonstrate how XRAuthor can access the scene. The steps are outlined as follows:

To import the module containing the immersive learning experience. Ensure that the correct path was used to the file (`app.ts`).
```
import {App} from "./app"   //replace "./" with the correct path to app.ts file
```

Initialise an instance of the App class
```
const app = new App()
```

Create the scene using the app instance by calling createXRScene() and passing in the HTML canvas element's ID and authoringData, a dict of dicts that contains various information from other XRAuthor components, e.g. dicts of recordingData, editingData, etc.
```
app.createXRScene("renderCanvas", {})
```

You now have the 3D scene rendered onto the HTMLCanvas element.
<!-- provide a code snippet of how the main.js file in the XRAuthor project can import your module and call the required function(s) to launch the immersive learning experience -->

## Link to video tutorial
https://github.com/ToM4tto/CSD3120-IPA/blob/main/assets/synthesisDecompBalanced/videos/0.webm

<!-- include a link to the video tutorial you recorded below -->



