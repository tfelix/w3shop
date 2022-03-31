import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { SetupModule } from './setup/setup.module';
import { CoreModule } from './core/core.module';
import { PageModule } from './page/page.module';

import { AppComponent } from './app.component';

import { NgWizardModule, NgWizardConfig, THEME } from 'ng-wizard';
import { ShopServiceFactory } from './core';

const ngWizardConfig: NgWizardConfig = {
  theme: THEME.dots
};

function shopServiceInitializerFactory(
  shopServiceFactory: ShopServiceFactory,
) {
  return () => {
    console.log(window.location.pathname);
    // c2M6NDoweEM5ODBmMUIwOTQ3YkIyMTllMjA1NjFDMDA2MjJEODU1NUM4QWIyMDQ=
    shopServiceFactory.init('c2M6NDoweEM5ODBmMUIwOTQ3YkIyMTllMjA1NjFDMDA2MjJEODU1NUM4QWIyMDQ=');
  };
}

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    CoreModule,
    PageModule,
    SetupModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    NgWizardModule.forRoot(ngWizardConfig)
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: shopServiceInitializerFactory,
      deps: [ShopServiceFactory],
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
