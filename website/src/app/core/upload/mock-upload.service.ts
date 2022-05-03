import { Injectable } from "@angular/core";
import { concat, Observable, of } from "rxjs";
import { delay } from "rxjs/operators";

import { UploadProgress, ProgressStage, UploadService } from "./upload.service";

@Injectable({
  providedIn: 'root'
})
export class MockUploadService implements UploadService {

  constructor(
  ) {
  }

  deployFiles(data: string): Observable<UploadProgress> {
    return concat(
      this.makeProgress(10, ProgressStage.SIGN_IN).pipe(delay(2000)),
      this.makeProgress(30, ProgressStage.FUND).pipe(delay(4000)),
      this.makeProgress(50, ProgressStage.UPLOAD).pipe(delay(3000)),
      this.makeProgress(100, ProgressStage.COMPLETE, MockUploadService.MOCK_ARWAVE_SHOP_CONFIG)
    );
  }

  getCurrentBalance(): Observable<string> {
    return of('0.0');
  }

  private makeProgress(
    progress: number,
    stage: ProgressStage,
    fileId?: string
  ): Observable<UploadProgress> {
    return of({
      progress,
      stage,
      fileId,
    })
  }

  static readonly MOCK_ARWAVE_SHOP_CONFIG = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
}