import { Observable } from "rxjs";

export interface UriId {
  id: number;
  uri: string;
}

export interface Resolver<T> {
  load(uris: UriId[]): Observable<T[]>;
}