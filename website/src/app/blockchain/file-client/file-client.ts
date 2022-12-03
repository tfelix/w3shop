import { Observable } from 'rxjs';
import { URI } from 'src/app/shared';

/**
 * Progress code here is inspired by https://nils-mehlhorn.de/posts/angular-file-download-progress
 */
export interface Download {
  state: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  progress: number
  content: Blob | null
}

export interface FileClient {
  get<T>(uri: URI): Observable<T>;

  /**
   * Downloads the content as Blob and should report progress
   * as far as the underlying tech allows this.
   *
   * @param uri
   */
  download(uri: string): Observable<Download>;
}
