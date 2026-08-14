"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// bundle-entry.ts
var bundle_entry_exports = {};
__export(bundle_entry_exports, {
  AddressMap: () => AddressMap,
  All: () => All,
  Channel: () => Channel,
  ContractDiscoveryProvider: () => ContractDiscoveryProvider,
  IndexerDiscoveryProvider: () => IndexerDiscoveryProvider,
  MAX_VIEWING_KEY: () => MAX_VIEWING_KEY,
  OhttpClient: () => OhttpClient,
  Open: () => Open,
  PrivacyPoolABI: () => PrivacyPoolABI,
  ProvingService: () => ProvingService,
  ProvingServiceError: () => ProvingServiceError,
  ProvingServiceHttpError: () => ProvingServiceHttpError,
  ProvingServiceProofProvider: () => ProvingServiceProofProvider,
  ScreeningRejected: () => ScreeningRejected,
  ScreeningUnavailable: () => ScreeningUnavailable,
  SetupRequirement: () => SetupRequirement,
  ShadowAccountAnonymizerABI: () => ShadowAccountAnonymizerABI,
  SimplePrivateTransfersImpl: () => SimplePrivateTransfersImpl,
  WarningCode: () => WarningCode,
  Witness: () => Witness,
  buildHistoryCursor: () => buildHistoryCursor,
  classifyTransaction: () => classifyTransaction,
  createEmptyRegistry: () => createEmptyRegistry,
  createPrivateTransfers: () => createPrivateTransfers,
  screeningErrorFromProvingError: () => screeningErrorFromProvingError
});
module.exports = __toCommonJS(bundle_entry_exports);

// dist/interfaces.js
var import_starknet7 = require("starknet");

// dist/utils/convert.js
var import_starknet = require("starknet");
function toBigInt(value) {
  if (value instanceof Uint8Array) {
    return import_starknet.encode.uint8ArrayToBigInt(value);
  }
  return BigInt(value);
}
function toBytes(value) {
  const n = toBigInt(value);
  const hex = n.toString(16).padStart(64, "0");
  return import_starknet.encode.hexStringToUint8Array(hex);
}
function toHex(value, { prefix = true } = {}) {
  let hex;
  if (value instanceof Uint8Array) {
    hex = import_starknet.encode.buf2hex(value);
  } else if (typeof value === "bigint") {
    hex = value.toString(16);
  } else if (typeof value === "number") {
    hex = value.toString(16);
  } else if (typeof value === "string") {
    if (value.startsWith("0x") || value.startsWith("0X") || /^\d+$/.test(value)) {
      hex = toBigInt(value).toString(16);
    } else {
      hex = import_starknet.encode.buf2hex(import_starknet.encode.utf8ToArray(value));
    }
  } else {
    hex = toBigInt(value).toString(16);
  }
  return prefix ? `0x${hex}` : hex;
}

