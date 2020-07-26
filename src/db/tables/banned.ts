/**
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import { Database } from "better-sqlite3";


/**
 * This manages the "bans" table in the database. This table basically
 * prevents users from managing the bot when their ID shows up here.
 */
export class BanTable {
  private readonly tableName = "bans";

  constructor(private readonly db: Database) {this.init()}

  /**
   * This bans a member
   * @returns {boolean} If it was added successfully
   */
  public ban(id: string): boolean {
    const info = this.db.prepare(
      `INSERT INTO ${this.tableName} VALUES (?)`
    ).run(id);

    return (info.changes > 0);
  }

  /**
   * Check if they're banned from using the bot
   */
  public isBanned(id: string): boolean {
    const row = this.db.prepare(
      `SELECT discord_id FROM ${this.tableName} WHERE discord_id=?`
    ).get(id);

    return (row != undefined);
  }

  /**
   * Gets all the banned member ID's
   * @returns {string[]} An array of Discord ID's
   */
  public async getAll(): Promise<string[]> {
    const rows = this.db.prepare(
      `SELECT discord_id FROM ${this.tableName}`
    ).all();
    const result = [];

    for (const row of rows) {
      result.push(row.discord_id);
    }

    return result;
  }

  /**
   * This lifts a ban
   * @returns {boolean} If it was lifted successfully
   */
  public async pardon(id: string): Promise<boolean> {
    const info = this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE discord_id=?`
    ).run(id);

    return (info.changes > 0);
  }

  private init() {
    this.db.prepare(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (` +
      'discord_id text PRIMARY KEY NOT NULL' +
      ')'
    ).run();
  }
}
