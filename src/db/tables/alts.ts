import sql from 'better-sqlite3';


export type AltAcc = {
  owner: string;
  alt_id: string;
  alt_name: string;
}

/**
 * This is the Alt Account Management database table. Here is where to
 * access the table.
 */
export class AltsTable {
  private readonly tableName = "alts"

  constructor(private readonly db: sql.Database) {
    this.init();
  }

  /**
   * This adds another alt account to the database
   * @returns {boolean} If it successfully was added
   */
  public async addAnAlt(owner: string, playerID: string, playerName: string): Promise<boolean> {
    const info = this.db.prepare(
      `INSERT INTO ${this.tableName} (owner, alt_id, alt_name) VALUES (?, ?,?)`
    ).run(owner, playerID, playerName);

    return info.changes > 0;
  }

  /**
   * This removes an alt account from the database
   * @param {string} playerName Minecraft player to remove
   * @returns {boolean} If it successfully was removed
   */
  public async removeAnAlt(playerName: string): Promise<boolean> {
    const info = this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE alt_name=?`
    ).run(playerName);

    return info.changes > 0;
  }

  /**
   * Checks if a provided player ID is an authorized alt account
   * @param {string} playerID Minecraft player UUID
   * @returns {boolean}
   */
  public async isAnAlt(playerID: string): Promise<boolean> {
    const row = this.db.prepare(
      `SELECT alt_name FROM ${this.tableName} WHERE alt_id=?`
    ).get(playerID);

    return row != undefined;
  }

  public async getAllAlts(): Promise<AltAcc[]> {
    const rows = this.db.prepare(
      `SELECT * FROM ${this.tableName}`
    ).all();
    const result: AltAcc[] = [];

    for (const row of rows) {
      result.push({
        alt_name: row.alt_name,
        alt_id: row.alt_id,
        owner: row.owner
      });
    }

    return result;
  }

  public async getAlts(owner: string): Promise<AltAcc[]> {
    const rows = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE owner=?`
    ).all(owner);
    const result: AltAcc[] = [];

    for (const row of rows) {
      result.push({
        alt_name: row.alt_name,
        alt_id: row.alt_id,
        owner: row.owner
      });
    }

    return result;
  }

  private init() {
    this.db.prepare(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (` +
      'alt_id text UNIQUE NOT NULL,' +
      'alt_name text UNIQUE NOT NULL,' +
      'owner text NOT NULL' +
      ')'
    ).run();
  }
}
