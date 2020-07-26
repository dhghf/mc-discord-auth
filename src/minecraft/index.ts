/**
 * This module communicates with Mojang API servers to get a player's UUID
 * & player name. This code is has been copied from one of projects
 *
 * matrix-appservice-minecraft:
 * @link https://github.com/dhghf/matrix-appservice-minecraft/blob/develop/src/minecraft/internal/Player.ts
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
import bent, { RequestFunction } from 'bent';


export class PlayerDoesNotExist extends Error {
  constructor() { super("Provided playername does not exist"); }
}

/**
 * Playername -> UUID Response
 * @link https://wiki.vg/Mojang_API#Username_-.3E_UUID_at_time
 * @typedef UUID
 * @property {string} id Their UUID
 * @property {string} username Their player name
 */
export type UUID = {
  id: string;
  username: string;
};

/**
 * So this type definition is kinda weird basically it holds a base64
 * encoding that represents a player's skin + cape in the "value" property
 * when you decode it, it will result in JSON (See the Skin type definition)
 * @typedef Texture
 * @property {string} name This will usually just have the value "texture"
 * @property {string} value
 * @property {string | undefined}
 */
export type Texture = {
  name: string;
  value: string;
  signature?: string;
};

/**
 * UUID -> Profile + Skin/Cape Response
 * @link https://wiki.vg/Mojang_API#UUID_-.3E_Profile_.2B_Skin.2FCape
 * @typedef Profile
 * @property {string} id The player's UUID
 * @property {string} name The player's name
 * @property {Texture[]} properties This will usually just be an array
 * with one Texture object in it.
 */
type Profile = {
  id: string;
  name: string;
  properties: Texture[];
}

/**
 * Retrieves the UUID of this player, this method should always be called
 * when trying to access the UUID property.
 * Playername -> UUID
 * @link https://wiki.vg/Mojang_API#Username_-.3E_UUID_at_time
 * @returns {Promise<string>}
 */
export async function getUUID(name: string): Promise<string> {
  const getJSON = bent('https://api.mojang.com', 'POST', 'json', 200) as RequestFunction<UUID[]>;
  const res = await getJSON('/profiles/minecraft', [name]);

  if (res.length > 0)
    return res[0].id;
  else
    throw new PlayerDoesNotExist();
}

/**
 * This gets the playername assigned to the UUID.
 * @returns {Promise<string>}
 */
export async function getName(uuid: string): Promise<string> {
  const getJSON = bent('json') as RequestFunction<Profile>;
  const target = `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`;
  const response = await getJSON(target);

  return response.name;
}
