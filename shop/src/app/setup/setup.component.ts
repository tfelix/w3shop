import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
})
export class SetupComponent implements OnInit {

  profileForm = this.fb.group({
    firstName: [''],
    lastName: [''],
  });

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.profileForm.value);
  }

}
