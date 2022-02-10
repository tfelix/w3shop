import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SetupComponent } from './setup.component';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    SetupComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class SetupModule { }
