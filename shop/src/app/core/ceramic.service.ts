import { Injectable } from "@angular/core";
import { CeramicClient } from '@ceramicnetwork/http-client';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { getResolver } from 'key-did-resolver';
import { EMPTY, from, Observable } from "rxjs";
import { randomBytes } from "ethers/lib/utils";
import { map, mergeMap, tap } from "rxjs/operators";
import { DID } from "dids";

import { environment } from "src/environments/environment";
import { base64ToBytes, bytesToBase64 } from "./base64";


@Injectable({
  providedIn: 'root'
})
export class CeramicService {

  private isAuthenticated = false;
  private readonly ceramic = new CeramicClient(environment.ceramicApi);

  constructor() {
    this.test();
  }

  authenticate(): Observable<string> {
    if (this.isAuthenticated) {
      return EMPTY;
    }

    const seed = this.getSeed();
    const provider = new Ed25519Provider(seed);
    const did = new DID({ provider, resolver: getResolver() })
    this.ceramic.did = did;

    const authObs = from(did.authenticate());

    authObs.subscribe(x => {
      this.isAuthenticated = true;
    }, (e) => {
      console.warn('Ceramic authentication failed.', e);
    });

    return authObs;
  }

  getSeed(): Uint8Array {
    const savedSeedEnc = localStorage.getItem(CeramicService.LOCAL_STORAGE_SEED_KEY);
    if (!savedSeedEnc) {
      const seed = randomBytes(32);
      const base64Seed = bytesToBase64(seed);
      localStorage.setItem(CeramicService.LOCAL_STORAGE_SEED_KEY, base64Seed);

      return seed;
    } else {

      return base64ToBytes(savedSeedEnc);
    }
  }

  test() {
    const streamId = 'kjzl6cwe1jw1469zq1nurheflkosnma10dk0xzq0csveur0qo8be86czzsofcp0';
    return from(this.ceramic.loadStream(streamId)).pipe(
      map(x => x.content),
    ).subscribe(x => console.log(x))
  }

  writeTest() {
    this.authenticate().pipe(
      tap(x => console.log(x)),
      mergeMap(() => TileDocument.create(this.ceramic, { hello: 'world' }))
    ).subscribe(doc => {
      console.log(doc);
    });
  }



  private static readonly LOCAL_STORAGE_SEED_KEY = 'CERAMIC_ED25519_SEED';
}