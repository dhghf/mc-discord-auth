/**
 * This is the Bot module it interfaces with Discord to communicate with
 * users. Everything related to Discord can be found in this file.
 * @license GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import type { GuildMember, Message } from 'discord.js';
import { Client, MessageEmbed, TextChannel, User } from 'discord.js';
import { DBController } from '../db';
import { DiscordConfig } from "../common/Config";
import { AdminCommands } from "./AdminCommands";
import { Commands } from "./Commands";
import {
  isNotValid,
  isValid
} from "../webserver/routes/isValidPlayer/responses";
import * as mc from "../minecraft";

const pkg = require('../../package.json');


/**
 * This is the Discord bot that communicates with Discord users. To start
 * it call the start() method of a Bot object.
 * @property {Client} client Discord API Client
 * @property {boolean} maintenance Whether or not maintenance is on
 * @property {DBController} db Database interface
 * @property {string[]} whitelist Whitelisted roles. Members with one of these
 *   roles can use bot commands and access the Minecraft server.
 * @property {string[]} adminRoles Members with one of these roles can use bot
 *   admin commands.
 * @property {string} token Discord bot access token
 * @property {Commands} commands Regular commands
 * @property {AdminCommands} adminCommands Admin commands
 */
export class Bot {
  public readonly prefix: string;

  private maintenance: boolean;
  private readonly client: Client;
  private readonly guild: string;
  private readonly db: DBController;
  private readonly whitelist: string[];
  private readonly adminRoles: string[];
  private readonly token: string;
  private readonly commands: Commands;
  private readonly adminCommands: AdminCommands;
  private readonly version = pkg.version;


  constructor(db: DBController, config: DiscordConfig) {
    this.client = new Client();
    this.guild = config.guild_id;
    this.whitelist = config.roles;
    this.db = db;
    this.maintenance = true;
    this.prefix = config.prefix;
    this.adminRoles = config.admin_roles;
    this.token = config.token;
    this.commands = new Commands(this, db);
    this.adminCommands = new AdminCommands(this, this.client, db);
  }

  /**
   * If they have a given role in a list
   * @returns {boolean}
   */
  private static hasRole(member: GuildMember, roles: string[]): boolean {
    for (const roleID of member.roles.cache.keys()) {
      let isWhitelisted = roles.includes(roleID);

      if (isWhitelisted) {
        return true;
      }
    }
    return false;
  }

  /**
   * This method starts the bot
   * @returns {Promise<string>} The string is the token provided
   */
  public start(): Promise<string> {

    // This will allow us to listen to incoming Discord messages that the
    // bot can see, if the bot isn't in the channel then no messages are
    // emitted here.
    this.client.on('message', this.onMessage.bind(this));

    this.client.on('ready', async () => {
      const serving = await this.client.guilds.cache.get(this.guild);

      if (this.client.user)
        console.log("Bot: Ready as " + this.client.user.username)
      if (serving)
        console.log(`Bot: Serving Guild "${serving.name}"`);
    })

    // Finally login into the Discord API gateway to start receiving and
    // sending objects through the websocket.
    return this.client.login(this.token);
  }

  /**
   * This is the status command
   */
  public async status(msg: Message) {
    if (!msg.guild)
      return;

    if (!(await this.isAnAdmin(msg.member as GuildMember)))
      return;

    const statusEmbed = new MessageEmbed();
    const linked = (await this.db.links.getAllDiscordAccs()).length;
    const alts = (await this.db.alts.getAllAlts()).length;
    const authCodes = this.db.auth.getAllAuthCodes().length;
    const banned = (await this.db.bans.getAll()).length;
    let adminRoles = '**Admin Roles**\n';
    let whitelist = '**Whitelist Roles**\n';

    statusEmbed.setTitle(`Mc Discord Auth ${this.version}`);
    statusEmbed.setURL("https://github.com/dhghf/mc-discord-auth");
    statusEmbed.setTimestamp(Date.now());
    statusEmbed.setColor(
      this.isMaintenanceMode() ? 0xFFD500 : 0x76EE00
    );

    try {
      for (const adminRole of this.adminRoles) {
        const role = await msg.guild.roles.fetch(adminRole);
        if (role)
          adminRoles += ` - ${role.name}\n`
      }
      for (const whitelisted of this.whitelist) {
        const role = await msg.guild.roles.fetch(whitelisted);
        if (role)
          whitelist += ` - ${role.name}\n`
      }
    } finally {
      const desc = (this.maintenance ? "**Maintenance Mode is On**\n\n" : "") +
        `**Linked Accounts** ${linked}\n` +
        `**Alt Accounts** ${alts}\n` +
        `**Pending Auth Codes** ${authCodes}\n` +
        `**Banned Accounts** ${banned}\n` +
        adminRoles + '\n' + whitelist

      statusEmbed.setDescription(desc);

      console.log(
        "Status Request\n" + desc
      );

      await msg.channel.send("**Bot Status Report**", { embed: statusEmbed });
    }
  }

  /**
   * This returns the "whois" of someone
   */
  public async whoIs(user: User, channel: TextChannel) {
    const uuid = await this.db.links.getMcID(user.id);
    const name = await mc.getName(uuid);

    await channel.send(
      "```json\n" +
      `{\n` +
      `  "uuid": "${uuid}",\n` +
      `  "name": "${name}"\n` +
      `}\n` +
      "```"
    );
  }

