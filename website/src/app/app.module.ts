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

import { ShopServiceFactory } from './core';

function shopServiceInitializerFactory(
  shopServiceFactory: ShopServiceFactory,
) {
  return () => {
    if(window.location.pathname.match(/\/[\w=]{20,}/)) {
      console.debug('Shop identifier detected');
      const identifier = window.location.pathname.slice(1);
      shopServiceFactory.init(identifier);
    } else {
      if(window.location.pathname.match(/setup/gi)) {
        shopServiceFactory.init('');
      }
    }
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
