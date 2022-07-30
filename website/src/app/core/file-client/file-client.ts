import { Observable } from "rxjs";
import { URI, URL } from "src/app/shared";

export interface FileClient {
  get<T>(uri: URI): Observable<T>;

  toURL(uri: URI): URL;
}
