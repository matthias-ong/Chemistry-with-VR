/**
 * Standalone entry point for debugging on local environment
 */
import { createXRScene } from "./init"
import { AuthoringData, loadAuthoringData } from "xrauthor-loader"

//load xrauthor assets for standalone debugging
loadAuthoringData("assets/synthesisDecompBalanced").then((data: AuthoringData) => {
    createXRScene("renderCanvas", data)
})

console.log("standalone entrypoint init")
