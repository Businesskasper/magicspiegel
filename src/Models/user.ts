
/*
 * A user has a name and a descriptor. The descriptor has the face "information" to identify a user. It gets translated to a "NamedFaceDescriptor" Object for faceapi.js
 */
export interface User {
  name: string;
  descriptors: Float32Array[];
}
