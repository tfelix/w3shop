import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { LicensesComponent } from './licenses/licenses.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { UsagePolicyComponent } from './usage-policy/usage-policy.component';

const routes: Routes = [
  { path: 'privacy', component: PrivacyComponent },
  { path: 'disclaimer', component: DisclaimerComponent },
  { path: 'licenses', component: LicensesComponent },
  { path: 'usage', component: UsagePolicyComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LegalRoutingModule { }
