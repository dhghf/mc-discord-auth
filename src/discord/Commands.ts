/**
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import { Bot } from "./Bot";
import { Message, TextChannel } from "discord.js";
import { DBController, NoMcAccError } from "../db";

/**
 * These are all the regular commands
 */
export class Commands {
  private readonly bot: Bot;
  private readonly db: DBController;

  constructor(bot: Bot, db: DBController) {
    this.bot = bot;
    this.db = db;
  }


  /**
   * This is the auth command
   * @param msg
   * @param {string[]} args Possible iterations:
   * * ["<bot prefix>", "auth"]
   * * ["<bot prefix>", "auth", "<auth code>"]
   */
  public async auth(msg: Message, args: string[]) {
    if (!msg.member)
      return;

    if (args.length > 1) {
      const authCode = args[2];
      const playerUUID = await this.db.auth.authorizedCode(authCode);

      if (playerUUID) {
        await this.db.links.link(msg.author.id, playerUUID);
        await msg.reply("Linked.");
      } else {
        await msg.reply("Invalid authentication code");
      }


    } else {
      await msg.reply("Please provide an authentication code");
    }
  }


  /**
   * This is the help command it prints all the available commands
   */
  public async help(msg: Message) {
    await msg.reply(` **How To Sign-up**:
 - Join the server, it will give you an authentication code
 - type it here: .mc auth <code>.`)
  }

  public async commands(msg: Message) {
    const bot = this.bot;
    await msg.reply(
      "Available Commands:\n" +
      ` - ${bot.prefix} auth <auth codes>\n` +
      ` - ${bot.prefix} unlink Unlink your Minecraft account.\n` +
      ` - ${bot.prefix} help Display this help dialogue\n` +
      ` - ${bot.prefix} whoami For debugging purposes\n` +
      ` - ${bot.prefix} admin Display admin commands`
    );
  }

  /**
   * This is the unlinkDiscordAcc command
   * @param {Message} msg Message to respond to
   * @param {string[]} args Possible iterations:
   *  * ["<bot prefix>", "unlink"]
   */
  public async unlink(msg: Message, args: string[]) {
    // Make sure they're talking in a guild
    if (!msg.member)
      return;

    // args = ["<bot prefix>", "unlink"]
    if (args.length == 2) {
      await this.db.links.unlinkDiscordAcc(msg.author.id);
      this.db.auth.removeAuth(msg.author.id);
      await msg.reply("Unlinked.");
    } else {
      await msg.reply("Please provide a Minecraft player name");
    }

  }

  /**
   * This is the whoami command
   * @param {Message} msg Message to respond to
   */
  public async whoami(msg: Message) {
    try {
      await this.bot.whoIs(msg.author, msg.channel as TextChannel);
    } catch (err) {
      if (NoMcAccError)
        await msg.reply("You're not linked with any account.");
      else
        await msg.reply("Something went wrong.");
    }
  }
}