  /**
   * This is the maintenance command, it toggles "maintenance mode".
   * Bot admin can only run this command.
   */
  public setMaintenance(toggled: boolean | null): boolean {
    if (toggled == null)
      return (this.maintenance = !this.maintenance);
    else
      return (this.maintenance = toggled);
  }

  /**
   * Checks if "maintenance mode" is enabled
   */
  public isMaintenanceMode(): boolean {
    return this.maintenance;
  }

  /**
   * Checks if the given Discord server member is an admin
   * @param {GuildMember | string} resolvable Discord user ID or GuildMember
   *  object
   */
  public isAnAdmin(resolvable: GuildMember | string): boolean {
    let member: GuildMember | null;

    if (typeof resolvable == 'string') {
      member = this.resolveMember(resolvable);
    } else {
      member = resolvable;
    }

    if (member == null)
      return false;

    return Bot.hasRole(member, this.adminRoles);
  }

  /**
   * This checks if the Discord server member is on the whitelist
   * @param {GuildMember | string} resolvable Discord user ID or GuildMember
   *  object
   * @returns {Promise<boolean>}
   * @throws {Error} if it can't get the guild that the bot is serving.
   */
  public isValidMember(resolvable: GuildMember | string): isNotValid | isValid {
    let member: GuildMember | null;

    if (typeof resolvable == 'string') {
      member = this.resolveMember(resolvable);
    } else {
      member = resolvable;
    }

    if (member == null)
      return {
        reason: 'no_link', valid: false
      };

    const isBanned = this.db.bans.isBanned(member.id);
    // No Banned Users
    if (isBanned)
      return {
        reason: 'banned', valid: false
      };

    if (this.maintenance) {
      const isAdmin = Bot.hasRole(member, this.adminRoles);

      if (isAdmin) {
        return { valid: true };
      } else {
        return {
          valid: false,
          reason: 'maintenance'
        };
      }
    } else {
      const isAuthed = Bot.hasRole(member, this.whitelist);
      if (isAuthed) {
        return { valid: true }
      } else {
        const isAdmin = Bot.hasRole(member, this.adminRoles);

        if (isAdmin)
          return { valid: true };
        else
          return { valid: false, reason: 'no_role' };
      }
    }
  }

  /**
   * This is our Message object listener when the bot retrieves a new
   * message in whatever channel it's in it is emitted here.
   * @param {Message} message The message object (see link for details)
   * @link https://discord.js.org/#/docs/main/stable/class/Message
   */
  private async onMessage(message: Message) {
    // First let's filter all the messages we don't want
    // We don't want bots & we don't want blank messages (ie images with no
    // caption)
    if (message.author.bot || message.content.length == 0 || !message.member)
      return;

    // Next let's see if they're communicating with our bot
    if (message.content.startsWith(this.prefix)) {
      // Let's make sure they're not banned from using this bot
      const isBanned = this.db.bans.isBanned(message.author.id);
      if (isBanned) {
        await message.reply("You're banned from using this bot.");
        return;
      }

      // Make sure they have the valid roles to talk to the bot / join the
      // MC server.
      const isValid = this.isValidMember(message.member)
      if (!isValid) {
        if (this.maintenance) {
          await message.reply("Bot is in maintenance mode.");
        } else {
          await message.reply(
            "You don't have the required roles to run this bot."
          );
        }
        return
      }


      // args = ["<bot prefix>", "<command name>" || undefined]
      const args = message.content.split(' ');

      switch (args[1]) {
        // COMMANDS
        case 'lock':
          await this.adminCommands.maintenance(message, true);
          break;
        case 'unlock':
          await this.adminCommands.maintenance(message, false);
          break;
        case 'auth':
          await this.commands.auth(message, args);
          break;
        case 'unlink':
          // admin version
          if (args.length > 2)
            await this.adminCommands.unlink(message, args);
          // regular version
          else
            await this.commands.unlink(message, args);
          break;
        case 'whoami':
          await this.commands.whoami(message);
          break;
        // ADMIN COMMANDS
        case 'admin':
          await this.adminCommands.help(message);
          break;
        case 'ban':
          await this.adminCommands.ban(message);
          break;
        case 'pardon':
          await this.adminCommands.pardon(message);
          break;
        case 'maintenance':
          await this.adminCommands.maintenance(message, null);
          break;
        case 'status':
          await this.status(message);
          break;
        case 'whois':
          await this.adminCommands.whois(message, args);
          break;
        case 'commands':
          await this.commands.commands(message);
          break;
        case 'help':
        default:
          await this.commands.help(message);
      }
    }
  }

  /**
   * This gets the GuildMember object of the provided ID.
   * @param {string} id The user's ID
   * @returns {GuildMember | null}
   * @throws {Error} if it failed getting the Guild that the bot should be
   * serving.
   */
  private resolveMember(id: string): GuildMember | null {
    const guild = this.client.guilds.cache.get(this.guild);

    if (guild)
      return guild.member(id);
    else
      throw new Error("Internal error occurred while fetching guild.");
  }
}
