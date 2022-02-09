import { Observable } from "rxjs";
import { Collection } from "src/app/shared";

export interface CollectionResolver {
  load(uris: string[]): Observable<Collection[]>;
}