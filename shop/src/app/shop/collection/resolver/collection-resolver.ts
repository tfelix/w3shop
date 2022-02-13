import { Observable } from "rxjs";
import { IdentifiedCollection } from "src/app/shared";

export interface UriId {
  id: number;
  uri: string;
}

export interface CollectionResolver {
  load(uris: UriId[]): Observable<IdentifiedCollection[]>;
}