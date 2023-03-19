# CSD3120 IPA
IPA for CSD3120 VR<br/>
By: Matthias Ong Si En (2000987)

## Introduction
This project exports into an [**XRAuthor**](https://hub.docker.com/r/immersification/xrauthor) extension. Please follow the instructions on the Docker Hub to install XRAuthor first, alternatively, you may run this as a standalone app inside dist/app folder. Although you need to host a Python server locally for that. 

This projects creates a 3D VR scene in order to teach students about Chemistry, particularly synthesis reactions. The 3D scene takes place in a classroom, there is a video screen that plays a recorded lecture in the event the student get stuck. The main interaction area is where students will combine the molecules using what they learnt to apply their knowledge. Screenshots are shown below.
![](https://github.com/ToM4tto/CSD3120-IPA/blob/main/screenshots/tutorial.png)
![](https://github.com/ToM4tto/CSD3120-IPA/blob/main/screenshots/practice.png)

### Project hierarchy
The source files of the project are included in the (`src`) folder. Assets are in (`public/assets`), distribution builds for both standalone and the XRAuthor extension are in (`dist/`)<br/>

(`index.html`) - contains the canvas that we will use BabylonJS to render to.<br/>
(`app.ts`) - contains the 3D main scene logic and rendering<br/>
(`src\components`) - contains several files as part of a simple component architecture system, these files are used throughout the program as an abstraction and organisation.<br/>
(`init.ts`) - contains the the common entry point of the project<br/>
(`index.ts`) - The standalone app's entry point.<br/>
(`index-ext.ts`) - XRAuthor extension's entry point<br/>

[Video Lecture](https://github.com/ToM4tto/CSD3120-IPA/blob/main/public/assets/synthesisDecompBalanced/videos/0.webm)

### Installing the dependencies:
Ensure that you have the NodeJS installed as we will be using [*NodeJS's NPM*](https://nodejs.org/en/) to download all the required dependencies.

After cloning this git repository, it contains all the configuration files for this NodeJS project. All that is needed is to install the dependencies using `npm install`

The development dependencies are necessary if you wish to run the project on a private Webpack server for testing purposes.

## How to import to XRAuthor extension?
After following the instructions to install and run XRAuthor container. Ensure that there is a (`xrauthor-uploads`) directory.

**Step 1**: Copy the `public\assets\synthesisDecompBalanced` directory into your `xrauthor-uploads\assets` directory that was created after setting up XRAuthor.

**Step 2**: Ensure the XRAuthor image is running, head over to `http://localhost:<port-number>/author/synthesisDecompBalanced`

**Step 3**: Go to `Publish` and upload as extension the `ext` folder found in `dist\ext` of the project.
![](https://github.com/ToM4tto/CSD3120-IPA/blob/main/screenshots/xrauthorupload.png)

**Step 4**: Refresh the page and head over to `Edit` > `XR Format`. You should see this scene after it loads:
![](https://github.com/ToM4tto/CSD3120-IPA/blob/main/screenshots/xrauthorComplete.png)