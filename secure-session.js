import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  sign,
  timingSafeEqual,
  verify
} from 'node:crypto';
import { canonicalStringify } from './memory-ledger.js';

export const SECURE_IDENTITY_VERSION = 'secure-identity/v1';
export const SESSION_OFFER_VERSION = 'session-offer/v1';
export const SECURE_FRAME_VERSION = 'secure-frame/v1';
export const FORWARDED_MESSAGE_VERSION = 'forwarded-message/v1';

export const SECURE_SESSION_LIMITS = Object.freeze({
  maxPayloadBytes: 16_384,
  maxFrameBytes: 32_768,
  maxTtl: 8,
  maxOfferAgeMs: 300_000,
  maxFutureSkewMs: 30_000,
  maxFrameAgeMs: 300_000,
  rateCapacity: 32,
  ratePerSecond: 8,
  maxSessionIds: 4096
});

const SESSION_FACTORY = Symbol('secure-session-factory');

export class SecureSessionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SecureSessionError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new SecureSessionError(code, message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, keys) {
  return (
    isPlainObject(value)
    && Object.keys(value).sort().join(',') === [...keys].sort().join(',')
  );
}

function clone(value) {
  return JSON.parse(canonicalStringify(value));
}

function cloneProtocolValue(value, code, message) {
  try {
    return clone(value);
  } catch {
    fail(code, message);
  }
}

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
}

function normalizeText(value, name, maxLength) {
  if (typeof value !== 'string') fail('INVALID_TEXT', `${name} must be text`);
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > maxLength) {
    fail(
      'INVALID_TEXT',
      `${name} must contain 1-${maxLength} characters`
    );
  }
  return normalized;
}

function normalizeLimits(overrides = {}) {
  if (!isPlainObject(overrides)) {
    fail('INVALID_LIMITS', 'session limits must be a plain object');
  }
  const allowed = Object.keys(SECURE_SESSION_LIMITS);
  const unexpected = Object.keys(overrides)
    .filter(key => !allowed.includes(key));
  if (unexpected.length > 0) {
    fail('INVALID_LIMITS', `unexpected limits: ${unexpected.join(', ')}`);
  }

  const limits = { ...SECURE_SESSION_LIMITS, ...overrides };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1) {
      fail('INVALID_LIMITS', `${name} must be a positive safe integer`);
    }
  }
  return Object.freeze(limits);
}

function canonicalTimestamp(value, name) {
  if (
    typeof value !== 'string'
    || Number.isNaN(Date.parse(value))
    || new Date(value).toISOString() !== value
  ) {
    fail('INVALID_TIMESTAMP', `${name} must be canonical ISO-8601`);
  }
  return value;
}

function readClock(clock) {
  const value = clock();
  if (!Number.isFinite(value)) {
    fail('INVALID_CLOCK', 'clock must return a finite millisecond timestamp');
  }
  return value;
}

function timestampFrom(value, name) {
  let timestamp;
  try {
    timestamp = new Date(value).toISOString();
  } catch {
    fail('INVALID_TIMESTAMP', `${name} must be a valid timestamp`);
  }
  return timestamp;
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function decodeBase64Url(value, name, expectedBytes) {
  if (
    typeof value !== 'string'
    || value.length < 1
    || !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    fail('INVALID_ENCODING', `${name} must be unpadded base64url`);
  }
  const decoded = Buffer.from(value, 'base64url');
  if (base64Url(decoded) !== value) {
    fail('INVALID_ENCODING', `${name} is not canonical base64url`);
  }
  if (expectedBytes !== undefined && decoded.length !== expectedBytes) {
    fail('INVALID_ENCODING', `${name} must contain ${expectedBytes} bytes`);
  }
  return decoded;
}

function sha256Id(value) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `sha256:${hash}`;
}

function publicDer(key) {
  return key.export({ type: 'spki', format: 'der' });
}

