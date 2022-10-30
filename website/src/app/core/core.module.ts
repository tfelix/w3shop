import { NgModule, Optional, SkipSelf } from '@angular/core';

import { SharedModule } from 'src/app/shared/shared.module';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [],
  imports: [
    SharedModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
  ]
})
export class CoreModule {

  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(`CoreModule has already been loaded. Import Core modules in the AppModule only.`);
    }
  }
}
