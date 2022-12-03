import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegalRoutingModule } from './legal-routing.module';

import { SharedModule } from 'src/app/shared/shared.module';
import { PrivacyComponent } from './privacy/privacy.component';
import { LicensesComponent } from './licenses/licenses.component';
import { UsagePolicyComponent } from './usage-policy/usage-policy.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';


@NgModule({
  declarations: [
    PrivacyComponent,
    LicensesComponent,
    UsagePolicyComponent,
    DisclaimerComponent
  ],
  imports: [
    CommonModule,
    LegalRoutingModule,
    SharedModule
  ]
})
export class LegalModule { }
