/**
 * XRAuthor extension entry point
 */
import { createXRScene } from "./init"

//Pass function to XRAuthor to use
//create a JS object that contains createXRScene function ref and adds it to window global object
//These Window global object is available for all the JS Scripts on the XRAuthor website
window['extension'] = { createXRScene: createXRScene }
//When XRAuthor loads the "extension"

console.log("xrauthor-extension entrypoint init")
