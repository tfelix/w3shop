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
  deployFiles(data: string): Observable<UploadProgress>;
}