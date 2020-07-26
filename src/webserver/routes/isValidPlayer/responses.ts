/**
 * These are all the possible successful responses from the isValidPlayer
 * endpoint.
 * @LICENSE GPL-3.0
 * @author Dylan Hackworth <dhpf@pm.me>
 */
export type isValid = {
  valid: true
}

export type isNotValid = {
  valid: false;
  reason: notValidReason;
}

export type authCodeRes = {
  valid: false;
  reason: 'auth_code';
  auth_code: string;
}

export type notValidReason =
  'no_link'
  | 'no_role'
  | 'banned'
  | 'maintenance'
  | 'auth_code';
