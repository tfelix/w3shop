import { Observable } from "rxjs";
import { ShopConfig } from "src/app/shared";

export interface DatabaseService {
  /**
   * Sets a new shop. Upon success it will return a CID (stream id).
   */
  saveShopConfig(content: ShopConfig): Observable<string>;
  loadShopConfig(uri: string): Observable<ShopConfig>;
}