import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export const filterNotNull = () => <T>(source: Observable<T | null | undefined>): Observable<T> => source.pipe(filter(value => !!value)) as Observable<T>;