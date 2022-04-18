import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { PageModule } from './page/page.module';

import { AppComponent } from './app.component';

import { ShopServiceFactory } from './core';

function shopServiceInitializerFactory(
  shopServiceFactory: ShopServiceFactory,
) {
  const pathRegex = /\/([\w=]{20,})/;

  return () => {
    const result = pathRegex.exec(window.location.pathname);
    if (result) {
      const shopIdentifier = result[1];
      console.debug('Shop identifier found: ' + shopIdentifier);
      shopServiceFactory.init(shopIdentifier);
    } else {
      console.debug('No shop identifier found');
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
      deps: [ShopServiceFactory],
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
