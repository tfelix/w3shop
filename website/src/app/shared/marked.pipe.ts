import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

@Pipe({
  name: 'marked'
})
export class MarkedPipe implements PipeTransform {

  transform(value: any, _?: any): any {
    if (value && value.length > 0) {
      return marked(value);
    }
    return value;
  }

}