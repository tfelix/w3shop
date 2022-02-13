import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SetupComponent } from './setup.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';


@NgModule({
  declarations: [
    SetupComponent,
    HomeComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class SetupModule { }
