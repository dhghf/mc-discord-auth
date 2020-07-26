/**
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import { Bot } from "./Bot";
import { DBController } from "../db";
import { Client, Message, TextChannel } from "discord.js";
import * as mc from "../minecraft";


/**
 * These are all the admin-related commands
 */
export class AdminCommands {
  private readonly bot: Bot;
  private readonly client: Client;
  private readonly db: DBController;

  constructor(bot: Bot, client: Client, db: DBController) {
    this.bot = bot;
    this.client = client;
    this.db = db;
  }

  /**
   * Admin help command
   */
  public async help(msg: Message) {
    if (!msg.member)
      return;
    const bot = this.bot;
    const isAdmin = bot.isAnAdmin(msg.member);

    if (isAdmin) {
      await msg.reply(
        "Admin Commands:\n" +
        ` - ${bot.prefix} unlink <Minecraft player name or @ discord member\n` +
        ` - ${bot.prefix} maintenance Toggles "maintenance mode"\n` +
        ` - ${bot.prefix} lock Turn on maintenance mode\n` +
        ` - ${bot.prefix} unlock Turn off maintenance mode\n` +
        ` - ${bot.prefix} ban <@discord member> Ban bot usage\n` +
        ` - ${bot.prefix} pardon <@discord member>\n` +
        ` - ${bot.prefix} status Display debug info\n` +
        ` - ${bot.prefix} whois <mc name || @discord member> Displays debug info of someone else`
      );
    } else {
      await msg.reply("You're not an admin.");
    }
  }

  /**
   * Unlink ADMIN command
   * @param {Message} msg
   * @param {string[]} args Possible Iterations:
   *  * ["<bot prefix>", "unlink", "<@discord member>"]
   *  * ["<bot prefix>", "unlink", "<minecraft player>"]
   */
  public async unlink(msg: Message, args: string[]) {
    if (!msg.member)
      return;

    // Let's make sure they have perms
    const hasPerms = this.bot.isAnAdmin(msg.member);
    if (!hasPerms) {
      await msg.reply("You don't have permissions to use this command");
      return;
    }

    // Check if they're mentioning someone
    // args = ["<bot prefix>", "unlink", "<@discord member>"]
    if (msg.mentions.members != null) {
      const target = msg.mentions.members.first();

      if (target) {
        await this.db.links.unlinkDiscordAcc(target.id);
        await msg.reply(
          `Unlinked ${target.user.username}'s claimed Minecraft account`);
        return;
      }
    }

    // Check if they're talking about a Minecraft account
    // ["<bot prefix>", "unlink", "<minecraft player>"]
    const playerName = args[2];
    try {
      const playerUUID = await mc.getUUID(playerName);
      await this.db.links.unlinkMcAcc(playerUUID);
      await msg.reply(`Unlinked "${playerName}"`);
    } catch (err) {
      await msg.reply("Please provide a valid Discord user or Minecraft" +
        " player");
    }
  }

  /**
   * This toggles maintenance mode.
   */
  public async maintenance(msg: Message, toggled: boolean | null) {
    if (!msg.member)
      return;

    // Let's make sure they have perms
    const hasPerms = this.bot.isAnAdmin(msg.member);
    if (!hasPerms) {
      await msg.reply("You don't have permissions to use this command");
      return;
    }

    const isOn = this.bot.setMaintenance(toggled);

    if (isOn)
      await msg.reply("Maintenance mode is now on.");
    else
      await msg.reply("Maintenance mode is now off.");
  }

  /**
   * This is the ban command
   */
  public async ban(msg: Message) {
    if (!msg.mentions.members || !msg.member)
      return;

    // Let's make sure they have perms
    const hasPerms = this.bot.isAnAdmin(msg.member);
    if (!hasPerms) {
      await msg.reply("You don't have permissions to use this command");
      return;
    }

    const target = msg.mentions.members.first();

    if (target) {
      try {
        this.db.bans.ban(target.id);
        await msg.reply(`Banned "${target.user.username}"`);
      } catch (err) {
        await msg.reply("This member is already banned.");
      }

    } else {
      await msg.reply("Mention the member you would like to ban from" +
        " using this bot.")
    }
  }

  /**
   * This is the pardon command
   */
  public async pardon(msg: Message) {
    if (!msg.mentions.members || !msg.member)
      return;

    // Let's make sure they have perms
    const hasPerms = this.bot.isAnAdmin(msg.member);
    if (!hasPerms) {
      await msg.reply("You don't have permissions to use this command");
      return;
    }

    const target = msg.mentions.members.first();

    if (target) {
      try {
        await this.db.bans.pardon(target.id);
        await msg.reply(`Pardoned "${target.user.username}"`);
      } catch (err) {
        await msg.reply("This member is not banned.");
      }

    } else {
      await msg.reply("Mention the member you would like to pardon.")
    }
  }

  /**
   * This is the whois command
   * @param msg
   * @param args = [".mc", "whois", "<@ID> or player name"]
   */
  public async whois(msg: Message, args: string[]) {
    if (!msg.mentions.members || !msg.member)
      return;

    const member = msg.mentions.members.first();

    try {
      if (member) {
        await this.bot.whoIs(member.user, msg.channel as TextChannel);
      } else {
        const playerName = args[2];

        if (playerName) {
          const uuid = await mc.getUUID(playerName);
          const discordID = await this.db.links.getDiscordID(uuid);

          if (!discordID || !uuid) {
            await msg.reply("That account isn't linked with anything.");
            return
          }
          const user = await this.client.users.fetch(discordID);
          await msg.reply(
            `${user.username}#${user.discriminator} (<@${discordID}>)`
          );
        } else {
          await msg.reply("Please mention somebody or provide a player name");
        }
      }
    } catch (err) {

    }
  }
}
