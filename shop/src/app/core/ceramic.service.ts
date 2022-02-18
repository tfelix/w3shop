import { Injectable } from "@angular/core";

// import { CeramicClient } from '@ceramicnetwork/http-client';
// import { Ed25519Provider } from 'key-did-provider-ed25519';
import { environment } from "src/environments/environment";
// import { randomBytes } from '@stablelib/random'
import { from } from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class CeramicService {

  /*
  private readonly ceramic = new CeramicClient(environment.ceramicApi);

  constructor() {
    const seed = this.getSeed();
    const provider = new Ed25519Provider(seed);
    this.ceramic.did.setProvider(provider);
    from(this.ceramic.did.authenticate()).subscribe(() => {
      console.log('Successfully authenticated for Ceramic');
    })
  }

  getSeed(): Uint8Array {
    const savedSeedEnc = localStorage.getItem(CeramicService.LOCAL_STORAGE_SEED_KEY);
    if (!!savedSeedEnc) {
      const enc = new TextDecoder("utf-8");
      const seed = randomBytes(32);
      const decSeed = enc.decode(seed);
      localStorage.setItem(CeramicService.LOCAL_STORAGE_SEED_KEY, decSeed);

      return seed;
    } else {
      const enc = new TextEncoder(); // always utf-8

      return enc.encode(savedSeedEnc!);
    }
  }

    /*
  test() {
    const streamId = 'kjzl6cwe1jw1469zq1nurheflkosnma10dk0xzq0csveur0qo8be86czzsofcp0';
    return from(this.ceramic.loadStream(streamId)).pipe(
      map(x => x.content),
    )
  }

  private static readonly LOCAL_STORAGE_SEED_KEY = 'ceramicEd25519Seed';*/
}