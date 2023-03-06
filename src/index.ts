import { App } from "./app" //Import App from app.ts file

console.log("Example Scene!")

//Instantiate the imported App
const app = new App()

//Launch XR Scene and render to HTML Cavas Element with ID = "renderCanvas"
app.createXRScene("renderCanvas", {})

