import { NgModule, Optional, SkipSelf } from '@angular/core';

import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [],
  imports: [
    ToastrModule.forRoot(),
  ]
})
export class CoreModule {

  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule has already been loaded. Import Core modules in the AppModule only.');
    }
  }
}
