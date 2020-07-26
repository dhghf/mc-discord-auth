/**
 * These are all the errors that can occur during alt management
 * @license GNU GPLv3
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import { WebServerError } from "../../errors";

export const noOwner: WebServerError = {
  errcode: "NO_OWNER",
  message: "An owner attribute was not provided"
}

export const ownerType: WebServerError = {
  errcode: "OWNER_TYPE_ERROR",
  message: "The owner attribute provided is not a string type"
}

export const noPlayerName: WebServerError = {
  "errcode": "NO_PLAYER_NAME",
  "message": "A player name wasn't provided"
}

export const playerNameType: WebServerError = {
  "errcode": "PLAYER_TYPE_ERROR",
  "message": "The player name attribute was not provided as a string"
}

export const invalidOwner: WebServerError = {
  errcode: "INVALID_OWNER",
  message: "The owner provided is not a valid player name"
}

export const altAlreadyAdded: WebServerError = {
  errcode: "ALT_ALREADY_ADDED",
  message: "The alt provided is already stored in the database"
}
