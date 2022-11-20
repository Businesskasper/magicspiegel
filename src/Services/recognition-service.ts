import * as faceapi from "face-api.js";
import { FaceMatcher, LabeledFaceDescriptors } from "face-api.js";
import * as fs from "fs";
import * as path from "path";
import { EventDispatcher, IEvent } from "strongly-typed-events";
import * as Events from "../Events";
import * as Model from "../Models";
import * as Services from "./";

/*
 * This class uses faceapi.js in order to detect faces and compare the calculated face descriptors with the ones saved on the database.
 */
export class RecognitionService {
  public cam: HTMLElement;

  private faceapiOptions = new faceapi.SsdMobilenetv1Options({
    minConfidence: 0.5,
    maxResults: 1,
  });
  // private labeledFaceDescriptors: Array<LabeledFaceDescriptors>;

  private userDetectedEvent = new EventDispatcher<
    RecognitionService,
    Events.UserDetected
  >();
  public get onUserDetected(): IEvent<RecognitionService, Events.UserDetected> {
    return this.userDetectedEvent.asEvent();
  }

  constructor(
    private dataAdapter: Services.DataAdapter,
    private logger: Services.LoggingService
  ) {
    faceapi.env.monkeyPatch({
      Canvas: HTMLCanvasElement,
      Image: HTMLImageElement,
      ImageData: ImageData,
      Video: HTMLVideoElement,
      createCanvasElement: () => document.createElement("canvas"),
      createImageElement: () => document.createElement("img"),
    });

    // this.labeledFaceDescriptors = new Array<LabeledFaceDescriptors>();
  }

  // Loads the trained models
  public async InitializeDetection(): Promise<RecognitionService> {
    this.logger.Debug("Initializing Recognition Service");

    try {
      const detectionNet = faceapi.nets.ssdMobilenetv1;

      await detectionNet.loadFromDisk(
        path.join(__dirname, "../../data/weights")
      ),
        await faceapi.nets.faceLandmark68Net.loadFromDisk(
          path.join(__dirname, "../../data/models/face_landmark_68")
        ),
        await faceapi.nets.faceRecognitionNet.loadFromDisk(
          path.join(__dirname, "../../data/models/face_recognition")
        );

      return this;
    } catch (err) {
      this.logger.Error(err);
      throw err;
    }
  }

  // Sets up the webcam
  public async InitializeCamera(
    width: number,
    height: number
  ): Promise<RecognitionService> {
    this.logger.Debug("Initializing Camera");

    this.cam = document.getElementById("cam");
    (this.cam as HTMLVideoElement).width = width;
    (this.cam as HTMLVideoElement).height = height;

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: width,
          height: height,
          frameRate: { exact: 10 },
        },
      });
      (this.cam as HTMLVideoElement).srcObject = media;

      // const devices = await navigator.mediaDevices.enumerateDevices();
      // devices.forEach(device => {
      //   console.log('device', device.label)
      // })


      await this.timeout(1000);
      return this;
    } catch (err) {
      this.logger.Error(err);
      throw err;
    }
  }

  public async DetectFace(input: faceapi.TNetInput) {
    const singleResult = await faceapi
      .detectSingleFace(input, this.faceapiOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return singleResult ?? null;
  }

  // Detects faces in an infinite loop. Once a face is detected, the personDetectedEvent is used to notify the mirror service.
  public async DetectFaces(): Promise<void> {

    this.logger.Debug("Detecting...");

    const singleResult = await this.DetectFace(this.cam as HTMLVideoElement);

    if (!!singleResult) {
      this.logger.Info("Face detected");

      this.dataAdapter
        .User(null)
        .forEach(({ name, descriptors }: Model.User) => {
          const labeledFaceDescriptors = new LabeledFaceDescriptors(
            name,
            descriptors
          );
          this.logger.Info(`Comparing with ${labeledFaceDescriptors.label}`);

          const faceMatcher = new FaceMatcher(labeledFaceDescriptors, 0.6);
          const bestMatch = faceMatcher.findBestMatch(singleResult.descriptor);

          if (bestMatch !== null && bestMatch.label !== "unknown") {
            this.logger.Info(`Detected ${bestMatch.label}`);
            this.userDetectedEvent.dispatch(this, {
              userName: bestMatch.label,
            });
          }
        });
    }
    await this.timeout(200);
    this.DetectFaces();
  }

  //   // Gets the saved face descriptors from the database in order to compare them to the person standing in front of the mirror.
  //   public LoadLabeledFaceDescriptorsFromDb(): void {
  //     this.dataAdapter.User(null).forEach(({ name, descriptors }: Model.User) => {
  //       this.labeledFaceDescriptors.push(new LabeledFaceDescriptors(name, descriptors));
  //     });

  //     console.log("FaceRecognitionService.LoadLabeledFaceDescriptorsFromDb() -> Found:");
  //     console.log(this.labeledFaceDescriptors);
  //   }

  // Registers a person in the database. This can be used to initialize the database with a few stored images - mainly for development.
  public async SeedLabeledFaceDescriptors(
    dataAdapter: Services.DataAdapter
  ): Promise<void> {
    this.logger.Info(`Loading faces from stored images`);

    const userFolders = fs.readdirSync(path.join("data", "Images"));
    for (var i = 0; i < userFolders.length; i++) {
      if (
        fs.statSync(path.join("data", "Images", userFolders[i])).isDirectory()
      ) {
        this.logger.Debug(`Reading face descriptors for ${userFolders[i]}`);

        const descriptors: Float32Array[] = [];

        const userPictures = fs.readdirSync(
          path.join("data", "Images", userFolders[i])
        );
        for (var j = 0; j < userPictures.length; j++) {
          const userPicturePath = path.join(
            "data",
            "Images",
            userFolders[i],
            userPictures[j]
          );
          if (
            fs.statSync(userPicturePath).isFile() &&
            userPicturePath.endsWith(".jpg")
          ) {
            this.logger.Debug(`Reading descriptors from ${userPicturePath}`);

            const img = new Image();
            img.src = userPicturePath;

            const singleResult = await this.DetectFace(img);

            if (!!singleResult) {
              this.logger.Debug(`Found Face for ${userFolders[i]}`);
              descriptors.push(singleResult.descriptor);
            } else {
              this.logger.Debug(`Found no face for ${+userFolders[i]} :(`);
            }
          }
        }

        if (descriptors.length !== 0) {
          this.logger.Debug(
            `Pushing new LabeledFaceDescriptors for ${userFolders[i]}`
          );
          dataAdapter.InsertUser({ name: userFolders[i], descriptors });
        }
      }
    }
  }

  public async timeout(duration: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }
}
