/**
 * These are all the database errors that can occur
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */

export class NoMcAccError extends Error {
  constructor() {
    super("This Discord account isn't linked with a Minecraft account");
  }
}

export class NoDiscordAccError extends Error {
  constructor() {
    super("This Minecraft account isn't linked with a Discord account");
  }
}

export class AlreadyLinkedError extends Error {
  public readonly account: 'both' | 'discord' | 'minecraft';

  constructor(account: 'both' | 'discord' | 'minecraft') {
    super("The provided Minecraft / Discord account is already linked.");
    this.account = account;
  }
}

export class AlreadyAuthCode extends Error {
  constructor() {
    super("There is an auth code already for this Discord" +
      " account running");
  }
}
