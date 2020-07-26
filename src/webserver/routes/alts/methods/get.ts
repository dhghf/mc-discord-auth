/**
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import { NextFunction, Request, Response } from "express";
import { WebServer } from "../../../WebServer";
import { noOwner, ownerType } from "../errors";
import { altAccs } from "../responses";


/**
 * GET /getAltsOf/:owner handler
 */
export async function getReq(req: Request, res: Response) {
  // @ts-ignore
  const reqID = req['id'];
  // @ts-ignore
  const owner = req['owner'];
  // @ts-ignore
  const webServer: WebServer = req['webserver'];

  // result is an array of player names owned by the owner
  const result = await webServer.db.alts.getAlts(owner);
  const body: altAccs = { alt_accs: result };

  console.log(`Response for "${reqID}"\n`, body);

  res.status(200);
  res.send(body);
  res.end();
}

/**
 * This checks the :owner path parameter in a given HTTP request
 */
export function checkGetReq(req: Request, res: Response, next: NextFunction, owner: any) {
  // @ts-ignore
  const reqID = req['id'];

  if (!owner) {
    res.status(401);
    console.log(`Response for "${reqID}"\n`, noOwner);
    res.send(noOwner);
    res.end();
    return;
  } else if (typeof owner != 'string') {
    res.status(401);
    console.log(`Response for "${reqID}"\n`, ownerType);
    res.send(ownerType);
    res.end();
    return;
  }

  // @ts-ignore
  req['owner'] = owner;

  next();
}
