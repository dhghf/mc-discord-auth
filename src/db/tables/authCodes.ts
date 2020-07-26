/**
 * @license GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import { Database } from "better-sqlite3";
import { v1 as uuid } from 'uuid';


export type AuthCodeProfile = {
  discordID: string;
  authCode: string;
  playerUUID: string;
}

export class AuthCodes {
  private readonly tableName = "auth_codes";

  constructor(private readonly db: Database) { this.init(); }

  /**
   * Gets the auth code associated with a given identifier
   */
  public async getAuthCode(playerUUID: string): Promise<string | null> {
    const row = this.db.prepare(
      `SELECT auth_code FROM ${this.tableName} WHERE minecraft_id=?`
    ).get(playerUUID);

    if (row)
      return row.auth_code;
    else
      return null;
  }

  public getAllAuthCodes(): AuthCodeProfile[] {
    const rows = this.db.prepare(
      `SELECT * FROM ${this.tableName}`
    ).all();
    const result: AuthCodeProfile[] = [];

    for (const row of rows) {
      result.push({
        discordID: row.discord_id,
        authCode: row.auth_code,
        playerUUID: row.minecraft_id
      });
    }


    return result;
  }

  public removeAuth(discordID: string): boolean {
    const info = this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE discord_id=?`
    ).run(discordID);

    return (info.changes > 0);
  }

  /**
   * Gets the auth code associated with a given
   */
  public getUUID(authCode: string): string | null {
    const row = this.db.prepare(
      `SELECT minecraft_id FROM ${this.tableName} WHERE auth_code=?`
    ).get(authCode);

    if (row)
      return row.minecraft_id;
    else
      return null;
  }

  /**
   * Checks to see if a given auth code is correct, it also deletes it from
   * the table
   */
  public async authorizedCode(authCode: string): Promise<string | null> {
    const playerUUID = this.getUUID(authCode);

    this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE auth_code=?`
    ).run(authCode);

    return playerUUID;
  }

  public async hasAuthCode(discordID: string): Promise<boolean> {
    return (await this.getAuthCode(discordID)) != null;
  }

  /**
   * Generates a new auth code for a given Discord user
   * This will return an auth code if the player already has one.
   */
  public async newAuthCode(playerUUID: string): Promise<string> {
    const authCode = uuid().split('-')[0];
    const oldAuthCode = await this.getAuthCode(playerUUID);

    if (oldAuthCode != undefined) {
      return oldAuthCode;
    }

    this.db.prepare(
      `INSERT INTO ${this.tableName} (auth_code,minecraft_id) VALUES (?,?)`
    ).run(authCode, playerUUID);

    return authCode;
  }

  private init() {
    this.db.prepare(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (` +
      "minecraft_id text NOT NULL," +
      "auth_code text UNIQUE NOT NULL" +
      ")"
    ).run();
  }
}
