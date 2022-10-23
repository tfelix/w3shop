import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { PageModule } from './page/page.module';

import { AppComponent } from './app.component';

import { ShopIdentifierService } from './core';

function shopServiceInitializerFactory(
  shopServiceFactory: ShopIdentifierService,
) {
  const pathRegex = /\/([\w=\-_]{10,})/;

  return () => {
    const result = pathRegex.exec(window.location.pathname);
    if (result) {
      const shopIdentifier = result[1];
      shopServiceFactory.setIdentifier(shopIdentifier);
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
  ],
  // This should probably be placed in the shop module
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: shopServiceInitializerFactory,
      deps: [ShopIdentifierService],
      // TODO check if it also works without this flag
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
