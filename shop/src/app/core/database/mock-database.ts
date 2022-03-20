import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";
import { ShopConfig } from "src/app/shared";
import { DatabaseService } from "./database";

@Injectable({
  providedIn: 'root'
})
export class MockDatabase implements DatabaseService {

  constructor(
    private http: HttpClient
  ) { }

  saveShopConfig(content: ShopConfig): Observable<string> {
    return of('kjzl6fddub9hxf2q312a5qjt9ra3oyzb7lthsrtwhne0wu54iuvj852bw9wxfvs').pipe(
      delay(2500)
    );
  }

  loadShopConfig(uri: string): Observable<ShopConfig> {
    if (uri == 'kjzl6fddub9hxf2q312a5qjt9ra3oyzb7lthsrtwhne0wu54iuvj852bw9wxfvs') {
      return this.http.get<ShopConfig>('assets/config.json');
    } else {
      throw new Error('Not found');
    }
  }
}