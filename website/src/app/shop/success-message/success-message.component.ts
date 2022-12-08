import { Component } from '@angular/core';

@Component({
  selector: 'w3s-success-message',
  templateUrl: './success-message.component.html',
  styleUrls: ['./success-message.component.scss']
})
export class SuccessMessageComponent {

  constructor() { }

  /**
   * In order for this to work we need to add this class to the div
   * $("button").click(function () {
  $(".check-icon").hide();
  setTimeout(function () {
    $(".check-icon").show();
  }, 10);
});
   */
}
