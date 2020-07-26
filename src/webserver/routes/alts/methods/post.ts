/**
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import { NextFunction, Request, Response } from "express";
import { noBodyError } from "../../../errors";
import {
  altAlreadyAdded,
  invalidOwner,
  noOwner,
  noPlayerName,
  ownerType,
  playerNameType,
} from "../errors";
import { WebServer } from "../../../WebServer";
import * as mc from "../../../../minecraft";


/**
 * POST /newAlt endpoint handler
 */
export async function postReq(req: Request, res: Response) {
  // @ts-ignore
  const reqID = req['id'];
  // @ts-ignore
  const playerName: string = req['player_name'];
  // @ts-ignore
  const owner: string = req['owner'];
  // @ts-ignore
  const webServer: WebServer = req['webserver'];

  try {
    const playerUUID: string = await mc.getUUID(playerName);
    const isAdded = await webServer.db.alts.addAnAlt(
      owner,
      playerUUID,
      playerName
    );
    console.log(
      `Response for "${reqID}"\n`,
      isAdded ? "Added new alt" : "Something went wrong."
    );
    res.status(200);
    res.end();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("Incorrect statusCode")) {
        res.status(401);
        res.send(invalidOwner);
        console.log(`Response for "${reqID}"\n`, invalidOwner);
        res.end();
      } else {
        res.status(401);
        res.send(altAlreadyAdded);
        console.log(`Response for "${reqID}"\n`, altAlreadyAdded);
        res.end();
      }
    } else {
      res.status(401);
      res.send(altAlreadyAdded);
      console.log(`Response for "${reqID}"\n`, altAlreadyAdded);
      res.end();
    }
  }
}


/**
 * This checks the given body of an HTTP request
 */
export function checkPostReq(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore
  const reqID = req['id'];
  const body = req.body;

  res.setHeader('Content-Type', 'application/json');

  // Check if they provided a body
  if (!body) {
    res.status(401);
    res.send(noBodyError);
    console.log(`Response for "${reqID}"\n`, noBodyError);
    res.end();
    return;
  }

  const playerName = req.body['player_name'];

  // Check if they provided a valid player name
  if (!playerName) {
    res.status(401);
    res.send(noPlayerName);
    console.log(`Response for "${reqID}"\n`, noPlayerName);
    res.end();
    return;
  } else if (typeof playerName != 'string') {
    res.status(401);
    res.send(playerNameType);
    console.log(`Response for "${reqID}"\n`, playerNameType);
    res.end();
    return;
  }

  const owner = req.body['owner'];

  // Check if they provided a valid owner attribute
  if (!owner) {
    res.status(401);
    res.send(noOwner);
    console.log(`Response for "${reqID}"\n`, noOwner);
    res.end()
    return;
  } else if (typeof owner != 'string') {
    res.status(401);
    res.send(ownerType);
    console.log(`Response for "${reqID}"\n`, ownerType);
    res.end();
    return;
  }

  // @ts-ignore
  req['player_name'] = playerName;
  // @ts-ignore
  req['owner'] = owner;

  next();
}
