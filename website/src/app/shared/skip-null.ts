import { Observable } from "rxjs";
import { filter } from "rxjs/operators";

export const skipNull = () => <T>(source: Observable <T>): Observable<T> => source.pipe(filter(value => value !== null));