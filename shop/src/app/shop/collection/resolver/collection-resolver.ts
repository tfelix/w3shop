import { Observable } from "rxjs";
import { CollectionId } from "src/app/shared";

export interface UriId {
  id: number;
  uri: string;
}

export interface CollectionResolver {
  load(uris: UriId[]): Observable<CollectionId[]>;
}