function importPublicKey(encoded, expectedType, name) {
  let key;
  try {
    key = createPublicKey({
      key: decodeBase64Url(encoded, name),
      type: 'spki',
      format: 'der'
    });
  } catch (error) {
    if (error instanceof SecureSessionError) throw error;
    fail('INVALID_KEY', `${name} is not a valid public key`);
  }
  if (key.asymmetricKeyType !== expectedType) {
    fail('INVALID_KEY', `${name} must be ${expectedType}`);
  }
  return key;
}

function identityStatement(identity) {
  return {
    version: identity.version,
    peerId: identity.peerId,
    label: identity.label,
    signingKey: identity.signingKey,
    exchangeKey: identity.exchangeKey
  };
}

function validatePublicIdentity(identity) {
  identity = cloneProtocolValue(
    identity,
    'INVALID_IDENTITY',
    'identity must be canonical JSON data'
  );
  if (!exactKeys(identity, [
    'exchangeKey',
    'label',
    'peerId',
    'proof',
    'signingKey',
    'version'
  ])) {
    fail('INVALID_IDENTITY', 'identity has unexpected fields');
  }
  if (identity.version !== SECURE_IDENTITY_VERSION) {
    fail('INVALID_IDENTITY', 'unsupported identity version');
  }
  if (normalizeText(identity.label, 'identity.label', 128) !== identity.label) {
    fail('INVALID_IDENTITY', 'identity label is not normalized');
  }
  const signingKey = importPublicKey(
    identity.signingKey,
    'ed25519',
    'identity.signingKey'
  );
  const exchangeKey = importPublicKey(
    identity.exchangeKey,
    'x25519',
    'identity.exchangeKey'
  );
  if (identity.peerId !== sha256Id(publicDer(signingKey))) {
    fail('INVALID_IDENTITY', 'peer ID does not match signing key');
  }
  const proof = decodeBase64Url(identity.proof, 'identity.proof', 64);
  if (!verify(
    null,
    Buffer.from(canonicalStringify(identityStatement(identity))),
    signingKey,
    proof
  )) {
    fail('INVALID_IDENTITY', 'identity proof did not verify');
  }
  return { signingKey, exchangeKey, identity: clone(identity) };
}

function offerStatement(offer) {
  return {
    version: offer.version,
    sessionId: offer.sessionId,
    from: offer.from,
    to: offer.to,
    createdAt: offer.createdAt,
    maxTtl: offer.maxTtl
  };
}

function frameHeader(frame) {
  return {
    version: frame.version,
    sessionId: frame.sessionId,
    from: frame.from,
    to: frame.to,
    sequence: frame.sequence,
    sentAt: frame.sentAt,
    ttl: frame.ttl,
    nonce: frame.nonce
  };
}

function unsignedFrame(frame) {
  return {
    ...frameHeader(frame),
    messageId: frame.messageId,
    ciphertext: frame.ciphertext,
    tag: frame.tag
  };
}

function messageId(headerBytes, ciphertext, tag) {
  return sha256Id(Buffer.concat([headerBytes, ciphertext, tag]));
}

function sequenceNonce(key, sequence) {
  const nonce = Buffer.alloc(12);
  createHash('sha256')
    .update(key)
    .update('consciousness-mesh/nonce-prefix/v1')
    .digest()
    .copy(nonce, 0, 0, 4);
  nonce.writeBigUInt64BE(BigInt(sequence), 4);
  return nonce;
}

class TokenBucket {
  constructor(capacity, perSecond, clock) {
    this.capacity = capacity;
    this.refillPerMs = perSecond / 1000;
    this.clock = clock;
    this.tokens = capacity;
    this.last = readClock(clock);
  }

  consume() {
    const now = readClock(this.clock);
    const elapsed = Math.max(0, now - this.last);
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.refillPerMs
    );
    this.last = now;
    if (this.tokens < 1) {
      fail('RATE_LIMITED', 'secure session frame rate exceeded');
    }
    this.tokens -= 1;
  }
}

