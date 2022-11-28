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
  // TODO directly attach the ar:// prefix here
  fileId?: string;
}

export interface FileInfo {
  contentType: string;
}

export interface UploadService {
  uploadFile(file: File): Observable<UploadProgress>;
  uploadBlob(blob: Blob): Observable<UploadProgress>;
  uploadJson(data: string): Observable<UploadProgress>;
}