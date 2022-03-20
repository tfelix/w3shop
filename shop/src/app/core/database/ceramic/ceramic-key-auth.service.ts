import CeramicClient from "@ceramicnetwork/http-client";
import { DID } from "dids";
import { randomBytes } from "ethers/lib/utils";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { from, Observable } from "rxjs";
import { base64ToBytes, bytesToBase64 } from "./base64";
import { CeramicAuthenticator } from "./ceramic-authenticator";

export class CeramicKeyAuthenticatorService implements CeramicAuthenticator {

  authenticate(ceramic: CeramicClient): Observable<string> {
    const seed = this.getSeed();
    const provider = new Ed25519Provider(seed);
    const did = new DID({ provider, resolver: getResolver() })
    ceramic.did = did;

    const authObs = from(did.authenticate());

    return authObs;
  }

  private getSeed(): Uint8Array {
    const savedSeedEnc = localStorage.getItem(CeramicKeyAuthenticatorService.LOCAL_STORAGE_SEED_KEY);
    if (!savedSeedEnc) {
      const seed = randomBytes(32);
      const base64Seed = bytesToBase64(seed);
      localStorage.setItem(CeramicKeyAuthenticatorService.LOCAL_STORAGE_SEED_KEY, base64Seed);

      return seed;
    } else {

      return base64ToBytes(savedSeedEnc);
    }
  }

  private static readonly LOCAL_STORAGE_SEED_KEY = 'CERAMIC_ED25519_SEED';
}