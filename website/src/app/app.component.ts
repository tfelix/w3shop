import { Component, ElementRef, NgZone, ViewChild, Renderer2, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'w3s-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  // Instead of holding a boolean value for whether the spinner
  // should show or not, we store a reference to the spinner element,
  // see template snippet below this script
  @ViewChild('spinnerElement')
  spinnerElement!: ElementRef;

  constructor(
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly renderer: Renderer2
  ) {
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(
        event =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError,
      )
    ).subscribe(event => {
      // If it's the start of navigation, `add()` a loading indicator
      if (event instanceof NavigationStart) {
        this.showSpinner();
        return;
      }

      // Else navigation has ended, so `remove()` a loading indicator
      this.hideSpinner();
    });
  }

  private showSpinner(): void {
    // We run this function outside of Angular's zone to
    // bypass change detection
    this.ngZone.runOutsideAngular(() => {
      console.debug('Show loading animation');
      this.renderer.setStyle(
        this.spinnerElement.nativeElement,
        'display',
        'block'
      );
    });
  }

  private hideSpinner(): void {
    // We run this function outside of Angular's zone to
    // bypass change detection,
    this.ngZone.runOutsideAngular(() => {
      console.debug('Hide loading animation');
      this.renderer.setStyle(
        this.spinnerElement.nativeElement,
        'display',
        'none');
    });
  }
}
