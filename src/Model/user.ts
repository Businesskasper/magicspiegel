import * as Model from "./export";

/*
* A user has a name and a descriptor. The descriptor has the face "information" to identify a user. It gets translated to a "NamedFaceDescriptor" Object for faceapi.js
*/
export class User {

    Name : string;
    Descriptors: Float32Array[];

    constructor(name: string = '', descriptors: Float32Array[] = new Array<Float32Array>()) {

        this.Name = name;
        this.Descriptors = descriptors;
    }
}