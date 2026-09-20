/**
 * Repository Base Interface
 */

import { DB } from '../database/db-helper';

export abstract class BaseRepository {
  protected db: DB;

  constructor() {
    this.db = new DB();
  }
}
