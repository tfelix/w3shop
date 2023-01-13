import { NgModule, Optional, SkipSelf } from '@angular/core';
import { ToastNoAnimationModule } from 'ngx-toastr';

@NgModule({
  declarations: [],
  imports: [
    ToastNoAnimationModule.forRoot({
      timeOut: 10000,
      preventDuplicates: true,
      resetTimeoutOnDuplicate: true
    }),
  ]
})
export class CoreModule {

  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule has already been loaded. Import Core modules in the AppModule only.');
    }
  }
}
