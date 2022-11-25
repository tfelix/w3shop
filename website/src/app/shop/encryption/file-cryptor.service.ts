import { Observable } from "rxjs";

export interface EncryptedZipWithMetadata {
  zipBlob: File
}

export interface DecryptedZip {
  decryptedFile: ArrayBuffer,
  metadata: any;
}

export interface FileCryptorService {
  /**
   * Encrypts the given shop file and makes it ready for uploading.
   *
   * @param file The file payload of the item to put into the shop.
   * @param nextTokenId The token ID that will represent this shop item NFT.
   * @returns
   */
  encryptPayloadFile(
    file: File,
    nextTokenId: string,
  ): Observable<EncryptedZipWithMetadata>

  decryptFile(encryptedFile: File | Blob): Observable<DecryptedZip>;
}