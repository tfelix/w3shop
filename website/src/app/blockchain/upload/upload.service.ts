import { Observable } from "rxjs";

export enum ProgressStage {
  SIGN_IN,
  FUND,
  UPLOAD,
  COMPLETE
}

export interface UploadProgress {
  progress: number;
  stage: ProgressStage;
  fileId?: string;
}

export interface UploadService {
  deployFiles(data: string | Uint8Array): Observable<UploadProgress>;
  getCurrentBalance(): Observable<string>;

  // Those APIs don't really fit into the UploadService, consider moving them into
  // a own class that gets the Bundlr client injects.

  /**
   * Number of bytes that can be roughly uploaded with the current funding.
   */
  bytesToUpload(): Observable<number>;

  /**
   * Fund the Bundlr node so that its able to upload nBytes for the current prices.
   * @param nBytes
   */
  fund(nBytes: number): Observable<void>;
}