// dist/utils/logging.js
var getEnv = (key) => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return void 0;
};
var traceStorage;
try {
  if (typeof window === "undefined" && typeof process !== "undefined") {
    const asyncHooks = require("async_hooks");
    traceStorage = new asyncHooks.AsyncLocalStorage();
  }
} catch {
  traceStorage = void 0;
}
var DEBUG_ENV_VAR = "SDK_DEBUG";
var isDebugEnabled = (targetName) => {
  const env = getEnv(DEBUG_ENV_VAR);
  if (!env)
    return false;
  if (env === "1" || env === "true")
    return true;
  if (targetName) {
    const patterns = env.split(",");
    return patterns.some((p) => targetName === p || targetName.startsWith(`${p}.`));
  }
  return false;
};
var CYAN = 36;
var useColor = () => {
  if (getEnv("SDK_DEBUG_COLOR") === "0" || getEnv("NO_COLOR"))
    return false;
  if (getEnv("SDK_DEBUG_COLOR") === "1" || getEnv("FORCE_COLOR"))
    return true;
  if (typeof process !== "undefined" && process.stdout?.isTTY)
    return true;
  return false;
};
var color = (text, code) => {
  if (!useColor())
    return text;
  return `\x1B[${code}m${text}\x1B[0m`;
};
var getTimestamp = () => {
  const now = /* @__PURE__ */ new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${ms}`;
};
var createReplacer = () => {
  const seen = /* @__PURE__ */ new WeakSet();
  return (_, v) => {
    if (typeof v === "bigint")
      return toHex(v);
    if (typeof v === "function")
      return "[Function]";
    if (v instanceof Uint8Array)
      return toHex(v);
    if (typeof v === "object" && v !== null) {
      if (seen.has(v))
        return "[Circular]";
      seen.add(v);
      if (v instanceof Map)
        return {
          dataType: "Map",
          value: Array.from(v.entries())
        };
      if (v instanceof Set)
        return Array.from(v);
    }
    return v;
  };
};
var debugLog = (target, sub, ...args) => {
  if (isDebugEnabled(`${target}.${sub}`)) {
    const current = traceStorage?.getStore();
    const traceId = current ? current.id : "?";
    const timestamp = color(`[${getTimestamp()}]`, 90);
    const evaluatedArgs = args.map((arg) => typeof arg === "function" ? arg() : arg);
    console.log(timestamp, color(`[${traceId}] [${target}.${sub}]`, CYAN), ...evaluatedArgs.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg, createReplacer(), 2)));
  }
};
var debugHint = `
Tip: Run with ${DEBUG_ENV_VAR}=1 for detailed logging`;

// dist/utils/crypto.js
var import_starknet2 = require("starknet");
function shortStringToFelt(str) {
  if (str.length > 31) {
    throw new Error(`Short string must be <= 31 chars, got ${str.length}`);
  }
  return BigInt(toHex(str));
}
function isNumericString(str) {
  return /^0x[0-9a-fA-F]+$/.test(str) || /^[0-9]+$/.test(str);
}
function hash(...values) {
  const feltValues = values.map((v) => {
    if (typeof v === "string") {
      return isNumericString(v) ? toBigInt(v) : shortStringToFelt(v);
    }
    return toBigInt(v);
  });
  return import_starknet2.ec.starkCurve.poseidonHashMany(feltValues);
}
var starkCurve = import_starknet2.ec.starkCurve;
function getXCoordinateFromBytes(publicKeyBytes) {
  const start = publicKeyBytes.length === 33 ? 1 : publicKeyBytes.length === 65 ? 1 : 0;
  const end = start + 32;
  return BigInt(toHex(publicKeyBytes.slice(start, end)));
}
function derivePublicKey(privateKey) {
  const privateKeyBytes = toBytes(privateKey);
  const publicKeyBytes = starkCurve.getPublicKey(privateKeyBytes);
  return getXCoordinateFromBytes(publicKeyBytes);
}
function generateRandom() {
  return import_starknet2.encode.uint8ArrayToBigInt(starkCurve.utils.randomPrivateKey());
}
function generateRandom120() {
  const bytes = new Uint8Array(15);
  crypto.getRandomValues(bytes);
  let result = 0n;
  for (const byte of bytes) {
    result = result << 8n | BigInt(byte);
  }
  return result;
}

// dist/utils/maps.js
var AdvancedMap = class {
  map = /* @__PURE__ */ new Map();
  options;
  constructor(entriesOrOptions, options) {
    let initialEntries = null;
    if (entriesOrOptions === null || entriesOrOptions === void 0) {
      this.options = options || {};
    } else if (Symbol.iterator in Object(entriesOrOptions)) {
      initialEntries = entriesOrOptions;
      this.options = options || {};
    } else {
      this.options = entriesOrOptions || {};
    }
    if (initialEntries) {
      for (const [key, value] of initialEntries) {
        this.set(key, value);
      }
    }
  }
  toInternalKey(key) {
    return this.options.keyConverter ? this.options.keyConverter(key) : key;
  }
  get(key, defaultValue) {
    const internalKey = this.toInternalKey(key);
    if (!this.map.has(internalKey) && (defaultValue || this.options.defaultFactory)) {
      this.map.set(internalKey, defaultValue ? defaultValue(key) : this.options.defaultFactory(key));
    }
    return this.map.get(internalKey);
  }
  set(key, value) {
    this.map.set(this.toInternalKey(key), value);
    return this;
  }
  has(key) {
    return this.map.has(this.toInternalKey(key));
  }
  delete(key) {
    return this.map.delete(this.toInternalKey(key));
  }
  clear() {
    this.map.clear();
  }
  get size() {
    return this.map.size;
  }
  /** Iterate over entries with internal keys */
  entries() {
    return this.map.entries();
  }
  /** Iterate over internal keys */
  keys() {
    return this.map.keys();
  }
  /** Iterate over values */
  values() {
    return this.map.values();
  }
  /** ForEach with internal keys */
  forEach(callbackfn) {
    this.map.forEach(callbackfn);
  }
  [Symbol.iterator]() {
    return this.map[Symbol.iterator]();
  }
  get [Symbol.toStringTag]() {
    return "AdvancedMap";
  }
};
var BigNumberishMap = class extends AdvancedMap {
  constructor(entriesOrDefaultFactory, defaultFactory) {
    let initialEntries = null;
    let factory;
    if (typeof entriesOrDefaultFactory === "function") {
      factory = entriesOrDefaultFactory;
    } else if (Symbol.iterator in Object(entriesOrDefaultFactory) || entriesOrDefaultFactory === null) {
      initialEntries = entriesOrDefaultFactory ?? null;
      factory = defaultFactory;
    }
    super(initialEntries, {
      keyConverter: (key) => toBigInt(key),
      defaultFactory: factory
    });
  }
};
var AddressMap = BigNumberishMap;

// dist/utils/validation.js
var import_starknet3 = require("starknet");
function assert(condition, message) {
  if (!condition) {
    throw new Error(message());
  }
}
function isOpen(value) {
  return value === Open;
}
function isOpenNote(obj) {
  return isOpen(obj.amount);
}
function isAll(value) {
  return value === All;
}

// dist/utils/hashes.js
var CHANNEL_MARKER_TAG = "CHANNEL_MARKER_TAG:V1";
var CHANNEL_KEY_TAG = "CHANNEL_KEY_TAG:V1";
var SUBCHANNEL_ID_TAG = "SUBCHANNEL_ID_TAG:V1";
var NULLIFIER_TAG = "NULLIFIER_TAG:V1";
var ENC_CHANNEL_KEY_TAG = "ENC_CHANNEL_KEY_TAG:V1";
var ENC_SENDER_ADDR_TAG = "ENC_SENDER_ADDR_TAG:V1";
var NOTE_ID_TAG = "NOTE_ID_TAG:V1";
var ENC_AMOUNT_TAG = "ENC_AMOUNT_TAG:V1";
var ENC_TOKEN_TAG = "ENC_TOKEN_TAG:V1";
var ENC_PRIVATE_KEY_TAG = "ENC_PRIVATE_KEY_TAG:V1";
var ENC_USER_ADDR_TAG = "ENC_USER_ADDR_TAG:V1";
var ENC_RECIPIENT_ADDR_TAG = "ENC_RECIPIENT_ADDR_TAG:V1";
var OUTGOING_CHANNEL_ID_TAG = "OUTGOING_CHANNEL_ID_TAG:V1";
var IDENTITY_KEY_TAG = "IDENTITY_KEY_TAG:V1";
function compute_identity_key(user_addr, user_private_key, contract_address) {
  return hash(IDENTITY_KEY_TAG, user_addr, user_private_key, contract_address);
}
function compute_enc_private_key_hash(shared_x) {
  return hash(ENC_PRIVATE_KEY_TAG, shared_x);
}
function compute_enc_user_addr_hash(shared_x) {
  return hash(ENC_USER_ADDR_TAG, shared_x);
}
function compute_enc_token_hash(channel_key, index, salt) {
  return hash(ENC_TOKEN_TAG, channel_key, index, 0n, salt);
}
function compute_enc_channel_key_hash(shared_x) {
  return hash(ENC_CHANNEL_KEY_TAG, shared_x);
}
function compute_enc_sender_addr_hash(shared_x) {
  return hash(ENC_SENDER_ADDR_TAG, shared_x);
}
function compute_enc_recipient_addr_hash(sender_addr, sender_private_key, index, salt) {
  return hash(ENC_RECIPIENT_ADDR_TAG, sender_addr, sender_private_key, index, 0n, salt);
}
function compute_channel_key(sender_addr, sender_private_key, recipient_addr, recipient_public_key) {
  return hash(CHANNEL_KEY_TAG, sender_addr, sender_private_key, recipient_addr, recipient_public_key);
}
function compute_outgoing_channel_id(sender_addr, sender_private_key, index) {
  return hash(OUTGOING_CHANNEL_ID_TAG, sender_addr, sender_private_key, index, 0n);
}
function compute_channel_marker(channel_key, sender_addr, recipient_addr, recipient_public_key) {
  return hash(CHANNEL_MARKER_TAG, channel_key, sender_addr, recipient_addr, recipient_public_key);
}
function compute_subchannel_id(channel_key, index) {
  return hash(SUBCHANNEL_ID_TAG, channel_key, index, 0n);
}
function compute_note_id(channel_key, token, index) {
  return hash(NOTE_ID_TAG, channel_key, token, index, 0n);
}
function compute_enc_amount_hash(channel_key, token, index, salt) {
  return hash(ENC_AMOUNT_TAG, channel_key, token, index, 0n, salt);
}
function compute_nullifier(channel_key, token, index, owner_private_key) {
  return hash(NULLIFIER_TAG, channel_key, token, index, 0n, owner_private_key);
}

// dist/utils/encryptions.js
var import_starknet4 = require("starknet");
var starkCurve2 = import_starknet4.ec.starkCurve;
var FIELD_PRIME = starkCurve2.CURVE.Fp.ORDER;
var TWO_POW_128 = 2n ** 128n;
function getXCoordinateFromBytes2(publicKeyBytes) {
  const start = publicKeyBytes.length === 33 ? 1 : publicKeyBytes.length === 65 ? 1 : 0;
  const end = start + 32;
  return BigInt(toHex(publicKeyBytes.slice(start, end)));
}
function recoverPointFromX(x) {
  const Fp = starkCurve2.CURVE.Fp;
  const a = starkCurve2.CURVE.a;
  const b = starkCurve2.CURVE.b;
  const x3 = Fp.mul(Fp.mul(x, x), x);
  const ax = Fp.mul(a, x);
  const y2 = Fp.add(Fp.add(x3, ax), b);
  const y = Fp.sqrt(y2);
  if (y === void 0) {
    throw new Error(`x-coordinate ${x} is not on the curve`);
  }
  const point = starkCurve2.ProjectivePoint.fromAffine({ x, y });
  return point.toRawBytes(true);
}
var encryptions = {
  // ============ Channel Info (ECDH) ============
  /**
   * Encrypt channel info using ECDH.
   * Matches Cairo's encrypt_channel_info in utils.cairo.
   *
   * @param ephemeralSecret - Random scalar for ECDH
   * @param recipientPublicKey - Recipient's public key (x-coordinate)
   * @param channelKey - The channel key to encrypt
   * @param senderAddr - The sender's address to encrypt
   */
  encryptChannelInfo: (ephemeralSecret, recipientPublicKey, channelKey, senderAddr) => {
    const ephemeralSecretBytes = toBytes(ephemeralSecret);
    const ephemeralPubPoint = starkCurve2.getPublicKey(ephemeralSecretBytes);
    const ephemeralPubkey = getXCoordinateFromBytes2(ephemeralPubPoint);
    const recipientPubBytes = recoverPointFromX(recipientPublicKey);
    const sharedPoint = starkCurve2.getSharedSecret(ephemeralSecretBytes, recipientPubBytes);
    const sharedX = getXCoordinateFromBytes2(sharedPoint);
    const encChannelKey = (compute_enc_channel_key_hash(sharedX) + channelKey) % FIELD_PRIME;
    const encSenderAddr = (compute_enc_sender_addr_hash(sharedX) + senderAddr) % FIELD_PRIME;
    return {
      ephemeral_pubkey: ephemeralPubkey,
      enc_channel_key: encChannelKey,
      enc_sender_addr: encSenderAddr
    };
  },
  /**
   * Decrypt channel info using ECDH.
   * Matches Cairo's decryption of EncChannelInfo.
   *
   * @param encrypted - The encrypted channel info
   * @param recipientPrivateKey - The recipient's private key
   */
  decryptChannelInfo: (encrypted, recipientPrivateKey) => {
    const privateKeyBytes = toBytes(recipientPrivateKey);
    const ephemeralPubBytes = recoverPointFromX(toBigInt(encrypted.ephemeral_pubkey));
    const sharedPoint = starkCurve2.getSharedSecret(privateKeyBytes, ephemeralPubBytes);
    const sharedX = getXCoordinateFromBytes2(sharedPoint);
    const key = ((toBigInt(encrypted.enc_channel_key) - compute_enc_channel_key_hash(sharedX)) % FIELD_PRIME + FIELD_PRIME) % FIELD_PRIME;
    const sender = ((toBigInt(encrypted.enc_sender_addr) - compute_enc_sender_addr_hash(sharedX)) % FIELD_PRIME + FIELD_PRIME) % FIELD_PRIME;
    return { key, sender };
  },
  // ============ Subchannel Info ============
  /**
   * Encrypt subchannel info.
   * Matches Cairo's encrypt_subchannel_info in utils.cairo.
   *
   * enc_token = h(ENC_TOKEN_TAG, channel_key, index, 0, salt) + token
   *
   * @param channelKey - The channel key
   * @param index - The subchannel index
   * @param token - The token address to encrypt
   * @param salt - Random salt for encryption
   */
  encryptSubchannelInfo: (channelKey, index, token, salt) => {
    const encTokenHash = compute_enc_token_hash(channelKey, index, salt);
    const enc_token = (encTokenHash + token) % FIELD_PRIME;
    return { salt, enc_token };
  },
  /**
   * Decrypt subchannel info.
   * Inverse of encrypt_subchannel_info.
   *
   * token = enc_token - h(ENC_TOKEN_TAG, channel_key, index, 0, salt)
   *
   * @param encrypted - The encrypted subchannel info (with salt and enc_token fields)
   * @param channelKey - The channel key
   * @param index - The subchannel index
   * @returns Decrypted token and salt
   */
  decryptSubchannelInfo: (encrypted, channelKey, index) => {
    const salt = toBigInt(encrypted.salt);
    const enc_token = toBigInt(encrypted.enc_token);
    const encTokenHash = compute_enc_token_hash(channelKey, index, salt);
    const token = ((enc_token - encTokenHash) % FIELD_PRIME + FIELD_PRIME) % FIELD_PRIME;
    return { token, salt };
  },
  // ============ Note Amount ============
  /**
   * Encrypt note amount.
   * Matches Cairo's enc_note_packed_value in utils.cairo.
   *
   * Result is packed: (salt << 128) | enc_amount
   * enc_amount = (hash + amount) % 2^128
   *
   * @param channelKey - The channel key
   * @param token - The token address
   * @param index - The note index
   * @param salt - Random salt (must be 120 bits)
   * @param amount - The amount to encrypt
   */
  encryptNoteAmount: (channelKey, token, index, salt, amount) => {
    const encAmountHash = compute_enc_amount_hash(channelKey, token, index, salt);
    const encAmount = (encAmountHash + amount) % TWO_POW_128;
    return salt * TWO_POW_128 + encAmount;
  },
  /**
   * Decrypt note amount.
   * Matches Cairo's decrypt_note_amount in utils.cairo.
   *
   * @param encNoteValue - The packed encrypted value (salt || enc_amount)
   * @param channelKey - The channel key
   * @param token - The token address
   * @param index - The note index
   * @returns Object with decrypted amount and extracted salt
   */
  decryptNoteAmount: (encNoteValue, channelKey, token, index) => {
    const salt = encNoteValue / TWO_POW_128;
    const encAmount = encNoteValue % TWO_POW_128;
    const pad = compute_enc_amount_hash(channelKey, token, index, salt) % TWO_POW_128;
    const amount = (encAmount + TWO_POW_128 - pad) % TWO_POW_128;
    return { amount, salt };
  },
  // ============ Public Key ============
  /**
   * Derive public key from private key (returns x-coordinate).
   * Matches Cairo's derive_public_key in utils.cairo.
   */
  derivePublicKey: (privateKey) => {
    const privateKeyBytes = toBytes(privateKey);
    const publicKeyBytes = starkCurve2.getPublicKey(privateKeyBytes);
    return getXCoordinateFromBytes2(publicKeyBytes);
  },
  // ============ Outgoing Channel Info ============
  /**
   * Encrypt outgoing channel info.
   * Matches Cairo's encrypt_outgoing_channel_info in utils.cairo.
   *
   * enc_recipient_addr = h(ENC_RECIPIENT_ADDR_TAG, sender_addr, sender_private_key, index, salt) + recipient_addr
   *
   * @param senderAddr - The sender's address
   * @param senderPrivateKey - The sender's private key
   * @param index - The channel index
   * @param recipientAddr - The recipient's address to encrypt
   * @param salt - Random salt for encryption
   */
  encryptOutgoingChannelInfo: (senderAddr, senderPrivateKey, index, recipientAddr, salt) => {
    const encRecipientAddrHash = compute_enc_recipient_addr_hash(senderAddr, senderPrivateKey, index, salt);
    const enc_recipient_addr = (encRecipientAddrHash + recipientAddr) % FIELD_PRIME;
    return { salt, enc_recipient_addr };
  },
  /**
   * Decrypt outgoing channel info.
   * Inverse of encrypt_outgoing_channel_info.
   *
   * @param encrypted - The encrypted outgoing channel info
   * @param senderAddr - The sender's address
   * @param senderPrivateKey - The sender's private key
   * @param index - The channel index
   */
  decryptOutgoingChannelInfo: (encrypted, senderAddr, senderPrivateKey, index) => {
    const salt = toBigInt(encrypted.salt);
    const enc_recipient_addr = toBigInt(encrypted.enc_recipient_addr);
    const encRecipientAddrHash = compute_enc_recipient_addr_hash(toBigInt(senderAddr), toBigInt(senderPrivateKey), index, salt);
    const recipientAddr = ((enc_recipient_addr - encRecipientAddrHash) % FIELD_PRIME + FIELD_PRIME) % FIELD_PRIME;
    return { recipientAddr, salt };
  },
  // ============ Private Key (ECDH) ============
  /**
   * Encrypt private key using ECDH.
   * Matches Cairo's encrypt_private_key in utils.cairo.
   *
   * @param ephemeralSecret - Random scalar for ECDH
   * @param auditorPublicKey - Auditor's public key (x-coordinate)
   * @param privateKey - The private key to encrypt
   */
  encryptPrivateKey: (ephemeralSecret, auditorPublicKey, privateKey) => {
    const ephemeralSecretBytes = toBytes(ephemeralSecret);
    const ephemeralPubPoint = starkCurve2.getPublicKey(ephemeralSecretBytes);
    const ephemeralPubkey = getXCoordinateFromBytes2(ephemeralPubPoint);
    const auditorPubBytes = recoverPointFromX(auditorPublicKey);
    const sharedPoint = starkCurve2.getSharedSecret(ephemeralSecretBytes, auditorPubBytes);
    const sharedX = getXCoordinateFromBytes2(sharedPoint);
    const encPrivateKey = (compute_enc_private_key_hash(sharedX) + privateKey) % FIELD_PRIME;
    return { ephemeralPubkey, encPrivateKey };
  },
  /**
   * Decrypt private key using ECDH.
   * Inverse of encrypt_private_key.
   *
   * @param encrypted - The encrypted private key
   * @param auditorPrivateKey - The auditor's private key
   */
  decryptPrivateKey: (encrypted, auditorPrivateKey) => {
    const privateKeyBytes = toBytes(auditorPrivateKey);
    const ephemeralPubBytes = recoverPointFromX(encrypted.ephemeralPubkey);
    const sharedPoint = starkCurve2.getSharedSecret(privateKeyBytes, ephemeralPubBytes);
    const sharedX = getXCoordinateFromBytes2(sharedPoint);
    const privateKey = ((encrypted.encPrivateKey - compute_enc_private_key_hash(sharedX)) % FIELD_PRIME + FIELD_PRIME) % FIELD_PRIME;
    return privateKey;
  },
  // ============ User Address (ECDH) ============
  /**
   * Encrypt user address using ECDH.
   * Matches Cairo's encrypt_user_addr in utils.cairo.
   *
   * @param ephemeralSecret - Random scalar for ECDH
   * @param auditorPublicKey - Auditor's public key (x-coordinate)
   * @param userAddr - The user address to encrypt
   */
  encryptUserAddr: (ephemeralSecret, auditorPublicKey, userAddr) => {
    const ephemeralSecretBytes = toBytes(ephemeralSecret);
    const ephemeralPubPoint = starkCurve2.getPublicKey(ephemeralSecretBytes);
    const ephemeralPubkey = getXCoordinateFromBytes2(ephemeralPubPoint);
    const auditorPubBytes = recoverPointFromX(auditorPublicKey);
    const sharedPoint = starkCurve2.getSharedSecret(ephemeralSecretBytes, auditorPubBytes);
    const sharedX = getXCoordinateFromBytes2(sharedPoint);
    const encUserAddr = (compute_enc_user_addr_hash(sharedX) + userAddr) % FIELD_PRIME;
    return { ephemeralPubkey, encUserAddr };
  },
  /**
   * Decrypt user address using ECDH.
   * Inverse of encrypt_user_addr.
   *
   * @param encrypted - The encrypted user address
   * @param auditorPrivateKey - The auditor's private key
   */
  decryptUserAddr: (encrypted, auditorPrivateKey) => {
    const privateKeyBytes = toBytes(auditorPrivateKey);
    const ephemeralPubBytes = recoverPointFromX(encrypted.ephemeralPubkey);
    const sharedPoint = starkCurve2.getSharedSecret(privateKeyBytes, ephemeralPubBytes);
    const sharedX = getXCoordinateFromBytes2(sharedPoint);
    const userAddr = ((encrypted.encUserAddr - compute_enc_user_addr_hash(sharedX)) % FIELD_PRIME + FIELD_PRIME) % FIELD_PRIME;
    return userAddr;
  }
};

// dist/utils/error-decoder.js
var import_starknet5 = require("starknet");
var COMMON_FUNCTIONS = [
  // Account functions
  "__execute__",
  "__validate__",
  "__validate_declare__",
  "__validate_deploy__",
  "is_valid_signature",
  "get_nonce",
  // ERC20
  "transfer",
  "transfer_from",
  "approve",
  "balance_of",
  "allowance",
  "total_supply",
  "name",
  "symbol",
  "decimals",
  // ERC721
  "owner_of",
  "safe_transfer_from",
  "set_approval_for_all",
  "get_approved",
  "is_approved_for_all",
  // Outside execution (SNIP-9)
  "execute_from_outside",
  "execute_from_outside_v2",
  "is_valid_outside_execution_nonce",
  // Ownable
  "owner",
  "transfer_ownership",
  "renounce_ownership",
  // Upgradeable
  "upgrade",
  // Access control
  "has_role",
  "grant_role",
  "revoke_role",
  // Privacy pool specific
  "register",
  "deposit",
  "withdraw",
  "get_public_key",
  "set_viewing_key",
  "get_note",
  "get_nullifier",
  "get_channel"
];
var selectorToName = /* @__PURE__ */ new Map();
for (const name of COMMON_FUNCTIONS) {
  const selector = import_starknet5.hash.getSelectorFromName(name);
  selectorToName.set(selector.toLowerCase(), name);
}

// dist/utils/proof-facts.js
var import_starknet6 = require("starknet");
var PROOF_VERSION = shortStringToFelt("PROOF0");
var VIRTUAL_SNOS = shortStringToFelt("VIRTUAL_SNOS");
var VIRTUAL_SNOS0 = shortStringToFelt("VIRTUAL_SNOS0");
var VIRTUAL_PROGRAM_HASH = "0x3e98c2d7703b03a7edb73ed7f075f97f1dcbaa8f717cdf6e1a57bf058265473";
var STRK_FEE_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
var STARKNET_OS_CONFIG_HASH_VERSION = "0x537461726b6e65744f73436f6e66696733";
function computeVirtualOsConfigHash(chainId, strkFeeTokenAddress) {
  return import_starknet6.hash.computeHashOnElements([
    STARKNET_OS_CONFIG_HASH_VERSION,
    chainId,
    strkFeeTokenAddress
  ]);
}
function computeMessageHash(poolAddress, poolClassHash, serverActionsCalldata) {
  const messagePayload = buildMessagePayload(poolClassHash, serverActionsCalldata);
  const feltValues = [
    toBigInt(poolAddress),
    0n,
    BigInt(messagePayload.length),
    ...messagePayload.map(toBigInt)
  ];
  return import_starknet6.ec.starkCurve.poseidonHashMany(feltValues);
}
function buildMessagePayload(poolClassHash, serverActionsCalldata) {
  return [toHex(poolClassHash), ...serverActionsCalldata];
}
function buildProofFacts(poolAddress, poolClassHash, serverActionsCalldata, blockNumber, blockHash, chainId) {
  const messageHash = computeMessageHash(poolAddress, poolClassHash, serverActionsCalldata);
  const configHash = computeVirtualOsConfigHash(chainId, STRK_FEE_TOKEN_ADDRESS);
  return [
    `0x${PROOF_VERSION.toString(16)}`,
    // proof_version ('PROOF0')
    `0x${VIRTUAL_SNOS.toString(16)}`,
    // program_variant
    VIRTUAL_PROGRAM_HASH,
    // virtual_program_hash
    `0x${VIRTUAL_SNOS0.toString(16)}`,
    // starknet_os_output_version
    `0x${blockNumber.toString(16)}`,
    // base_block_number
    `0x${toBigInt(blockHash).toString(16)}`,
    // base_block_hash
    configHash,
    // starknet_os_config_hash
    "0x1",
    // message_to_l1_hashes length (Span serialization)
    `0x${messageHash.toString(16)}`
    // message_to_l1_hashes[0]
  ];
}

// dist/internal/channel.js
function cloneNotesCursor(cursor) {
  if (!cursor) {
    return {
      blockId: 0,
      incomingChannels: new AddressMap()
    };
  }
  const cloneIncomingChannelCursor = (sc) => ({
    channelKey: sc.channelKey,
    subchannelIdIndex: sc.subchannelIdIndex,
    noteIndexes: new AddressMap(sc.noteIndexes.entries()),
    totalNoteCounts: new AddressMap(sc.totalNoteCounts.entries())
  });
  const incomingChannels = new AddressMap([...cursor.incomingChannels.entries()].map(([k, v]) => [k, cloneIncomingChannelCursor(v)]));
  return {
    blockId: cursor.blockId,
    incomingChannels
  };
}
function cloneChannelCursor(cursor) {
  if (!cursor) {
    return {
      channels: new AddressMap(),
      total: void 0
    };
  }
  return {
    channels: cursor.channels ? new AddressMap([...cursor.channels.entries()].map(([k, v]) => [
      k,
      v.clone()
    ])) : void 0,
    total: cursor.total
  };
}
var Channel = class _Channel {
  publicKey;
  key;
  tokens;
  // for the next note for each token
  constructor(publicKey, key, tokens) {
    this.publicKey = publicKey;
    this.key = key;
    this.tokens = new AddressMap(() => {
      return { tokenIndex: 0, noteNonce: 0 };
    });
    if (tokens) {
      for (const [k, v] of tokens) {
        this.tokens.set(k, v);
      }
    }
  }
  incrementNoteNonce(token) {
    const current = this.tokens.get(token);
    current.noteNonce += 1;
    this.tokens.set(token, current);
    return current.noteNonce;
  }
  /** Create a deep clone of this channel */
  clone() {
    return new _Channel(this.publicKey, this.key, this.tokens.entries());
  }
  toSetupRequirement(token) {
    if (!this.publicKey) {
      return SetupRequirement.Register;
    }
    if (!this.key) {
      return SetupRequirement.SetupChannel;
    }
    if (!this.tokens.has(token)) {
      return SetupRequirement.SetupToken;
    }
    return SetupRequirement.Ready;
  }
};
var Witness = class {
  channelKey;
  nonce;
  r;
  constructor(channelKey, nonce, r) {
    this.channelKey = channelKey;
    this.nonce = nonce;
    this.r = r;
  }
};

// dist/interfaces.js
var MAX_VIEWING_KEY = import_starknet7.ec.starkCurve.CURVE.n / 2n;
var Open = /* @__PURE__ */ Symbol("Open");
var All = /* @__PURE__ */ Symbol("All");
var SetupRequirement;
(function(SetupRequirement2) {
  SetupRequirement2[SetupRequirement2["Register"] = 0] = "Register";
  SetupRequirement2[SetupRequirement2["SetupChannel"] = 1] = "SetupChannel";
  SetupRequirement2[SetupRequirement2["SetupToken"] = 2] = "SetupToken";
  SetupRequirement2[SetupRequirement2["Ready"] = 3] = "Ready";
})(SetupRequirement || (SetupRequirement = {}));
function createEmptyRegistry() {
  return {
    channels: new AddressMap(),
    notes: new AddressMap(() => [])
  };
}
var WarningCode;
(function(WarningCode2) {
  WarningCode2["USER_LINKAGE"] = "USER_LINKAGE";
})(WarningCode || (WarningCode = {}));

// dist/internal/pool-simulator.js
var PoolSimulator = class {
  userAddress;
  userViewingKey;
  nextChannelIndex;
  // Per-user state: channels from this user to recipients, notes owned by this user
  channels = new AddressMap();
  notes = new AddressMap(() => /* @__PURE__ */ new Map());
  constructor(userAddress, userViewingKey, nextChannelIndex) {
    this.userAddress = userAddress;
    this.userViewingKey = userViewingKey;
    this.nextChannelIndex = nextChannelIndex;
  }
  /**
   * Execute a client action, updating the tracked state.
   * No encryption, no hashing, no balance checks.
   */
  execute(action) {
    switch (action.type) {
      case "SetViewingKey":
        this.handleSetViewingKey(action.input);
        break;
      case "OpenChannel":
        this.handleOpenChannel(action.input);
        break;
      case "OpenSubchannel":
        this.handleOpenSubchannel(action.input);
        break;
      case "Deposit":
        break;
      case "UseNote":
        this.handleUseNote(action.input);
        break;
      case "CreateEncNote":
        this.handleCreateEncNote(action.input);
        break;
      case "CreateOpenNote":
        this.handleCreateOpenNote(action.input);
        break;
      case "Withdraw":
        break;
      case "InvokeExternal":
        break;
      case "ComputeAndInvoke":
        break;
    }
  }
  /**
   * Get the channel to a recipient.
   */
  getChannel(recipient) {
    return this.channels.get(recipient);
  }
  getNextChannelIndex() {
    return this.nextChannelIndex;
  }
  /**
   * Check if a note exists by ID.
   */
  hasNote(token, noteId) {
    return this.notes.get(token)?.has(noteId) ?? false;
  }
  /**
   * Setup a channel from registry/discovery.
   * Used to initialize state before compilation.
   */
  setupChannel(recipientAddress, channel) {
    debugLog("pool-simulator", "setupChannel", "addr:", toHex(recipientAddress), "incoming publicKey:", channel.publicKey, "incoming key:", channel.key);
    this.channels.set(recipientAddress, new Channel(channel.publicKey, channel.key));
    if (!channel.key)
      return;
    for (const [token, nonces] of channel.tokens.entries()) {
      this.channels.get(recipientAddress).tokens.set(token, { ...nonces });
    }
  }
  /**
   * Setup a note from registry.
   * Used to initialize state before compilation.
   */
  setupNote(token, note) {
    this.notes.get(token).set(toBigInt(note.id), note);
  }
  /**
   * Export tracked state back to the registry.
   */
  updateRegistry(registry) {
    for (const [address, channel] of this.channels.entries()) {
      registry.channels.set(address, channel);
    }
    for (const [token, notes] of this.notes.entries()) {
      registry.notes.set(token, Array.from(notes.values()));
    }
    return registry;
  }
  handleSetViewingKey(_input) {
    if (this.userViewingKey !== void 0) {
      const publicKey = derivePublicKey(this.userViewingKey);
      assert(!this.channels.has(this.userAddress), () => `Channel already exists for ${toHex(this.userAddress)}`);
      this.channels.set(this.userAddress, new Channel(publicKey));
    }
    debugLog("pool-simulator", "SetViewingKey", toHex(this.userAddress));
  }
  handleOpenChannel(input) {
    const { recipient_addr } = input;
    const existingChannel = this.channels.get(recipient_addr);
    assert(existingChannel, () => `Channel not found for recipient ${toHex(recipient_addr)} \u2014 setupChannel must be called first`);
    const recipientPublicKey = existingChannel.publicKey;
    const channelKey = compute_channel_key(this.userAddress, toBigInt(this.userViewingKey), recipient_addr, toBigInt(recipientPublicKey));
    existingChannel.key = channelKey;
    this.nextChannelIndex++;
    debugLog("pool-simulator", "OpenChannel", toHex(this.userAddress), "->", toHex(recipient_addr));
  }
  handleOpenSubchannel(input) {
    const { recipient_addr, token, index } = input;
    const channel = this.channels.get(recipient_addr);
    channel.tokens.set(token, {
      tokenIndex: index,
      noteNonce: 0
    });
    debugLog("pool-simulator", "OpenSubchannel", toHex(this.userAddress), "->", toHex(recipient_addr), "token:", toHex(token));
  }
  handleUseNote(input) {
    const { token, channel_key, index } = input;
    const tokenNotes = this.notes.get(token);
    const noteId = compute_note_id(channel_key, token, index);
    tokenNotes.delete(noteId);
    debugLog("pool-simulator", "UseNote", toHex(this.userAddress), "token:", toHex(token));
  }
  handleCreateEncNote(input) {
    const { recipient_addr, recipient_public_key, token, amount, index, salt } = input;
    const senderChannel = this.channels.get(recipient_addr);
    senderChannel.incrementNoteNonce(token);
    if (recipient_addr === this.userAddress && this.userViewingKey) {
      const channelKey = compute_channel_key(this.userAddress, toBigInt(this.userViewingKey), recipient_addr, toBigInt(recipient_public_key));
      const noteId = compute_note_id(channelKey, token, index);
      this.notes.get(token).set(noteId, {
        id: noteId,
        amount: typeof amount === "bigint" ? amount : 0n,
        witness: {
          channelKey,
          nonce: index,
          r: salt
        },
        sender: this.userAddress
      });
    }
    debugLog("pool-simulator", "CreateEncNote", toHex(this.userAddress), "->", toHex(recipient_addr), "token:", toHex(token));
  }
  handleCreateOpenNote(input) {
    const { recipient_addr, token } = input;
    const senderChannel = this.channels.get(recipient_addr);
    senderChannel.incrementNoteNonce(token);
    debugLog("pool-simulator", "CreateOpenNote", toHex(this.userAddress), "->", toHex(recipient_addr), "token:", toHex(token));
  }
};

// dist/internal/compiler.js
var import_starknet8 = require("starknet");

// dist/internal/errors.js
var ReorgError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ReorgError";
  }
};
var ScreeningRejected = class extends Error {
  name = "ScreeningRejected";
  constructor(reason) {
    super(reason ? `Deposit screening rejected: ${reason}` : "Deposit screening rejected");
  }
};
var ScreeningUnavailable = class extends Error {
  name = "ScreeningUnavailable";
  constructor(reason) {
    super(reason ? `Deposit screening unavailable: ${reason}` : "Deposit screening unavailable");
  }
};
var SCREENING_BLOCKED_REASON = "address_blocked";
var SCREENING_UNAVAILABLE_REASON = "screening_unavailable";
function screeningErrorFromProvingError(error) {
  const TRANSACTION_REJECTED = 1e4;
  if (error.code !== TRANSACTION_REJECTED) {
    return void 0;
  }
  if (error.data === SCREENING_UNAVAILABLE_REASON) {
    return new ScreeningUnavailable(error.data);
  }
  if (error.data === SCREENING_BLOCKED_REASON) {
    return new ScreeningRejected(error.data);
  }
  return void 0;
}

// dist/internal/compiler.js
function addOpenChannel(actions, recipient) {
  actions.openChannels ??= [];
  const alreadyQueued = actions.openChannels.some((a) => a.recipient === recipient);
  if (!alreadyQueued) {
    actions.openChannels.push({
      recipient
    });
  }
}
var ActionCompiler = class {
  userAddress;
  userViewingKey;
  discoveryProvider;
  poolAddress;
  constructor(userAddress, userViewingKey, discoveryProvider, poolAddress = 0n) {
    this.userAddress = userAddress;
    this.userViewingKey = userViewingKey;
    this.discoveryProvider = discoveryProvider;
    this.poolAddress = poolAddress;
  }
  /**
   * Compile actions by resolving contexts, updating the registry, and producing ClientAction[].
   */
  async compile(actions, options) {
    try {
      return await this.compileOnce(actions, options);
    } catch (e) {
      if (e instanceof ReorgError) {
        debugLog("compiler", "compile", "reorg detected", e);
        if (options?.registry) {
          options.registry.notes.clear();
          options.registry.channels.clear();
          delete options.registry.cursor;
        }
        return await this.compileOnce(actions, options);
      }
      throw e;
    }
  }
  async compileOnce(actions, options) {
    const registry_ = options?.registry ?? createEmptyRegistry();
    const registry = options?.registryConst ? this.cloneRegistry(registry_) : registry_;
    const recipientsNeeded = this.getRecipientsNeeded(actions);
    const [{ channels, total }] = await Promise.all([
      this.resolveRecipientChannels(actions, options, registry, recipientsNeeded),
      this.resolveNotes(actions, registry, options)
    ]);
    debugLog("compiler", "compile", "post resolveNotes", registry?.notes?.size, actions);
    const pool = this.createPool(toBigInt(this.userViewingKey), registry, channels, total);
    const clientActions = this.transformToClientActions(actions, pool, recipientsNeeded, options);
    debugLog("compiler", "compile", "post transformToClientActions", clientActions);
    return {
      clientActions,
      registry: pool.updateRegistry(registry),
      warnings: this.checkWarnings(clientActions)
    };
  }
  checkWarnings(clientActions) {
    const warnings = [];
    if (clientActions.filter((action) => action.type === "OpenChannel").length > 1) {
      warnings.push({
        code: WarningCode.USER_LINKAGE,
        message: "Multiple open channel actions found"
      });
    }
    return warnings;
  }
  getRecipientsNeeded(actions) {
    const recipientsNeeded = new AddressMap([[this.userAddress, true]]);
    if (actions.openChannels) {
      for (const action of actions.openChannels) {
        recipientsNeeded.set(action.recipient, true);
      }
    }
    if (actions.openTokenChannels) {
      for (const action of actions.openTokenChannels) {
        recipientsNeeded.set(action.recipient, true);
      }
    }
    if (actions.createNotes) {
      for (const action of actions.createNotes) {
        recipientsNeeded.set(action.recipient, true);
      }
    }
    if (actions.surpluses) {
      for (const surplus of actions.surpluses) {
        recipientsNeeded.set(surplus.recipient, true);
      }
    }
    return recipientsNeeded;
  }
  createPool(privateKey, registry, channels, totalChannels) {
    const pool = new PoolSimulator(this.userAddress, privateKey, totalChannels ?? 0);
    debugLog("compiler", "setup discovered channels", channels);
    for (const [addr, channel] of channels?.entries() ?? []) {
      pool.setupChannel(addr, channel);
    }
    debugLog("compiler", "setup registry channels", registry?.channels);
    for (const [addr, channel] of registry?.channels?.entries() ?? []) {
      if (channels?.has(addr))
        continue;
      pool.setupChannel(addr, channel);
    }
    debugLog("compiler", "setup notes", registry?.notes);
    if (registry?.notes) {
      for (const [token, notes] of registry.notes.entries()) {
        for (const note of notes) {
          pool.setupNote(token, note);
        }
      }
    }
    return pool;
  }
  /**
   * Transform high-level Actions to low-level ClientAction[] using registry context.
   */
  transformToClientActions(actions, pool, recipientsNeeded, options) {
    const clientActions = {
      setViewingKey: void 0,
      openChannels: [],
      openTokenChannels: [],
      deposits: [],
      useNotes: [],
      createNotes: [],
      withdraws: [],
      invoke: void 0,
      computeAndInvoke: void 0
    };
    debugLog("compiler", "transformToClientActions", actions);
    if (options?.autoRegister && !pool.getChannel(this.userAddress)?.publicKey) {
      actions.setViewingKey = {
        type: "SetViewingKey",
        input: { random: generateRandom() }
      };
    }
    if (actions.setViewingKey && options?.autoSetup) {
      addOpenChannel(actions, this.userAddress);
    }
    for (const recipient of recipientsNeeded.keys()) {
      const channel = pool.getChannel(recipient);
      if (!channel?.key && options?.autoSetup) {
        addOpenChannel(actions, recipient);
      } else {
        debugLog("compiler", "channel found", recipient, channel);
      }
    }
    const execute = (input, arr = []) => {
      pool.execute(input);
      arr.push(input);
      return input;
    };
    if (actions.setViewingKey) {
      debugLog("compiler", "register", actions.setViewingKey);
      const input = {
        type: "SetViewingKey",
        input: {
          random: generateRandom()
        }
      };
      clientActions.setViewingKey = execute(input);
    }
    if (actions.openChannels) {
      const seenRecipients = /* @__PURE__ */ new Set();
      for (const action of actions.openChannels) {
        if (seenRecipients.has(action.recipient))
          continue;
        seenRecipients.add(action.recipient);
        debugLog("compiler", "open channel x", action.recipient);
        const channel = pool.getChannel(action.recipient);
        assert(channel, () => `Missing channel context for recipient ${toHex(action.recipient)}`);
        const input = {
          type: "OpenChannel",
          input: {
            recipient_addr: action.recipient,
            index: pool.getNextChannelIndex(),
            random: generateRandom(),
            salt: generateRandom()
          }
        };
        execute(input, clientActions.openChannels);
      }
    }
    const transformOpenSubchannel = (action, force) => {
      const channel = pool.getChannel(action.recipient);
      assert(channel, () => `Channel not found for recipient ${toHex(action.recipient)}`);
      debugLog("compiler", "open channel", action.recipient, action, channel);
      if (channel.tokens.has(action.token)) {
        return channel;
      }
      if (!force && !options?.autoSetup) {
        return channel;
      }
      const input = {
        type: "OpenSubchannel",
        input: {
          recipient_addr: action.recipient,
          recipient_public_key: channel.publicKey,
          channel_key: channel.key,
          index: channel.tokens.size,
          token: action.token,
          salt: generateRandom()
        }
      };
      execute(input, clientActions.openTokenChannels);
      return pool.getChannel(action.recipient);
    };
    if (actions.openTokenChannels) {
      for (const action of actions.openTokenChannels) {
        transformOpenSubchannel(action, true);
      }
    }
    if (actions.deposits) {
      for (const action of actions.deposits) {
        const input = {
          type: "Deposit",
          input: {
            token: action.token,
            amount: action.amount
            //noteId,
          }
        };
        execute(input, clientActions.deposits);
      }
    }
    if (actions.useNotes) {
      for (const action of actions.useNotes) {
        const input = {
          type: "UseNote",
          input: {
            channel_key: action.note.witness.channelKey,
            token: action.token,
            index: action.note.witness.nonce
          }
        };
        if (!pool.hasNote(action.token, toBigInt(action.note.id))) {
          pool.setupNote(action.token, action.note);
        }
        execute(input, clientActions.useNotes);
      }
    }
    if (actions.createNotes) {
      for (const action of actions.createNotes) {
        const channel = transformOpenSubchannel({
          recipient: action.recipient,
          token: action.token
        }, false);
        if (isOpenNote(action)) {
          const input = {
            type: "CreateOpenNote",
            input: {
              recipient_addr: action.recipient,
              recipient_public_key: channel.publicKey,
              token: action.token,
              index: channel.tokens.get(action.token).noteNonce,
              random: generateRandom()
            }
          };
          execute(input, clientActions.createNotes);
        } else {
          const input = {
            type: "CreateEncNote",
            input: {
              recipient_addr: action.recipient,
              recipient_public_key: channel.publicKey,
              token: action.token,
              amount: action.amount,
              index: channel.tokens.get(action.token).noteNonce,
              salt: generateRandom120()
            }
          };
          execute(input, clientActions.createNotes);
        }
      }
    }
    if (actions.withdraws) {
      for (const action of actions.withdraws) {
        const input = {
          type: "Withdraw",
          input: {
            to_addr: action.recipient,
            token: action.token,
            amount: action.amount,
            random: generateRandom()
          }
        };
        execute(input, clientActions.withdraws);
      }
    }
    assert(!(actions.invoke && actions.computeAndInvoke), () => "At most one invoke-phase action (.invoke() / .computeAndInvoke()) per transaction; already set.");
    if (actions.invoke) {
      const call = actions.invoke.callBuilder(this.invokeBuilderArgs(clientActions, pool));
      const calldata = import_starknet8.CallData.compile(call.calldata ?? []).map(toBigInt);
      const input = {
        type: "InvokeExternal",
        input: {
          contract_address: toBigInt(call.contractAddress),
          calldata
        }
      };
      clientActions.invoke = execute(input);
    }
    if (actions.computeAndInvoke) {
      const details = actions.computeAndInvoke.callBuilder(this.invokeBuilderArgs(clientActions, pool));
      const compute_additional_data = import_starknet8.CallData.compile(details.computeAdditionalData ?? []).map(toBigInt);
      const invoke_additional_data = import_starknet8.CallData.compile(details.invokeAdditionalData ?? []).map(toBigInt);
      const input = {
        type: "ComputeAndInvoke",
        input: {
          contract_address: toBigInt(details.contractAddress),
          compute_additional_data,
          invoke_additional_data
        }
      };
      clientActions.computeAndInvoke = execute(input);
    }
    return Object.values(clientActions).filter((action) => action !== void 0).flat();
  }
  // Shared arguments for `invoke` / `computeAndInvoke` call builders: the open notes created
  // in this batch (so the callee can deposit into them) and the withdrawals it can consume.
  invokeBuilderArgs(clientActions, pool) {
    const openNotes = clientActions.createNotes.flatMap((note) => {
      if (note.type !== "CreateOpenNote")
        return [];
      const channelKey = pool.getChannel(note.input.recipient_addr)?.key;
      assert(channelKey, () => `Missing channel key for open note recipient`);
      return [
        {
          noteId: compute_note_id(channelKey, note.input.token, note.input.index),
          token: note.input.token
        }
      ];
    });
    const withdrawals = clientActions.withdraws.map((withdraw) => ({
      recipient: withdraw.input.to_addr,
      token: withdraw.input.token,
      amount: withdraw.input.amount
    }));
    return { openNotes, withdrawals, poolAddress: this.poolAddress };
  }
  /**
   * Resolve recipient channels by discovering or using registry.
   */
  async resolveRecipientChannels(actions, options, registry, recipientsNeeded) {
    const recipientDiscoveryLevel = options?.autoDiscover?.channels;
    if (!recipientDiscoveryLevel) {
      const hasOpenChannels = actions.openChannels && actions.openChannels.length > 0;
      if (!hasOpenChannels && !options?.autoSetup) {
        return { channels: void 0, total: void 0 };
      }
    }
    let recipientsToDiscover;
    if (recipientDiscoveryLevel === "refresh") {
      recipientsToDiscover = [...recipientsNeeded.keys()];
    } else {
      recipientsToDiscover = [...recipientsNeeded.keys()].filter((r) => !registry.channels.has(r));
    }
    if (recipientsToDiscover.length === 0) {
      return { channels: void 0, total: void 0 };
    }
    const { channels, total } = await this.discoveryProvider.discoverChannels(this.userAddress, this.userViewingKey, recipientsToDiscover, { blockIdentifier: options?.provingBlockId });
    if (this.allOpen(channels, recipientsToDiscover)) {
      return { channels, total: void 0 };
    }
    const resolvedTotal = total ?? (await this.discoveryProvider.discoverChannels(this.userAddress, this.userViewingKey, "total-only", { blockIdentifier: options?.provingBlockId })).total;
    return { channels, total: resolvedTotal };
  }
  /**
   * Resolve notes by discovering and/or auto-selecting from registry.
   */
  async resolveNotes(actions, registry, options) {
    if (!actions.surpluses && !options?.autoSelectNotes)
      return;
    const balances = new AddressMap(() => 0n);
    const update = (token, amount) => {
      const current = balances.get(token);
      balances.set(token, current + amount);
    };
    if (actions.deposits) {
      for (const d of actions.deposits) {
        assert(d.amount > 0n, () => `Deposit amount must be positive`);
        if (d.noteId === void 0) {
          update(d.token, d.amount);
        }
      }
    }
    const usedNoteIds = new AdvancedMap({
      keyConverter: (key) => String(key)
    });
    if (actions.useNotes) {
      for (const u of actions.useNotes) {
        assert(u.note.amount > 0n, () => `Note ${u.note.id}: amount must be positive`);
        update(u.token, u.note.amount);
        usedNoteIds.set(u.note.id, true);
      }
    }
    if (actions.withdraws) {
      for (const w of actions.withdraws) {
        assert(w.amount > 0n, () => `Withdraw amount must be positive`);
        update(w.token, -w.amount);
      }
    }
    if (actions.createNotes) {
      for (const c of actions.createNotes) {
        assert(isOpen(c.amount) || c.amount > 0n, () => `Created note amount must be positive (token: ${toHex(c.token)})`);
        if (!isOpen(c.amount)) {
          update(c.token, -c.amount);
        }
      }
    }
    const notesDiscoveryLevel = options?.autoDiscover?.notes;
    if (notesDiscoveryLevel !== void 0) {
      const tokensToDiscover = (() => {
        if (notesDiscoveryLevel === "all")
          return void 0;
        return [...balances.entries()].filter(([token, balance]) => {
          const hasDeficit = balance < 0n;
          const isSweeping = options?.autoSelectNotes === "all" && // assume 'all' means the user wants to always "compress" their notes even if balance is 0
          actions.surpluses?.some((s) => s.token === token);
          if (!hasDeficit && !isSweeping)
            return false;
          return notesDiscoveryLevel === "refresh" || !registry.notes.has(token);
        }).map(([token]) => token);
      })();
      debugLog("compiler", "discovering notes", tokensToDiscover);
      if (!tokensToDiscover || tokensToDiscover.length > 0) {
        const { notes, cursor } = await this.discoveryProvider.discoverNotes(this.userAddress, this.userViewingKey, {
          cursor: registry.cursor,
          tokens: tokensToDiscover,
          blockIdentifier: options?.provingBlockId
        });
        for (const [token, discoveredNotes] of notes.entries()) {
          registry.notes.set(token, discoveredNotes);
        }
        registry.cursor = cursor;
      }
    }
    for (const token of balances.keys()) {
      let balance = balances.get(token);
      if (balance < 0n && options?.autoSelectNotes || options?.autoSelectNotes === "all") {
        const availableNotes = registry.notes.get(token) ?? [];
        actions.useNotes ??= [];
        for (const note of availableNotes.slice().sort((a, b) => Number(b.amount - a.amount))) {
          if (usedNoteIds.has(note.id))
            continue;
          actions.useNotes.push({ token, note });
          balance += note.amount;
          if (balance >= 0n && options?.autoSelectNotes !== "all")
            break;
        }
      }
      if (balance < 0n) {
        const totalAvailable = (registry.notes.get(token) ?? []).reduce((sum, note) => sum + note.amount, 0n);
        throw new Error(`Insufficient balance for token ${toHex(token)}: need ${-balance} more (total available: ${totalAvailable})`);
      }
      if (balance > 0n) {
        let surplusAction = actions.surpluses?.find((s) => s.token === token);
        if (!surplusAction) {
          if (actions.deposits?.some((d) => d.token === token)) {
            surplusAction = {
              recipient: this.userAddress,
              token,
              withdraw: false
            };
            actions.surpluses ??= [];
            actions.surpluses.push(surplusAction);
          } else {
            throw new Error(`Surplus of ${balance} found for token ${toHex(token)} but no surplus action found`);
          }
        }
        if (surplusAction.withdraw) {
          actions.withdraws ??= [];
          actions.withdraws.push({
            recipient: surplusAction.recipient,
            token,
            amount: balance
          });
        } else {
          actions.createNotes ??= [];
          actions.createNotes.push({
            recipient: surplusAction.recipient,
            token,
            amount: balance
          });
        }
      }
    }
  }
  cloneRegistry(registry) {
    const clonedChannels = new AddressMap();
    for (const [addr, channel] of registry.channels.entries()) {
      clonedChannels.set(addr, channel);
    }
    const clonedNotes = new AddressMap(() => []);
    for (const [addr, notes] of registry.notes.entries()) {
      clonedNotes.set(addr, [...notes]);
    }
    return { channels: clonedChannels, notes: clonedNotes };
  }
  allOpen(channels, recipients) {
    return recipients.every((recipient) => channels?.get(recipient)?.key !== void 0);
  }
};

// dist/internal/shadow-accounts.js
var import_starknet9 = require("starknet");

// dist/internal/anonymizer-abi.js
var ShadowAccountAnonymizerABI = [
  {
    type: "impl",
    name: "ShadowAccountAnonymizerImpl",
    interface_name: "shadow_account_anonymizer::shadow_account_anonymizer::IShadowAccountAnonymizer"
  },
  {
    type: "struct",
    name: "core::array::Span::<core::felt252>",
    members: [
      {
        name: "snapshot",
        type: "@core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    type: "struct",
    name: "core::starknet::account::Call",
    members: [
      {
        name: "to",
        type: "core::starknet::contract_address::ContractAddress"
      },
      {
        name: "selector",
        type: "core::felt252"
      },
      {
        name: "calldata",
        type: "core::array::Span::<core::felt252>"
      }
    ]
  },
  {
    type: "enum",
    name: "shadow_account_anonymizer::shadow_account_anonymizer::CollectPolicy",
    variants: [
      {
        name: "All",
        type: "()"
      },
      {
        name: "Diff",
        type: "()"
      },
      {
        name: "Exact",
        type: "core::integer::u128"
      }
    ]
  },
  {
    type: "struct",
    name: "shadow_account_anonymizer::shadow_account_anonymizer::OpenNote",
    members: [
      {
        name: "note_id",
        type: "core::felt252"
      },
      {
        name: "token",
        type: "core::starknet::contract_address::ContractAddress"
      },
      {
        name: "collect_policy",
        type: "shadow_account_anonymizer::shadow_account_anonymizer::CollectPolicy"
      }
    ]
  },
  {
    type: "struct",
    name: "core::array::Span::<shadow_account_anonymizer::shadow_account_anonymizer::OpenNote>",
    members: [
      {
        name: "snapshot",
        type: "@core::array::Array::<shadow_account_anonymizer::shadow_account_anonymizer::OpenNote>"
      }
    ]
  },
  {
    type: "struct",
    name: "privacy::objects::OpenNoteDeposit",
    members: [
      {
        name: "note_id",
        type: "core::felt252"
      },
      {
        name: "token",
        type: "core::starknet::contract_address::ContractAddress"
      },
      {
        name: "amount",
        type: "core::integer::u128"
      }
    ]
  },
  {
    type: "struct",
    name: "core::array::Span::<privacy::objects::OpenNoteDeposit>",
    members: [
      {
        name: "snapshot",
        type: "@core::array::Array::<privacy::objects::OpenNoteDeposit>"
      }
    ]
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      {
        name: "False",
        type: "()"
      },
      {
        name: "True",
        type: "()"
      }
    ]
  },
  {
    type: "struct",
    name: "shadow_account_anonymizer::shadow_account_anonymizer::ShadowAccountInfo",
    members: [
      {
        name: "nonce",
        type: "core::integer::u64"
      },
      {
        name: "address",
        type: "core::starknet::contract_address::ContractAddress"
      },
      {
        name: "is_deployed",
        type: "core::bool"
      }
    ]
  },
  {
    type: "struct",
    name: "core::array::Span::<shadow_account_anonymizer::shadow_account_anonymizer::ShadowAccountInfo>",
    members: [
      {
        name: "snapshot",
        type: "@core::array::Array::<shadow_account_anonymizer::shadow_account_anonymizer::ShadowAccountInfo>"
      }
    ]
  },
  {
    type: "interface",
    name: "shadow_account_anonymizer::shadow_account_anonymizer::IShadowAccountAnonymizer",
    items: [
      {
        type: "function",
        name: "privacy_compute",
        inputs: [
          {
            name: "identity_key",
            type: "core::felt252"
          },
          {
            name: "dapp_name",
            type: "core::felt252"
          },
          {
            name: "nonce",
            type: "core::felt252"
          }
        ],
        outputs: [
          {
            type: "core::felt252"
          }
        ],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "privacy_invoke_with_computation",
        inputs: [
          {
            name: "identity_commitment",
            type: "core::felt252"
          },
          {
            name: "calls",
            type: "core::array::Array::<core::starknet::account::Call>"
          },
          {
            name: "open_notes",
            type: "core::array::Span::<shadow_account_anonymizer::shadow_account_anonymizer::OpenNote>"
          }
        ],
        outputs: [
          {
            type: "core::array::Span::<privacy::objects::OpenNoteDeposit>"
          }
        ],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "get_shadow_accounts",
        inputs: [
          {
            name: "partial_commitment",
            type: "core::felt252"
          },
          {
            name: "start_nonce",
            type: "core::integer::u64"
          },
          {
            name: "end_nonce",
            type: "core::integer::u64"
          },
          {
            name: "until_undeployed",
            type: "core::bool"
          }
        ],
        outputs: [
          {
            type: "core::array::Span::<shadow_account_anonymizer::shadow_account_anonymizer::ShadowAccountInfo>"
          }
        ],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "get_shadow_account",
        inputs: [
          {
            name: "identity_commitment",
            type: "core::felt252"
          }
        ],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress"
          }
        ],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "get_privacy_contract",
        inputs: [],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress"
          }
        ],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "get_shadow_account_class_hash",
        inputs: [],
        outputs: [
          {
            type: "core::starknet::class_hash::ClassHash"
          }
        ],
        state_mutability: "view"
      }
    ]
  },
  {
    type: "impl",
    name: "ReplaceabilityImpl",
    interface_name: "starkware_utils::components::replaceability::interface::IReplaceable"
  },
  {
    type: "struct",
    name: "starkware_utils::components::replaceability::interface::EICData",
    members: [
      {
        name: "eic_hash",
        type: "core::starknet::class_hash::ClassHash"
      },
      {
        name: "eic_init_data",
        type: "core::array::Span::<core::felt252>"
      }
    ]
  },
  {
    type: "enum",
    name: "core::option::Option::<starkware_utils::components::replaceability::interface::EICData>",
    variants: [
      {
        name: "Some",
        type: "starkware_utils::components::replaceability::interface::EICData"
      },
      {
        name: "None",
        type: "()"
      }
    ]
  },
  {
    type: "struct",
    name: "starkware_utils::components::replaceability::interface::ImplementationData",
    members: [
      {
        name: "impl_hash",
        type: "core::starknet::class_hash::ClassHash"
      },
      {
        name: "eic_data",
        type: "core::option::Option::<starkware_utils::components::replaceability::interface::EICData>"
      },
      {
        name: "final",
        type: "core::bool"
      }
    ]
  },
  {
    type: "interface",
    name: "starkware_utils::components::replaceability::interface::IReplaceable",
    items: [
      {
        type: "function",
        name: "get_upgrade_delay",
        inputs: [],
        outputs: [
          {
            type: "core::integer::u64"
          }
        ],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "get_impl_activation_time",
        inputs: [
          {
            name: "implementation_data",
            type: "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        outputs: [
          {
            type: "core::integer::u64"
          }
        ],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "add_new_implementation",
        inputs: [
          {
            name: "implementation_data",
            type: "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "add_new_implementation_unsafe",
        inputs: [
          {
            name: "implementation_data",
            type: "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "remove_implementation",
        inputs: [
          {
            name: "implementation_data",
            type: "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "replace_to",
        inputs: [
          {
            name: "implementation_data",
            type: "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "validate_upgradeability",
        inputs: [
          {
            name: "implementation_data",
            type: "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        outputs: [],
        state_mutability: "external"
      }
    ]
  },
  {
    type: "impl",
    name: "CommonRolesImpl",
    interface_name: "starkware_utils::components::roles::interface::ICommonRoles"
  },
  {
    type: "enum",
    name: "starkware_utils::components::roles::interface::Role",
    variants: [
      {
        name: "AppGovernor",
        type: "()"
      },
      {
        name: "AppRoleAdmin",
        type: "()"
      },
      {
        name: "GovernanceAdmin",
        type: "()"
      },
      {
        name: "Operator",
        type: "()"
      },
      {
        name: "TokenAdmin",
        type: "()"
      },
      {
        name: "UpgradeAgent",
        type: "()"
      },
      {
        name: "UpgradeGovernor",
        type: "()"
      },
      {
        name: "SecurityAdmin",
        type: "()"
      },
      {
        name: "SecurityAgent",
        type: "()"
      },
      {
        name: "SecurityGovernor",
        type: "()"
      }
    ]
  },
  {
    type: "struct",
    name: "core::array::Span::<core::starknet::contract_address::ContractAddress>",
    members: [
      {
        name: "snapshot",
        type: "@core::array::Array::<core::starknet::contract_address::ContractAddress>"
      }
    ]
  },
  {
    type: "interface",
    name: "starkware_utils::components::roles::interface::ICommonRoles",
    items: [
      {
        type: "function",
        name: "grant_role",
        inputs: [
          {
            name: "role",
            type: "starkware_utils::components::roles::interface::Role"
          },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "revoke_role",
        inputs: [
          {
            name: "role",
            type: "starkware_utils::components::roles::interface::Role"
          },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "has_role",
        inputs: [
          {
            name: "role",
            type: "starkware_utils::components::roles::interface::Role"
          },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress"
          }
        ],
        outputs: [
          {
            type: "core::bool"
          }
        ],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "renounce",
        inputs: [
          {
            name: "role",
            type: "starkware_utils::components::roles::interface::Role"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "reclaim_legacy_roles",
        inputs: [],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "reclaim_legacy_roles_for_accounts",
        inputs: [
          {
            name: "accounts",
            type: "core::array::Span::<core::starknet::contract_address::ContractAddress>"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "disable_legacy_role_reclaim",
        inputs: [],
        outputs: [],
        state_mutability: "external"
      }
    ]
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      {
        name: "privacy_contract",
        type: "core::starknet::contract_address::ContractAddress"
      },
      {
        name: "shadow_account_class_hash",
        type: "core::starknet::class_hash::ClassHash"
      },
      {
        name: "governance_admin",
        type: "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    type: "event",
    name: "starkware_utils::components::replaceability::interface::ImplementationAdded",
    kind: "struct",
    members: [
      {
        name: "implementation_data",
        type: "starkware_utils::components::replaceability::interface::ImplementationData",
        kind: "data"
      }
    ]
  },
  {
    type: "event",
    name: "starkware_utils::components::replaceability::interface::ImplementationRemoved",
    kind: "struct",
    members: [
      {
        name: "implementation_data",
        type: "starkware_utils::components::replaceability::interface::ImplementationData",
        kind: "data"
      }
    ]
  },
  {
    type: "event",
    name: "starkware_utils::components::replaceability::interface::ImplementationReplaced",
    kind: "struct",
    members: [
      {
        name: "implementation_data",
        type: "starkware_utils::components::replaceability::interface::ImplementationData",
        kind: "data"
      }
    ]
  },
  {
    type: "event",
    name: "starkware_utils::components::replaceability::interface::ImplementationFinalized",
    kind: "struct",
    members: [
      {
        name: "impl_hash",
        type: "core::starknet::class_hash::ClassHash",
        kind: "data"
      }
    ]
  },
  {
    type: "event",
    name: "starkware_utils::components::replaceability::replaceability::ReplaceabilityComponent::Event",
    kind: "enum",
    variants: [
      {
        name: "ImplementationAdded",
        type: "starkware_utils::components::replaceability::interface::ImplementationAdded",
        kind: "nested"
      },
      {
        name: "ImplementationRemoved",
        type: "starkware_utils::components::replaceability::interface::ImplementationRemoved",
        kind: "nested"
      },
      {
        name: "ImplementationReplaced",
        type: "starkware_utils::components::replaceability::interface::ImplementationReplaced",
        kind: "nested"
      },
      {
        name: "ImplementationFinalized",
        type: "starkware_utils::components::replaceability::interface::ImplementationFinalized",
        kind: "nested"
      }
    ]
  },
  {
    type: "event",
    name: "starkware_utils::components::common_roles::common_roles::CommonRolesComponent::Event",
    kind: "enum",
    variants: []
  },
  {
    type: "event",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
    kind: "struct",
    members: [
      {
        name: "role",
        type: "core::felt252",
        kind: "data"
      },
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data"
      },
      {
        name: "sender",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data"
      }
    ]
  },
  {
    type: "event",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGrantedWithDelay",
    kind: "struct",
    members: [
      {
        name: "role",
        type: "core::felt252",
        kind: "data"
      },
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data"
      },
      {
        name: "sender",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data"
      },
      {
        name: "delay",
        type: "core::integer::u64",
        kind: "data"
      }
    ]
  },
  {
    type: "event",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
    kind: "struct",
    members: [
      {
        name: "role",
        type: "core::felt252",
        kind: "data"
      },
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data"
      },
      {
        name: "sender",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data"
      }
    ]
  },
  {
    type: "event",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
    kind: "struct",
    members: [
      {
        name: "role",
        type: "core::felt252",
        kind: "data"
      },
      {
        name: "previous_admin_role",
        type: "core::felt252",
        kind: "data"
      },
      {
        name: "new_admin_role",
        type: "core::felt252",
        kind: "data"
      }
    ]
  },
  {
    type: "event",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
    kind: "enum",
    variants: [
      {
        name: "RoleGranted",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
        kind: "nested"
      },
      {
        name: "RoleGrantedWithDelay",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGrantedWithDelay",
        kind: "nested"
      },
      {
        name: "RoleRevoked",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
        kind: "nested"
      },
      {
        name: "RoleAdminChanged",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
        kind: "nested"
      }
    ]
  },
  {
    type: "event",
    name: "openzeppelin_introspection::src5::SRC5Component::Event",
    kind: "enum",
    variants: []
  },
  {
    type: "event",
    name: "shadow_account_anonymizer::shadow_account_anonymizer::ShadowAccountAnonymizer::ShadowAccountDeployed",
    kind: "struct",
    members: [
      {
        name: "identity_commitment",
        type: "core::felt252",
        kind: "key"
      },
      {
        name: "shadow_account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key"
      }
    ]
  },
  {
    type: "event",
    name: "shadow_account_anonymizer::shadow_account_anonymizer::ShadowAccountAnonymizer::Event",
    kind: "enum",
    variants: [
      {
        name: "ReplaceabilityEvent",
        type: "starkware_utils::components::replaceability::replaceability::ReplaceabilityComponent::Event",
        kind: "flat"
      },
      {
        name: "CommonRolesEvent",
        type: "starkware_utils::components::common_roles::common_roles::CommonRolesComponent::Event",
        kind: "flat"
      },
      {
        name: "AccessControlEvent",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
        kind: "flat"
      },
      {
        name: "SRC5Event",
        type: "openzeppelin_introspection::src5::SRC5Component::Event",
        kind: "flat"
      },
      {
        name: "ShadowAccountDeployed",
        type: "shadow_account_anonymizer::shadow_account_anonymizer::ShadowAccountAnonymizer::ShadowAccountDeployed",
        kind: "nested"
      }
    ]
  }
];

// dist/internal/shadow-accounts.js
function encodeDappName(dappName) {
  return typeof dappName === "string" ? toBigInt(import_starknet9.shortString.encodeShortString(dappName)) : toBigInt(dappName);
}
var ShadowAccountsBuilderImpl = class {
  params;
  dappName;
  shadowAccountAnonymizerAddress;
  constructor(params) {
    this.params = params;
    this.dappName = encodeDappName(params.dappName);
    this.shadowAccountAnonymizerAddress = toBigInt(params.shadowAccountAnonymizerAddress);
  }
  invoke(nonce, options) {
    const { dappName, shadowAccountAnonymizerAddress } = this;
    const nonceFelt = toBigInt(nonce);
    const anonymizerCalls = options.calls.map((call) => ({
      to: call.contractAddress,
      selector: import_starknet9.hash.getSelectorFromName(call.entrypoint),
      calldata: import_starknet9.CallData.compile(call.calldata ?? [])
    }));
    const collectPolicy = toCollectPolicyEnum(options.collectPolicy ?? { type: "all" });
    return this.params.builder.computeAndInvoke((args) => {
      const openNotes = args.openNotes.map((note) => ({
        note_id: note.noteId,
        token: note.token,
        collect_policy: collectPolicy
      }));
      const invokeAdditionalData = new import_starknet9.CallData(ShadowAccountAnonymizerABI).compile("privacy_invoke_with_computation", [0n, anonymizerCalls, openNotes]).slice(1).map(toBigInt);
      return {
        contractAddress: toHex(shadowAccountAnonymizerAddress),
        computeAdditionalData: [dappName, nonceFelt],
        invokeAdditionalData
      };
    });
  }
  async partialCommitment() {
    const viewingKey = await this.params.getViewingKey();
    const identityKey = compute_identity_key(this.params.user, toBigInt(viewingKey), this.shadowAccountAnonymizerAddress);
    return hash(identityKey, this.dappName);
  }
  async commitment(nonce) {
    return hash(await this.partialCommitment(), toBigInt(nonce));
  }
};
function toCollectPolicyEnum(policy) {
  return new import_starknet9.CairoCustomEnum({
    All: policy.type === "all" ? {} : void 0,
    Diff: policy.type === "diff" ? {} : void 0,
    Exact: policy.type === "exact" ? policy.amount : void 0
  });
}

// dist/internal/builders.js
var TokenOperationsBuilderImpl = class {
  parentBuilder;
  // Actions stored without context - context resolved during execute
  openTokenChannels = [];
  useNotes = [];
  deposits = [];
  createNotes = [];
  withdraws = [];
  // Surplus recipient (overrides parent builder's surplus recipient for this token)
  surplusAction;
  token;
  constructor(parentBuilder, token) {
    this.parentBuilder = parentBuilder;
    this.token = toBigInt(token);
    debugLog("builder", `TokenBuilder created for ${token}`);
  }
  setup(recipient) {
    debugLog("builder", `TokenBuilder.setup for ${this.token} -> ${recipient}`);
    this.openTokenChannels.push({ recipient: toBigInt(recipient), token: this.token });
    return this;
  }
  inputs(...notes) {
    for (const note of notes) {
      this.useNotes.push({ token: this.token, note });
    }
    return this;
  }
  deposit(...inputs) {
    debugLog("builder", `TokenBuilder.deposit for ${this.token}`, inputs);
    for (const input of inputs) {
      this.deposits.push({ token: this.token, amount: input.amount });
      if (input.recipient !== void 0) {
        this.createNotes.push({
          token: this.token,
          amount: input.amount,
          recipient: toBigInt(input.recipient)
        });
      }
    }
    return this;
  }
  withdraw(...outputs) {
    for (const output of outputs) {
      this.withdraws.push({
        token: this.token,
        recipient: toBigInt(output.recipient ?? this.parentBuilder.userAddress),
        amount: output.amount
      });
    }
    return this;
  }
  transfer(...outputs) {
    for (const output of outputs) {
      if (isOpenNote(output)) {
        this.createNotes.push({
          token: this.token,
          recipient: toBigInt(output.recipient),
          amount: Open
        });
      } else {
        this.createNotes.push({
          token: this.token,
          recipient: toBigInt(output.recipient),
          amount: output.amount
        });
      }
    }
    return this;
  }
  surplusTo(recipient, withdraw) {
    this.surplusAction = { recipient: toBigInt(recipient), token: this.token, withdraw };
    return this;
  }
  with(token, ops) {
    if (ops) {
      ops(this.parentBuilder.with(token));
      return this;
    }
    return this.parentBuilder.with(token);
  }
  done() {
    return this.parentBuilder;
  }
  async execute(options) {
    return this.parentBuilder.execute(options);
  }
  async createProofInvocation(options) {
    return this.parentBuilder.createProofInvocation(options);
  }
  async simulate(options) {
    return this.parentBuilder.simulate(options);
  }
};
var PrivateTransfersBuilderImpl = class {
  transfers;
  userAddress;
  shadowAccountDeps;
  setViewingKey;
  openChannels = [];
  invokeExternal;
  computeAndInvokeAction;
  tokenBuilders = new AddressMap((token) => new TokenOperationsBuilderImpl(this, token));
  // Default surplus recipient for all tokens
  defaultSurplusAction;
  // Options passed at build time
  buildOptions;
  constructor(transfers, userAddress, options, shadowAccountDeps) {
    this.transfers = transfers;
    this.userAddress = userAddress;
    this.shadowAccountDeps = shadowAccountDeps;
    this.buildOptions = options;
  }
  register() {
    this.setViewingKey = {};
    return this;
  }
  setup(recipient) {
    this.openChannels.push({ recipient: toBigInt(recipient) });
    return this;
  }
  invoke(callBuilder) {
    this.assertNoInvokePhaseAction();
    this.invokeExternal = {
      callBuilder
    };
    return this;
  }
  computeAndInvoke(callBuilder) {
    this.assertNoInvokePhaseAction();
    this.computeAndInvokeAction = {
      callBuilder
    };
    return this;
  }
  // `invoke` and `computeAndInvoke` both occupy the single invoke phase the contract allows
  // per transaction, so only one of them may be queued.
  assertNoInvokePhaseAction() {
    if (this.invokeExternal !== void 0 || this.computeAndInvokeAction !== void 0) {
      throw new Error("At most one invoke-phase action (.invoke() / .computeAndInvoke()) per transaction; already set.");
    }
  }
  shadowAccounts(dappName) {
    const deps = this.shadowAccountDeps;
    if (deps?.anonymizerAddress === void 0) {
      throw new Error("shadowAccounts(...) requires `shadowAccountAnonymizerAddress` in the createPrivateTransfers config.");
    }
    return new ShadowAccountsBuilderImpl({
      builder: this,
      dappName,
      shadowAccountAnonymizerAddress: deps.anonymizerAddress,
      user: toBigInt(this.userAddress),
      getViewingKey: deps.getViewingKey
    });
  }
  surplusTo(recipient, withdraw) {
    this.defaultSurplusAction = { recipient: toBigInt(recipient), token: void 0, withdraw };
    return this;
  }
  with(token, ops) {
    const tokenBuilder = this.tokenBuilders.get(token);
    if (ops) {
      ops(tokenBuilder);
      return this;
    }
    return tokenBuilder;
  }
  collectActionsAndOptions(options) {
    const mergedOptions = {
      ...this.buildOptions,
      ...options,
      autoDiscover: {
        ...this.buildOptions?.autoDiscover,
        ...options?.autoDiscover
      }
    };
    const openTokenChannels = [];
    const deposits = [];
    const useNotes = [];
    const createNotes = [];
    const withdraws = [];
    const surpluses = [];
    for (const [token, tokenBuilder] of this.tokenBuilders.entries()) {
      debugLog("builder", `Collecting actions for ${token}`, {
        openTokenChannels: tokenBuilder.openTokenChannels,
        deposits: tokenBuilder.deposits.length
      });
      openTokenChannels.push(...tokenBuilder.openTokenChannels);
      deposits.push(...tokenBuilder.deposits);
      useNotes.push(...tokenBuilder.useNotes);
      createNotes.push(...tokenBuilder.createNotes);
      withdraws.push(...tokenBuilder.withdraws);
      const surplusToAction = tokenBuilder.surplusAction ?? this.defaultSurplusAction;
      if (surplusToAction) {
        surpluses.push({ ...surplusToAction, token });
      }
    }
    const actions = {
      setViewingKey: this.setViewingKey,
      openChannels: this.openChannels,
      openTokenChannels,
      deposits,
      useNotes,
      createNotes,
      withdraws,
      surpluses,
      invoke: this.invokeExternal,
      computeAndInvoke: this.computeAndInvokeAction
    };
    return { actions, mergedOptions };
  }
  async execute(options) {
    debugLog("builder", "PrivateTransfersBuilderImpl.execute called");
    const { actions, mergedOptions } = this.collectActionsAndOptions(options);
    return this.transfers.execute(actions, mergedOptions);
  }
  async createProofInvocation(options) {
    debugLog("builder", "PrivateTransfersBuilderImpl.createProofInvocation called");
    const { actions, mergedOptions } = this.collectActionsAndOptions(options);
    return this.transfers.createProofInvocation(actions, mergedOptions);
  }
  async simulate(options) {
    debugLog("builder", "PrivateTransfersBuilderImpl.simulate called");
    const { actions, mergedOptions } = this.collectActionsAndOptions();
    return this.transfers.simulate(actions, { ...mergedOptions, ...options });
  }
};

// dist/internal/abstract-private-transfers.js
var AbstractPrivateTransfers = class {
  viewingKeyProvider;
  discoveryProvider;
  shadowAccountAnonymizerAddress;
  user;
  /** No-op in base; override in subclass when using a provider that caches nonce. */
  invalidateProofNonceCache() {
  }
  constructor(userAddress, viewingKeyProvider, discoveryProvider, shadowAccountAnonymizerAddress) {
    this.viewingKeyProvider = viewingKeyProvider;
    this.discoveryProvider = discoveryProvider;
    this.shadowAccountAnonymizerAddress = shadowAccountAnonymizerAddress;
    this.user = toBigInt(userAddress);
  }
  /**
   * Get the current viewing key from the provider
   */
  async getViewingKey() {
    return await this.viewingKeyProvider.getViewingKey();
  }
  /**
   * Discover unspent notes per token
   */
  async discoverNotes(params = {}) {
    return this.discoveryProvider.discoverNotes(this.user, await this.getViewingKey(), params);
  }
  /**
   * Discover channels for one or more recipients
   */
  async discoverChannels(recipients, params) {
    return this.discoveryProvider.discoverChannels(this.user, await this.getViewingKey(), Array.isArray(recipients) ? recipients.map(toBigInt) : recipients, params);
  }
  /**
   * Check the setup requirements for a recipient and token
   */
  async discoverRequirement(recipient, token) {
    return this.discoveryProvider.discoverRequirement(this.user, await this.getViewingKey(), toBigInt(recipient), toBigInt(token));
  }
  /**
   * Create a builder for batching multiple operations
   */
  build(options) {
    return new PrivateTransfersBuilderImpl(this, this.user, options, {
      anonymizerAddress: this.shadowAccountAnonymizerAddress,
      getViewingKey: () => this.getViewingKey()
    });
  }
  /**
   * Execute raw actions: compile, prove, and return the call+proof.
   */
  async execute(actions, options) {
    const invocationResult = await this.createProofInvocation(actions, options);
    return this.executeWithInvocation(invocationResult, options?.provingBlockId);
  }
  async simulate(_actions, _options) {
    throw new Error("simulate() is not supported by this implementation");
  }
};

// dist/internal/mock-proving.js
var import_starknet12 = require("starknet");

// dist/internal/proof-invocation-factory.js
var import_starknet11 = require("starknet");

// dist/internal/serialization.js
var import_starknet10 = require("starknet");

// dist/internal/client-actions.js
var CLIENT_ACTION_TYPES = [
  "SetViewingKey",
  "OpenChannel",
  "OpenSubchannel",
  "CreateEncNote",
  "CreateOpenNote",
  "Deposit",
  "UseNote",
  "Withdraw",
  "InvokeExternal",
  "ComputeAndInvoke"
];

// dist/internal/serialization.js
function toCairoEnum(action) {
  const variants = {};
  for (const variant of CLIENT_ACTION_TYPES) {
    variants[variant] = variant === action.type ? action.input : void 0;
  }
  return new import_starknet10.CairoCustomEnum(variants);
}
function serializeClientActions(actions) {
  return actions.map(toCairoEnum);
}

// dist/internal/abi.js
var PrivacyPoolABI = [
  {
    "type": "impl",
    "name": "ClientImpl",
    "interface_name": "privacy::interface::IClient"
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::felt252>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::starknet::account::Call",
    "members": [
      {
        "name": "to",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "selector",
        "type": "core::felt252"
      },
      {
        "name": "calldata",
        "type": "core::array::Span::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::SetViewingKeyInput",
    "members": [
      {
        "name": "random",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::OpenChannelInput",
    "members": [
      {
        "name": "recipient_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "index",
        "type": "core::integer::u32"
      },
      {
        "name": "random",
        "type": "core::felt252"
      },
      {
        "name": "salt",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::OpenSubchannelInput",
    "members": [
      {
        "name": "recipient_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "recipient_public_key",
        "type": "core::felt252"
      },
      {
        "name": "channel_key",
        "type": "core::felt252"
      },
      {
        "name": "index",
        "type": "core::integer::u32"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "salt",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::CreateEncNoteInput",
    "members": [
      {
        "name": "recipient_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "recipient_public_key",
        "type": "core::felt252"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u128"
      },
      {
        "name": "index",
        "type": "core::integer::u32"
      },
      {
        "name": "salt",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::CreateOpenNoteInput",
    "members": [
      {
        "name": "recipient_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "recipient_public_key",
        "type": "core::felt252"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "index",
        "type": "core::integer::u32"
      },
      {
        "name": "random",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::DepositInput",
    "members": [
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::UseNoteInput",
    "members": [
      {
        "name": "channel_key",
        "type": "core::felt252"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "index",
        "type": "core::integer::u32"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::WithdrawInput",
    "members": [
      {
        "name": "to_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u128"
      },
      {
        "name": "random",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::InvokeExternalInput",
    "members": [
      {
        "name": "contract_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "calldata",
        "type": "core::array::Span::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::ComputeAndInvokeInput",
    "members": [
      {
        "name": "contract_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "compute_additional_data",
        "type": "core::array::Span::<core::felt252>"
      },
      {
        "name": "invoke_additional_data",
        "type": "core::array::Span::<core::felt252>"
      }
    ]
  },
  {
    "type": "enum",
    "name": "privacy::actions::ClientAction",
    "variants": [
      {
        "name": "SetViewingKey",
        "type": "privacy::actions::SetViewingKeyInput"
      },
      {
        "name": "OpenChannel",
        "type": "privacy::actions::OpenChannelInput"
      },
      {
        "name": "OpenSubchannel",
        "type": "privacy::actions::OpenSubchannelInput"
      },
      {
        "name": "CreateEncNote",
        "type": "privacy::actions::CreateEncNoteInput"
      },
      {
        "name": "CreateOpenNote",
        "type": "privacy::actions::CreateOpenNoteInput"
      },
      {
        "name": "Deposit",
        "type": "privacy::actions::DepositInput"
      },
      {
        "name": "UseNote",
        "type": "privacy::actions::UseNoteInput"
      },
      {
        "name": "Withdraw",
        "type": "privacy::actions::WithdrawInput"
      },
      {
        "name": "InvokeExternal",
        "type": "privacy::actions::InvokeExternalInput"
      },
      {
        "name": "ComputeAndInvoke",
        "type": "privacy::actions::ComputeAndInvokeInput"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::array::Span::<privacy::actions::ClientAction>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<privacy::actions::ClientAction>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::WriteOnceInput",
    "members": [
      {
        "name": "storage_address",
        "type": "core::felt252"
      },
      {
        "name": "value",
        "type": "core::array::Span::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::objects::EncChannelInfo",
    "members": [
      {
        "name": "ephemeral_pubkey",
        "type": "core::felt252"
      },
      {
        "name": "enc_channel_key",
        "type": "core::felt252"
      },
      {
        "name": "enc_sender_addr",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::AppendInput",
    "members": [
      {
        "name": "recipient_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "enc_channel_info",
        "type": "privacy::objects::EncChannelInfo"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::TransferFromInput",
    "members": [
      {
        "name": "from_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::TransferToInput",
    "members": [
      {
        "name": "to_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::objects::EncPrivateKey",
    "members": [
      {
        "name": "auditor_public_key",
        "type": "core::felt252"
      },
      {
        "name": "ephemeral_pubkey",
        "type": "core::felt252"
      },
      {
        "name": "enc_private_key",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::events::ViewingKeySet",
    "members": [
      {
        "name": "user_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "public_key",
        "type": "core::felt252"
      },
      {
        "name": "enc_private_key",
        "type": "privacy::objects::EncPrivateKey"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::objects::EncUserAddr",
    "members": [
      {
        "name": "auditor_public_key",
        "type": "core::felt252"
      },
      {
        "name": "ephemeral_pubkey",
        "type": "core::felt252"
      },
      {
        "name": "enc_user_addr",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::events::Withdrawal",
    "members": [
      {
        "name": "enc_user_addr",
        "type": "privacy::objects::EncUserAddr"
      },
      {
        "name": "to_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::events::Deposit",
    "members": [
      {
        "name": "user_addr",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::events::OpenNoteCreated",
    "members": [
      {
        "name": "enc_recipient_addr",
        "type": "privacy::objects::EncUserAddr"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "note_id",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::events::EncNoteCreated",
    "members": [
      {
        "name": "note_id",
        "type": "core::felt252"
      },
      {
        "name": "packed_value",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::events::NoteUsed",
    "members": [
      {
        "name": "nullifier",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::actions::InvokeInput",
    "members": [
      {
        "name": "contract_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "calldata",
        "type": "core::array::Span::<core::felt252>"
      }
    ]
  },
  {
    "type": "enum",
    "name": "privacy::actions::ServerAction",
    "variants": [
      {
        "name": "WriteOnce",
        "type": "privacy::actions::WriteOnceInput"
      },
      {
        "name": "Append",
        "type": "privacy::actions::AppendInput"
      },
      {
        "name": "TransferFrom",
        "type": "privacy::actions::TransferFromInput"
      },
      {
        "name": "TransferTo",
        "type": "privacy::actions::TransferToInput"
      },
      {
        "name": "EmitViewingKeySet",
        "type": "privacy::events::ViewingKeySet"
      },
      {
        "name": "EmitWithdrawal",
        "type": "privacy::events::Withdrawal"
      },
      {
        "name": "EmitDeposit",
        "type": "privacy::events::Deposit"
      },
      {
        "name": "EmitOpenNoteCreated",
        "type": "privacy::events::OpenNoteCreated"
      },
      {
        "name": "EmitEncNoteCreated",
        "type": "privacy::events::EncNoteCreated"
      },
      {
        "name": "EmitNoteUsed",
        "type": "privacy::events::NoteUsed"
      },
      {
        "name": "Invoke",
        "type": "privacy::actions::InvokeInput"
      },
      {
        "name": "InvokeWithComputation",
        "type": "privacy::actions::InvokeInput"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::array::Span::<privacy::actions::ServerAction>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<privacy::actions::ServerAction>"
      }
    ]
  },
  {
    "type": "interface",
    "name": "privacy::interface::IClient",
    "items": [
      {
        "type": "function",
        "name": "__execute__",
        "inputs": [
          {
            "name": "calls",
            "type": "core::array::Array::<core::starknet::account::Call>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "compile_and_panic",
        "inputs": [
          {
            "name": "user_addr",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "user_private_key",
            "type": "core::felt252"
          },
          {
            "name": "client_actions",
            "type": "core::array::Span::<privacy::actions::ClientAction>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "compile_actions",
        "inputs": [
          {
            "name": "user_addr",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "user_private_key",
            "type": "core::felt252"
          },
          {
            "name": "client_actions",
            "type": "core::array::Span::<privacy::actions::ClientAction>"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Span::<privacy::actions::ServerAction>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "__validate__",
        "inputs": [
          {
            "name": "calls",
            "type": "core::array::Array::<core::starknet::account::Call>"
          }
        ],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "impl",
    "name": "ServerImpl",
    "interface_name": "privacy::interface::IServer"
  },
  {
    "type": "struct",
    "name": "privacy::snip12::ScreeningAttestation",
    "members": [
      {
        "name": "issued_at",
        "type": "core::integer::u64"
      },
      {
        "name": "signature",
        "type": "(core::felt252, core::felt252)"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::option::Option::<privacy::snip12::ScreeningAttestation>",
    "variants": [
      {
        "name": "Some",
        "type": "privacy::snip12::ScreeningAttestation"
      },
      {
        "name": "None",
        "type": "()"
      }
    ]
  },
  {
    "type": "interface",
    "name": "privacy::interface::IServer",
    "items": [
      {
        "type": "function",
        "name": "apply_actions",
        "inputs": [
          {
            "name": "actions",
            "type": "core::array::Span::<privacy::actions::ServerAction>"
          },
          {
            "name": "screening",
            "type": "core::option::Option::<privacy::snip12::ScreeningAttestation>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "ViewsImpl",
    "interface_name": "privacy::interface::IViews"
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::objects::EncSubchannelInfo",
    "members": [
      {
        "name": "salt",
        "type": "core::felt252"
      },
      {
        "name": "enc_token",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::objects::EncOutgoingChannelInfo",
    "members": [
      {
        "name": "salt",
        "type": "core::felt252"
      },
      {
        "name": "enc_recipient_addr",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "privacy::objects::Note",
    "members": [
      {
        "name": "packed_value",
        "type": "core::felt252"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "interface",
    "name": "privacy::interface::IViews",
    "items": [
      {
        "type": "function",
        "name": "channel_exists",
        "inputs": [
          {
            "name": "channel_marker",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_num_of_channels",
        "inputs": [
          {
            "name": "recipient_addr",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_channel_info",
        "inputs": [
          {
            "name": "recipient_addr",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "channel_index",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [
          {
            "type": "privacy::objects::EncChannelInfo"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "subchannel_exists",
        "inputs": [
          {
            "name": "subchannel_marker",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_subchannel_info",
        "inputs": [
          {
            "name": "subchannel_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "privacy::objects::EncSubchannelInfo"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_outgoing_channel_info",
        "inputs": [
          {
            "name": "outgoing_channel_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "privacy::objects::EncOutgoingChannelInfo"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_note",
        "inputs": [
          {
            "name": "note_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "privacy::objects::Note"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "nullifier_exists",
        "inputs": [
          {
            "name": "nullifier",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_public_key",
        "inputs": [
          {
            "name": "user_addr",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_enc_private_key",
        "inputs": [
          {
            "name": "user_addr",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "privacy::objects::EncPrivateKey"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_auditor_public_key",
        "inputs": [],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_screener_public_key",
        "inputs": [],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_version",
        "inputs": [],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_fee_amount",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u128"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_fee_collector",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_proof_validity_blocks",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "is_open_note_depositor_blocked",
        "inputs": [
          {
            "name": "depositor",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "impl",
    "name": "AdminImpl",
    "interface_name": "privacy::interface::IAdmin"
  },
  {
    "type": "interface",
    "name": "privacy::interface::IAdmin",
    "items": [
      {
        "type": "function",
        "name": "set_auditor_public_key",
        "inputs": [
          {
            "name": "auditor_public_key",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_screener_public_key",
        "inputs": [
          {
            "name": "screener_public_key",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_fee_amount",
        "inputs": [
          {
            "name": "fee_amount",
            "type": "core::integer::u128"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_fee_collector",
        "inputs": [
          {
            "name": "fee_collector",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_proof_validity_blocks",
        "inputs": [
          {
            "name": "proof_validity_blocks",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_open_note_depositor_blocked",
        "inputs": [
          {
            "name": "depositor",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "blocked",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "PausableImpl",
    "interface_name": "starkware_utils::components::pausable::interface::IPausable"
  },
  {
    "type": "interface",
    "name": "starkware_utils::components::pausable::interface::IPausable",
    "items": [
      {
        "type": "function",
        "name": "is_paused",
        "inputs": [],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "pause",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "unpause",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "ReplaceabilityImpl",
    "interface_name": "starkware_utils::components::replaceability::interface::IReplaceable"
  },
  {
    "type": "struct",
    "name": "starkware_utils::components::replaceability::interface::EICData",
    "members": [
      {
        "name": "eic_hash",
        "type": "core::starknet::class_hash::ClassHash"
      },
      {
        "name": "eic_init_data",
        "type": "core::array::Span::<core::felt252>"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::option::Option::<starkware_utils::components::replaceability::interface::EICData>",
    "variants": [
      {
        "name": "Some",
        "type": "starkware_utils::components::replaceability::interface::EICData"
      },
      {
        "name": "None",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "starkware_utils::components::replaceability::interface::ImplementationData",
    "members": [
      {
        "name": "impl_hash",
        "type": "core::starknet::class_hash::ClassHash"
      },
      {
        "name": "eic_data",
        "type": "core::option::Option::<starkware_utils::components::replaceability::interface::EICData>"
      },
      {
        "name": "final",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "interface",
    "name": "starkware_utils::components::replaceability::interface::IReplaceable",
    "items": [
      {
        "type": "function",
        "name": "get_upgrade_delay",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_impl_activation_time",
        "inputs": [
          {
            "name": "implementation_data",
            "type": "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "add_new_implementation",
        "inputs": [
          {
            "name": "implementation_data",
            "type": "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "add_new_implementation_unsafe",
        "inputs": [
          {
            "name": "implementation_data",
            "type": "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "remove_implementation",
        "inputs": [
          {
            "name": "implementation_data",
            "type": "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "replace_to",
        "inputs": [
          {
            "name": "implementation_data",
            "type": "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "validate_upgradeability",
        "inputs": [
          {
            "name": "implementation_data",
            "type": "starkware_utils::components::replaceability::interface::ImplementationData"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "CommonRolesImpl",
    "interface_name": "starkware_utils::components::roles::interface::ICommonRoles"
  },
  {
    "type": "enum",
    "name": "starkware_utils::components::roles::interface::Role",
    "variants": [
      {
        "name": "AppGovernor",
        "type": "()"
      },
      {
        "name": "AppRoleAdmin",
        "type": "()"
      },
      {
        "name": "GovernanceAdmin",
        "type": "()"
      },
      {
        "name": "Operator",
        "type": "()"
      },
      {
        "name": "TokenAdmin",
        "type": "()"
      },
      {
        "name": "UpgradeAgent",
        "type": "()"
      },
      {
        "name": "UpgradeGovernor",
        "type": "()"
      },
      {
        "name": "SecurityAdmin",
        "type": "()"
      },
      {
        "name": "SecurityAgent",
        "type": "()"
      },
      {
        "name": "SecurityGovernor",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::starknet::contract_address::ContractAddress>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::starknet::contract_address::ContractAddress>"
      }
    ]
  },
  {
    "type": "interface",
    "name": "starkware_utils::components::roles::interface::ICommonRoles",
    "items": [
      {
        "type": "function",
        "name": "grant_role",
        "inputs": [
          {
            "name": "role",
            "type": "starkware_utils::components::roles::interface::Role"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "revoke_role",
        "inputs": [
          {
            "name": "role",
            "type": "starkware_utils::components::roles::interface::Role"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "has_role",
        "inputs": [
          {
            "name": "role",
            "type": "starkware_utils::components::roles::interface::Role"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "renounce",
        "inputs": [
          {
            "name": "role",
            "type": "starkware_utils::components::roles::interface::Role"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "reclaim_legacy_roles",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "reclaim_legacy_roles_for_accounts",
        "inputs": [
          {
            "name": "accounts",
            "type": "core::array::Span::<core::starknet::contract_address::ContractAddress>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "disable_legacy_role_reclaim",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "governance_admin",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "auditor_public_key",
        "type": "core::felt252"
      },
      {
        "name": "screener_public_key",
        "type": "core::felt252"
      },
      {
        "name": "proof_validity_blocks",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "type": "event",
    "name": "starkware_utils::components::pausable::pausable::PausableComponent::Paused",
    "kind": "struct",
    "members": [
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "starkware_utils::components::pausable::pausable::PausableComponent::Unpaused",
    "kind": "struct",
    "members": [
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "starkware_utils::components::pausable::pausable::PausableComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "Paused",
        "type": "starkware_utils::components::pausable::pausable::PausableComponent::Paused",
        "kind": "nested"
      },
      {
        "name": "Unpaused",
        "type": "starkware_utils::components::pausable::pausable::PausableComponent::Unpaused",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "starkware_utils::components::replaceability::interface::ImplementationAdded",
    "kind": "struct",
    "members": [
      {
        "name": "implementation_data",
        "type": "starkware_utils::components::replaceability::interface::ImplementationData",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "starkware_utils::components::replaceability::interface::ImplementationRemoved",
    "kind": "struct",
    "members": [
      {
        "name": "implementation_data",
        "type": "starkware_utils::components::replaceability::interface::ImplementationData",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "starkware_utils::components::replaceability::interface::ImplementationReplaced",
    "kind": "struct",
    "members": [
      {
        "name": "implementation_data",
        "type": "starkware_utils::components::replaceability::interface::ImplementationData",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "starkware_utils::components::replaceability::interface::ImplementationFinalized",
    "kind": "struct",
    "members": [
      {
        "name": "impl_hash",
        "type": "core::starknet::class_hash::ClassHash",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "starkware_utils::components::replaceability::replaceability::ReplaceabilityComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "ImplementationAdded",
        "type": "starkware_utils::components::replaceability::interface::ImplementationAdded",
        "kind": "nested"
      },
      {
        "name": "ImplementationRemoved",
        "type": "starkware_utils::components::replaceability::interface::ImplementationRemoved",
        "kind": "nested"
      },
      {
        "name": "ImplementationReplaced",
        "type": "starkware_utils::components::replaceability::interface::ImplementationReplaced",
        "kind": "nested"
      },
      {
        "name": "ImplementationFinalized",
        "type": "starkware_utils::components::replaceability::interface::ImplementationFinalized",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "starkware_utils::components::common_roles::common_roles::CommonRolesComponent::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "sender",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGrantedWithDelay",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "sender",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "delay",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "sender",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "previous_admin_role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "new_admin_role",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "RoleGranted",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
        "kind": "nested"
      },
      {
        "name": "RoleGrantedWithDelay",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGrantedWithDelay",
        "kind": "nested"
      },
      {
        "name": "RoleRevoked",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
        "kind": "nested"
      },
      {
        "name": "RoleAdminChanged",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_introspection::src5::SRC5Component::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "openzeppelin_security::reentrancyguard::ReentrancyGuardComponent::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "privacy::events::ViewingKeySet",
    "kind": "struct",
    "members": [
      {
        "name": "user_addr",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "public_key",
        "type": "core::felt252",
        "kind": "key"
      },
      {
        "name": "enc_private_key",
        "type": "privacy::objects::EncPrivateKey",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::Withdrawal",
    "kind": "struct",
    "members": [
      {
        "name": "enc_user_addr",
        "type": "privacy::objects::EncUserAddr",
        "kind": "data"
      },
      {
        "name": "to_addr",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u128",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::Deposit",
    "kind": "struct",
    "members": [
      {
        "name": "user_addr",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u128",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::AuditorPublicKeySet",
    "kind": "struct",
    "members": [
      {
        "name": "auditor_public_key",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::ScreenerPublicKeySet",
    "kind": "struct",
    "members": [
      {
        "name": "screener_public_key",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::OpenNoteCreated",
    "kind": "struct",
    "members": [
      {
        "name": "enc_recipient_addr",
        "type": "privacy::objects::EncUserAddr",
        "kind": "data"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "note_id",
        "type": "core::felt252",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::EncNoteCreated",
    "kind": "struct",
    "members": [
      {
        "name": "note_id",
        "type": "core::felt252",
        "kind": "key"
      },
      {
        "name": "packed_value",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::OpenNoteDeposited",
    "kind": "struct",
    "members": [
      {
        "name": "depositor",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "note_id",
        "type": "core::felt252",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u128",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::ExternalContractInvoked",
    "kind": "struct",
    "members": [
      {
        "name": "contract_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "selector",
        "type": "core::felt252",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::NoteUsed",
    "kind": "struct",
    "members": [
      {
        "name": "nullifier",
        "type": "core::felt252",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::FeeAmountSet",
    "kind": "struct",
    "members": [
      {
        "name": "fee_amount",
        "type": "core::integer::u128",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::FeeCollectorSet",
    "kind": "struct",
    "members": [
      {
        "name": "fee_collector",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::ProofValidityBlocksSet",
    "kind": "struct",
    "members": [
      {
        "name": "proof_validity_blocks",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::events::OpenNoteDepositorBlockSet",
    "kind": "struct",
    "members": [
      {
        "name": "depositor",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "blocked",
        "type": "core::bool",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "privacy::privacy::Privacy::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "PausableEvent",
        "type": "starkware_utils::components::pausable::pausable::PausableComponent::Event",
        "kind": "flat"
      },
      {
        "name": "ReplaceabilityEvent",
        "type": "starkware_utils::components::replaceability::replaceability::ReplaceabilityComponent::Event",
        "kind": "flat"
      },
      {
        "name": "CommonRolesEvent",
        "type": "starkware_utils::components::common_roles::common_roles::CommonRolesComponent::Event",
        "kind": "flat"
      },
      {
        "name": "AccessControlEvent",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
        "kind": "flat"
      },
      {
        "name": "SRC5Event",
        "type": "openzeppelin_introspection::src5::SRC5Component::Event",
        "kind": "flat"
      },
      {
        "name": "ReentrancyGuardEvent",
        "type": "openzeppelin_security::reentrancyguard::ReentrancyGuardComponent::Event",
        "kind": "flat"
      },
      {
        "name": "ViewingKeySet",
        "type": "privacy::events::ViewingKeySet",
        "kind": "nested"
      },
      {
        "name": "Withdrawal",
        "type": "privacy::events::Withdrawal",
        "kind": "nested"
      },
      {
        "name": "Deposit",
        "type": "privacy::events::Deposit",
        "kind": "nested"
      },
      {
        "name": "AuditorPublicKeySet",
        "type": "privacy::events::AuditorPublicKeySet",
        "kind": "nested"
      },
      {
        "name": "ScreenerPublicKeySet",
        "type": "privacy::events::ScreenerPublicKeySet",
        "kind": "nested"
      },
      {
        "name": "OpenNoteCreated",
        "type": "privacy::events::OpenNoteCreated",
        "kind": "nested"
      },
      {
        "name": "EncNoteCreated",
        "type": "privacy::events::EncNoteCreated",
        "kind": "nested"
      },
      {
        "name": "OpenNoteDeposited",
        "type": "privacy::events::OpenNoteDeposited",
        "kind": "nested"
      },
      {
        "name": "ExternalContractInvoked",
        "type": "privacy::events::ExternalContractInvoked",
        "kind": "nested"
      },
      {
        "name": "NoteUsed",
        "type": "privacy::events::NoteUsed",
        "kind": "nested"
      },
      {
        "name": "FeeAmountSet",
        "type": "privacy::events::FeeAmountSet",
        "kind": "nested"
      },
      {
        "name": "FeeCollectorSet",
        "type": "privacy::events::FeeCollectorSet",
        "kind": "nested"
      },
      {
        "name": "ProofValidityBlocksSet",
        "type": "privacy::events::ProofValidityBlocksSet",
        "kind": "nested"
      },
      {
        "name": "OpenNoteDepositorBlockSet",
        "type": "privacy::events::OpenNoteDepositorBlockSet",
        "kind": "nested"
      }
    ]
  }
];

// dist/internal/proof-invocation-factory.js
var DEFAULT_L2_GAS_MAX_AMOUNT = 100000000n;
var PROOF_INVOCATION_NONCE = 0n;
function getDefaultProofDetails(chainId) {
  return {
    versions: [import_starknet11.ETransactionVersion.V3],
    nonce: PROOF_INVOCATION_NONCE,
    skipValidate: true,
    resourceBounds: {
      l1_gas: { max_amount: 1n, max_price_per_unit: 0n },
      l2_gas: { max_amount: DEFAULT_L2_GAS_MAX_AMOUNT, max_price_per_unit: 0n },
      l1_data_gas: { max_amount: 1n, max_price_per_unit: 0n }
    },
    tip: 0n,
    paymasterData: [],
    accountDeploymentData: [],
    nonceDataAvailabilityMode: "L1",
    feeDataAvailabilityMode: "L1",
    version: import_starknet11.ETransactionVersion.V3,
    chainId
  };
}
function compileExecuteCalldata(poolAddress, executeViewCalldata) {
  const callDataCompiler = new import_starknet11.CallData(PrivacyPoolABI);
  return callDataCompiler.compile("__execute__", [
    [
      {
        to: poolAddress,
        selector: import_starknet11.hash.getSelectorFromName("compile_actions"),
        calldata: executeViewCalldata
      }
    ]
  ]);
}
function extractExecuteViewCalldata(executeCalldata) {
  const innerCalldataLength = Number(BigInt(executeCalldata[3]));
  return executeCalldata.slice(4, 4 + innerCalldataLength);
}
var ProofInvocationFactory = class {
  async create(user, poolAddress, clientActions, details) {
    const cairoActions = serializeClientActions(clientActions);
    const callDataCompiler = new import_starknet11.CallData(PrivacyPoolABI);
    const userAddress = toBigInt(user.address);
    const poolAddressHex = toHex(poolAddress);
    const executeViewCalldata = callDataCompiler.compile("compile_actions", [
      userAddress,
      user.viewingKey,
      cairoActions
    ]);
    const compiledCalldata = compileExecuteCalldata(poolAddressHex, executeViewCalldata).map((v) => toHex(v));
    const nonce = BigInt(details.nonce ?? PROOF_INVOCATION_NONCE);
    const detailsWithNonce = { ...details, nonce };
    const signature = await user.signer.signTransaction([
      {
        contractAddress: poolAddressHex,
        entrypoint: "compile_actions",
        calldata: executeViewCalldata
      }
    ], {
      walletAddress: poolAddressHex,
      cairoVersion: "1",
      ...detailsWithNonce
    });
    const rb = detailsWithNonce.resourceBounds ?? {
      l1_gas: { max_amount: 0n, max_price_per_unit: 0n },
      l2_gas: { max_amount: 0n, max_price_per_unit: 0n },
      l1_data_gas: { max_amount: 0n, max_price_per_unit: 0n }
    };
    return {
      type: "INVOKE",
      sender_address: poolAddressHex,
      calldata: compiledCalldata,
      signature: import_starknet11.stark.formatSignature(signature),
      nonce: toHex(detailsWithNonce.nonce ?? 0n),
      resource_bounds: {
        l1_gas: {
          max_amount: toHex(rb.l1_gas.max_amount),
          max_price_per_unit: toHex(rb.l1_gas.max_price_per_unit)
        },
        l2_gas: {
          max_amount: toHex(rb.l2_gas.max_amount),
          max_price_per_unit: toHex(rb.l2_gas.max_price_per_unit)
        },
        l1_data_gas: {
          max_amount: toHex(rb.l1_data_gas?.max_amount ?? 0n),
          max_price_per_unit: toHex(rb.l1_data_gas?.max_price_per_unit ?? 0n)
        }
      },
      tip: toHex(detailsWithNonce.tip ?? 0n),
      paymaster_data: (detailsWithNonce.paymasterData ?? []).map((x) => toHex(x)),
      account_deployment_data: (detailsWithNonce.accountDeploymentData ?? []).map((x) => toHex(x)),
      nonce_data_availability_mode: detailsWithNonce.nonceDataAvailabilityMode ?? "L1",
      fee_data_availability_mode: detailsWithNonce.feeDataAvailabilityMode ?? "L1",
      version: "0x3"
    };
  }
  parseOutput(output) {
    const decoder = new import_starknet11.CallData(PrivacyPoolABI);
    return decoder.decodeParameters("core::array::Span::<privacy::actions::ServerAction>", output);
  }
};

// dist/internal/mock-proving.js
function unwrapMessage(entry) {
  return "message" in entry ? entry.message : entry;
}
function collectMessages(invocation) {
  if (invocation == null)
    return [];
  return [
    ...(invocation.messages ?? []).map(unwrapMessage),
    ...(invocation.calls ?? []).flatMap(collectMessages)
  ];
}
var CallMockProofProvider = class {
  node;
  chainId;
  options;
  constructor(node, chainId, options) {
    this.node = node;
    this.chainId = chainId;
    this.options = options;
  }
  async getDefaultDetails() {
    return getDefaultProofDetails(this.chainId);
  }
  async prove(invocation, blockIdentifier) {
    const { poolClassHash, serverActions } = await this.compileActions(invocation, blockIdentifier);
    let baseBlockNumber;
    if (blockIdentifier != null) {
      const block = await this.node.getBlock(blockIdentifier);
      baseBlockNumber = BigInt(block.block_number);
    } else {
      const latestBlock = await this.node.getBlock("latest");
      const currentBlockNumber = BigInt(latestBlock.block_number);
      const blocksBack = 10n;
      baseBlockNumber = currentBlockNumber > blocksBack ? currentBlockNumber - blocksBack : 1n;
    }
    const baseBlock = await this.node.getBlock(Number(baseBlockNumber));
    const proofFacts = buildProofFacts(invocation.sender_address, poolClassHash, serverActions, baseBlockNumber, baseBlock.block_hash ?? "0x0", this.chainId);
    return {
      output: buildMessagePayload(poolClassHash, serverActions),
      data: void 0,
      proofFacts
    };
  }
  /**
   * Runs the pool's compile step. A signed invocation is simulated as a real `__execute__` invoke, so
   * the pool itself runs `assert_valid_signature` — every accepted signature form (custom validation,
   * transaction hash, SNIP-12 `CallSet`) is honored exactly as on-chain, and an unauthorized one
   * panics with `INVALID_SIGNATURE`. Fee simulation and unsigned mock invocations instead use the
   * plain `compile_actions` view, which performs no signature check because a view has no `tx_info`.
   */
  async compileActions(invocation, blockIdentifier) {
    const signature = invocation.signature ? import_starknet12.stark.formatSignature(invocation.signature) : [];
    if (this.options?.validateSignature === false || signature.length === 0) {
      const [serverActions, poolClassHash] = await Promise.all([
        this.node.callContract({
          contractAddress: invocation.sender_address,
          entrypoint: "compile_actions",
          calldata: extractExecuteViewCalldata(invocation.calldata)
        }, blockIdentifier),
        this.node.getClassHashAt(invocation.sender_address, blockIdentifier)
      ]);
      return { poolClassHash, serverActions };
    }
    return this.simulateExecute(invocation, signature, blockIdentifier);
  }
  /**
   * Simulates the invocation as an `__execute__` invoke and reads the compile output back out of the
   * L2-to-L1 message the pool emits (`send_message_to_server`), whose payload is
   * `[class_hash, ...server_actions]` — so the class hash needs no separate query.
   */
  async simulateExecute(invocation, signature, blockIdentifier) {
    const channel = this.node.channel;
    if (channel?.simulateTransaction == null) {
      throw new Error("CallMockProofProvider needs a node whose channel supports simulateTransaction to validate signatures; pass validateSignature: false to compile without validation");
    }
    const simulation = await channel.simulateTransaction(
      [
        {
          type: import_starknet12.TransactionType.INVOKE,
          contractAddress: invocation.sender_address,
          calldata: invocation.calldata,
          signature,
          nonce: invocation.nonce,
          version: invocation.version,
          resourceBounds: invocation.resource_bounds,
          tip: invocation.tip,
          paymasterData: invocation.paymaster_data,
          accountDeploymentData: invocation.account_deployment_data,
          nonceDataAvailabilityMode: invocation.nonce_data_availability_mode,
          feeDataAvailabilityMode: invocation.fee_data_availability_mode
        }
      ],
      // skipValidate drops only __validate__'s zero-tip / zero-resource-price assertions; the
      // signature check lives in __execute__ and still runs. skipFeeCharge is required, not
      // cosmetic: __validate__ demands a zero max_price_per_unit, so the invocation carries zero
      // resource bounds and the node's fee-bounds pre-check would otherwise reject the transaction
      // before __execute__ runs ("resources don't cover the minimal transaction fee"). It is passed
      // explicitly rather than relying on the client's default.
      { blockIdentifier, skipValidate: true, skipFeeCharge: true }
    );
    const payload = collectMessages(simulation?.[0]?.transaction_trace?.execute_invocation).find((message) => BigInt(message.to_address) === 0n)?.payload;
    if (payload == null || payload.length === 0) {
      throw new Error("simulated __execute__ emitted no server message; the pool did not compile the actions");
    }
    return { poolClassHash: payload[0], serverActions: payload.slice(1) };
  }
};

// dist/internal/screening-calldata.js
var import_starknet13 = require("starknet");
function screeningCalldataSuffix(additionalData) {
  const signature = additionalData?.signature;
  const attestationOption = signature === void 0 ? new import_starknet13.CairoOption(import_starknet13.CairoOptionVariant.None) : new import_starknet13.CairoOption(import_starknet13.CairoOptionVariant.Some, {
    issued_at: signature.issued_at,
    signature: import_starknet13.cairo.tuple(signature.sig_r, signature.sig_s)
  });
  return import_starknet13.CallData.compile([attestationOption]).map((felt) => toHex(BigInt(felt)));
}

// dist/internal/private-transfers.js
var PrivateTransfers = class extends AbstractPrivateTransfers {
  params;
  constructor(params) {
    super(params.account.address, params.viewingKeyProvider, params.discoveryProvider, params.shadowAccountAnonymizerAddress);
    this.params = params;
  }
  async getCompiler() {
    const viewingKey = await this.params.viewingKeyProvider.getViewingKey();
    return new ActionCompiler(this.user, viewingKey, this.params.discoveryProvider, toBigInt(this.params.poolContractAddress));
  }
  async createProofInvocation(actions, options) {
    const viewingKey = await this.params.viewingKeyProvider.getViewingKey();
    const compiler = new ActionCompiler(this.user, viewingKey, this.params.discoveryProvider, toBigInt(this.params.poolContractAddress));
    const { clientActions, registry, warnings } = await compiler.compile(actions, options);
    const details = await this.params.provingProvider.getDefaultDetails();
    const invocation = await this.params.proofInvocationFactory.create({ ...this.params.account, viewingKey }, this.params.poolContractAddress, clientActions, details);
    return { invocation, registry, warnings };
  }
  invalidateProofNonceCache() {
    this.params.provingProvider.invalidateNonceCache?.();
  }
  async executeWithInvocation({ invocation, registry, warnings }, provingBlockId) {
    const proof = await this.params.provingProvider.prove(invocation, provingBlockId);
    return this.buildExecuteResult(proof, registry, warnings);
  }
  /**
   * Assemble the `apply_actions` call and `ExecuteResult` from a proof. Shared
   * by `executeWithInvocation` (real proof) and `simulate` (mock proof) so both
   * produce identical calldata — notably the trailing screening attestation.
   */
  buildExecuteResult(proof, registry, warnings) {
    const serverActionsCalldata = proof.output.slice(1);
    const parsedOutput = () => this.params.proofInvocationFactory.parseOutput(serverActionsCalldata);
    debugLog("private-transfers", "execute", "parsed server actions", parsedOutput);
    const screeningSuffix = screeningCalldataSuffix(proof.additionalData);
    return {
      callAndProof: {
        call: {
          contractAddress: toHex(this.params.poolContractAddress),
          entrypoint: "apply_actions",
          calldata: [...serverActionsCalldata, ...screeningSuffix]
        },
        proof
      },
      registry,
      warnings
    };
  }
  async simulate(actions, options) {
    const { invocation, registry, warnings } = await this.createProofInvocation(actions, options);
    const chainId = await options.node.getChainId();
    const mockProvider = new CallMockProofProvider(options.node, chainId, {
      validateSignature: options.validateSignature ?? false
    });
    const proof = await mockProvider.prove(invocation, options.provingBlockId);
    return this.buildExecuteResult(proof, registry, warnings);
  }
};

// dist/internal/proving-service-provider.js
var import_starknet14 = require("starknet");

// node_modules/ohttp-ts/dist/index.js
var OHTTPErrorCode = {
  /** Failed to parse key configuration */
  InvalidKeyConfig: "INVALID_KEY_CONFIG",
  /** Unknown key identifier */
  UnknownKeyId: "UNKNOWN_KEY_ID",
  /** Unsupported cipher suite */
  UnsupportedCipherSuite: "UNSUPPORTED_CIPHER_SUITE",
  /** Decryption failed - deliberately opaque */
  DecryptionFailed: "DECRYPTION_FAILED",
  /** Encryption failed */
  EncryptionFailed: "ENCRYPTION_FAILED",
  /** Invalid message format */
  InvalidMessage: "INVALID_MESSAGE",
  /** Chunk sequence error */
  ChunkSequenceError: "CHUNK_SEQUENCE_ERROR",
  /** Chunk limit exceeded */
  ChunkLimitExceeded: "CHUNK_LIMIT_EXCEEDED"
};
var OHTTPError = class _OHTTPError extends Error {
  code;
  constructor(code) {
    super(`OHTTP error: ${code}`);
    this.name = "OHTTPError";
    this.code = code;
    Object.setPrototypeOf(this, _OHTTPError.prototype);
  }
};
var VLI_MASK_HEADER = 63;
var VLI_MASK_VALUE = 192;
var VLI_MASK_LSB = 255;
var VLI_LEN_1 = 0;
var VLI_LEN_2 = 64;
var VLI_LEN_4 = 128;
var VLI_LEN_8 = 192;
var BHttpError = class extends Error {
};
var InvalidMessageError = class extends BHttpError {
};
var NotSupportedError = class extends BHttpError {
};
var InformationalResponse = class {
  constructor(status) {
    Object.defineProperty(this, "status", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "headers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.status = status;
    this.headers = new Headers();
  }
};
var DecoderContext = class {
  constructor(buf) {
    Object.defineProperty(this, "buf", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "p", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "framingIndicator", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "headers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "content", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "trailers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.buf = buf;
    this.headers = new Headers();
    this.content = new Uint8Array(0);
    this.trailers = new Headers();
  }
};
var RequestDecoderContext = class extends DecoderContext {
  constructor(buf) {
    super(buf);
    Object.defineProperty(this, "method", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ""
    });
    Object.defineProperty(this, "scheme", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ""
    });
    Object.defineProperty(this, "authority", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ""
    });
    Object.defineProperty(this, "path", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ""
    });
  }
  createRequest() {
    const input = this.scheme + "://" + this.authority + this.path;
    let req;
    if (this.method === "GET" || this.method === "HEAD") {
      req = new Request(input, {
        method: this.method
      });
    } else {
      req = new Request(input, {
        method: this.method,
        body: this.content
      });
    }
    this.headers.forEach((value, key) => {
      req.headers.set(key, value);
    });
    return req;
  }
};
var ResponseDecoderContext = class extends DecoderContext {
  constructor(buf) {
    super(buf);
    Object.defineProperty(this, "status", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "informationalResponses", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.informationalResponses = new Array(0);
  }
  createResponse() {
    return new Response(this.content, {
      status: this.status,
      headers: this.headers
    });
  }
};
var BHttpDecoder = class {
  constructor() {
    Object.defineProperty(this, "_td", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._td = new TextDecoder();
  }
  decodeRequest(src) {
    if (src instanceof ArrayBuffer) {
      src = new Uint8Array(src);
    }
    const ctx = new RequestDecoderContext(src);
    ctx.framingIndicator = this.decodeVli(ctx);
    switch (ctx.framingIndicator) {
      case 0:
        return this.decodeKnownLengthRequest(ctx);
      case 2:
        return this.decodeIndeterminateLengthRequest(ctx);
      default:
        throw new InvalidMessageError("Invalid framing indicator.");
    }
  }
  decodeResponse(src) {
    if (src instanceof ArrayBuffer) {
      src = new Uint8Array(src);
    }
    const ctx = new ResponseDecoderContext(src);
    ctx.framingIndicator = this.decodeVli(ctx);
    switch (ctx.framingIndicator) {
      case 1:
        return this.decodeKnownLengthResponse(ctx);
      case 3:
        return this.decodeIndeterminateLengthResponse(ctx);
      default:
        throw new InvalidMessageError("Invalid framing indicator.");
    }
  }
  decodeKnownLengthRequest(ctx) {
    this.decodeRequestControlData(ctx);
    this.decodeKnownLengthRequestHeaders(ctx);
    this.decodeKnownLengthContent(ctx);
    this.decodeKnownLengthTrailers(ctx);
    this.checkPadding(ctx);
    return ctx.createRequest();
  }
  decodeIndeterminateLengthRequest(ctx) {
    this.decodeRequestControlData(ctx);
    this.decodeIndeterminateLengthRequestHeaders(ctx);
    this.decodeIndeterminateLengthContent(ctx);
    this.decodeIndeterminateLengthTrailers(ctx);
    this.checkPadding(ctx);
    return ctx.createRequest();
  }
  decodeKnownLengthResponse(ctx) {
    this.decodeKnownLengthInformationalResponsesAndHeaders(ctx);
    this.decodeKnownLengthContent(ctx);
    this.decodeKnownLengthTrailers(ctx);
    this.checkPadding(ctx);
    return ctx.createResponse();
  }
  decodeIndeterminateLengthResponse(ctx) {
    this.decodeIndeterminateLengthInformationalResponsesAndHeaders(ctx);
    this.decodeIndeterminateLengthContent(ctx);
    this.decodeIndeterminateLengthTrailers(ctx);
    this.checkPadding(ctx);
    return ctx.createResponse();
  }
  decodeRequestControlData(ctx) {
    ctx.method = this.decodeVliAndValue(ctx);
    ctx.scheme = this.decodeVliAndValue(ctx);
    ctx.authority = this.decodeVliAndValue(ctx);
    ctx.path = this.decodeVliAndValue(ctx);
    return;
  }
  decodeKnownLengthInformationalResponsesAndHeaders(ctx) {
    let status = this.decodeVli(ctx);
    while (status >= 100 && status < 200) {
      this.decodeKnownLengthInformationalResponse(ctx, status);
      status = this.decodeVli(ctx);
    }
    if (status < 100 && status >= 600) {
      throw new InvalidMessageError("Invalid status code.");
    }
    ctx.status = status;
    this.decodeKnownLengthResponseHeaders(ctx);
    return;
  }
  decodeIndeterminateLengthInformationalResponsesAndHeaders(ctx) {
    let status = this.decodeVli(ctx);
    while (status >= 100 && status < 200) {
      this.decodeIndeterminateLengthInformationalResponse(ctx, status);
      status = this.decodeVli(ctx);
    }
    if (status < 100 && status >= 600) {
      throw new InvalidMessageError("Invalid status code.");
    }
    ctx.status = status;
    this.decodeIndeterminateLengthResponseHeaders(ctx);
    return;
  }
  decodeKnownLengthInformationalResponse(ctx, status) {
    const ir = new InformationalResponse(status);
    const len = this.decodeVli(ctx);
    let name = "";
    let value = "";
    const base = ctx.p;
    while (ctx.p < base + len) {
      name = this.decodeVliAndValue(ctx);
      value = this.decodeVliAndValue(ctx);
      ir.headers.set(name, value);
    }
    ctx.informationalResponses.push(ir);
    return;
  }
  decodeIndeterminateLengthInformationalResponse(ctx, status) {
    const ir = new InformationalResponse(status);
    let name = "";
    let value = "";
    let terminator = this.decodeVli(ctx);
    while (terminator !== 0) {
      ctx.p--;
      name = this.decodeVliAndValue(ctx);
      value = this.decodeVliAndValue(ctx);
      ir.headers.set(name, value);
      terminator = this.decodeVli(ctx);
    }
    ctx.informationalResponses.push(ir);
    return;
  }
  decodeKnownLengthRequestHeaders(ctx) {
    let name = "";
    let value = "";
    const len = this.decodeVli(ctx);
    const base = ctx.p;
    while (ctx.p < base + len) {
      name = this.decodeVliAndValue(ctx);
      value = this.decodeVliAndValue(ctx);
      if (name.localeCompare("host", void 0, { sensitivity: "accent" }) === 0 && ctx.authority === "") {
        ctx.authority = value;
      }
      ctx.headers.set(name, value);
    }
    return;
  }
  decodeKnownLengthResponseHeaders(ctx) {
    let name = "";
    let value = "";
    const base = ctx.p;
    const len = this.decodeVli(ctx);
    while (ctx.p < base + len) {
      name = this.decodeVliAndValue(ctx);
      value = this.decodeVliAndValue(ctx);
      ctx.headers.set(name, value);
    }
    return;
  }
  decodeIndeterminateLengthRequestHeaders(ctx) {
    let name = "";
    let value = "";
    let terminator = this.decodeVli(ctx);
    while (terminator !== 0) {
      ctx.p--;
      name = this.decodeVliAndValue(ctx);
      value = this.decodeVliAndValue(ctx);
      if (name.localeCompare("host", void 0, { sensitivity: "accent" }) === 0 && ctx.authority === "") {
        ctx.authority = value;
      }
      ctx.headers.set(name, value);
      terminator = this.decodeVli(ctx);
    }
    return;
  }
  decodeIndeterminateLengthResponseHeaders(ctx) {
    let name = "";
    let value = "";
    let terminator = this.decodeVli(ctx);
    while (terminator !== 0) {
      ctx.p--;
      name = this.decodeVliAndValue(ctx);
      value = this.decodeVliAndValue(ctx);
      ctx.headers.set(name, value);
      terminator = this.decodeVli(ctx);
    }
    return;
  }
  decodeKnownLengthContent(ctx) {
    const len = this.decodeVli(ctx);
    ctx.content = ctx.buf.slice(ctx.p, ctx.p + len);
    ctx.p += len;
    return;
  }
  decodeIndeterminateLengthContent(ctx) {
    let len = 0;
    const p = ctx.p;
    let terminator = this.decodeVli(ctx);
    while (terminator !== 0) {
      len += terminator;
      ctx.p += terminator;
      terminator = this.decodeVli(ctx);
    }
    if (len === 0) {
      return;
    }
    ctx.p = p;
    ctx.content = new Uint8Array(len);
    len = 0;
    terminator = this.decodeVli(ctx);
    while (terminator !== 0) {
      ctx.content.set(ctx.buf.slice(ctx.p, ctx.p + terminator), len);
      len += terminator;
      ctx.p += terminator;
      terminator = this.decodeVli(ctx);
    }
    return;
  }
  decodeKnownLengthTrailers(ctx) {
    const len = this.decodeVli(ctx);
    let name = "";
    let value = "";
    const base = ctx.p;
    while (ctx.p < base + len) {
      name = this.decodeVliAndValue(ctx);
      value = this.decodeVliAndValue(ctx);
      ctx.trailers.set(name, value);
    }
    return;
  }
  decodeIndeterminateLengthTrailers(ctx) {
    let name = "";
    let value = "";
    let terminator = this.decodeVli(ctx);
    while (terminator != 0) {
      ctx.p--;
      name = this.decodeVliAndValue(ctx);
      value = this.decodeVliAndValue(ctx);
      ctx.trailers.set(name, value);
      terminator = this.decodeVli(ctx);
    }
    return;
  }
  checkPadding(ctx) {
    while (ctx.p < ctx.buf.byteLength) {
      if (ctx.buf[ctx.p++] !== 0) {
        throw new InvalidMessageError("Invalid padding data.");
      }
    }
    return;
  }
  decodeVliAndValue(ctx) {
    const len = this.decodeVli(ctx);
    const res = this._td.decode(ctx.buf.slice(ctx.p, ctx.p + len));
    ctx.p += len;
    return res;
  }
  decodeVli(ctx) {
    let res = 0;
    switch (ctx.buf[ctx.p] & VLI_MASK_VALUE) {
      case VLI_LEN_1:
        return ctx.buf[ctx.p++] & VLI_MASK_HEADER;
      case VLI_LEN_2:
        res = (ctx.buf[ctx.p++] & VLI_MASK_HEADER) << 8;
        res += ctx.buf[ctx.p++];
        return res;
      case VLI_LEN_4:
        res = (ctx.buf[ctx.p++] & VLI_MASK_HEADER) << 24;
        res += ctx.buf[ctx.p++] << 16;
        res += ctx.buf[ctx.p++] << 8;
        res += ctx.buf[ctx.p++];
        return res;
      default:
        res = 0;
        if (ctx.buf[++ctx.p] > 15) {
          throw new NotSupportedError("Over MAX_SAFE_INTEGER-length value is not supported.");
        }
        res += ctx.buf[ctx.p++] << 48;
        res += ctx.buf[ctx.p++] << 40;
        res += ctx.buf[ctx.p++] << 32;
        res += ctx.buf[ctx.p++] << 24;
        res += ctx.buf[ctx.p++] << 16;
        res += ctx.buf[ctx.p++] << 8;
        res += ctx.buf[ctx.p++];
        return res;
    }
  }
};
var EncoderContext = class {
  constructor() {
    Object.defineProperty(this, "buf", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "p", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "framingIndicator", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "headerSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "body", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.buf = new Uint8Array(0);
    this.headerSize = 0;
    this.body = new Uint8Array(0);
  }
  calculateVliSize(v) {
    if (v < 64) {
      return 1;
    }
    if (v < 16384) {
      return 2;
    }
    if (v < 1073741824) {
      return 4;
    }
    if (v <= Number.MAX_SAFE_INTEGER) {
      return 8;
    }
    throw new NotSupportedError("Over MAX_SAFE_INTEGER length value is not supported.");
  }
};
var RequestEncoderContext = class extends EncoderContext {
  constructor(request) {
    super();
    Object.defineProperty(this, "request", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "url", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.request = request;
    this.url = new URL(request.url);
  }
  async setup() {
    this.body = new Uint8Array(await this.request.arrayBuffer());
    this.buf = new Uint8Array(this.calculateEncodedRequestSize());
  }
  calculateEncodedRequestSize() {
    let len = 1;
    len += 1;
    len += this.request.method.length;
    len += this.calculateVliSize(this.url.protocol.length - 1);
    len += this.url.protocol.length - 1;
    len += this.calculateVliSize(this.url.host.length);
    len += this.url.host.length;
    len += this.calculateVliSize(this.url.pathname.length + this.url.search.length);
    len += this.url.pathname.length;
    len += this.url.search.length;
    this.headerSize = 0;
    this.request.headers.forEach((value, key) => {
      this.headerSize += this.calculateVliSize(key.length);
      this.headerSize += key.length;
      this.headerSize += this.calculateVliSize(value.length);
      this.headerSize += value.length;
    });
    len += this.calculateVliSize(this.headerSize);
    len += this.headerSize;
    len += this.calculateVliSize(this.body.byteLength);
    len += this.body.byteLength;
    len += 1;
    return len;
  }
};
var ResponseEncoderContext = class extends EncoderContext {
  constructor(response) {
    super();
    Object.defineProperty(this, "response", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.response = response;
  }
  async setup() {
    this.body = new Uint8Array(await this.response.arrayBuffer());
    this.buf = new Uint8Array(this.calculateEncodedResponseSize());
  }
  calculateEncodedResponseSize() {
    let len = 1;
    len += 2;
    this.headerSize = 0;
    this.response.headers.forEach((value, key) => {
      this.headerSize += this.calculateVliSize(key.length);
      this.headerSize += key.length;
      this.headerSize += this.calculateVliSize(value.length);
      this.headerSize += value.length;
    });
    len += this.calculateVliSize(this.headerSize);
    len += this.headerSize;
    len += this.calculateVliSize(this.body.byteLength);
    len += this.body.byteLength;
    len += 1;
    return len;
  }
};
var BHttpEncoder = class {
  constructor() {
    Object.defineProperty(this, "_te", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._te = new TextEncoder();
  }
  async encodeRequest(src) {
    const ctx = new RequestEncoderContext(src);
    await ctx.setup();
    return this.encodeKnownLengthRequest(ctx);
  }
  async encodeResponse(src) {
    const ctx = new ResponseEncoderContext(src);
    await ctx.setup();
    return this.encodeKnownLengthResponse(ctx);
  }
  encodeKnownLengthRequest(ctx) {
    this.encodeVli(ctx, 0);
    this.encodeVliAndValue(ctx, ctx.request.method);
    this.encodeVliAndValue(ctx, ctx.url.protocol.slice(0, ctx.url.protocol.length - 1));
    this.encodeVliAndValue(ctx, ctx.url.host);
    this.encodeVliAndValue(ctx, ctx.url.pathname + ctx.url.search);
    this.encodeVli(ctx, ctx.headerSize);
    ctx.request.headers.forEach((value, key) => {
      this.encodeVliAndValue(ctx, key);
      this.encodeVliAndValue(ctx, value);
    });
    this.encodeVli(ctx, ctx.body.byteLength);
    ctx.buf.set(ctx.body, ctx.p);
    ctx.p += ctx.body.byteLength;
    this.encodeVli(ctx, 0);
    return ctx.buf;
  }
  encodeKnownLengthResponse(ctx) {
    this.encodeVli(ctx, 1);
    this.encodeVli(ctx, ctx.response.status);
    this.encodeVli(ctx, ctx.headerSize);
    ctx.response.headers.forEach((value, key) => {
      this.encodeVliAndValue(ctx, key);
      this.encodeVliAndValue(ctx, value);
    });
    this.encodeVli(ctx, ctx.body.byteLength);
    ctx.buf.set(ctx.body, ctx.p);
    ctx.p += ctx.body.byteLength;
    this.encodeVli(ctx, 0);
    return ctx.buf;
  }
  encodeVliAndValue(ctx, v) {
    this.encodeVli(ctx, v.length);
    ctx.buf.set(this._te.encode(v), ctx.p);
    ctx.p += v.length;
    return;
  }
  encodeVli(ctx, v) {
    if (v < 64) {
      ctx.buf[ctx.p++] = VLI_LEN_1 + v;
      return;
    }
    if (v < 16384) {
      ctx.buf[ctx.p++] = VLI_LEN_2 + (v >> 8);
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v;
      return;
    }
    if (v < 1073741824) {
      ctx.buf[ctx.p++] = VLI_LEN_4 + (v >> 24);
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v >> 16;
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v >> 8;
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v;
      return;
    }
    if (v <= Number.MAX_SAFE_INTEGER) {
      ctx.buf[ctx.p++] = VLI_LEN_8;
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v >> 48;
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v >> 40;
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v >> 32;
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v >> 24;
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v >> 16;
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v >> 8;
      ctx.buf[ctx.p++] = VLI_MASK_LSB & v;
      return;
    }
    throw new NotSupportedError("Over MAX_SAFE_INTEGER-length value is not supported.");
  }
};
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
var MediaType = {
  /** Key configuration: application/ohttp-keys (RFC 9458 Section 9.1) */
  KEYS: "application/ohttp-keys",
  /** Encapsulated request: message/ohttp-req (RFC 9458 Section 9.2) */
  REQUEST: "message/ohttp-req",
  /** Encapsulated response: message/ohttp-res (RFC 9458 Section 9.3) */
  RESPONSE: "message/ohttp-res",
  /** Chunked encapsulated request: message/ohttp-chunked-req (draft-08 Section 8.1) */
  CHUNKED_REQUEST: "message/ohttp-chunked-req",
  /** Chunked encapsulated response: message/ohttp-chunked-res (draft-08 Section 8.2) */
  CHUNKED_RESPONSE: "message/ohttp-chunked-res"
};
var bhttp = {
  encoder: new BHttpEncoder(),
  decoder: new BHttpDecoder()
};
var KemId = {
  // Standard KEMs (RFC 9180)
  P256_HKDF_SHA256: 16,
  P384_HKDF_SHA384: 17,
  P521_HKDF_SHA512: 18,
  X25519_HKDF_SHA256: 32,
  X448_HKDF_SHA512: 33,
  // Post-quantum KEMs (ML-KEM, FIPS 203)
  ML_KEM_512: 64,
  ML_KEM_768: 65,
  ML_KEM_1024: 66,
  // Hybrid KEMs
  MLKEM768_P256: 80,
  MLKEM1024_P384: 81,
  MLKEM768_X25519: 25722
};
var KdfId = {
  HKDF_SHA256: 1,
  HKDF_SHA384: 2,
  HKDF_SHA512: 3
};
var AeadId = {
  AES_128_GCM: 1,
  AES_256_GCM: 2,
  /** Defined for parsing; not implemented for encryption (use AES-GCM) */
  ChaCha20Poly1305: 3
};
function isValidKemId(id) {
  return (
    // Standard KEMs
    id === KemId.P256_HKDF_SHA256 || id === KemId.P384_HKDF_SHA384 || id === KemId.P521_HKDF_SHA512 || id === KemId.X25519_HKDF_SHA256 || id === KemId.X448_HKDF_SHA512 || // Post-quantum KEMs
    id === KemId.ML_KEM_512 || id === KemId.ML_KEM_768 || id === KemId.ML_KEM_1024 || // Hybrid KEMs
    id === KemId.MLKEM768_P256 || id === KemId.MLKEM1024_P384 || id === KemId.MLKEM768_X25519
  );
}
function isValidKdfId(id) {
  return id === KdfId.HKDF_SHA256 || id === KdfId.HKDF_SHA384 || id === KdfId.HKDF_SHA512;
}
function isValidAeadId(id) {
  return id === AeadId.AES_128_GCM || id === AeadId.AES_256_GCM || id === AeadId.ChaCha20Poly1305;
}
function getPublicKeyLength(kemId) {
  switch (kemId) {
    // Standard KEMs
    case KemId.X25519_HKDF_SHA256:
      return 32;
    case KemId.X448_HKDF_SHA512:
      return 56;
    case KemId.P256_HKDF_SHA256:
      return 65;
    // Uncompressed point
    case KemId.P384_HKDF_SHA384:
      return 97;
    case KemId.P521_HKDF_SHA512:
      return 133;
    // ML-KEM (FIPS 203)
    case KemId.ML_KEM_512:
      return 800;
    case KemId.ML_KEM_768:
      return 1184;
    case KemId.ML_KEM_1024:
      return 1568;
    // Hybrid KEMs (ML-KEM + ECDH)
    case KemId.MLKEM768_P256:
      return 1184 + 65;
    // ML-KEM-768 + P-256 uncompressed
    case KemId.MLKEM1024_P384:
      return 1568 + 97;
    // ML-KEM-1024 + P-384 uncompressed
    case KemId.MLKEM768_X25519:
      return 1184 + 32;
    // ML-KEM-768 + X25519
    default:
      throw new OHTTPError(OHTTPErrorCode.UnsupportedCipherSuite);
  }
}
function serializeKeyConfig(config) {
  const symAlgosLen = config.symmetricAlgorithms.length * 4;
  const totalLen = 1 + 2 + config.publicKey.length + 2 + symAlgosLen;
  const result = new Uint8Array(totalLen);
  const view = new DataView(result.buffer);
  let offset = 0;
  view.setUint8(offset, config.keyId);
  offset += 1;
  view.setUint16(offset, config.kemId);
  offset += 2;
  result.set(config.publicKey, offset);
  offset += config.publicKey.length;
  view.setUint16(offset, symAlgosLen);
  offset += 2;
  for (const algo of config.symmetricAlgorithms) {
    view.setUint16(offset, algo.kdfId);
    view.setUint16(offset + 2, algo.aeadId);
    offset += 4;
  }
  return result;
}
function parseKeyConfig(data) {
  if (data.length < 7) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;
  const keyId = view.getUint8(offset);
  offset += 1;
  const kemIdRaw = view.getUint16(offset);
  if (!isValidKemId(kemIdRaw)) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  const kemId = kemIdRaw;
  offset += 2;
  const publicKeyLength = getPublicKeyLength(kemId);
  if (offset + publicKeyLength > data.length) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  const publicKey = data.slice(offset, offset + publicKeyLength);
  offset += publicKeyLength;
  if (offset + 2 > data.length) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  const symmetricAlgorithmsLength = view.getUint16(offset);
  offset += 2;
  if (symmetricAlgorithmsLength % 4 !== 0) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  if (offset + symmetricAlgorithmsLength > data.length) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  const symmetricAlgorithms = [];
  const endOffset = offset + symmetricAlgorithmsLength;
  while (offset < endOffset) {
    const kdfIdRaw = view.getUint16(offset);
    const aeadIdRaw = view.getUint16(offset + 2);
    if (!isValidKdfId(kdfIdRaw) || !isValidAeadId(aeadIdRaw)) {
      throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
    }
    symmetricAlgorithms.push({ kdfId: kdfIdRaw, aeadId: aeadIdRaw });
    offset += 4;
  }
  if (symmetricAlgorithms.length === 0) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  if (offset !== data.length) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  return {
    keyId,
    kemId,
    publicKey,
    symmetricAlgorithms
  };
}
function serializeKeyConfigs(configs) {
  const serialized = [];
  let totalLen = 0;
  for (const config of configs) {
    const s = serializeKeyConfig(config);
    serialized.push(s);
    totalLen += 2 + s.length;
  }
  const result = new Uint8Array(totalLen);
  const view = new DataView(result.buffer);
  let offset = 0;
  for (const s of serialized) {
    view.setUint16(offset, s.length);
    offset += 2;
    result.set(s, offset);
    offset += s.length;
  }
  return result;
}
function parseKeyConfigs(data) {
  const configs = [];
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;
  while (offset < data.length) {
    if (offset + 2 > data.length) {
      throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
    }
    const length2 = view.getUint16(offset);
    offset += 2;
    if (offset + length2 > data.length) {
      throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
    }
    const configBytes = data.slice(offset, offset + length2);
    configs.push(parseKeyConfig(configBytes));
    offset += length2;
  }
  return configs;
}
async function generateKeyConfig(suite, keyId, symmetricAlgorithms) {
  if (keyId < 0 || keyId > 255) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  const kemId = suite.KEM.id;
  if (!isValidKemId(kemId)) {
    throw new OHTTPError(OHTTPErrorCode.UnsupportedCipherSuite);
  }
  const keyPair = await suite.GenerateKeyPair(true);
  const publicKey = await suite.SerializePublicKey(keyPair.publicKey);
  return {
    keyId,
    kemId,
    publicKey,
    symmetricAlgorithms,
    keyPair,
    suite
  };
}
async function deriveKeyConfig(suite, seed, keyId, symmetricAlgorithms) {
  if (keyId < 0 || keyId > 255) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  if (seed.length < suite.KEM.Nsk) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  const kemId = suite.KEM.id;
  if (!isValidKemId(kemId)) {
    throw new OHTTPError(OHTTPErrorCode.UnsupportedCipherSuite);
  }
  const keyPair = await suite.DeriveKeyPair(seed, true);
  const publicKey = await suite.SerializePublicKey(keyPair.publicKey);
  return {
    keyId,
    kemId,
    publicKey,
    symmetricAlgorithms,
    keyPair,
    suite
  };
}
async function importKeyConfig(suite, keyId, publicKeyBytes, privateKeyBytes, symmetricAlgorithms) {
  if (keyId < 0 || keyId > 255) {
    throw new OHTTPError(OHTTPErrorCode.InvalidKeyConfig);
  }
  const kemId = suite.KEM.id;
  if (!isValidKemId(kemId)) {
    throw new OHTTPError(OHTTPErrorCode.UnsupportedCipherSuite);
  }
  const publicKey = await suite.DeserializePublicKey(publicKeyBytes);
  const privateKey = await suite.DeserializePrivateKey(privateKeyBytes, true);
  const keyPair = { publicKey, privateKey };
  return {
    keyId,
    kemId,
    publicKey: publicKeyBytes,
    symmetricAlgorithms,
    keyPair,
    suite
  };
}
function concat(...arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
function toArrayBuffer(data) {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
}
var textEncoder2 = new TextEncoder();
function encodeString(s) {
  return textEncoder2.encode(s);
}
var DEFAULT_REQUEST_LABEL = "message/bhttp request";
var DEFAULT_RESPONSE_LABEL = "message/bhttp response";
var HEADER_SIZE = 7;
function writeHeader(view, offset, keyId, kemId, kdfId, aeadId) {
  view.setUint8(offset, keyId);
  view.setUint16(offset + 1, kemId);
  view.setUint16(offset + 3, kdfId);
  view.setUint16(offset + 5, aeadId);
  return HEADER_SIZE;
}
function buildRequestInfo(keyId, kemId, kdfId, aeadId, label = DEFAULT_REQUEST_LABEL) {
  const labelBytes = encodeString(label);
  const result = new Uint8Array(labelBytes.length + 1 + HEADER_SIZE);
  const view = new DataView(result.buffer);
  result.set(labelBytes, 0);
  view.setUint8(labelBytes.length, 0);
  writeHeader(view, labelBytes.length + 1, keyId, kemId, kdfId, aeadId);
  return result;
}
function buildRequestHeader(keyId, kemId, kdfId, aeadId) {
  const result = new Uint8Array(HEADER_SIZE);
  const view = new DataView(result.buffer);
  writeHeader(view, 0, keyId, kemId, kdfId, aeadId);
  return result;
}
function getResponseNonceLength(suite) {
  return Math.max(suite.AEAD.Nn, suite.AEAD.Nk);
}
async function encapsulateRequest(suite, publicKey, keyConfig, kdfId, aeadId, request, label = DEFAULT_REQUEST_LABEL) {
  const info = buildRequestInfo(keyConfig.keyId, keyConfig.kemId, kdfId, aeadId, label);
  const { encapsulatedSecret: enc, ctx: senderContext } = await suite.SetupSender(publicKey, {
    info
  });
  const ciphertext = await senderContext.Seal(request);
  const header = buildRequestHeader(keyConfig.keyId, keyConfig.kemId, kdfId, aeadId);
  const encapsulatedRequest = concat(header, enc, ciphertext);
  return {
    encapsulatedRequest,
    senderContext,
    enc,
    suite
  };
}
async function decapsulateResponse(clientContext, encapsulatedResponse, label = DEFAULT_RESPONSE_LABEL) {
  const { senderContext, enc, suite } = clientContext;
  const nonceLength = getResponseNonceLength(suite);
  if (encapsulatedResponse.length < nonceLength) {
    throw new OHTTPError(OHTTPErrorCode.InvalidMessage);
  }
  const responseNonce = encapsulatedResponse.slice(0, nonceLength);
  const ciphertext = encapsulatedResponse.slice(nonceLength);
  const secret = await senderContext.Export(encodeString(label), nonceLength);
  const salt = concat(enc, responseNonce);
  const kdf = suite.KDF;
  const prk = await extractPrk(kdf, salt, secret);
  const aeadKey = await expandPrk(kdf, prk, encodeString("key"), suite.AEAD.Nk);
  const aeadNonce = await expandPrk(kdf, prk, encodeString("nonce"), suite.AEAD.Nn);
  const aead = suite.AEAD;
  try {
    return await openWithRawAead(aead, aeadKey, aeadNonce, new Uint8Array(0), ciphertext);
  } catch {
    throw new OHTTPError(OHTTPErrorCode.DecryptionFailed);
  }
}
function asArrayBuffer(data) {
  if (typeof SharedArrayBuffer !== "undefined" && data.buffer instanceof SharedArrayBuffer) {
    const copy = new ArrayBuffer(data.byteLength);
    new Uint8Array(copy).set(data);
    return copy;
  }
  const sliced = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  return sliced;
}
async function extractPrk(kdf, salt, ikm) {
  const algorithm = kdf.name.includes("256") ? "SHA-256" : kdf.name.includes("384") ? "SHA-384" : "SHA-512";
  const key = await crypto.subtle.importKey(
    "raw",
    asArrayBuffer(salt),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );
  const prk = await crypto.subtle.sign("HMAC", key, asArrayBuffer(ikm));
  return new Uint8Array(prk);
}
async function expandPrk(kdf, prk, info, length2) {
  const algorithm = kdf.name.includes("256") ? "SHA-256" : kdf.name.includes("384") ? "SHA-384" : "SHA-512";
  const hashLen = kdf.Nh;
  const n = Math.ceil(length2 / hashLen);
  const okm = new Uint8Array(n * hashLen);
  const key = await crypto.subtle.importKey(
    "raw",
    asArrayBuffer(prk),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );
  let t = new Uint8Array(0);
  for (let i = 1; i <= n; i++) {
    const input = concat(t, info, new Uint8Array([i]));
    const block = await crypto.subtle.sign("HMAC", key, asArrayBuffer(input));
    t = new Uint8Array(block);
    okm.set(t, (i - 1) * hashLen);
  }
  return okm.slice(0, length2);
}
async function openWithRawAead(aead, key, nonce, aad, ciphertext) {
  const algorithm = aead.name.includes("AES") ? "AES-GCM" : "ChaCha20-Poly1305";
  if (algorithm === "AES-GCM") {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      asArrayBuffer(key),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: asArrayBuffer(nonce), additionalData: asArrayBuffer(aad) },
      cryptoKey,
      asArrayBuffer(ciphertext)
    );
    return new Uint8Array(pt);
  }
  throw new OHTTPError(OHTTPErrorCode.UnsupportedCipherSuite);
}
var FINAL_CHUNK_AAD = encodeString("final");
var MAX_CHUNKS = 2 ** 32;
var OHTTPClient = class {
  suite;
  keyConfig;
  kdfId;
  aeadId;
  requestLabel;
  responseLabel;
  /**
   * Create an OHTTP client
   *
   * @param suite - The HPKE cipher suite to use
   * @param keyConfig - The server's public key configuration
   * @param options - Optional configuration
   */
  constructor(suite, keyConfig, options = {}) {
    this.suite = suite;
    this.keyConfig = keyConfig;
    this.requestLabel = options.requestLabel ?? DEFAULT_REQUEST_LABEL;
    this.responseLabel = options.responseLabel ?? DEFAULT_RESPONSE_LABEL;
    const rawKdfId = suite.KDF.id;
    const rawAeadId = suite.AEAD.id;
    if (!isValidKdfId(rawKdfId) || !isValidAeadId(rawAeadId)) {
      throw new OHTTPError(OHTTPErrorCode.UnsupportedCipherSuite);
    }
    const matchingAlgo = keyConfig.symmetricAlgorithms.find(
      (a) => a.kdfId === rawKdfId && a.aeadId === rawAeadId
    );
    if (matchingAlgo === void 0) {
      throw new OHTTPError(OHTTPErrorCode.UnsupportedCipherSuite);
    }
    this.kdfId = rawKdfId;
    this.aeadId = rawAeadId;
  }
  /**
   * Encapsulate a binary HTTP request (low-level API)
   *
   * @param request - The binary HTTP request bytes to encapsulate
   * @returns The encapsulated request bytes and context for decrypting the response
   */
  async encapsulate(request) {
    const publicKey = await this.suite.DeserializePublicKey(this.keyConfig.publicKey);
    const ctx = await encapsulateRequest(
      this.suite,
      publicKey,
      this.keyConfig,
      this.kdfId,
      this.aeadId,
      request,
      this.requestLabel
    );
    const responseLabel = this.responseLabel;
    const context = {
      async decryptResponse(encapsulatedResponse) {
        return decapsulateResponse(ctx, encapsulatedResponse, responseLabel);
      }
    };
    return {
      encapsulatedRequest: ctx.encapsulatedRequest,
      context
    };
  }
  /**
   * Encapsulate an HTTP Request (high-level API)
   *
   * Encodes the request using Binary HTTP (RFC 9292), then encapsulates with OHTTP.
   * Returns a RequestInit ready to use with fetch() or new Request().
   *
   * @param request - The HTTP Request to encapsulate
   * @returns A RequestInit for the relay and context for decapsulating the response
   *
   * @example
   * ```typescript
   * const { init, context } = await client.encapsulateRequest(request);
   * const response = await fetch(relayUrl, init);
   * const innerResponse = await context.decapsulateResponse(response);
   * ```
   */
  async encapsulateRequest(request) {
    let binaryRequest;
    try {
      binaryRequest = await bhttp.encoder.encodeRequest(request);
    } catch {
      throw new OHTTPError(OHTTPErrorCode.InvalidMessage);
    }
    const { encapsulatedRequest, context: bytesContext } = await this.encapsulate(binaryRequest);
    const context = {
      async decapsulateResponse(response) {
        const contentType = response.headers.get("content-type");
        if (contentType !== MediaType.RESPONSE) {
          throw new OHTTPError(OHTTPErrorCode.InvalidMessage);
        }
        const encapsulatedResponse = new Uint8Array(await response.arrayBuffer());
        let binaryResponse;
        try {
          binaryResponse = await bytesContext.decryptResponse(encapsulatedResponse);
        } catch {
          throw new OHTTPError(OHTTPErrorCode.DecryptionFailed);
        }
        try {
          return bhttp.decoder.decodeResponse(binaryResponse);
        } catch {
          throw new OHTTPError(OHTTPErrorCode.DecryptionFailed);
        }
      }
    };
    const init = {
      method: "POST",
      headers: {
        "Content-Type": MediaType.REQUEST
      },
      body: toArrayBuffer(encapsulatedRequest)
    };
    return { init, context };
  }
};
var KeyConfig = {
  /** Generate a new KeyConfig with random key pair */
  generate: generateKeyConfig,
  /** Derive a deterministic KeyConfig from a seed */
  derive: deriveKeyConfig,
  /** Import a KeyConfig from raw key bytes */
  import: importKeyConfig,
  /** Parse a single KeyConfig from bytes */
  parse: parseKeyConfig,
  /** Parse multiple KeyConfigs from application/ohttp-keys format */
  parseMultiple: parseKeyConfigs,
  /** Serialize a KeyConfig to bytes */
  serialize: serializeKeyConfig,
  /** Serialize multiple KeyConfigs to application/ohttp-keys format */
  serializeMultiple: serializeKeyConfigs,
  /** Get the public key length for a KEM */
  getPublicKeyLength
};

// node_modules/hpke/index.js
function ComputeNonce(base_nonce, seq, Nn) {
  const seq_bytes = I2OSP(seq, Nn);
  return xor(base_nonce, seq_bytes);
}
function IncrementSeq(seq) {
  if (seq >= Number.MAX_SAFE_INTEGER) {
    throw new MessageLimitReachedError("Sequence number overflow");
  }
  return ++seq;
}
async function ContextExport(suite, exporterSecret, exporterContext, L) {
  checkUint8Array(exporterContext, "exporterContext");
  const stages = KDFStages(suite.KDF);
  if (!Number.isInteger(L) || L <= 0 || L > 65535) {
    throw new TypeError('"L" must be a positive integer not exceeding 65535');
  }
  const Export = stages === 1 ? Export_OneStage : Export_TwoStage;
  return await Export(suite.KDF, suite.id, exporterSecret, exporterContext, L);
}
var Mutex = class {
  #locked = Promise.resolve();
  async lock() {
    let releaseLock;
    const nextLock = new Promise((resolve) => {
      releaseLock = resolve;
    });
    const previousLock = this.#locked;
    this.#locked = nextLock;
    await previousLock;
    return releaseLock;
  }
};
var SenderContext = class {
  #suite;
  #key;
  #base_nonce;
  #exporter_secret;
  #mode;
  #seq = 0;
  #mutex;
  constructor(suite, mode, key, base_nonce, exporter_secret) {
    this.#suite = suite;
    this.#mode = mode;
    this.#key = key;
    this.#base_nonce = base_nonce;
    this.#exporter_secret = exporter_secret;
  }
  get mode() {
    return this.#mode;
  }
  get seq() {
    return this.#seq;
  }
  async Seal(plaintext, aad) {
    checkUint8Array(plaintext, "plaintext");
    aad ??= new Uint8Array();
    checkUint8Array(aad, "aad");
    if (this.#suite.AEAD.id === EXPORT_ONLY) {
      throw new TypeError("Export-only AEAD cannot be used with Seal");
    }
    this.#mutex ??= new Mutex();
    const release = await this.#mutex.lock();
    let ct;
    try {
      ct = await this.#suite.AEAD.Seal(
        this.#key,
        ComputeNonce(this.#base_nonce, this.#seq, this.#suite.AEAD.Nn),
        aad,
        plaintext
      );
      this.#seq = IncrementSeq(this.#seq);
      return ct;
    } finally {
      release();
    }
  }
  async Export(exporterContext, length2) {
    return await ContextExport(this.#suite, this.#exporter_secret, exporterContext, length2);
  }
  get Nt() {
    return this.#suite.AEAD.Nt;
  }
};
var RecipientContext = class {
  #suite;
  #key;
  #base_nonce;
  #exporter_secret;
  #mode;
  #seq = 0;
  #mutex;
  constructor(suite, mode, key, base_nonce, exporter_secret) {
    this.#suite = suite;
    this.#mode = mode;
    this.#key = key;
    this.#base_nonce = base_nonce;
    this.#exporter_secret = exporter_secret;
  }
  get mode() {
    return this.#mode;
  }
  get seq() {
    return this.#seq;
  }
  async Open(ciphertext, aad) {
    checkUint8Array(ciphertext, "ciphertext");
    aad ??= new Uint8Array();
    checkUint8Array(aad, "aad");
    if (this.#suite.AEAD.id === EXPORT_ONLY) {
      throw new TypeError("Export-only AEAD cannot be used with Open");
    }
    this.#mutex ??= new Mutex();
    const release = await this.#mutex.lock();
    try {
      let pt;
      try {
        pt = await this.#suite.AEAD.Open(
          this.#key,
          ComputeNonce(this.#base_nonce, this.#seq, this.#suite.AEAD.Nn),
          aad,
          ciphertext
        );
      } catch (cause) {
        if (cause instanceof MessageLimitReachedError || cause instanceof NotSupportedError2) {
          throw cause;
        }
        throw new OpenError("AEAD decryption failed", { cause });
      }
      this.#seq = IncrementSeq(this.#seq);
      return pt;
    } finally {
      release();
    }
  }
  async Export(exporterContext, length2) {
    return await ContextExport(this.#suite, this.#exporter_secret, exporterContext, length2);
  }
};
var validate = (factory, type) => {
  try {
    const result = factory();
    if (result.type !== type) {
      throw new Error(`Invalid "${type}" return discriminator`);
    }
    return result;
  } catch (cause) {
    throw new TypeError(`Invalid "${type}"`, { cause });
  }
};
var CipherSuite = class {
  #suite;
  constructor(KEM, KDF, AEAD) {
    const kem = validate(KEM, "KEM");
    const kdf = validate(KDF, "KDF");
    const aead = validate(AEAD, "AEAD");
    this.#suite = {
      KEM: kem,
      KDF: kdf,
      AEAD: aead,
      id: concat2(encode4("HPKE"), I2OSP(kem.id, 2), I2OSP(kdf.id, 2), I2OSP(aead.id, 2))
    };
  }
  get KEM() {
    return {
      id: this.#suite.KEM.id,
      name: this.#suite.KEM.name,
      Nsecret: this.#suite.KEM.Nsecret,
      Nenc: this.#suite.KEM.Nenc,
      Npk: this.#suite.KEM.Npk,
      Nsk: this.#suite.KEM.Nsk
    };
  }
  get KDF() {
    return {
      id: this.#suite.KDF.id,
      name: this.#suite.KDF.name,
      stages: this.#suite.KDF.stages,
      Nh: this.#suite.KDF.Nh
    };
  }
  get AEAD() {
    return {
      id: this.#suite.AEAD.id,
      name: this.#suite.AEAD.name,
      Nk: this.#suite.AEAD.Nk,
      Nn: this.#suite.AEAD.Nn,
      Nt: this.#suite.AEAD.Nt
    };
  }
  async GenerateKeyPair(extractable) {
    extractable ??= false;
    checkExtractable(extractable);
    return await this.#suite.KEM.GenerateKeyPair(extractable);
  }
  async DeriveKeyPair(ikm, extractable) {
    extractable ??= false;
    checkExtractable(extractable);
    checkUint8Array(ikm, "ikm");
    if (ikm.byteLength < this.#suite.KEM.Nsk) {
      throw new DeriveKeyPairError('Insufficient "ikm" length');
    }
    try {
      return await this.#suite.KEM.DeriveKeyPair(ikm, extractable);
    } catch (cause) {
      if (cause instanceof NotSupportedError2) {
        throw cause;
      }
      throw new DeriveKeyPairError("Key derivation failed", { cause });
    }
  }
  async SerializePrivateKey(privateKey) {
    isKey(privateKey, "private", true);
    return await this.#suite.KEM.SerializePrivateKey(privateKey);
  }
  async SerializePublicKey(publicKey) {
    isKey(publicKey, "public", true);
    return await this.#suite.KEM.SerializePublicKey(publicKey);
  }
  async DeserializePrivateKey(privateKey, extractable) {
    extractable ??= false;
    checkExtractable(extractable);
    checkUint8Array(privateKey, "privateKey");
    try {
      if (privateKey.byteLength !== this.#suite.KEM.Nsk) {
        throw new Error('Invalid "privateKey" length');
      }
      return await this.#suite.KEM.DeserializePrivateKey(privateKey, extractable);
    } catch (cause) {
      if (cause instanceof NotSupportedError2) {
        throw cause;
      }
      throw new DeserializeError("Private key deserialization failed", { cause });
    }
  }
  async DeserializePublicKey(publicKey) {
    checkUint8Array(publicKey, "publicKey");
    try {
      if (publicKey.byteLength !== this.#suite.KEM.Npk) {
        throw new Error('Invalid "publicKey" length');
      }
      return await this.#suite.KEM.DeserializePublicKey(publicKey);
    } catch (cause) {
      if (cause instanceof NotSupportedError2) {
        throw cause;
      }
      throw new DeserializeError("Public key deserialization failed", { cause });
    }
  }
  async Seal(publicKey, plaintext, options) {
    if (this.#suite.AEAD.id === EXPORT_ONLY) {
      throw new TypeError("Export-only AEAD cannot be used with Seal");
    }
    const { encapsulatedSecret, ctx } = await this.SetupSender(publicKey, options);
    const ciphertext = await ctx.Seal(plaintext, options?.aad);
    return { encapsulatedSecret, ciphertext };
  }
  async Open(privateKey, encapsulatedSecret, ciphertext, options) {
    if (this.#suite.AEAD.id === EXPORT_ONLY) {
      throw new TypeError("Export-only AEAD cannot be used with Open");
    }
    const ctx = await this.SetupRecipient(privateKey, encapsulatedSecret, options);
    return await ctx.Open(ciphertext, options?.aad);
  }
  async SendExport(publicKey, exporterContext, length2, options) {
    const { encapsulatedSecret, ctx } = await this.SetupSender(publicKey, options);
    const exportedSecret = await ctx.Export(exporterContext, length2);
    return { encapsulatedSecret, exportedSecret };
  }
  async ReceiveExport(privateKey, encapsulatedSecret, exporterContext, length2, options) {
    const ctx = await this.SetupRecipient(privateKey, encapsulatedSecret, options);
    return await ctx.Export(exporterContext, length2);
  }
  async SetupSender(publicKey, options) {
    isKey(publicKey, "public");
    let shared_secret;
    let enc;
    try {
      const result = await this.#suite.KEM.Encap(publicKey);
      shared_secret = result.shared_secret;
      enc = result.enc;
    } catch (cause) {
      if (cause instanceof ValidationError || cause instanceof NotSupportedError2) {
        throw cause;
      }
      throw new EncapError("Encapsulation failed", { cause });
    }
    const mode = options?.psk?.byteLength ? MODE_PSK : MODE_BASE;
    const { key, base_nonce, exporter_secret } = await KeySchedule(
      this.#suite,
      mode,
      shared_secret,
      options?.info,
      options?.psk,
      options?.pskId
    );
    const ctx = new SenderContext(this.#suite, mode, key, base_nonce, exporter_secret);
    return { encapsulatedSecret: enc, ctx };
  }
  async SetupRecipient(privateKey, encapsulatedSecret, options) {
    const { skR, pkR } = this.#extractRecipientKeys(privateKey);
    checkUint8Array(encapsulatedSecret, "encapsulatedSecret");
    if (encapsulatedSecret.byteLength !== this.#suite.KEM.Nenc) {
      throw new DecapError("Invalid encapsulated secret length");
    }
    let shared_secret;
    try {
      shared_secret = await this.#suite.KEM.Decap(encapsulatedSecret, skR, pkR);
    } catch (cause) {
      if (cause instanceof ValidationError || cause instanceof NotSupportedError2) {
        throw cause;
      }
      throw new DecapError("Decapsulation failed", { cause });
    }
    const mode = options?.psk?.byteLength ? MODE_PSK : MODE_BASE;
    const { key, base_nonce, exporter_secret } = await KeySchedule(
      this.#suite,
      mode,
      shared_secret,
      options?.info,
      options?.psk,
      options?.pskId
    );
    return new RecipientContext(this.#suite, mode, key, base_nonce, exporter_secret);
  }
  #extractRecipientKeys(skR) {
    if (isKeyPair(skR)) {
      return { skR: skR.privateKey, pkR: skR.publicKey };
    }
    isKey(skR, "private");
    return { skR, pkR: void 0 };
  }
};
var ValidationError = class _ValidationError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "ValidationError";
    Error.captureStackTrace?.(this, _ValidationError);
  }
};
var DeserializeError = class _DeserializeError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "DeserializeError";
    Error.captureStackTrace?.(this, _DeserializeError);
  }
};
var EncapError = class _EncapError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "EncapError";
    Error.captureStackTrace?.(this, _EncapError);
  }
};
var DecapError = class _DecapError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "DecapError";
    Error.captureStackTrace?.(this, _DecapError);
  }
};
var OpenError = class _OpenError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "OpenError";
    Error.captureStackTrace?.(this, _OpenError);
  }
};
var MessageLimitReachedError = class _MessageLimitReachedError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "MessageLimitReachedError";
    Error.captureStackTrace?.(this, _MessageLimitReachedError);
  }
};
var DeriveKeyPairError = class _DeriveKeyPairError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "DeriveKeyPairError";
    Error.captureStackTrace?.(this, _DeriveKeyPairError);
  }
};
var NotSupportedError2 = class _NotSupportedError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "NotSupportedError";
    Error.captureStackTrace?.(this, _NotSupportedError);
  }
};
var MODE_BASE = 0;
var MODE_PSK = 1;
function concat2(...buffers) {
  const size = buffers.reduce((acc, { length: length2 }) => acc + length2, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
function slice(buffer, start, end) {
  return Uint8Array.prototype.slice.call(buffer, start, end);
}
function encode4(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("Input string must contain only ASCII characters");
    }
    bytes[i] = code;
  }
  return bytes;
}
function xor(a, b) {
  if (a.byteLength !== b.byteLength) {
    throw new Error("XOR operands must have equal length");
  }
  const buf = new Uint8Array(a.byteLength);
  for (let i = 0; i < a.byteLength; i++) {
    buf[i] = a[i] ^ b[i];
  }
  return buf;
}
function lengthPrefixed(x) {
  return concat2(I2OSP(x.byteLength, 2), x);
}
async function LabeledDerive(KDF, suite_id, ikm, label, context, L) {
  const labeled_ikm = concat2(
    ikm,
    encode4("HPKE-v1"),
    suite_id,
    lengthPrefixed(label),
    I2OSP(L, 2),
    context
  );
  return await KDF.Derive(labeled_ikm, L);
}
async function Export_OneStage(KDF, suite_id, exporter_secret, exporter_context, L) {
  checkLength(exporter_context, "Exporter context", MAX_LENGTH_ONE_STAGE);
  return await LabeledDerive(KDF, suite_id, exporter_secret, encode4("sec"), exporter_context, L);
}
async function CombineSecrets_OneStage(suite, mode, shared_secret, info, psk, psk_id) {
  checkLength(psk, "PSK", MAX_LENGTH_ONE_STAGE);
  checkLength(psk_id, "PSK ID", MAX_LENGTH_ONE_STAGE);
  checkLength(info, "Info", MAX_LENGTH_ONE_STAGE);
  const secrets = concat2(lengthPrefixed(psk), lengthPrefixed(shared_secret));
  const context = concat2(I2OSP(mode, 1), lengthPrefixed(psk_id), lengthPrefixed(info));
  const secret = await LabeledDerive(
    suite.KDF,
    suite.id,
    secrets,
    encode4("secret"),
    context,
    suite.AEAD.Nk + suite.AEAD.Nn + suite.KDF.Nh
  );
  const key = slice(secret, 0, suite.AEAD.Nk);
  const base_nonce = slice(secret, suite.AEAD.Nk, suite.AEAD.Nk + suite.AEAD.Nn);
  const exporter_secret = slice(secret, suite.AEAD.Nk + suite.AEAD.Nn);
  return { key, base_nonce, exporter_secret };
}
var MAX_LENGTH_TWO_STAGE = 65535;
var MAX_LENGTH_ONE_STAGE = 65535;
function checkLength(data, name, maxLength) {
  if (data.byteLength > maxLength) {
    throw new TypeError(`${name} length must not exceed ${maxLength} bytes`);
  }
}
function checkUint8Array(input, name) {
  if (!(input instanceof Uint8Array)) {
    throw new TypeError(`"${name}" must be Uint8Array`);
  }
}
function checkExtractable(extractable) {
  if (typeof extractable !== "boolean") {
    throw new TypeError('"extractable" must be boolean');
  }
}
async function CombineSecrets_TwoStage(suite, mode, shared_secret, info, psk, psk_id) {
  checkLength(psk, "PSK", MAX_LENGTH_TWO_STAGE);
  checkLength(psk_id, "PSK ID", MAX_LENGTH_TWO_STAGE);
  checkLength(info, "Info", MAX_LENGTH_TWO_STAGE);
  const [psk_id_hash, info_hash] = await Promise.all([
    LabeledExtract(suite.KDF, suite.id, new Uint8Array(), encode4("psk_id_hash"), psk_id),
    LabeledExtract(suite.KDF, suite.id, new Uint8Array(), encode4("info_hash"), info)
  ]);
  const key_schedule_context = concat2(I2OSP(mode, 1), psk_id_hash, info_hash);
  const secret = await LabeledExtract(suite.KDF, suite.id, shared_secret, encode4("secret"), psk);
  if (suite.AEAD.id === EXPORT_ONLY) {
    const exporter_secret2 = await LabeledExpand(
      suite.KDF,
      suite.id,
      secret,
      encode4("exp"),
      key_schedule_context,
      suite.KDF.Nh
    );
    return { key: new Uint8Array(), base_nonce: new Uint8Array(), exporter_secret: exporter_secret2 };
  }
  const [key, base_nonce, exporter_secret] = await Promise.all([
    LabeledExpand(suite.KDF, suite.id, secret, encode4("key"), key_schedule_context, suite.AEAD.Nk),
    LabeledExpand(
      suite.KDF,
      suite.id,
      secret,
      encode4("base_nonce"),
      key_schedule_context,
      suite.AEAD.Nn
    ),
    LabeledExpand(suite.KDF, suite.id, secret, encode4("exp"), key_schedule_context, suite.KDF.Nh)
  ]);
  return { key, base_nonce, exporter_secret };
}
async function Export_TwoStage(KDF, suite_id, exporter_secret, exporter_context, L) {
  checkLength(exporter_context, "Exporter context", MAX_LENGTH_TWO_STAGE);
  return await LabeledExpand(KDF, suite_id, exporter_secret, encode4("sec"), exporter_context, L);
}
async function LabeledExtract(KDF, suite_id, salt, label, ikm) {
  const labeled_ikm = concat2(encode4("HPKE-v1"), suite_id, label, ikm);
  return await KDF.Extract(salt, labeled_ikm);
}
async function LabeledExpand(KDF, suite_id, prk, label, info, L) {
  const labeled_info = concat2(I2OSP(L, 2), encode4("HPKE-v1"), suite_id, label, info);
  return await KDF.Expand(prk, labeled_info, L);
}
function isKeyPair(skR) {
  if (!skR || typeof skR !== "object") return false;
  if ("publicKey" in skR && "privateKey" in skR) {
    const pkR = skR.publicKey;
    skR = skR.privateKey;
    try {
      isKey(pkR, "public");
      isKey(skR, "private");
      if (pkR.algorithm.name !== skR.algorithm.name) {
        throw new TypeError("key pair algorithms do not match");
      }
    } catch (cause) {
      throw new TypeError('Invalid "privateKey"', { cause });
    }
    return true;
  }
  return false;
}
function isKey(key, type, extractable) {
  const k = key;
  if (typeof k.algorithm !== "object" || typeof k.algorithm.name !== "string" || typeof k.extractable !== "boolean" || typeof k.type !== "string" || k.type !== type) {
    throw new TypeError(`Invalid "${type}Key"`);
  }
  if (extractable && k.extractable !== true) {
    throw new TypeError(`"${type}Key" must be extractable`);
  }
}
function I2OSP(n, w) {
  if (!Number.isSafeInteger(w) || w <= 0) {
    throw new Error("w must be a positive safe integer");
  }
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new Error("n must be a non-negative safe integer");
  }
  const max = Math.pow(256, w);
  if (n >= max) {
    throw new Error("n too large to fit in w-length byte string");
  }
  const ret = new Uint8Array(w);
  let num2 = n;
  for (let i = 0; i < w && num2; i++) {
    ret[w - (i + 1)] = num2 % 256;
    num2 = Math.floor(num2 / 256);
  }
  return ret;
}
function KDFStages(KDF) {
  if (KDF.stages === 1 || KDF.stages === 2) {
    return KDF.stages;
  }
  throw new Error("unreachable");
}
async function KeySchedule(suite, mode, shared_secret, info, psk, pskId) {
  info ??= new Uint8Array();
  checkUint8Array(info, "info");
  psk ??= new Uint8Array();
  checkUint8Array(psk, "psk");
  pskId ??= new Uint8Array();
  checkUint8Array(pskId, "pskId");
  const stages = KDFStages(suite.KDF);
  const CombineSecrets = stages === 1 ? CombineSecrets_OneStage : CombineSecrets_TwoStage;
  VerifyPSKInputs(psk, pskId);
  return await CombineSecrets(suite, mode, shared_secret, info, psk, pskId);
}
function VerifyPSKInputs(psk, psk_id) {
  if (psk.byteLength && psk_id.byteLength) {
    if (psk.byteLength < 32) {
      throw new TypeError("Insufficient PSK length");
    }
    return;
  }
  if (!psk.byteLength && !psk_id.byteLength) {
    return;
  }
  throw new TypeError("Inconsistent PSK inputs");
}
var NotApplicable = () => {
  throw new Error("unreachable");
};
var EXPORT_ONLY = 65535;
async function subtle(promise, name) {
  try {
    return await promise(crypto.subtle);
  } catch (cause) {
    if (cause instanceof TypeError || cause instanceof DOMException && cause.name === "NotSupportedError") {
      throw new NotSupportedError2(`${name} is unsupported in this runtime`, { cause });
    }
    throw cause;
  }
}
function sab(input) {
  return typeof SharedArrayBuffer !== "undefined" && input instanceof SharedArrayBuffer;
}
function ab(input) {
  if (sab(input.buffer)) {
    throw new TypeError("input must not be a SharedArrayBuffer");
  }
  if (input.byteLength === input.buffer.byteLength) {
    return input.buffer;
  }
  return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
}
function HKDF_SHARED() {
  return {
    stages: 2,
    Derive: NotApplicable,
    async Extract(_salt, _ikm) {
      let salt;
      if (_salt.byteLength === 0) {
        salt = new ArrayBuffer(this.Nh);
      } else {
        salt = ab(_salt);
      }
      const ikm = ab(_ikm);
      return new Uint8Array(
        await subtle(
          async (c) => c.sign(
            "HMAC",
            await c.importKey("raw", salt, { name: "HMAC", hash: this.hash }, false, ["sign"]),
            ikm
          ),
          this.name
        )
      );
    },
    async Expand(_prk, info, L) {
      if (_prk.byteLength < this.Nh) {
        throw new Error("prk.byteLength < this.Nh");
      }
      if (L > 255 * this.Nh) {
        throw new Error("L must be <= 255*Nh");
      }
      const N = Math.ceil(L / this.Nh);
      const prk = ab(_prk);
      const key = await subtle(
        (c) => c.importKey("raw", prk, { name: "HMAC", hash: this.hash }, false, ["sign"]),
        this.name
      );
      const T = new Uint8Array(N * this.Nh);
      let T_prev = new Uint8Array();
      for (let i = 0; i < N; i++) {
        const input = new Uint8Array(T_prev.byteLength + info.byteLength + 1);
        input.set(T_prev);
        input.set(info, T_prev.byteLength);
        input[T_prev.byteLength + info.byteLength] = i + 1;
        const T_i = new Uint8Array(await subtle((c) => c.sign("HMAC", key, input), this.name));
        T.set(T_i, i * this.Nh);
        T_prev = T_i;
      }
      return slice(T, 0, L);
    }
  };
}
var KDF_HKDF_SHA256 = function() {
  return { id: 1, type: "KDF", name: "HKDF-SHA256", Nh: 32, hash: "SHA-256", ...HKDF_SHARED() };
};
async function getPublicKeyByExport(name, key, usages) {
  if (!key.extractable) {
    throw new TypeError(
      '"privateKey" must be extractable or a Key Pair must be used in this runtime'
    );
  }
  return await subtle(async (c) => {
    const jwk = await c.exportKey("jwk", key);
    return c.importKey(
      "jwk",
      { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
      key.algorithm,
      true,
      usages
    );
  }, name);
}
async function getPublicKey(name, key, usages) {
  return await subtle((c) => c.getPublicKey?.(key, usages), name) || await getPublicKeyByExport(name, key, usages);
}
function checkNotAllZeros(buffer) {
  let or = 0;
  for (let i = 0; i < buffer.length; i++) {
    or |= buffer[i];
  }
  if (or === 0) {
    throw new ValidationError("DH shared secret is an all-zero value");
  }
}
function fromBase64(input) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
function b64u(input) {
  return Uint8Array.fromBase64?.(input, { alphabet: "base64url" }) || fromBase64(input);
}
function assertKeyAlgorithm(key, expectedAlgorithm) {
  if (key.algorithm.name !== expectedAlgorithm.name) {
    throw new TypeError(`key algorithm must be ${expectedAlgorithm.name}`);
  }
  if (key.algorithm.namedCurve !== expectedAlgorithm.namedCurve) {
    throw new TypeError(
      `key namedCurve must be ${expectedAlgorithm.namedCurve}`
    );
  }
}
function assertCryptoKey(key) {
  if (key[Symbol.toStringTag] !== "CryptoKey") {
    if (key instanceof CryptoKey) return;
    throw new TypeError("unexpected key constructor");
  }
}
async function ExtractAndExpand_TwoStage(DHKEM, dh, kem_context) {
  const eae_prk = await LabeledExtract(
    DHKEM.kdf,
    DHKEM.suite_id,
    new Uint8Array(),
    encode4("eae_prk"),
    dh
  );
  return await LabeledExpand(
    DHKEM.kdf,
    DHKEM.suite_id,
    eae_prk,
    encode4("shared_secret"),
    kem_context,
    DHKEM.Nsecret
  );
}
function DHKEM_SHARED() {
  return {
    async GenerateKeyPair(extractable) {
      return await subtle(
        (c) => c.generateKey(this.algorithm, extractable, ["deriveBits"]),
        this.name
      );
    },
    async SerializePublicKey(key) {
      assertKeyAlgorithm(key, this.algorithm);
      assertCryptoKey(key);
      return new Uint8Array(await subtle((c) => c.exportKey("raw", key), this.name));
    },
    async DeserializePublicKey(_key) {
      const key = ab(_key);
      return await subtle((c) => c.importKey("raw", key, this.algorithm, true, []), this.name);
    },
    async SerializePrivateKey(key) {
      assertKeyAlgorithm(key, this.algorithm);
      assertCryptoKey(key);
      const { d } = await subtle((c) => c.exportKey("jwk", key), this.name);
      return b64u(d);
    },
    async Encap(pkR) {
      assertKeyAlgorithm(pkR, this.algorithm);
      assertCryptoKey(pkR);
      const ekp = await this.GenerateKeyPair(false);
      const skE = ekp.privateKey;
      const pkE = ekp.publicKey;
      const dh = new Uint8Array(
        await subtle(
          (c) => c.deriveBits({ name: skE.algorithm.name, public: pkR }, skE, this.Ndh << 3),
          this.name
        )
      );
      checkNotAllZeros(dh);
      const enc = await this.SerializePublicKey(pkE);
      const pkRm = await this.SerializePublicKey(pkR);
      const kem_context = concat2(enc, pkRm);
      const shared_secret = await ExtractAndExpand_TwoStage(this, dh, kem_context);
      return { shared_secret, enc };
    },
    async Decap(enc, skR, pkR) {
      assertKeyAlgorithm(skR, this.algorithm);
      assertCryptoKey(skR);
      if (pkR) {
        assertKeyAlgorithm(pkR, this.algorithm);
        assertCryptoKey(pkR);
      } else {
        pkR = await getPublicKey(this.name, skR, []);
      }
      const pkE = await this.DeserializePublicKey(enc);
      const dh = new Uint8Array(
        await subtle(
          (c) => c.deriveBits({ name: skR.algorithm.name, public: pkE }, skR, this.Ndh << 3),
          this.name
        )
      );
      checkNotAllZeros(dh);
      const pkRm = await this.SerializePublicKey(pkR);
      const kem_context = concat2(enc, pkRm);
      const shared_secret = await ExtractAndExpand_TwoStage(this, dh, kem_context);
      return shared_secret;
    }
  };
}
async function createKeyPairFromPrivateKey(DHKEM, key, extractable) {
  let privateKey;
  let publicKey;
  if (!extractable && typeof crypto.subtle.getPublicKey !== "function") {
    privateKey = await DHKEM.DeserializePrivateKey(key, true);
    publicKey = await getPublicKey(DHKEM.name, privateKey, []);
    privateKey = await DHKEM.DeserializePrivateKey(key, false);
  } else {
    privateKey = await DHKEM.DeserializePrivateKey(key, extractable);
    publicKey = await getPublicKey(DHKEM.name, privateKey, []);
  }
  return { privateKey, publicKey };
}
async function CurveKeyFromD(name, Nsk, template, algorithm, key, extractable) {
  const tmpl = slice(template);
  const pkcs8 = new Uint8Array(Nsk + tmpl.byteLength);
  pkcs8.set(tmpl);
  pkcs8.set(key, tmpl.byteLength);
  return await subtle(
    (c) => c.importKey("pkcs8", pkcs8, algorithm, extractable, ["deriveBits"]),
    name
  );
}
async function DeriveKeyPairX(ikm, extractable) {
  const dkp_prk = await LabeledExtract(
    this.kdf,
    this.suite_id,
    new Uint8Array(),
    encode4("dkp_prk"),
    ikm
  );
  const sk = await LabeledExpand(
    this.kdf,
    this.suite_id,
    dkp_prk,
    encode4("sk"),
    new Uint8Array(),
    this.Nsk
  );
  return await createKeyPairFromPrivateKey(this, sk, extractable);
}
var KEM_DHKEM_X25519_HKDF_SHA256 = function() {
  const id = 32;
  const name = "DHKEM(X25519, HKDF-SHA256)";
  const kdf = KDF_HKDF_SHA256();
  kdf.name = name;
  return {
    id,
    suite_id: concat2(encode4("KEM"), I2OSP(id, 2)),
    type: "KEM",
    name,
    kdf,
    Nsecret: 32,
    Nenc: 32,
    Npk: 32,
    Nsk: 32,
    Ndh: 32,
    algorithm: { name: "X25519" },
    pkcs8: Uint8Array.of(48, 46, 2, 1, 0, 48, 5, 6, 3, 43, 101, 110, 4, 34, 4, 32),
    DeriveKeyPair: DeriveKeyPairX,
    async DeserializePrivateKey(key, extractable) {
      return await CurveKeyFromD(name, this.Nsk, this.pkcs8, this.algorithm, key, extractable);
    },
    ...DHKEM_SHARED()
  };
};
function AEAD_SHARED() {
  return {
    async Seal(_key, _nonce, _aad, _pt) {
      const nonce = ab(_nonce);
      const aad = ab(_aad);
      const key = ab(_key);
      const pt = ab(_pt);
      return new Uint8Array(
        await subtle(
          async (c) => c.encrypt(
            { name: this.algorithm, iv: nonce, additionalData: aad },
            await c.importKey(this.keyFormat, key, this.algorithm, false, ["encrypt"]),
            pt
          ),
          this.name
        )
      );
    },
    async Open(_key, _nonce, _aad, _ct) {
      const nonce = ab(_nonce);
      const aad = ab(_aad);
      const key = ab(_key);
      const ct = ab(_ct);
      return new Uint8Array(
        await subtle(
          async (c) => c.decrypt(
            { name: this.algorithm, iv: nonce, additionalData: aad },
            await c.importKey(this.keyFormat, key, this.algorithm, false, ["decrypt"]),
            ct
          ),
          this.name
        )
      );
    }
  };
}
var AEAD_AES_128_GCM = function() {
  return {
    id: 1,
    type: "AEAD",
    name: "AES-128-GCM",
    Nk: 16,
    Nn: 12,
    Nt: 16,
    algorithm: "AES-GCM",
    keyFormat: "raw",
    ...AEAD_SHARED()
  };
};

// dist/internal/ohttp-client.js
var REORG_STATUS = 409;
var INNER_REQUEST_ORIGIN = "https://ohttp-target.invalid";
var OhttpClient = class {
  gatewayUrl;
  ohttpClient = null;
  pinnedKeyConfig;
  /**
   * @param gatewayUrl - URL where the OHTTP gateway accepts encapsulated requests
   *   and serves `/ohttp-keys`. May include a reverse-proxy path prefix (e.g.
   *   `https://api.example.com/discovery`); the prefix is preserved on outer
   *   requests but stripped from the inner OHTTP request path (which always
   *   uses just the supplied per-call `path`).
   *   Must be HTTPS in production — without it (or a pinned `publicKeyConfig`),
   *   an active network attacker can replace the OHTTP key config.
   * @param options.relayUrl - Optional OHTTP relay URL. When set, encapsulated
   *   requests are sent here instead of the gateway. `/ohttp-keys` is still
   *   fetched from `gatewayUrl`.
   * @param options.publicKeyConfig - Optional pinned key config bytes
   *   (`application/ohttp-keys` format). When set, `/ohttp-keys` is never fetched.
   */
  constructor(gatewayUrl, options) {
    this.gatewayUrl = gatewayUrl;
    this.pinnedKeyConfig = options?.publicKeyConfig;
    if (options?.relayUrl) {
      this.relayUrl = options.relayUrl;
    }
  }
  relayUrl;
  /**
   * Send an OHTTP-encapsulated GET request and return the decrypted JSON response.
   */
  async get(path) {
    return this.send(path, new Request(`${INNER_REQUEST_ORIGIN}${path}`, { method: "GET" }));
  }
  /**
   * Send an OHTTP-encapsulated POST request and return the decrypted JSON response.
   */
  async post(path, body) {
    return this.send(path, new Request(`${INNER_REQUEST_ORIGIN}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }));
  }
  async send(path, request) {
    await this.ensureClient();
    const { init, context } = await this.ohttpClient.encapsulateRequest(request);
    const targetUrl = this.relayUrl ?? this.gatewayUrl;
    const response = await fetch(targetUrl, init);
    if (response.status === 422) {
      this.invalidate();
      const text = await response.text().catch(() => "");
      throw new Error(`OHTTP decapsulation failed on server: ${text}`);
    }
    if (!response.ok && response.headers.get("content-type") !== "message/ohttp-res") {
      const text = await response.text().catch(() => "");
      if (response.status === REORG_STATUS) {
        throw new ReorgError(`Block reorged during ${path}: ${text}`);
      }
      throw new Error(`OHTTP request ${path} failed (${response.status}): ${text}`);
    }
    const innerResponse = await context.decapsulateResponse(response);
    const innerBody = await readResponseText(innerResponse);
    if (innerResponse.status === REORG_STATUS) {
      throw new ReorgError(`Block reorged during ${path}: ${innerBody}`);
    }
    if (innerResponse.status !== 200) {
      throw new Error(`OHTTP inner response ${path} failed (${innerResponse.status}): ${innerBody}`);
    }
    return JSON.parse(innerBody);
  }
  /** Fetch (or use pinned) key config and create the OHTTPClient. */
  async ensureClient() {
    if (this.ohttpClient) {
      return;
    }
    let raw;
    if (this.pinnedKeyConfig) {
      raw = this.pinnedKeyConfig;
    } else {
      const response = await fetch(`${this.gatewayUrl}/ohttp-keys`);
      if (!response.ok) {
        throw new Error(`Failed to fetch OHTTP key config: ${response.status} ${response.statusText}`);
      }
      raw = new Uint8Array(await response.arrayBuffer());
    }
    const publicKeyConfigs = KeyConfig.parseMultiple(raw);
    if (publicKeyConfigs.length === 0) {
      throw new Error("OHTTP key config response contained no key configurations");
    }
    const publicKeyConfig = publicKeyConfigs[0];
    const suite = new CipherSuite(KEM_DHKEM_X25519_HKDF_SHA256, KDF_HKDF_SHA256, AEAD_AES_128_GCM);
    this.ohttpClient = new OHTTPClient(suite, publicKeyConfig);
  }
  invalidate() {
    this.ohttpClient = null;
  }
};
var ENCODING_TO_FORMAT = {
  gzip: "gzip",
  "x-gzip": "gzip",
  deflate: "deflate"
};
async function readResponseText(response) {
  const encoding = response.headers.get("content-encoding")?.toLowerCase();
  if (!encoding || !response.body || encoding === "identity") {
    return response.text();
  }
  const format = ENCODING_TO_FORMAT[encoding];
  if (!format) {
    throw new Error(`Unsupported Content-Encoding in OHTTP response: ${encoding}`);
  }
  const decompressed = response.body.pipeThrough(new DecompressionStream(format));
  return new Response(decompressed).text();
}

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// dist/internal/proving-service.js
var DEFAULT_REQUEST_TIMEOUT_MS = 3e4;
var DEFAULT_PROVE_MAX_RETRIES = 3;
var DEFAULT_PROVE_BASE_DELAY_MS = 1e3;
var MAX_PROVE_BACKOFF_MS = 3e4;
var SERVICE_BUSY_CODE = -32005;
var TRANSIENT_HTTP_STATUS = /* @__PURE__ */ new Set([503]);
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var ProvingServiceError = class extends Error {
  code;
  data;
  name = "ProvingServiceError";
  constructor(code, message, data) {
    super(data ? `${message}: ${data}` : message);
    this.code = code;
    this.data = data;
  }
};
var ProvingServiceHttpError = class extends Error {
  status;
  name = "ProvingServiceHttpError";
  constructor(status, body) {
    super(`Proving service HTTP ${status}: ${body}`);
    this.status = status;
  }
};
var MessageToL1Schema = external_exports.object({
  from_address: external_exports.string(),
  to_address: external_exports.string(),
  payload: external_exports.array(external_exports.string())
}).strict();
var ScreeningSignatureSchema = external_exports.object({
  issued_at: external_exports.number(),
  sig_r: external_exports.string(),
  sig_s: external_exports.string()
}).strict();
var AdditionalDataSchema = external_exports.object({
  signature: ScreeningSignatureSchema.optional()
}).strict();
var ProveTransactionResultSchema = external_exports.object({
  proof: external_exports.string().min(1),
  proof_facts: external_exports.array(external_exports.string()),
  l2_to_l1_messages: external_exports.array(MessageToL1Schema),
  additional_data: AdditionalDataSchema.optional()
}).strict();
var ProvingService = class {
  baseUrl;
  requestTimeoutMs;
  ohttpClient;
  maxRetries;
  baseDelayMs;
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.requestTimeoutMs = config.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    this.ohttpClient = config.ohttpClient;
    this.maxRetries = config.retry?.maxRetries ?? DEFAULT_PROVE_MAX_RETRIES;
    this.baseDelayMs = config.retry?.baseDelayMs ?? DEFAULT_PROVE_BASE_DELAY_MS;
  }
  /**
   * Single JSON-RPC call attempt (no retry). On a non-2xx HTTP response throws
   * {@link ProvingServiceHttpError}; on a JSON-RPC error body throws
   * {@link ProvingServiceError}.
   */
  async callOnce(method, params) {
    const body = {
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params
    };
    let json;
    if (this.ohttpClient) {
      json = await this.ohttpClient.post("", body);
    } else {
      const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // Per-attempt timeout: each retry gets a fresh budget, so worst-case wall
        // time on a hung connection is (maxRetries + 1) * requestTimeoutMs plus backoff.
        signal: AbortSignal.timeout(this.requestTimeoutMs)
      });
      const text = await res.text();
      if (!res.ok) {
        throw new ProvingServiceHttpError(res.status, text);
      }
      json = JSON.parse(text);
    }
    if (json.error) {
      const { code, message, data } = json.error;
      throw new ProvingServiceError(code, message, typeof data === "string" ? data : void 0);
    }
    const result = json.result;
    if (result === void 0) {
      throw new Error("Proving service returned no result");
    }
    return result;
  }
  /**
   * JSON-RPC call that retries transient failures (service-busy `-32005` or HTTP
   * 503) with exponential backoff per the configured {@link ProvingRetryOptions}.
   * Non-transient errors are rethrown on the first attempt.
   */
  async callWithRetry(method, params) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.callOnce(method, params);
      } catch (error) {
        if (attempt >= this.maxRetries || !isTransientError(error)) {
          throw error;
        }
        await sleep(Math.min(this.baseDelayMs * 2 ** attempt, MAX_PROVE_BACKOFF_MS));
      }
    }
  }
  async getSpecVersion() {
    return this.callOnce("starknet_specVersion", []);
  }
  async proveTransaction(blockId, transaction) {
    const blockIdParam = typeof blockId === "number" || typeof blockId === "bigint" ? { block_number: Number(blockId) } : blockId;
    const result = await this.callWithRetry("starknet_proveTransaction", {
      block_id: blockIdParam,
      transaction
    });
    const parsed = ProveTransactionResultSchema.safeParse(result);
    if (!parsed.success) {
      const snippet = typeof result === "object" && result !== null ? JSON.stringify(result).slice(0, 500) : String(result);
      throw new Error(`Proving service returned invalid result: expected { proof, proof_facts, l2_to_l1_messages }. ${parsed.error.message} Response: ${snippet}`);
    }
    return parsed.data;
  }
  async isHealthy() {
    try {
      await this.getSpecVersion();
      return true;
    } catch {
      return false;
    }
  }
};
function isTransientError(error) {
  if (error instanceof ProvingServiceError) {
    return error.code === SERVICE_BUSY_CODE;
  }
  if (error instanceof ProvingServiceHttpError) {
    return TRANSIENT_HTTP_STATUS.has(error.status);
  }
  return false;
}

// dist/internal/proving-service-provider.js
var ProvingServiceProofProvider = class {
  chainId;
  provingService;
  blockIdentifier;
  rpcProvider;
  poolAddressHex;
  cachedNonce = null;
  constructor(provingServiceUrl, chainId, options = {}) {
    this.chainId = chainId;
    let ohttpClient;
    if (options.ohttp) {
      const ohttpOptions = typeof options.ohttp === "object" ? { relayUrl: options.ohttp.relayUrl, publicKeyConfig: options.ohttp.publicKeyConfig } : void 0;
      ohttpClient = new OhttpClient(provingServiceUrl, ohttpOptions);
    }
    this.provingService = new ProvingService({
      baseUrl: provingServiceUrl,
      requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      ohttpClient,
      retry: options.retry
    });
    this.blockIdentifier = options.blockIdentifier ?? "latest";
    if (options.nodeUrl != null) {
      if (options.poolAddress == null) {
        throw new Error("ProvingServiceProofProvider: nodeUrl requires poolAddress to be set");
      }
      this.rpcProvider = new import_starknet14.RpcProvider({ nodeUrl: options.nodeUrl });
      this.poolAddressHex = toHex(options.poolAddress);
    } else {
      this.rpcProvider = null;
      this.poolAddressHex = null;
    }
  }
  invalidateNonceCache() {
    this.cachedNonce = null;
  }
  async getDefaultDetails() {
    const base = getDefaultProofDetails(this.chainId);
    if (this.rpcProvider == null || this.poolAddressHex == null) {
      return base;
    }
    if (this.cachedNonce == null) {
      this.cachedNonce = BigInt(await this.rpcProvider.getNonceForAddress(this.poolAddressHex, "latest"));
    }
    return { ...base, nonce: this.cachedNonce };
  }
  async prove(invocation, blockIdentifier) {
    const blockId = blockIdentifier ?? this.blockIdentifier;
    const result = await this.provingService.proveTransaction(blockId, invocation);
    const poolAddressHex = toHex(invocation.sender_address);
    const poolMessage = result.l2_to_l1_messages?.find((m) => m.from_address?.toLowerCase() === poolAddressHex.toLowerCase());
    const output = poolMessage?.payload ?? [];
    const proofFacts = result.proof_facts ?? [];
    return {
      data: result.proof,
      output,
      proofFacts,
      additionalData: result.additional_data
    };
  }
};

// dist/internal/abstract-discovery.js
var AbstractDiscoveryProvider = class {
  // Default implementation provided by the abstract class
  async discoverRequirement(address, viewingKey, recipient, token) {
    const { channels } = await this.discoverChannels(address, viewingKey, [recipient]);
    const channel = channels?.get(recipient);
    return channel?.toSetupRequirement(token) ?? SetupRequirement.Register;
  }
};

// dist/internal/history.js
function buildHistoryCursor(userAddress, notesCursor, channelCursor) {
  const subchannels = [];
  for (const [sender, incomingChannel] of notesCursor.incomingChannels) {
    for (const [token, noteIndex] of incomingChannel.noteIndexes) {
      subchannels.push({
        channelKey: incomingChannel.channelKey,
        token,
        channelKind: sender === userAddress ? "self_channel" : "incoming",
        counterparty: sender,
        nextIndex: noteIndex > 0 ? noteIndex - 1 : void 0
      });
    }
  }
  if (channelCursor.channels) {
    for (const [recipient, channel] of channelCursor.channels) {
      if (!channel.key)
        continue;
      if (recipient === userAddress)
        continue;
      const channelKind = "outgoing";
      for (const [token, tokenChannel] of channel.tokens) {
        subchannels.push({
          channelKey: channel.key,
          token,
          channelKind,
          counterparty: recipient,
          nextIndex: tokenChannel.noteNonce > 0 ? tokenChannel.noteNonce - 1 : void 0
        });
      }
    }
  }
  return { subchannels, historyComplete: false };
}
function historyCursorToApi(cursor) {
  return {
    subchannels: cursor.subchannels.map((sc) => ({
      channel_key: toHex(sc.channelKey),
      token: toHex(sc.token),
      channel_kind: sc.channelKind,
      counterparty: toHex(sc.counterparty),
      next_index: sc.nextIndex ?? null
    })),
    begin_block_number: cursor.beginBlockNumber,
    history_complete: cursor.historyComplete
  };
}
function apiResponseToHistoryPage(resp) {
  return {
    blockRef: resp.block_ref,
    transactions: resp.transactions.map((tx) => ({
      blockNumber: tx.block_number,
      transactionHash: BigInt(tx.transaction_hash),
      notes: tx.notes.map((note) => ({
        channelKind: note.channel_kind,
        token: BigInt(note.token),
        noteIndex: note.note_index,
        noteId: BigInt(note.note_id),
        counterparty: BigInt(note.counterparty),
        amount: BigInt(note.amount),
        salt: BigInt(note.salt)
      })),
      deposits: tx.deposits.map((deposit) => ({
        fromAddress: BigInt(deposit.user_address),
        token: BigInt(deposit.token),
        amount: BigInt(deposit.amount)
      })),
      withdrawals: tx.withdrawals.map((withdrawal) => ({
        toAddress: BigInt(withdrawal.to_address),
        token: BigInt(withdrawal.token),
        amount: BigInt(withdrawal.amount)
      })),
      openNoteDeposits: tx.open_note_deposits.map((deposit) => ({
        depositor: BigInt(deposit.depositor),
        token: BigInt(deposit.token),
        noteId: BigInt(deposit.note_id),
        amount: BigInt(deposit.amount)
      })),
      ...tx.registered_pubkey && { registeredPubkey: BigInt(tx.registered_pubkey) }
    })),
    cursor: {
      subchannels: resp.cursor.subchannels.map((sc) => ({
        channelKey: BigInt(sc.channel_key),
        token: BigInt(sc.token),
        channelKind: sc.channel_kind,
        counterparty: BigInt(sc.counterparty),
        nextIndex: sc.next_index ?? void 0
      })),
      beginBlockNumber: resp.cursor.begin_block_number,
      historyComplete: resp.cursor.history_complete
    }
  };
}

// dist/internal/indexer-discovery.js
var REORG_STATUS2 = 409;
var IndexerDiscoveryProvider = class extends AbstractDiscoveryProvider {
  apiUrl;
  contractAddress;
  ohttpClient;
  constructor(apiUrl, contractAddress, options) {
    super();
    this.apiUrl = apiUrl;
    this.contractAddress = contractAddress;
    if (options?.ohttp) {
      const ohttpOptions = typeof options.ohttp === "object" ? { relayUrl: options.ohttp.relayUrl, publicKeyConfig: options.ohttp.publicKeyConfig } : void 0;
      this.ohttpClient = new OhttpClient(apiUrl, ohttpOptions);
    }
  }
  async isHealthy() {
    try {
      const body = await this.get("/health");
      return body.status === "OK";
    } catch {
      return false;
    }
  }
  async getHealth() {
    return this.get("/health");
  }
  async discoverNotes(address, viewingKey, params) {
    const tokenFilter = params?.tokens ? new Set(params.tokens.map(toBigInt)) : null;
    const cursor = params?.cursor;
    let apiCursor = cursor ? notesCursorToApiCursor(cursor, tokenFilter) : {};
    const lastKnownBlock = cursor?.blockId;
    let blockRef;
    const allNotes = new AddressMap(() => []);
    const incomingChannels = new AddressMap();
    let complete = false;
    do {
      const body = {
        contract_address: toHex(this.contractAddress),
        recipient_address: toHex(address),
        viewing_key: toHex(viewingKey),
        cursor: apiCursor
      };
      if (blockRef) {
        body.block_ref = blockRef;
      } else if (params?.blockIdentifier !== void 0) {
        body.block_ref = params.blockIdentifier;
      } else if (lastKnownBlock) {
        body.last_known_block = lastKnownBlock;
      }
      const resp = await this.post("/v1/sync/incoming_state", body);
      blockRef = resp.block_ref;
      const channelKeyMap = /* @__PURE__ */ new Map();
      for (const ch of resp.channels) {
        channelKeyMap.set(ch.sender_addr, BigInt(ch.channel_key));
      }
      const notesByToken = convertIncomingNotes(resp.notes, channelKeyMap, incomingChannels, tokenFilter);
      for (const [token, tokenNotes] of notesByToken) {
        allNotes.get(token).push(...tokenNotes);
      }
      const updatedCursor = apiCursorToNotesCursor(resp.cursor, resp.block_ref);
      for (const [sender, icc] of updatedCursor.incomingChannels) {
        incomingChannels.set(sender, icc);
      }
      apiCursor = resp.cursor;
      complete = isApiCursorComplete(resp.cursor);
    } while (!complete);
    const blockIdentifier = blockRef;
    return {
      timestamp: blockIdentifier,
      notes: allNotes,
      cursor: { blockId: blockIdentifier, incomingChannels }
    };
  }
  async discoverChannels(address, viewingKey, recipients, params) {
    if (recipients === "total-only") {
      let apiCursor2 = { channel_discovery_complete: false };
      let blockRef2;
      let complete2 = false;
      do {
        const body = {
          contract_address: toHex(this.contractAddress),
          sender_address: toHex(address),
          viewing_key: toHex(viewingKey),
          cursor: apiCursor2
        };
        if (blockRef2) {
          body.block_ref = blockRef2;
        } else if (params?.blockIdentifier !== void 0) {
          body.block_ref = params.blockIdentifier;
        }
        const resp = await this.post("/v1/sync/outgoing_state", body);
        blockRef2 = resp.block_ref;
        apiCursor2 = resp.cursor;
        complete2 = isApiCursorComplete(resp.cursor);
        if (!complete2)
          pruneCompleteCursor(apiCursor2);
      } while (!complete2);
      if (apiCursor2.total_n_channels === void 0) {
        throw new Error("outgoing_state reported complete without total_n_channels");
      }
      return {
        timestamp: blockRef2,
        total: apiCursor2.total_n_channels
      };
    }
    const cursorMap = params?.cursor?.channels;
    let apiCursor;
    if (recipients === "all") {
      apiCursor = channelMapToApiCursor(cursorMap, false);
    } else {
      let allResolved = true;
      const resolved = /* @__PURE__ */ new Map();
      for (const r of recipients) {
        const rb = toBigInt(r);
        const existing = cursorMap?.get(rb);
        if (existing?.key) {
          resolved.set(rb, { key: existing.key, publicKey: toBigInt(existing.publicKey) });
        } else {
          allResolved = false;
        }
      }
      if (allResolved) {
        apiCursor = { channel_discovery_complete: true, channels: {} };
        for (const [rb, info] of resolved) {
          const existing = cursorMap?.get(rb);
          const subchannels = existing ? buildSubchannelCursors([...existing.tokens].map(([token, nonces]) => [token, nonces.noteNonce]), null) : {};
          apiCursor.channels[toHex(rb)] = {
            channel_key: toHex(info.key),
            subchannel_discovery_complete: false,
            subchannels
          };
        }
      } else {
        apiCursor = { channel_discovery_complete: false, channels: {} };
      }
    }
    const createdChannelMap = /* @__PURE__ */ new Map();
    const subchannelsByRecipient = /* @__PURE__ */ new Map();
    const nonCreatedChannelMap = /* @__PURE__ */ new Map();
    let blockRef;
    let complete = false;
    do {
      const body = {
        contract_address: toHex(this.contractAddress),
        sender_address: toHex(address),
        viewing_key: toHex(viewingKey),
        cursor: apiCursor
      };
      if (blockRef) {
        body.block_ref = blockRef;
      } else if (params?.blockIdentifier !== void 0) {
        body.block_ref = params.blockIdentifier;
      }
      if (recipients !== "all") {
        body.recipients = recipients.map((r) => toHex(r));
      }
      const resp = await this.post("/v1/sync/outgoing_state", body);
      blockRef = resp.block_ref;
      accumulateOutgoingResponse(resp, createdChannelMap, subchannelsByRecipient, nonCreatedChannelMap);
      apiCursor = resp.cursor;
      complete = isApiCursorComplete(resp.cursor);
      if (!complete)
        pruneCompleteCursor(apiCursor);
    } while (!complete);
    const channels = buildChannelMap(createdChannelMap, subchannelsByRecipient, nonCreatedChannelMap);
    if (recipients !== "all") {
      const requested = new Set(recipients.map(toBigInt));
      for (const key of [...channels.keys()]) {
        if (!requested.has(key))
          channels.delete(key);
      }
    }
    return { timestamp: blockRef, channels, total: apiCursor.total_n_channels };
  }
  async discoverRequirement(address, viewingKey, recipient, token) {
    const resp = await this.post("/v1/sync/preflight_check", {
      contract_address: toHex(this.contractAddress),
      sender_address: toHex(address),
      viewing_key: toHex(viewingKey),
      recipient: toHex(recipient),
      token: toHex(token)
    });
    if (!resp.sender_registered)
      return SetupRequirement.Register;
    if (!resp.channel_exists)
      return SetupRequirement.SetupChannel;
    if (!resp.subchannel_exists)
      return SetupRequirement.SetupToken;
    return SetupRequirement.Ready;
  }
  async fetchHistory(userAddress, notesCursor, channelCursor, options) {
    const cursor = options?.historyCursor ?? buildHistoryCursor(userAddress, notesCursor, channelCursor);
    const body = {
      contract_address: toHex(this.contractAddress),
      user_address: toHex(userAddress),
      max_transactions: options?.maxTransactions ?? 50,
      cursor: historyCursorToApi(cursor)
    };
    if (options?.blockIdentifier !== void 0) {
      body.block_ref = options.blockIdentifier;
    } else if (options?.lastKnownBlock) {
      body.last_known_block = options.lastKnownBlock;
    }
    const resp = await this.post("/v1/history", body);
    return apiResponseToHistoryPage(resp);
  }
  async get(path) {
    if (this.ohttpClient) {
      return this.ohttpClient.get(path);
    }
    const resp = await fetch(`${this.apiUrl}${path}`, {
      signal: AbortSignal.timeout(8e3)
    });
    if (!resp.ok) {
      throw new Error(`Indexer API ${path} failed (${resp.status})`);
    }
    return resp.json();
  }
  async post(path, body) {
    if (this.ohttpClient) {
      return this.ohttpClient.post(path, body);
    }
    const resp = await fetch(`${this.apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      if (resp.status === REORG_STATUS2) {
        throw new ReorgError(`Block reorged during ${path}: ${text}`);
      }
      throw new Error(`Indexer API ${path} failed (${resp.status}): ${text}`);
    }
    return resp.json();
  }
};
function isApiCursorComplete(cursor) {
  if (!cursor.channel_discovery_complete)
    return false;
  if (!cursor.channels)
    return true;
  return Object.values(cursor.channels).every((ch) => ch.subchannel_discovery_complete && (!ch.subchannels || Object.values(ch.subchannels).every((sc) => !!sc.note_discovery_complete)));
}
function buildSubchannelCursors(noteIndexes, tokenFilter, totalNoteCounts) {
  const subchannels = {};
  for (const [token, noteIndex] of noteIndexes) {
    if (tokenFilter && !tokenFilter.has(toBigInt(token)))
      continue;
    const cursor = {
      last_note_index: noteIndex > 0 ? noteIndex - 1 : void 0
    };
    const noteCount = totalNoteCounts?.get(toBigInt(token));
    if (noteCount != null) {
      cursor.total_n_notes = noteCount;
    }
    subchannels[toHex(token)] = cursor;
  }
  return subchannels;
}
function notesCursorToApiCursor(cursor, tokenFilter) {
  const apiCursor = {
    channel_discovery_complete: false,
    last_channel_index: cursor.incomingChannels.size > 0 ? cursor.incomingChannels.size - 1 : void 0,
    channels: {}
  };
  for (const [sender, icc] of cursor.incomingChannels) {
    const subchannels = buildSubchannelCursors(icc.noteIndexes, tokenFilter, icc.totalNoteCounts);
    apiCursor.channels[toHex(sender)] = {
      channel_key: toHex(icc.channelKey),
      subchannel_discovery_complete: tokenFilter != null && tokenFilter.size === Object.keys(subchannels).length,
      last_subchannel_index: icc.subchannelIdIndex > 0 ? icc.subchannelIdIndex - 1 : void 0,
      subchannels
    };
  }
  return apiCursor;
}
function apiCursorToNotesCursor(apiCursor, blockRef) {
  const incomingChannels = new AddressMap();
  if (apiCursor.channels) {
    for (const [senderHex, ch] of Object.entries(apiCursor.channels)) {
      const channelKey = ch.channel_key ? BigInt(ch.channel_key) : 0n;
      const noteIndexes = new AddressMap();
      const totalNoteCounts = new AddressMap();
      if (ch.subchannels) {
        for (const [tokenHex, sc] of Object.entries(ch.subchannels)) {
          noteIndexes.set(BigInt(tokenHex), (sc.last_note_index ?? -1) + 1);
          if (sc.total_n_notes != null) {
            totalNoteCounts.set(BigInt(tokenHex), sc.total_n_notes);
          }
        }
      }
      incomingChannels.set(BigInt(senderHex), {
        channelKey,
        subchannelIdIndex: (ch.last_subchannel_index ?? -1) + 1,
        noteIndexes,
        totalNoteCounts
      });
    }
  }
  return { blockId: blockRef, incomingChannels };
}
function channelMapToApiCursor(channels, channelDiscoveryComplete) {
  const apiCursor = {
    channel_discovery_complete: channelDiscoveryComplete,
    channels: {}
  };
  if (channels) {
    for (const [recipient, channel] of channels) {
      if (!channel.key)
        continue;
      const subchannels = buildSubchannelCursors([...channel.tokens].map(([token, nonces]) => [token, nonces.noteNonce]), null);
      apiCursor.channels[toHex(recipient)] = {
        channel_key: toHex(channel.key),
        subchannel_discovery_complete: false,
        subchannels
      };
    }
  }
  return apiCursor;
}
function accumulateOutgoingResponse(resp, createdChannelMap, subchannelsByRecipient, nonCreatedChannelMap) {
  for (const ch of resp.channels) {
    const info = { publicKey: BigInt(ch.recipient_public_key), channelKey: BigInt(ch.channel_key) };
    if (ch.precomputed) {
      if (!createdChannelMap.has(ch.recipient_addr)) {
        nonCreatedChannelMap.set(ch.recipient_addr, info);
      }
    } else {
      createdChannelMap.set(ch.recipient_addr, info);
      nonCreatedChannelMap.delete(ch.recipient_addr);
    }
  }
  for (const sc of resp.subchannels) {
    let tokenMap = subchannelsByRecipient.get(sc.recipient_addr);
    if (!tokenMap) {
      tokenMap = /* @__PURE__ */ new Map();
      subchannelsByRecipient.set(sc.recipient_addr, tokenMap);
    }
    const existing = tokenMap.get(sc.token);
    if (!existing || sc.last_note_index !== null) {
      tokenMap.set(sc.token, { token: BigInt(sc.token), lastIndex: sc.last_note_index });
    }
  }
}
function buildChannelMap(createdChannelMap, subchannelsByRecipient, nonCreatedChannelMap) {
  const channels = new AddressMap();
  for (const [recipientHex, info] of createdChannelMap) {
    const tokens = new AddressMap();
    const subs = subchannelsByRecipient.get(recipientHex);
    if (subs) {
      let tokenIndex = 0;
      for (const [, sub] of subs) {
        tokens.set(sub.token, {
          tokenIndex: tokenIndex++,
          noteNonce: sub.lastIndex !== null ? sub.lastIndex + 1 : 0
        });
      }
    }
    channels.set(BigInt(recipientHex), new Channel(info.publicKey, info.channelKey, tokens.entries()));
  }
  for (const [recipientHex, info] of nonCreatedChannelMap) {
    const addr = BigInt(recipientHex);
    if (!channels.has(addr)) {
      channels.set(addr, new Channel(info.publicKey));
    }
  }
  return channels;
}
function pruneCompleteCursor(cursor) {
  if (!cursor.channels)
    return;
  for (const [addr, ch] of Object.entries(cursor.channels)) {
    if (ch.subchannel_discovery_complete && ch.subchannels) {
      for (const [token, sc] of Object.entries(ch.subchannels)) {
        if (sc.note_discovery_complete) {
          delete ch.subchannels[token];
        }
      }
      if (Object.keys(ch.subchannels).length === 0) {
        delete cursor.channels[addr];
      }
    }
  }
}
function convertIncomingNotes(apiNotes, channelKeyMap, existingChannels, tokenFilter) {
  const result = new AddressMap(() => []);
  for (const n of apiNotes) {
    const token = BigInt(n.token);
    if (tokenFilter && !tokenFilter.has(token))
      continue;
    const sender = BigInt(n.sender_addr);
    const channelKey = channelKeyMap.get(n.sender_addr) ?? existingChannels.get(sender)?.channelKey;
    if (channelKey == null) {
      throw new Error(`Missing channel_key for sender ${n.sender_addr}: not found in current response or previous pages`);
    }
    result.get(token).push({
      id: n.note_id,
      amount: BigInt(n.amount),
      created: n.block_number,
      witness: new Witness(channelKey, n.index, BigInt(n.salt)),
      sender,
      open: n.salt === "1"
    });
  }
  return result;
}

// dist/factory.js
function isProofProviderConfig(x) {
  return typeof x === "object" && x !== null && "url" in x && "chainId" in x;
}
function isDiscoveryProviderConfig(x) {
  return typeof x === "object" && x !== null && "url" in x && !("discoverNotes" in x);
}
function createPrivateTransfers(params) {
  const provingProvider = isProofProviderConfig(params.provingProvider) ? new ProvingServiceProofProvider(params.provingProvider.url, params.provingProvider.chainId, {
    requestTimeoutMs: params.provingProvider.requestTimeoutMs,
    blockIdentifier: params.provingProvider.blockIdentifier,
    nodeUrl: params.provingProvider.nodeUrl,
    poolAddress: params.poolContractAddress,
    ohttp: params.provingProvider.ohttp,
    retry: params.provingProvider.retry
  }) : params.provingProvider;
  const discoveryProvider = isDiscoveryProviderConfig(params.discoveryProvider) ? new IndexerDiscoveryProvider(params.discoveryProvider.url, params.poolContractAddress) : params.discoveryProvider;
  return new PrivateTransfers({
    account: params.account,
    viewingKeyProvider: params.viewingKeyProvider,
    provingProvider,
    discoveryProvider,
    proofInvocationFactory: params.proofInvocationFactory ?? new ProofInvocationFactory(),
    poolContractAddress: params.poolContractAddress,
    shadowAccountAnonymizerAddress: params.shadowAccountAnonymizerAddress
  });
}

// dist/simple-private-transfers.js
var SimplePrivateTransfersImpl = class {
  inner;
  constructor(inner) {
    this.inner = inner;
  }
  get user() {
    return this.inner.user;
  }
  registry = {
    channels: new AddressMap(),
    notes: new AddressMap()
  };
  deposit(token, amount) {
    return this.build(token).deposit({ amount }).execute();
  }
  withdraw(token, recipient, amount) {
    const builder = this.build(token);
    if (isAll(amount)) {
      return builder.surplusTo(recipient, true).execute();
    }
    return builder.withdraw({ recipient, amount }).surplusTo(this.inner.user, false).execute();
  }
  transfer(token, recipient, amount) {
    const builder = this.build(token);
    if (isAll(amount)) {
      return builder.surplusTo(recipient, false).execute();
    }
    return builder.transfer({ recipient, amount }).surplusTo(this.inner.user, false).execute();
  }
  swap(fromToken, fromAmount, toToken, executor) {
    const toTokenAddress = toBigInt(toToken);
    return this.build(fromToken).withdraw({ recipient: executor, amount: fromAmount }).surplusTo(this.inner.user, false).with(toToken).transfer({ recipient: this.inner.user, amount: Open }).done().invoke(({ openNotes, withdrawals }) => {
      return {
        contractAddress: toHex(executor),
        calldata: [
          withdrawals[0].token,
          toTokenAddress,
          withdrawals[0].amount,
          openNotes[0].noteId
        ]
      };
    }).execute();
  }
  build(token) {
    this.registry.notes.clear();
    return this.inner.build({
      autoDiscover: { notes: "refresh", channels: "refresh" },
      autoSetup: true,
      autoSelectNotes: "all",
      registry: this.registry
    }).with(token);
  }
};

// dist/internal/action-classifier.js
function classifyTransaction(transaction, options) {
  if (transaction.registeredPubkey != null) {
    return {
      blockNumber: transaction.blockNumber,
      transactionHash: transaction.transactionHash,
      actions: [{ type: "register", pubkey: transaction.registeredPubkey }]
    };
  }
  const actions = [];
  const swapsByExecutor = /* @__PURE__ */ new Map();
  const matchedWithdrawalIndexes = /* @__PURE__ */ new Set();
  for (const openNoteDeposit of transaction.openNoteDeposits) {
    let swap = swapsByExecutor.get(openNoteDeposit.depositor);
    if (!swap) {
      swap = { sent: [], received: [] };
      swapsByExecutor.set(openNoteDeposit.depositor, swap);
    }
    swap.received.push({ token: openNoteDeposit.token, amount: openNoteDeposit.amount });
  }
  for (const [executor, swap] of swapsByExecutor) {
    for (let index = 0; index < transaction.withdrawals.length; index++) {
      if (matchedWithdrawalIndexes.has(index))
        continue;
      if (transaction.withdrawals[index].toAddress === executor) {
        const withdrawal = transaction.withdrawals[index];
        swap.sent.push({ token: withdrawal.token, amount: withdrawal.amount });
        matchedWithdrawalIndexes.add(index);
      }
    }
    actions.push({ type: "swap", executor, sent: swap.sent, received: swap.received });
  }
  const feeRecipientSet = new Set(options?.feeRecipients);
  for (const deposit of transaction.deposits) {
    actions.push({ type: "deposit", ...deposit });
  }
  for (let index = 0; index < transaction.withdrawals.length; index++) {
    if (matchedWithdrawalIndexes.has(index))
      continue;
    const withdrawal = transaction.withdrawals[index];
    const type = feeRecipientSet.has(withdrawal.toAddress) ? "fee" : "withdrawal";
    actions.push({ type, ...withdrawal });
  }
  const noteAggregates = /* @__PURE__ */ new Map();
  const selfChannelAggregates = /* @__PURE__ */ new Map();
  for (const note of transaction.notes) {
    if (note.channelKind === "self_channel") {
      const existing2 = selfChannelAggregates.get(note.token);
      if (existing2) {
        existing2.totalAmount += note.amount;
        existing2.noteCount += 1;
      } else {
        selfChannelAggregates.set(note.token, { totalAmount: note.amount, noteCount: 1 });
      }
      continue;
    }
    const aggregateKey = `${note.channelKind}:${note.counterparty}:${note.token}`;
    const existing = noteAggregates.get(aggregateKey);
    if (existing) {
      existing.totalAmount += note.amount;
      existing.noteCount += 1;
    } else {
      noteAggregates.set(aggregateKey, { note, totalAmount: note.amount, noteCount: 1 });
    }
  }
  for (const { note, totalAmount, noteCount } of noteAggregates.values()) {
    if (note.channelKind === "outgoing") {
      actions.push({
        type: "transferSent",
        toAddress: note.counterparty,
        token: note.token,
        amount: totalAmount,
        noteCount
      });
    } else {
      actions.push({
        type: "transferReceived",
        fromAddress: note.counterparty,
        token: note.token,
        amount: totalAmount,
        noteCount
      });
    }
  }
  const meaningfulActions = actions.filter((a) => a.type !== "fee");
  if (meaningfulActions.length === 0 && selfChannelAggregates.size > 0) {
    for (const [token, { totalAmount, noteCount }] of selfChannelAggregates) {
      actions.push({ type: "transferSelf", token, amount: totalAmount, noteCount });
    }
  }
  const isIncoming = actions.some((a) => a.type === "transferReceived") && !actions.some((a) => a.type === "transferSent");
  const filteredActions = isIncoming ? actions.filter((a) => a.type !== "fee") : actions;
  return {
    blockNumber: transaction.blockNumber,
    transactionHash: transaction.transactionHash,
    actions: filteredActions
  };
}

// dist/utils/scan.js
var INITIAL_OFFSET = 8;
var INITIAL_STEP = 8;
var Tracker = class {
  pending = /* @__PURE__ */ new Set();
  errors = [];
  add(p) {
    const tracked = p.catch((err) => {
      this.errors.push(err);
      throw err;
    });
    this.pending.add(tracked);
    void tracked.catch(() => {
    }).finally(() => this.pending.delete(tracked));
    return p;
  }
  async wait() {
    while (this.pending.size > 0) {
      await Promise.race([...this.pending].map((p) => p.catch(() => {
      })));
    }
    if (this.errors.length > 0) {
      throw this.errors[0];
    }
  }
};
async function touch(probe, start, end, tracker, lengthOnly) {
  if (lengthOnly)
    return;
  const tr = tracker ?? new Tracker();
  for (let i = start; i < end; i++) {
    void tr.add(probe(i, true));
  }
  if (!tracker)
    await tr.wait();
}
async function bisect(probe, start, end, tracker, lengthOnly) {
  if (start >= end)
    return;
  const tr = tracker ?? new Tracker();
  const mid = Math.floor((start + end) / 2);
  if (await tr.add(probe(mid))) {
    void touch(probe, start, mid, tr, lengthOnly);
    void bisect(probe, mid + 1, end, tr, lengthOnly);
  } else {
    void bisect(probe, start, mid, tr, lengthOnly);
  }
  if (!tracker)
    await tr.wait();
}
async function scan(probe, start, tracker, lengthOnly) {
  const tr = tracker ?? new Tracker();
  let offset = INITIAL_OFFSET;
  let step = INITIAL_STEP;
  let prev = -1;
  let index;
  while (true) {
    index = start + offset;
    if (!await tr.add(probe(index)))
      break;
    void touch(probe, prev + 1, index, tr, lengthOnly);
    prev = index;
    offset += step;
    step *= 2;
  }
  void bisect(probe, prev + 1, index, tr, lengthOnly);
  if (!tracker)
    await tr.wait();
}

// dist/utils/rate-limiter.js
function createLimiter(concurrency) {
  let active = 0;
  const queue = [];
  const run = async (fn) => {
    if (active >= concurrency) {
      await new Promise((resolve) => queue.push(resolve));
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
  return run;
}
var sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
function createRateLimitedObject(obj, options = {}) {
  const { concurrency = 8, maxRetries = 3, baseDelayMs = 100 } = options;
  const limit = createLimiter(concurrency);
  const withRetry = async (fn) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries)
          throw error;
        await sleep2(baseDelayMs * Math.pow(2, attempt));
      }
    }
    throw new Error("Unreachable");
  };
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return (...args) => limit(() => withRetry(() => value.apply(target, args)));
      }
      return value;
    }
  });
}

