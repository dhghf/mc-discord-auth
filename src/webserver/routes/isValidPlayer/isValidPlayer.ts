/**
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import { authCodeRes, isValid } from "./responses";
import { noBodyError, noPlayerID, playerIDType } from "../../errors";
import { WebServer } from "../../WebServer";


export const isValidPlayer = express.Router();

isValidPlayer.post('/isValidPlayer', express.json());

isValidPlayer.use('/isValidPlayer', validateBody);

/**
 * POST /isValidPlayer
 * This is the isValidPlayer endpoint handler.
 */
isValidPlayer.post('/isValidPlayer', async (req: Request, res: Response) => {
  // @ts-ignore
  const reqID: string = req['id'];
  // @ts-ignore
  const playerUUID: string = req['player_id'];
  // @ts-ignore
  const webserver: WebServer = req['webserver'];

  // Let's check if they're a valid alt account
  const isAnAlt = await webserver.db.alts.isAnAlt(playerUUID);

  res.status(200);

  if (isAnAlt) {
    const body: isValid = { valid: true };
    res.send(body);
    console.log(`Response for "${reqID}" (ALT)\n`, body);
    res.end();
    return;
  }

  const discordID = await webserver.db.links.getDiscordID(playerUUID);

  if (discordID != undefined) {
    const auth = webserver.discord.isValidMember(discordID);

    res.send(auth);
    console.log(`Response for "${reqID}"\n`, auth);
    res.end();
    return;
  } else {
    const authCode = await webserver.db.auth.newAuthCode(playerUUID);
    let response: authCodeRes = {
      auth_code: authCode,
      reason: "auth_code",
      valid: false,
    };

    res.send(response);
    console.log(`Response for "${reqID}"\n`, response);
    res.end();
  }
});

/**
 * This checks the integrity of the body in a given request.
 */
function validateBody(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore
  const reqID = req['id'];

  console.log(
    `Validating Body for Request "${reqID}"`
  );

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
    console.log(`Response for "${reqID}"\n`, noPlayerID);
    res.end();
    return;
  } else if (typeof playerUUID != 'string') {
    res.status(400);
    res.send(playerIDType);
    console.log(`Response for "${reqID}"\n`, playerIDType);
    res.end();
    return;
  }

  // @ts-ignore
  req['player_id'] = playerUUID;
  console.log(
    `Validated Request `
  )
  next();
}
