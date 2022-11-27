import { Observable } from "rxjs";

export interface EncryptedFileMeta {
  encryptedKeyBase64: string,
  accessCondition: any,
  encryptedFile: Blob
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
  ): Observable<EncryptedFileMeta>

  decryptFile(encryptedFile: File | Blob);
}