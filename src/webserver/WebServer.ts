/**
 * This module interfaces with Minecraft servers, servers can call the
 * "isPlayerValid" POST endpoint to see if a certain player (provided with
 * a UUID) is valid
 * @license GNU GPLv3
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import express, { Express, NextFunction, Request, Response } from 'express';
import { WebServerConfig } from "../common/Config";
import { Bot } from "../discord/Bot";
import { noBodyError, noPlayerID, playerIDType } from "./errors";
import { DBController, NoDiscordAccError } from "../db";
import { isNotValid, isValid } from "./responses";


/**
 * This is the WebServer it first authenticates each request that comes in
 * with the checkAuth object method. Then it validates all the bodies of
 * each request and finally gets the results with the isValidPlayer method.
 */
export class WebServer {
  private readonly app: Express;
  private readonly db: DBController;
  private readonly discord: Bot;
  private readonly port: number;
  private readonly token: string;


  constructor(discord: Bot, db: DBController, config: WebServerConfig) {
    this.app = express();
    this.db = db;
    this.discord = discord;
    this.port = config.port;
    this.token = config.token;
  }

  public start() {
    this.app.listen(this.port);

    console.log("WebServer: Listening on port " + this.port);

    // Authorize every request
    this.app.use('/', this.checkAuth.bind(this));

    // Parse incoming bodies
    this.app.post('/isValidPlayer', express.json());

    // Validate incoming bodies
    this.app.post('/isValidPlayer', WebServer.validateBody.bind(this));

    // Listen to the /isValidPlayer POST endpoint
    this.app.post('/isValidPlayer', this.isValidPlayer.bind(this));
  }

  /**
   * This makes sure that the client communicating with this webserver is
   * authorized to do so.
   * @param req
   * @param res
   * @param next
   */
  private checkAuth(req: Request, res: Response, next: NextFunction) {
    const auth = req.header('Authorization');

    if (!auth) {
      res.status(203);
      res.end();
      return;
    }

    // auth = "Bearer <token || undefined>"
    const authSplit = auth.split(' ');
    if (authSplit.length == 1) {
      res.status(203);
      res.end();
      return;
    }

    const token = authSplit[1];

    if (token == this.token) {
      next();
    } else {
      res.status(401);
      res.end();
      return;
    }
  }

  /**
   * This makes sure that the authorized client is providing a valid body
   * @param req
   * @param res
   * @param next
   */
  private static validateBody(req: Request, res: Response, next: NextFunction) {
    if (req.body == undefined) {
      res.status(400);
      res.send(noBodyError);
      res.end();
    }

    const playerUUID = req.body['player_id'];

    res.setHeader('Content-Type', 'application/json');

    if (playerUUID == undefined) {
      res.status(400);
      res.send(noPlayerID);
      res.end();
      return;
    } else if (typeof playerUUID != 'string') {
      res.status(400);
      res.send(playerIDType);
      res.end();
      return;
    }

    // @ts-ignore
    req['player_id'] = playerUUID;
    next();
  }

  /**
   * This tells the Minecraft server is a provided player is authenticated
   * on the Discord server.
   * @param req
   * @param res
   */
  private async isValidPlayer(req: Request, res: Response) {
    // @ts-ignore
    const playerUUID = req['player_id'];

    try {
      const discordID = this.db.getDiscordID(playerUUID);
      const isTierThree = await this.discord.isTierThree(discordID);

      res.status(200);
      isTierThree ? res.send(isValid) : res.send(isNotValid);
      res.end();

    } catch (err) {
      if (err instanceof NoDiscordAccError) {
        res.status(200);
        res.send(isNotValid);
        res.end()
      } else {
        res.status(500);
        res.send(isNotValid);
        res.end();
      }
    }
  }
}