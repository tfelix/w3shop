import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface FileClient {
  get<T>(uri: string): Observable<T>
}

@Injectable({
  providedIn: 'root'
})
export class ArweaveClient implements FileClient {
  constructor(
    private readonly httpClient: HttpClient
  ) {
  }

  get<T>(uri: string): Observable<T> {
    return this.httpClient.get<T>(uri);
  }
}