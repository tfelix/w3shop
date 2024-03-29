export type Locale = 'en' |
  'es' |
  'fr' |
  'de';

export interface Erc1155Translation {
  name: string;
  description: string;
}

type OSKindAttribute = 'Shop Instance' | 'Digital Item';

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

/**
 * The ERC1155 Metadata format used by W3Shop.
 */
export interface Erc1155Metadata {
  /**
   * Name of the item.
   */
  name: string;

  decimals: 0;

  /**
   * A description of the item. Markdown is supported.
   */
  description: string;

  /**
   * Link back to the shop marketplace where a buyer can decript the item. This is either an IPFS
   * address or an Arweave URI.
   * At best point directly to the item e.g.
   * - https://w3shop.eth/s/<SHOP_IDENT>/items/<ID>
   */
  external_uri: string;

  /**
   * URL of the image of the item. Should be IPFS or Arweave URI.
   */
  image: string;
  /**
   * For now this is not supported because we need to upload a folder into Arweave via Bundlr
   * for this.
   */
  localization?: Erc1155MetadataLocalization;

  /**
   * OpenSea specific attribute map. We use it to better group the tokens between owner tokens of
   * shops and actual digital items.
   *
   * Shop: {value: 'Shop Instance'}
   * Item: {value: 'Digital Item'}
   */
  attributes: [{ value: OSKindAttribute }];

  /**
   * Additional attributes according to the ERC1155 standard.
   */
  properties: {
    /**
     * Version number to define which properties in here are saved. In case the data saved here
     * is altered in the future.
     */
    version: 1,

    /**
     * Arweave payload hash. It will start with ar:// e.g.
     * ar://V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg
     * or IPFS based, starting with ipfs://
     */
    content_uri: string;

    /**
     * Base64 encoded access condition that was used to save the Lit symmetric key. Must be used to
     * decrypt the key again later.
     */
    access_condition: string;

    /**
     * Base64 encoded encrypted key to access the content payload specified in content_uri.
     */
    encrypted_key: string;
  }
}
