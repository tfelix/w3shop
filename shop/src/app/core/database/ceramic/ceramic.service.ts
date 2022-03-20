import { Inject, Injectable } from "@angular/core";
import { CeramicClient } from '@ceramicnetwork/http-client';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { from, Observable, of } from "rxjs";
import { map, mergeMap, tap } from "rxjs/operators";

import { environment } from "src/environments/environment";
import { CID } from "src/app/shared/model/cid";

import { CeramicAuthenticator } from "./ceramic-authenticator";


@Injectable({
  providedIn: 'root'
})
export class CeramicService {

  private isAuthenticated = false;
  private readonly ceramic = new CeramicClient(environment.ceramicApi);

  constructor(
    @Inject('CeramicAuthenticator') private readonly ceramicAuth: CeramicAuthenticator
  ) {
  }

  readDocument<T>(streamId: string): Observable<T> {
    return from(this.ceramic.loadStream(streamId)).pipe(
      map(x => x.content as T)
    );
  }

  createDocument(content: any): Observable<CID> {
    return this.useAuthenticatedClient().pipe(
      mergeMap(authedCeramic => TileDocument.create(authedCeramic, content)),
      map(doc => doc.id.toString())
    );
  }

  updateDocument(id: CID, content: any): Observable<void> {
    return this.useAuthenticatedClient().pipe(
      mergeMap(authedCeramic => TileDocument.load(authedCeramic, id)),
      mergeMap(doc => doc.update(content))
    );
  }

  private useAuthenticatedClient(): Observable<CeramicClient> {
    if (this.isAuthenticated) {
      return of(this.ceramic);
    } else {
      return this.ceramicAuth.authenticate(this.ceramic).pipe(
        tap(() => this.isAuthenticated = true),
        mergeMap(() => of(this.ceramic))
      )
    }
  }
}