export class SecureIdentity {
  #clock;
  #exchangePrivate;
  #openedSessions = new Set();
  #publicIdentity;
  #signingPrivate;

  constructor(label, options = {}) {
    this.#clock = options.clock || Date.now;
    if (typeof this.#clock !== 'function') {
      fail('INVALID_CLOCK', 'clock must be a function');
    }
    const normalizedLabel = normalizeText(label, 'label', 128);
    const signing = generateKeyPairSync('ed25519');
    const exchange = generateKeyPairSync('x25519');
    this.#signingPrivate = signing.privateKey;
    this.#exchangePrivate = exchange.privateKey;

    const signingKey = base64Url(publicDer(signing.publicKey));
    const exchangeKey = base64Url(publicDer(exchange.publicKey));
    const statement = {
      version: SECURE_IDENTITY_VERSION,
      peerId: sha256Id(publicDer(signing.publicKey)),
      label: normalizedLabel,
      signingKey,
      exchangeKey
    };
    this.#publicIdentity = Object.freeze({
      ...statement,
      proof: base64Url(sign(
        null,
        Buffer.from(canonicalStringify(statement)),
        this.#signingPrivate
      ))
    });
  }

  get peerId() {
    return this.#publicIdentity.peerId;
  }

  exportPublicIdentity() {
    return clone(this.#publicIdentity);
  }

  createSessionOffer(peerIdentity, options = {}) {
    const peer = validatePublicIdentity(peerIdentity).identity;
    if (peer.peerId === this.peerId) {
      fail('SELF_SESSION', 'cannot create a session with the same identity');
    }
    const maxTtl = options.maxTtl ?? SECURE_SESSION_LIMITS.maxTtl;
    if (
      !Number.isSafeInteger(maxTtl)
      || maxTtl < 1
      || maxTtl > SECURE_SESSION_LIMITS.maxTtl
    ) {
      fail('INVALID_TTL', 'offer maxTtl is outside protocol bounds');
    }
    const statement = {
      version: SESSION_OFFER_VERSION,
      sessionId: base64Url(randomBytes(24)),
      from: this.peerId,
      to: peer.peerId,
      createdAt: timestampFrom(
        options.createdAt ?? readClock(this.#clock),
        'offer.createdAt'
      ),
      maxTtl
    };
    return {
      ...statement,
      signature: base64Url(sign(
        null,
        Buffer.from(canonicalStringify(statement)),
        this.#signingPrivate
      ))
    };
  }

  openSession(peerIdentity, offer, options = {}) {
    const limits = normalizeLimits(options.limits);
    const local = validatePublicIdentity(this.#publicIdentity);
    const peer = validatePublicIdentity(peerIdentity);
    offer = cloneProtocolValue(
      offer,
      'INVALID_OFFER',
      'session offer must be canonical JSON data'
    );
    if (!exactKeys(offer, [
      'createdAt',
      'from',
      'maxTtl',
      'sessionId',
      'signature',
      'to',
      'version'
    ])) {
      fail('INVALID_OFFER', 'session offer has unexpected fields');
    }
    if (offer.version !== SESSION_OFFER_VERSION) {
      fail('INVALID_OFFER', 'unsupported session offer version');
    }
    if (
      !(
        offer.from === local.identity.peerId
        && offer.to === peer.identity.peerId
      )
      && !(
        offer.from === peer.identity.peerId
        && offer.to === local.identity.peerId
      )
    ) {
      fail('INVALID_OFFER', 'session offer is not addressed to this pair');
    }
    if (
      !Number.isSafeInteger(offer.maxTtl)
      || offer.maxTtl < 1
      || offer.maxTtl > limits.maxTtl
    ) {
      fail('INVALID_TTL', 'session offer TTL exceeds local policy');
    }
    const sessionId = decodeBase64Url(
      offer.sessionId,
      'offer.sessionId',
      24
    );
    canonicalTimestamp(offer.createdAt, 'offer.createdAt');
    const age = readClock(this.#clock) - Date.parse(offer.createdAt);
    if (age > limits.maxOfferAgeMs || age < -limits.maxFutureSkewMs) {
      fail('EXPIRED_OFFER', 'session offer is outside the accepted time window');
    }
    const issuer = offer.from === local.identity.peerId ? local : peer;
    if (!verify(
      null,
      Buffer.from(canonicalStringify(offerStatement(offer))),
      issuer.signingKey,
      decodeBase64Url(offer.signature, 'offer.signature', 64)
    )) {
      fail('INVALID_OFFER', 'session offer signature did not verify');
    }
    if (this.#openedSessions.has(offer.sessionId)) {
      fail('SESSION_REUSE', 'session offer has already been opened');
    }
    if (this.#openedSessions.size >= limits.maxSessionIds) {
      fail('SESSION_LIMIT', 'identity must rotate before opening more sessions');
    }

    const sharedSecret = diffieHellman({
      privateKey: this.#exchangePrivate,
      publicKey: peer.exchangeKey
    });
    const ordered = [local.identity.peerId, peer.identity.peerId].sort();
    const keyMaterial = Buffer.from(hkdfSync(
      'sha256',
      sharedSecret,
      sessionId,
      Buffer.from(`consciousness-mesh/secure-session/v1:${ordered.join(':')}`),
      64
    ));
    sharedSecret.fill(0);
    const localIsFirst = local.identity.peerId === ordered[0];
    const sendKey = Buffer.from(
      keyMaterial.subarray(localIsFirst ? 0 : 32, localIsFirst ? 32 : 64)
    );
    const receiveKey = Buffer.from(
      keyMaterial.subarray(localIsFirst ? 32 : 0, localIsFirst ? 64 : 32)
    );
    keyMaterial.fill(0);
    this.#openedSessions.add(offer.sessionId);

    return new SecureSession(SESSION_FACTORY, {
      clock: this.#clock,
      limits,
      sessionId: offer.sessionId,
      maxTtl: offer.maxTtl,
      localIdentity: local.identity,
      peerIdentity: peer.identity,
      peerSigningKey: peer.signingKey,
      signingPrivate: this.#signingPrivate,
      sendKey,
      receiveKey
    });
  }
}

export class SecureSession {
  #active = true;
  #clock;
  #lastReceivedSequence = 0;
  #limits;
  #localIdentity;
  #maxTtl;
  #openedMessages = new WeakSet();
  #peerIdentity;
  #peerSigningKey;
  #rateLimiter;
  #receiveKey;
  #sendKey;
  #sendSequence = 0;
  #sessionId;
  #signingPrivate;

  constructor(factory, state) {
    if (factory !== SESSION_FACTORY) {
      fail('INVALID_CONSTRUCTION', 'sessions are created by SecureIdentity');
    }
    this.#clock = state.clock;
    this.#limits = state.limits;
    this.#sessionId = state.sessionId;
    this.#maxTtl = state.maxTtl;
    this.#localIdentity = state.localIdentity;
    this.#peerIdentity = state.peerIdentity;
    this.#peerSigningKey = state.peerSigningKey;
    this.#signingPrivate = state.signingPrivate;
    this.#sendKey = state.sendKey;
    this.#receiveKey = state.receiveKey;
    this.#rateLimiter = new TokenBucket(
      this.#limits.rateCapacity,
      this.#limits.ratePerSecond,
      this.#clock
    );
  }

  #assertActive() {
    if (!this.#active) fail('SESSION_CLOSED', 'secure session is disposed');
  }

  seal(payload, options = {}) {
    this.#assertActive();
    let plaintext;
    try {
      plaintext = Buffer.from(canonicalStringify(payload));
    } catch {
      fail('INVALID_PAYLOAD', 'payload must be canonical JSON data');
    }
    if (plaintext.length > this.#limits.maxPayloadBytes) {
      fail('PAYLOAD_TOO_LARGE', 'payload exceeds secure session byte limit');
    }
    const ttl = options.ttl ?? 1;
    if (
      !Number.isSafeInteger(ttl)
      || ttl < 1
      || ttl > this.#maxTtl
    ) {
      fail('INVALID_TTL', 'frame TTL exceeds negotiated bounds');
    }
    if (this.#sendSequence >= Number.MAX_SAFE_INTEGER) {
      fail('SEQUENCE_EXHAUSTED', 'secure session sequence is exhausted');
    }

    const sequence = ++this.#sendSequence;
    const nonce = sequenceNonce(this.#sendKey, sequence);
    const header = {
      version: SECURE_FRAME_VERSION,
      sessionId: this.#sessionId,
      from: this.#localIdentity.peerId,
      to: this.#peerIdentity.peerId,
      sequence,
      sentAt: timestampFrom(readClock(this.#clock), 'frame.sentAt'),
      ttl,
      nonce: base64Url(nonce)
    };
    const headerBytes = Buffer.from(canonicalStringify(header));
    const cipher = createCipheriv('aes-256-gcm', this.#sendKey, nonce);
    cipher.setAAD(headerBytes);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final()
    ]);
    const tag = cipher.getAuthTag();
    const unsigned = {
      ...header,
      messageId: messageId(headerBytes, ciphertext, tag),
      ciphertext: base64Url(ciphertext),
      tag: base64Url(tag)
    };
    const frame = {
      ...unsigned,
      signature: base64Url(sign(
        null,
        Buffer.from(canonicalStringify(unsigned)),
        this.#signingPrivate
      ))
    };
    const serialized = canonicalStringify(frame);
    if (Buffer.byteLength(serialized) > this.#limits.maxFrameBytes) {
      fail('FRAME_TOO_LARGE', 'serialized frame exceeds byte limit');
    }
    return serialized;
  }

  open(serialized) {
    this.#assertActive();
    this.#rateLimiter.consume();
    if (typeof serialized !== 'string') {
      fail('INVALID_FRAME', 'secure frame must be serialized JSON');
    }
    if (Buffer.byteLength(serialized) > this.#limits.maxFrameBytes) {
      fail('FRAME_TOO_LARGE', 'serialized frame exceeds byte limit');
    }

    let frame;
    try {
      frame = JSON.parse(serialized);
    } catch {
      fail('INVALID_FRAME', 'secure frame is not valid JSON');
    }
    if (!exactKeys(frame, [
      'ciphertext',
      'from',
      'messageId',
      'nonce',
      'sentAt',
      'sequence',
      'sessionId',
      'signature',
      'tag',
      'to',
      'ttl',
      'version'
    ])) {
      fail('INVALID_FRAME', 'secure frame has unexpected fields');
    }
    let canonicalFrame;
    try {
      canonicalFrame = canonicalStringify(frame);
    } catch {
      fail('INVALID_FRAME', 'secure frame exceeds canonical JSON bounds');
    }
    if (canonicalFrame !== serialized) {
      fail('NON_CANONICAL_FRAME', 'secure frame JSON must be canonical');
    }
    if (
      frame.version !== SECURE_FRAME_VERSION
      || frame.sessionId !== this.#sessionId
      || frame.from !== this.#peerIdentity.peerId
      || frame.to !== this.#localIdentity.peerId
    ) {
      fail('WRONG_SESSION', 'secure frame does not belong to this session');
    }
    if (
      !Number.isSafeInteger(frame.sequence)
      || frame.sequence < 1
      || !Number.isSafeInteger(frame.ttl)
      || frame.ttl < 1
      || frame.ttl > this.#maxTtl
    ) {
      fail('INVALID_FRAME', 'sequence or propagation bounds are invalid');
    }
    canonicalTimestamp(frame.sentAt, 'frame.sentAt');
    const age = readClock(this.#clock) - Date.parse(frame.sentAt);
    if (age > this.#limits.maxFrameAgeMs || age < -this.#limits.maxFutureSkewMs) {
      fail('STALE_FRAME', 'secure frame is outside the accepted time window');
    }

    const nonce = decodeBase64Url(frame.nonce, 'frame.nonce', 12);
    const ciphertext = decodeBase64Url(frame.ciphertext, 'frame.ciphertext');
    const tag = decodeBase64Url(frame.tag, 'frame.tag', 16);
    const signature = decodeBase64Url(frame.signature, 'frame.signature', 64);
    const headerBytes = Buffer.from(canonicalStringify(frameHeader(frame)));
    if (frame.messageId !== messageId(headerBytes, ciphertext, tag)) {
      fail('INVALID_FRAME', 'message ID does not match encrypted frame');
    }
    if (!verify(
      null,
      Buffer.from(canonicalStringify(unsignedFrame(frame))),
      this.#peerSigningKey,
      signature
    )) {
      fail('INVALID_SIGNATURE', 'secure frame signature did not verify');
    }
    if (frame.sequence <= this.#lastReceivedSequence) {
      fail('REPLAY', 'secure frame sequence was already observed');
    }
    const expectedNonce = sequenceNonce(this.#receiveKey, frame.sequence);
    if (!timingSafeEqual(nonce, expectedNonce)) {
      fail('INVALID_NONCE', 'secure frame nonce is not sequence-derived');
    }

    let plaintext;
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.#receiveKey,
        nonce
      );
      decipher.setAAD(headerBytes);
      decipher.setAuthTag(tag);
      plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]).toString('utf8');
    } catch {
      fail('DECRYPTION_FAILED', 'secure frame authentication failed');
    }
    if (Buffer.byteLength(plaintext) > this.#limits.maxPayloadBytes) {
      fail('PAYLOAD_TOO_LARGE', 'decrypted payload exceeds byte limit');
    }

    let payload;
    try {
      payload = JSON.parse(plaintext);
      if (canonicalStringify(payload) !== plaintext) {
        fail('NON_CANONICAL_PAYLOAD', 'decrypted payload is not canonical');
      }
    } catch (error) {
      if (error instanceof SecureSessionError) throw error;
      fail('INVALID_PAYLOAD', 'decrypted payload is not valid canonical JSON');
    }

    this.#lastReceivedSequence = frame.sequence;
    const openedMessage = freezeDeep({
      payload,
      messageId: frame.messageId,
      remainingHops: frame.ttl - 1,
      provenance: {
        from: frame.from,
        to: frame.to,
        sessionId: frame.sessionId,
        sequence: frame.sequence,
        sentAt: frame.sentAt
      }
    });
    this.#openedMessages.add(openedMessage);
    return openedMessage;
  }

  forward(openedMessage) {
    this.#assertActive();
    if (
      !this.#openedMessages.has(openedMessage)
      || !isPlainObject(openedMessage)
      || !Number.isSafeInteger(openedMessage.remainingHops)
      || openedMessage.remainingHops < 1
      || typeof openedMessage.messageId !== 'string'
      || !isPlainObject(openedMessage.provenance)
    ) {
      fail('INVALID_FORWARD', 'message cannot be forwarded');
    }
    this.#openedMessages.delete(openedMessage);
    return this.seal({
      version: FORWARDED_MESSAGE_VERSION,
      previousMessageId: openedMessage.messageId,
      observedFrom: openedMessage.provenance.from,
      payload: openedMessage.payload
    }, {
      ttl: openedMessage.remainingHops
    });
  }

  dispose() {
    if (!this.#active) return;
    this.#sendKey.fill(0);
    this.#receiveKey.fill(0);
    this.#active = false;
  }
}

export default SecureIdentity;
