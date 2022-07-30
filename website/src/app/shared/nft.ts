import { URI } from "./model/url";

export interface NftMetadata {
  name: string;
  description: string;
  externalUri: URI;
  image: URI;
}

export interface NftToken {
  default: NftMetadata;
  local: { [key: string]: NftMetadata; };
}