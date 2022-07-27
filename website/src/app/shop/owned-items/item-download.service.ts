import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { scan } from "rxjs/operators";
import { LitFileCryptorService } from "src/app/core/encryption/lit-file-cryptor.service";

export interface Download {
  state: 'PENDING' | 'IN_PROGRESS' | 'DECRYPTING' | 'DONE'
  progress: number
  content: Blob | null
}

function isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
  return event.type === HttpEventType.Response
}

function isHttpProgressEvent(event: HttpEvent<unknown>): event is HttpProgressEvent {
  return event.type === HttpEventType.DownloadProgress
    || event.type === HttpEventType.UploadProgress
}

// Inspired by https://nils-mehlhorn.de/posts/angular-file-download-progress

@Injectable({
  providedIn: 'root'
})
export class OwnedItemsService {

  constructor(
    private http: HttpClient,
    private cryptorService: LitFileCryptorService
  ) { }

  download(): Observable<Download> {
    const url = '';
    return this.http.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(
      scan((previous: Download, event: HttpEvent<Blob>): Download => {
        if (isHttpProgressEvent(event)) {
          return {
            progress: event.total
              ? Math.round((100 * event.loaded) / event.total)
              : previous.progress,
            state: 'IN_PROGRESS',
            content: null
          }
        }
        if (isHttpResponse(event)) {
          if (saver && event.body) {
            saver(event.body)
          }
          return {
            progress: 100,
            state: 'DONE',
            content: event.body
          }
        }
        return previous
      },
        { state: 'PENDING', progress: 0, content: null }
      )
    );
  }

  private decrypt(file: Blob) {

  }
}