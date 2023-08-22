import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'imagePathUrl',
})
export class ImagePathUrlPipe implements PipeTransform {
  transform(value: any, ...args: any[]) {
    if (typeof value == 'string') {
      return 'https://carpentryutil-public.s3.amazonaws.com/'.concat(value);
    }
  }
}