// dist/internal/contract-discovery.js
var NotesDiscovery = class {
  address;
  viewingKey;
  existingCursor;
  tokens;
  pool;
  tracker = new Tracker();
  notes = new AddressMap(() => []);
  cursor;
  constructor(address, viewingKey, existingCursor, tokens, pool) {
    this.address = address;
    this.viewingKey = viewingKey;
    this.existingCursor = existingCursor;
    this.tokens = tokens;
    this.pool = pool;
    this.cursor = cloneNotesCursor(this.existingCursor);
  }
  async discover() {
    void this.tracker.add(this.discoverChannels(this.existingCursor?.incomingChannels.size ?? 0));
    for (const [sender, incomingChannelCursor] of this.existingCursor?.incomingChannels ?? []) {
      void this.tracker.add(this.discoverSubchannels(sender));
      for (const [token, index] of incomingChannelCursor.noteIndexes) {
        void this.tracker.add(this.discoverNotes(sender, token, index));
      }
    }
    await this.tracker.wait();
    return {
      timestamp: 0,
      notes: this.notes,
      cursor: this.cursor
    };
  }
  async discoverChannels(start) {
    debugLog("contract-discovery", "discoverNotes", "start", this.cursor);
    const nc = await this.pool.get_num_of_channels(this.address);
    debugLog("contract-discovery", "discoverNotes", "num of channels", nc);
    void bisect(async (c) => {
      const encryptedChannel = await this.pool.get_channel_info(this.address, c);
      const channel = encryptions.decryptChannelInfo(encryptedChannel, this.viewingKey);
      debugLog("contract-discovery", "discoverNotes", "channel", channel);
      const incomingChannelCursor = {
        channelKey: channel.key,
        subchannelIdIndex: 0,
        noteIndexes: new AddressMap(),
        totalNoteCounts: new AddressMap()
      };
      this.cursor.incomingChannels.set(channel.sender, incomingChannelCursor);
      void this.tracker.add(this.discoverSubchannels(channel.sender));
      return true;
    }, start, Number(nc), this.tracker);
  }
  async discoverSubchannels(sender) {
    const incomingChannelCursor = this.cursor.incomingChannels.get(sender);
    const channelKey = incomingChannelCursor.channelKey;
    void scan(async (k) => {
      const encSubchannel = await this.pool.get_subchannel_info(compute_subchannel_id(channelKey, k));
      if (toBigInt(encSubchannel.salt) === 0n)
        return false;
      debugLog("contract-discovery", "discoverNotes", "encSubchannel", encSubchannel, () => compute_subchannel_id(channelKey, k), k);
      const { token } = encryptions.decryptSubchannelInfo(encSubchannel, channelKey, k);
      if ((this.tokens?.size ?? 0) > 0 && !this.tokens.has(token)) {
        debugLog("contract-discovery", "discoverNotes", "skipping token", token);
        return true;
      }
      debugLog("contract-discovery", "discoverNotes", "subchannel", sender, token, k);
      incomingChannelCursor.noteIndexes.set(token, 0);
      incomingChannelCursor.subchannelIdIndex = Math.max(incomingChannelCursor.subchannelIdIndex, k);
      void this.tracker.add(this.discoverNotes(sender, token, 0));
      return true;
    }, incomingChannelCursor.subchannelIdIndex, this.tracker);
  }
  async discoverNotes(sender, token, index) {
    const incomingChannelCursor = this.cursor.incomingChannels.get(sender);
    const channelKey = incomingChannelCursor.channelKey;
    void scan(async (i, skipResult) => {
      const noteId = compute_note_id(channelKey, token, i);
      if (skipResult) {
        const nullifier = compute_nullifier(channelKey, token, i, BigInt(this.viewingKey));
        const isSpent = await this.pool.nullifier_exists(nullifier);
        if (isSpent)
          return true;
        const noteData2 = await this.pool.get_note(noteId);
        const packedValue2 = toBigInt(noteData2.packed_value);
        if (packedValue2 === 0n)
          return false;
        await this.addNoteIfNotSpent(noteId, noteData2, i, channelKey, token, sender, true);
        return true;
      }
      const noteData = await this.pool.get_note(noteId);
      const packedValue = toBigInt(noteData.packed_value);
      if (packedValue === 0n)
        return false;
      void this.tracker.add(this.addNoteIfNotSpent(noteId, noteData, i, channelKey, token, sender, false));
      return true;
    }, index, this.tracker);
  }
  /** Helper to check nullifier and add note if not spent */
  async addNoteIfNotSpent(noteId, noteData, index, channelKey, token, sender, skipNullifierCheck) {
    if (!skipNullifierCheck) {
      const nullifier = compute_nullifier(channelKey, token, index, BigInt(this.viewingKey));
      const isSpent = await this.pool.nullifier_exists(nullifier);
      if (isSpent)
        return true;
    }
    const packedValue = toBigInt(noteData.packed_value);
    const packedSalt = packedValue >> 128n;
    const isOpenNote2 = packedSalt === 1n;
    let amount;
    let salt;
    if (isOpenNote2) {
      amount = packedValue & (1n << 128n) - 1n;
      salt = 1n;
    } else {
      const decrypted = encryptions.decryptNoteAmount(packedValue, channelKey, token, index);
      amount = decrypted.amount;
      salt = decrypted.salt;
    }
    debugLog("contract-discovery", "discoverNotes", "note", sender, token, index, amount, isOpenNote2 ? "open" : "encrypted");
    this.notes.get(token).push({
      id: noteId,
      amount,
      created: 0,
      witness: { channelKey, nonce: index, r: salt },
      sender,
      open: isOpenNote2
    });
    const m = this.cursor.incomingChannels.get(sender).noteIndexes.get(token);
    this.cursor.incomingChannels.get(sender).noteIndexes.set(token, Math.max(m, index + 1));
    return true;
  }
};
var ChannelsDiscovery = class {
  address;
  viewingKey;
  recipients;
  cursor;
  pool;
  tracker = new Tracker();
  channels;
  total;
  constructor(address, viewingKey, recipients, cursor, pool) {
    this.address = address;
    this.viewingKey = viewingKey;
    this.recipients = recipients;
    this.cursor = cursor;
    this.pool = pool;
    const { channels, total } = cloneChannelCursor(cursor);
    this.channels = channels;
    this.total = total;
  }
  async discover() {
    if (this.recipients == "all" || this.recipients == "total-only") {
      void scan(async (s) => {
        const encOutgoingChannelInfo = await this.pool.get_outgoing_channel_info(compute_outgoing_channel_id(this.address, toBigInt(this.viewingKey), s));
        if (toBigInt(encOutgoingChannelInfo.salt) === 0n)
          return false;
        if (this.recipients !== "total-only") {
          const { recipientAddr } = encryptions.decryptOutgoingChannelInfo(encOutgoingChannelInfo, this.address, this.viewingKey, s);
          void this.tracker.add(this.discoverChannel(recipientAddr));
        }
        this.total = Math.max(this.total ?? 0, s + 1);
        return true;
      }, this.total ?? 0, this.tracker, this.recipients === "total-only");
    } else {
      for (const recipient of this.recipients) {
        void this.tracker.add(this.discoverChannel(toBigInt(recipient)));
      }
    }
    if (this.cursor) {
      for (const [recipient, channel] of this.cursor.channels?.entries() ?? []) {
        if (!channel.key)
          continue;
        void this.tracker.add(this.discoverSubchannels(recipient, channel));
        for (const [token, nonces] of channel.tokens) {
          void this.tracker.add(this.discoverNotes(recipient, channel, token, nonces.noteNonce));
        }
      }
    }
    await this.tracker.wait();
    return { timestamp: 0, channels: this.channels, total: this.total };
  }
  async discoverChannel(recipient) {
    debugLog("contract-discovery", "discoverChannels", "recipient", toHex(recipient));
    let channel = this.channels.get(recipient);
    if (channel && channel.key !== 0n) {
      void this.tracker.add(this.discoverSubchannels(recipient, channel));
      return;
    }
    const publicKey = this.channels.get(recipient)?.publicKey ?? await this.pool.get_public_key(recipient);
    debugLog("contract-discovery", "discoverChannels", "publicKey", publicKey);
    if (!publicKey)
      return;
    channel = this.channels.get(recipient, () => new Channel(publicKey));
    const channelKey = compute_channel_key(this.address, this.viewingKey, recipient, toBigInt(publicKey));
    const channelMarker = compute_channel_marker(channelKey, this.address, recipient, toBigInt(publicKey));
    if (await this.pool.channel_exists(channelMarker)) {
      channel.key = channelKey;
      void this.tracker.add(this.discoverSubchannels(recipient, channel));
    }
  }
  async discoverSubchannels(recipient, channel) {
    void scan(async (k) => {
      const encSubchannel = await this.pool.get_subchannel_info(compute_subchannel_id(channel.key, k));
      if (toBigInt(encSubchannel.salt) === 0n)
        return false;
      const { token } = encryptions.decryptSubchannelInfo(encSubchannel, channel.key, k);
      this.channels.get(recipient).tokens.set(token, { tokenIndex: k, noteNonce: 0 });
      void this.tracker.add(this.discoverNotes(recipient, channel, token, 0));
      return true;
    }, channel.tokens.size ?? 0, this.tracker);
  }
  async discoverNotes(recipient, channel, token, index) {
    void scan(async (i) => {
      const noteData = await this.pool.get_note(compute_note_id(channel.key, token, i));
      if (toBigInt(noteData.packed_value) === 0n)
        return false;
      const nonces = this.channels.get(recipient).tokens.get(token);
      nonces.noteNonce = Math.max(nonces.noteNonce, i + 1);
      return true;
    }, index, this.tracker, true);
  }
};
var ContractDiscoveryProvider = class extends AbstractDiscoveryProvider {
  pool;
  constructor(pool, options) {
    super();
    this.pool = options?.rateLimit ? createRateLimitedObject(pool, options.rateLimit) : pool;
  }
  async discoverNotes(address, viewingKey, params) {
    const discovery = new NotesDiscovery(address, viewingKey, params?.cursor, new Set(params?.tokens ?? []), this.pool);
    return discovery.discover();
  }
  async discoverChannels(address, viewingKey, recipients, params) {
    const discovery = new ChannelsDiscovery(address, toBigInt(viewingKey), recipients, params?.cursor, this.pool);
    return discovery.discover();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AddressMap,
  All,
  Channel,
  ContractDiscoveryProvider,
  IndexerDiscoveryProvider,
  MAX_VIEWING_KEY,
  OhttpClient,
  Open,
  PrivacyPoolABI,
  ProvingService,
  ProvingServiceError,
  ProvingServiceHttpError,
  ProvingServiceProofProvider,
  ScreeningRejected,
  ScreeningUnavailable,
  SetupRequirement,
  ShadowAccountAnonymizerABI,
  SimplePrivateTransfersImpl,
  WarningCode,
  Witness,
  buildHistoryCursor,
  classifyTransaction,
  createEmptyRegistry,
  createPrivateTransfers,
  screeningErrorFromProvingError
});
