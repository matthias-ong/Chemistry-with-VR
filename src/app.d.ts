export declare class App {
    private engine;
    private canvas;
    constructor();
    createXRScene(canvasID: string, authoringData: {
        [data: string]: {
            [key: string]: any;
        };
    }): void;
    private createScene;
}
