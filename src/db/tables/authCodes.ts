/**
 * @license GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import { Database } from "better-sqlite3";
import { v1 as uuid } from "uuid";

function generateAuthCodeString(): string {
  return uuid().split('-')[0];
}

export type AuthCodeProfile = {
  auth_code: string;
  mc_id: string;
}

export class AuthCodes {
  private readonly tablename = "pending_authorisations";

  constructor(private readonly db: Database) { this.init(); }

  /**
   * Gets the auth code associated wih a given Minecraft player id.
   */
  public async getMinecraftPlayer(mc_id: string): Promise<AuthCodeProfile | null> {
    const row: AuthCodeProfile | null = this.db.prepare<[string]>(
      `SELECT * FROM ${this.tablename} WHERE mc_id=?`,
    ).get(mc_id);

    return row;
  }

  public async getAuthCode(auth_code: string): Promise<AuthCodeProfile | null> {
    const row: AuthCodeProfile | null = this.db.prepare<[string]>(
      `SELECT * FROM ${this.tablename} WHERE auth_code=?`,
    ).get(auth_code);

    return row;
  }

  /**
   * Creates an auth code for a user.
   */
  public async assertAuthCode(mc_id: string): Promise<AuthCodeProfile> {
    const auth_code = generateAuthCodeString();
    const row: AuthCodeProfile = this.db.prepare<[string, string, string, string]>(
      `INSERT INTO ${this.tablename} (auth_code, mc_id) VALUES (?, ?)` +
      " ON CONFLICT(mc_id) DO UPDATE SET auth_code=? WHERE mc_id=? RETURNING *",
    ).get(auth_code, mc_id, auth_code, mc_id);

    return row;
  }

  public init() {
    this.db.prepare<[]>(
      `CREATE TABLE IF NOT EXISTS ${this.tablename} (` + [
        "mc_id text UNIQUE NOT NULL",
        "auth_code text UNIQUE NOT NULL",
      ].join(',') + ")",
    ).run();
  }
}
