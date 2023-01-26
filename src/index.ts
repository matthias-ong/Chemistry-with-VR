import {App} from "./app"

console.log("Hello XR!")

const canvas : HTMLCanvasElement = document.getElementById("renderCanvas") as HTMLCanvasElement

// const ctx = canvas.getContext('2d')
// ctx.font = "50px Arial"
// ctx.fillText("Hello XR!", 50, 50)
const app = new App()

app.createXRScene(canvas, {})

