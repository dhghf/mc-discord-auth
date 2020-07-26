/**
 * Database controller class
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import sql from 'better-sqlite3';
import mkdirp from 'mkdirp';
import fs from 'fs';
import { DBConfig } from "../common/Config";
import { LinksTable } from "./tables/links";
import { AltsTable } from "./tables/alts";
import { BanTable } from "./tables/banned";
import { AuthCodes } from "./tables/authCodes";


/**
 * Each table is split into it's own public property
 * @property {AltsTable} alts This manages the alts table in the db
 * @property {AuthCodes} auth Authentication code manager
 * @property {BanTable} bans This manages the bans table in the db
 * @property {LinksTable} links This manages the links
 */
export class DBController {
  public static readonly rootDir = `${process.cwd()}/config`;
  public static readonly defPath = `${DBController.rootDir}/accounts.db`;
  public readonly alts: AltsTable;
  public readonly auth: AuthCodes;
  public readonly links: LinksTable;
  public readonly bans: BanTable;
  private readonly db: sql.Database;

  constructor(config: DBConfig) {
    if (!fs.existsSync(DBController.rootDir))
      mkdirp.sync(DBController.rootDir);

    this.db = new sql(config.location);
    this.links = new LinksTable(this.db);
    this.auth = new AuthCodes(this.db);
    this.alts = new AltsTable(this.db);
    this.bans = new BanTable(this.db);
  }

}
