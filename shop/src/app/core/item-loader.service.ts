import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Collection } from 'src/app/shared';


@Injectable({
  providedIn: 'root'
})
export class ItemLoaderService {

  constructor(
    private http: HttpClient,
  ) {

  }

  getCollections(): Observable<Collection> {
    return this.http.get<Collection>('/assets/collections.json');
  }
}
