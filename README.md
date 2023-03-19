# CSD3120 IPA
IPA for CSD3120 VR<br/>
By: Matthias Ong Si En (2000987)

## Introduction
This project exports into an [**XRAuthor**](https://hub.docker.com/r/immersification/xrauthor) extension. Please follow the instructions on the Docker Hub to install XRAuthor first, alternatively, you may run this as a standalone app inside dist/app folder. Although you need to host a Python server locally for that. 

This projects creates a 3D VR scene in order to teach students about Chemistry, specifically synthesis reactions. The 3D scene takes place in a classroom, there is a video screen that plays a recorded lecture in the event the student get stuck. The main interaction area is where students will combine the molecules into H2O using what they learnt to apply their knowledge. Screenshots are shown below.
**Tutorial area**:
![](https://github.com/ToM4tto/CSD3120-IPA/blob/main/screenshots/tutorial.png)
**Practice area**:
![](https://github.com/ToM4tto/CSD3120-IPA/blob/main/screenshots/practice.png)

## Project hierarchy
The source files of the project are included in the (`src`) folder. Assets are in (`public/assets`), distribution builds for both standalone and the XRAuthor extension are in (`dist/`)<br/>

(`index.html`) - contains the canvas that we will use BabylonJS to render to.<br/>
(`app.ts`) - contains the 3D main scene logic and rendering<br/>
(`src\components`) - contains several files as part of a simple component architecture system, these files are used throughout the program as an abstraction and organisation.<br/>
(`init.ts`) - contains the the common entry point of the project<br/>
(`index.ts`) - The standalone app's entry point.<br/>
(`index-ext.ts`) - XRAuthor extension's entry point<br/>

[Video Lesson Link](https://github.com/ToM4tto/CSD3120-IPA/blob/main/public/assets/synthesisDecompBalanced/videos/0.webm)

## Installing the dependencies:
Ensure that you have the NodeJS installed as we will be using [*NodeJS's NPM*](https://nodejs.org/en/) to download all the required dependencies.

After cloning this git repository, it contains all the configuration files for this NodeJS project. All that is needed is to install the dependencies using `npm install`

The development dependencies are necessary if you wish to run the project on a private Webpack server for testing purposes.

## How to run as XRAuthor extension?
After following the instructions to install and run XRAuthor container. Ensure that there is a (`xrauthor-uploads`) directory. Ensure that the `dist/ext` folder is there if not issue the `npm run build-ext` command to generate it.

**Step 1**: Copy the `public\assets\synthesisDecompBalanced` directory into your `xrauthor-uploads\assets` directory that was created after setting up XRAuthor.

**Step 2**: Ensure the XRAuthor image is running, head over to `http://localhost:<port-number>/author/synthesisDecompBalanced`

**Step 3**: Go to `Publish` and upload as extension the `ext` folder found in `dist\ext` of the project.
![](https://github.com/ToM4tto/CSD3120-IPA/blob/main/screenshots/xrauthorupload.png)

**Step 4**: Refresh the page and head over to `Edit` > `XR Format`. You should see this scene after it loads:
![](https://github.com/ToM4tto/CSD3120-IPA/blob/main/screenshots/xrauthorComplete.png)

## How to run as standalone on a browser locally?
Ensure you have [**Python**](https://www.python.org/) installed as we will be using a Python server. Check that the `dist/app` folder is there and it contains the HTML and JS files, if not do `npm run build` to generate them.

**Step 1**: Run the command ``python -m http.server`

**Step 2**: Open the server using a browser, it should be something like `http://localhost:<port-number>/dist/app/`

**Step 3**: Wait for the scene to load.

## Controls
This is a full VR application and it has been tested using Oculus Quest from the WebXR emulator Chrome Extension. However, it also supports Windows keyboard and mouse inputs if needed to gain wider accessibility.

**Desktop controls**:
- `Movement` - Arrow Keys
- `Select and pick`: Left click
- `Dragging`: Mouse to drag molecules and/or move Guizmos
- `Reset`: Press `R` to reset the interactable models in the practice area.
- `Rotation + Scaling`: Double left click to toggle `Gizmo` mode on or off (this is printed on the console), after turning it on, click on a interactable model in the practice area (**NOT** the video tutorial area).

**VR mode**:
- `Locomotion`: Using either left and right controller, aim onto a target on the ground and squeeze the button once to `teleport` to that location.
- `Rotation + Scaling`: Squeeze the button twice repeatedly to toggle `Gizmo` mode on or off (this is printed on the console), after turning it on, click on a interactable model in the practice area (not the video tutorial area).
- `Pinch Scaling`: Alternatively, you may use left and right controllers separately, point at the same target and pinch with both controllers open/close to scale the molecule.

`Gizmo` mode once activated will output on the console. After turning it on, click on an interactable model in the practice area (**NOT** the video tutorial area) to bring out the Gizmo tools.

**Completion**:
After successfully completing the interaction, you will see `Particles and a Sound effect` for a few seconds as feedback.
![](https://github.com/ToM4tto/CSD3120-IPA/blob/main/screenshots/correct.png)
