import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { scan } from "rxjs/operators";
import { URI } from "src/app/shared";
import { Download, FileClient } from "./file-client";


function isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
  return event.type === HttpEventType.Response
}

function isHttpProgressEvent(event: HttpEvent<unknown>): event is HttpProgressEvent {
  return event.type === HttpEventType.DownloadProgress
    || event.type === HttpEventType.UploadProgress
}

export abstract class BaseHttpClient implements FileClient {
  constructor(
    protected readonly httpClient: HttpClient
  ) {
  }
  abstract get<T>(uri: string): Observable<T>;
  abstract toURL(uri: string): string;

  download(uri: string): Observable<Download> {
    const url = this.toURL(uri);

    return this.httpClient.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(
      scan((previous: Download, event: HttpEvent<Blob>): Download => {
        if (isHttpProgressEvent(event)) {
          return {
            progress: this.toProgress(event, previous),
            state: 'IN_PROGRESS',
            content: null
          }
        }
        if (isHttpResponse(event)) {
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

  private toProgress(event: HttpProgressEvent, previous: Download): number {
    return event.total ? Math.round((100 * event.loaded) / event.total) : previous.progress;
  }
}