import { Observable } from "rxjs";
import { filter } from "rxjs/operators";

export const filterNotNull = () => <T>(source: Observable <T>): Observable<T> => source.pipe(filter(value => value !== null));