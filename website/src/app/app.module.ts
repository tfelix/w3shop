import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { PageModule } from './page/page.module';

import { AppComponent } from './app.component';

import { ShopFacadeFactory } from './core';

function shopServiceInitializerFactory(
  shopServiceFactory: ShopFacadeFactory,
) {
  return () => {
    if(window.location.pathname.match(/\/[\w=]{20,}/)) {
      console.debug('Shop identifier detected');
      const identifier = window.location.pathname.slice(1);
      shopServiceFactory.init(identifier);
    } else {
      shopServiceFactory.init('');
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
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: shopServiceInitializerFactory,
      deps: [ShopFacadeFactory],
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
