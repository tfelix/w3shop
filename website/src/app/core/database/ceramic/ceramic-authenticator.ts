import CeramicClient from "@ceramicnetwork/http-client";
import { Observable } from "rxjs";

export interface CeramicAuthenticator {
  authenticate(ceramic: CeramicClient): Observable<string>;
}