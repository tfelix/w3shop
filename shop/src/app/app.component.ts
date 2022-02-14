import { Component, OnInit } from '@angular/core';

import LitJsSdk from 'lit-js-sdk';
import { from } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  private readonly client = new LitJsSdk.LitNodeClient();

  ngOnInit(): void {
    from(this.client.connect()).subscribe(x => console.log('Lit Loaded'));
  }

}
