export type Locale = 'en' |
  'es' |
  'fr' |
  'de';

export interface Erc1155Translation {
  name: string;
  description: string;
}

export interface Erc1155MetadataLocalization {
  /**
   * The URI pattern to fetch localized data from. This URI should contain
   * the substring `{locale}` which will be replaced with the appropriate
   * locale value before sending the request.
   */
  uri: string;

  /**
   * The locale of the default data within the base JSON.
   */
  default: Locale;

  /**
   * The list of locales for which data is available. These locales should
   * conform to those defined in the Unicode Common Locale Data Repository (http://cldr.unicode.org/)."
   */
  locales: Locale[];
}

export interface Erc1155Metadata {
  /**
   * Name of the item.
   */
  name: string;
  decimals: 0;
  /**
   * A description of the item.
   */
  description: string;
  /**
   * Link back to the shop marketplace where a buyer can decript the item. Should probably
   * be the IPFS hash and not the IPNS address to be more stable against changes of the website.
   */
  external_uri: string;
  image: string;
  /**
   * For now this is not supported because we need to upload a folder into Arweave via Bundlr
   * for this.
   */
  localization?: Erc1155MetadataLocalization;
  properties: {
    /**
     * Arweave payload hash. It will start with ar:// e.g.
     * ar://V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg
     */
    payload: string;
  }
}
