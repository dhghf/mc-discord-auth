/**
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import sql from 'better-sqlite3';
import { Snowflake } from "discord.js";
import {
  AlreadyLinkedError,
  NoDiscordAccError,
  NoMcAccError
} from "../errors";


/**
 * This manages the account_links table. It associates Minecraft and
 * Discord accounts.
 */
export class LinksTable {
  private readonly tableName = 'account_links';

  constructor(private readonly db: sql.Database) { this.init(); }


  /**
   * This gets the Minecraft UUID that is associated with the given Discord ID.
   * @param {string} discordID Discord user ID.
   * @returns {string}
   * @throws {NoMcAccError} if the provided ID isn't associated with an MC
   * account.
   */
  public async getMcID(discordID: Snowflake): Promise<string> {
    const row = this.db.prepare(
      `SELECT minecraft FROM ${this.tableName} WHERE discord=?`,
    ).get(discordID);

    const uuid: string | undefined = row?.minecraft;

    if (uuid)
      return uuid;
    else
      throw new NoMcAccError();
  }

  /**
   * This fetches a Discord user ID associated with the provided Minecraft
   * account.
   * @param {string} uuid
   * @returns {string}
   * @throws {NoDiscordAccError} if the provided Minecraft player ID isn't
   * associated with a Discord account.
   */
  public async getDiscordID(uuid: string): Promise<string | null> {
    const row = this.db.prepare(
      `SELECT discord FROM ${this.tableName} WHERE minecraft=?`
    ).get(uuid);

    const discordID: string | undefined = row?.discord;

    if (discordID)
      return discordID;
    else
      return null;
  }

  public async link(discordID: string, mcID: string): Promise<void> {
    const alreadyLinked = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE discord=? OR minecraft=?`
    ).get(discordID, mcID);

    // This means a provided identifier is already linked with another account.
    if (alreadyLinked != undefined) {
      if (alreadyLinked.discord && alreadyLinked.minecraft) {
        throw new AlreadyLinkedError('both');
      } else if (alreadyLinked.discord) {
        throw new AlreadyLinkedError('discord');
      } else {
        throw new AlreadyLinkedError('minecraft');
      }
    }

    // If it passed the above sanity check then continue to link the two
    this.db.prepare(
      `INSERT INTO ${this.tableName} (discord, minecraft) VALUES (?,?)`
    ).run(discordID, mcID);
  }

  public async checkIfLinked(discordID?: string, minecraftID?: string): Promise<void> {
    const alreadyLinked = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE discord=? OR minecraft=?`
    ).get(discordID || '', minecraftID || '');

    // This means a provided identifier is already linked with another account.
    if (alreadyLinked) {
      if (alreadyLinked.discord == discordID) {
        throw new AlreadyLinkedError('both');
      } else if (alreadyLinked.minecraft) {
        throw new AlreadyLinkedError('minecraft');
      } else {
        throw new AlreadyLinkedError('discord');
      }
    }
  }

  /**
   * Unlinks the provided Discord ID with anything it was linked with
   * @param {string} discordID
   * @returns {boolean} If it was successfully unlinked.
   */
  public async unlinkDiscordAcc(discordID: string): Promise<boolean> {
    const info = this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE discord=?`
    ).run(discordID);

    return (info.changes > 0);
  }

  /**
   * This gets every Discord user ID in the database
   * @returns {string[]} Discord user ID array
   */
  public async getAllDiscordAccs(): Promise<string[]> {
    const rows = this.db.prepare(
      `SELECT discord FROM ${this.tableName}`
    ).all();
    const result = []

    for (const row of rows)
      result.push(row.discord);
    return result;
  }

  /**
   * This unassociated a Minecraft UUID with whatever it's associated with.
   * @param {string} playerUUID Player UUID to remove from the database
   * @returns {boolean} if it was successful or not
   */
  public async unlinkMcAcc(playerUUID: string): Promise<boolean> {
    const info = this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE minecraft=?`
    ).run(playerUUID);

    return (info.changes > 0);
  }

  private init() {
    this.db.prepare(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (` +
      'minecraft text UNIQUE NOT NULL,' +
      'discord text PRIMARY KEY NOT NULL' +
      ')'
    ).run();
  }
}
