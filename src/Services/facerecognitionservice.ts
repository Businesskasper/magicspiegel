import { FaceMatcher, LabeledFaceDescriptors } from 'face-api.js';
import { EventDispatcher, IEvent } from "strongly-typed-events";
import * as faceapi from 'face-api.js';
import * as path from "path";
import * as fs from "fs";
import * as Services from './export';
import * as Model from '../Model/export';

/*
* This class uses faceapi.js in order to detect faces and compare the calculated face descriptors with the ones saved on the database.
*/
export class FaceRecognitionService {

    public cam: HTMLElement;
    public isRunning: Boolean = true;
    public isReady: Boolean = false;

    private faceapiOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5, maxResults: 1 });
    private labeledFaceDescriptorsArray : Array<LabeledFaceDescriptors>;
    private _dataAdapter : Services.DataAdapter;

    private personDetectedEvent = new EventDispatcher<FaceRecognitionService, string>();
    public get onPersonDetectedEvent(): IEvent<FaceRecognitionService, string> {

        return this.personDetectedEvent.asEvent();
    }

    constructor(dataAdater: Services.DataAdapter) {

        this._dataAdapter = dataAdater;

        faceapi.env.monkeyPatch({
            Canvas: HTMLCanvasElement,
            Image: HTMLImageElement,
            ImageData: ImageData,
            Video: HTMLVideoElement,
            createCanvasElement: () => document.createElement('canvas'),
            createImageElement: () => document.createElement('img')
        });

        this.labeledFaceDescriptorsArray = new Array<LabeledFaceDescriptors>();
    }

    // Loads the trained models
    public async SetupService(): Promise<void> {

        console.log("FaceRecognitionService.SetupService() -> Setting up Service");

        try {

            let detectionNet = faceapi.nets.ssdMobilenetv1;
            
            await detectionNet.loadFromDisk(path.join(__dirname, "../../data/weights")),
            await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, '../../data/models/face_landmark_68')),
            await faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(__dirname, '../../data/models/face_recognition'))

            console.log("FaceRecognitionService.SetupService() -> Done!");
        }       
        catch (err) {
                
            console.log("FaceRecognitionService.SetupService() -> Failed for reason: " + err);
            throw(err);
        }
    }

    // Sets up the webcam
    public async InitializeCamera(width: number, height: number): Promise<void> {

        console.log("FaceRecognitionService.InitializeCamera() -> Initializing camera");

        this.cam = document.getElementById('cam');
        (this.cam as HTMLVideoElement).width = width;
        (this.cam as HTMLVideoElement).height = height;

        try {

            (this.cam as HTMLVideoElement).srcObject = await navigator.mediaDevices.getUserMedia({

                audio: false,
                video: {
                    facingMode: "user",
                    width: width,
                    height: height,
                    frameRate: { exact: 5 }
                }
            })

            await this.timeout(1000);
            console.log("FaceRecognitionService.InitializeCamera() -> Done");
        }
        catch (err) {

            console.error(err);
            return Promise.reject(err);
        }
    }


    // Detects faces in an infinite loop. Once a face is detected, the personDetectedEvent is used to notify the mirror service.
    public async DetectFaces(): Promise<void> {

        console.log("FaceRecognitionService.DetectFaces() -> Detecting..");

        let singleResult = await faceapi.detectSingleFace((this.cam as HTMLVideoElement), this.faceapiOptions).withFaceLandmarks().withFaceDescriptor();

        if (singleResult !== undefined) {

            console.log("FaceRecognitionService.DetectFaces() -> Face detected!");
            
            this._dataAdapter.User(null).forEach((user: Model.User) => {

                let labeledFaceDescriptors = new LabeledFaceDescriptors(user.Name, user.Descriptors);
                console.log("FaceRecognitionService.DetectFaces() -> Comparing with " + labeledFaceDescriptors.label);
                
                let faceMatcher = new FaceMatcher(labeledFaceDescriptors, 0.6);
                let bestMatch = faceMatcher.findBestMatch(singleResult.descriptor);

                if (bestMatch !== null && bestMatch.label !== 'unknown') {

                    console.log("FaceRecognitionService.DetectFaces() -> Detected " + bestMatch.label);
                    this.personDetectedEvent.dispatch(this, bestMatch.label);
                } 
            })
        }
        else {

            console.log("FaceRecognitionService.DetectFaces() -> Nothing detected..");
        }

        await this.timeout(1000);
        this.DetectFaces();
    }


    // Gets the saved face descriptors from the database in order to compare them to the person standing in front of the mirror.
    public LoadLabeledFaceDescriptorsFromDb(): void {

        console.log("FaceRecognitionService.LoadLabeledFaceDescriptorsFromDb() -> Loading")

        this._dataAdapter.User(null).forEach((user: Model.User) => {

            this.labeledFaceDescriptorsArray.push(new LabeledFaceDescriptors(user.Name, user.Descriptors));
        });
        
        console.log("FaceRecognitionService.LoadLabeledFaceDescriptorsFromDb() -> Found:")
        console.log(this.labeledFaceDescriptorsArray);
    }


    // Registers a person in the database. This can be used to initialize the database with a few stored images - mainly for development.
    public async StoreLabeledFaceDescriptors(dataAdapter: Services.DataAdapter): Promise<void> {

        console.log("FaceRecognitionService.StoreLabeledFaceDescriptors() -> Loading faces to store in db");
    
        let userFolders : string[] = fs.readdirSync(path.join("data", "Images"));
        for (var i = 0; i < userFolders.length; i++) {
        
            if (fs.statSync(path.join("data", "Images", userFolders[i])).isDirectory()){

                console.log("FaceRecognitionService.StoreLabeledFaceDescriptors() -> Reading face descriptors for " + userFolders[i]);

                let descriptors : Float32Array[] = [];

                let userPictures = fs.readdirSync(path.join("data", "Images", userFolders[i]));
                for (var j = 0; j < userPictures.length; j++) {

                    let userPicturePath = path.join("data", "Images", userFolders[i], userPictures[j]);
                    if (fs.statSync(userPicturePath).isFile() && userPicturePath.endsWith('.jpg')){

                        console.log("FaceRecognitionService.StoreLabeledFaceDescriptors() -> Reading descriptors from " + userPicturePath);
                        
                        let img = new Image();
                        img.src = userPicturePath;

                        let singleResult = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                        if (typeof singleResult !== 'undefined') {

                            console.log("FaceRecognitionService.StoreLabeledFaceDescriptors() -> Found face for " + userFolders[i]);
                            descriptors.push(singleResult.descriptor);
                        }
                        else {

                            console.log("FaceRecognitionService.StoreLabeledFaceDescriptors() -> Found no face for " + userFolders[i] + " :(");
                        }
                    }
                }

                if (descriptors.length !== 0){

                    console.log("FaceRecognitionService.StoreLabeledFaceDescriptors() -> Pushing new LabeledFaceDescriptors for " + userFolders[i] + " with descriptors: ");
                    console.log(descriptors);

                    dataAdapter.InsertUser(new Model.User(userFolders[i], descriptors));
                }
            }
        }
    }

    
    public async timeout(duration:number) : Promise<void> {

        return new Promise((resolve) => {
            setTimeout(resolve, duration);
        })
    }
}