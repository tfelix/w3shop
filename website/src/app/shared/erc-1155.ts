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
  name: string;
  decimals: 0;
  description: string;
  /**
   * Link back to the shop marketplace where a buyer can decript the item. Should probably
   * be the IPFS hash and not the IPNS address to be more stable against changes of the website.
   */
  external_uri: string;
  image: string;
  localization?: Erc1155MetadataLocalization;
  // properties: any currenty not supported.
}
