import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { faAngleRight, faWallet, faFileSignature } from '@fortawesome/free-solid-svg-icons';

import { CeramicService } from '../shared/ceramic.service';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
})
export class SetupComponent implements OnInit {
  faAngleRight = faAngleRight;
  faWallet = faWallet;
  faFileSignature = faFileSignature;

  keywords: string[] = [];

  profileForm = this.fb.group({
    firstName: [''],
    lastName: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ceramicService: CeramicService
  ) { }

  ngOnInit(): void {
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.profileForm.value);
  }

}
