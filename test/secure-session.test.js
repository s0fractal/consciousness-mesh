import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  SECURE_FRAME_VERSION,
  SECURE_IDENTITY_VERSION,
  SESSION_ACCEPTANCE_VERSION,
  SESSION_OFFER_VERSION,
  SecureIdentity,
  SecureSessionError
} from '../secure-session.js';

const baseTime = Date.parse('2026-07-30T12:00:00.000Z');

function createPair(options = {}) {
  let now = options.now ?? baseTime;
  const clock = () => now;
  const alice = new SecureIdentity('alice', { clock });
  const bob = new SecureIdentity('bob', { clock });
  const offer = alice.createSessionOffer(bob.exportPublicIdentity(), {
    createdAt: new Date(now).toISOString(),
    maxTtl: options.maxTtl ?? 8,
    limits: options.limits
  });
  const limits = options.limits;
  const accepted = bob.acceptSession(
    alice.exportPublicIdentity(),
    offer,
    {
      acceptedAt: new Date(now).toISOString(),
      limits
    }
  );
  const aliceSession = alice.completeSession(
    bob.exportPublicIdentity(),
    offer,
    accepted.acceptance,
    { limits }
  );

  return {
    alice,
    bob,
    aliceSession,
    bobSession: accepted.session,
    acceptance: accepted.acceptance,
    offer,
    advance(milliseconds) {
      now += milliseconds;
    }
  };
}

test('authenticated sessions encrypt canonical payloads in both directions', () => {
  const pair = createPair();
  const toBob = pair.aliceSession.seal({
    type: 'thought/v1',
    text: 'connection follows consent',
    metrics: { H: 0.8, L: 0.7 }
  }, { ttl: 3 });
  const openedByBob = pair.bobSession.open(toBob);

  assert.deepEqual(openedByBob.payload, {
    metrics: { H: 0.8, L: 0.7 },
    text: 'connection follows consent',
    type: 'thought/v1'
  });
  assert.equal(openedByBob.provenance.from, pair.alice.peerId);
  assert.equal(openedByBob.provenance.to, pair.bob.peerId);
  assert.equal(openedByBob.remainingHops, 2);
  assert.doesNotMatch(toBob, /connection follows consent/);

  const toAlice = pair.bobSession.seal({ acknowledged: true });
  assert.deepEqual(
    pair.aliceSession.open(toAlice).payload,
    { acknowledged: true }
  );
});

test('identity proofs bind stable peer IDs without static exchange keys', () => {
  const alice = new SecureIdentity('alice');
  const bob = new SecureIdentity('bob');
  const tampered = bob.exportPublicIdentity();
  tampered.label = 'mallory';

  assert.throws(
    () => alice.createSessionOffer(tampered),
    error => (
      error instanceof SecureSessionError
      && ['INVALID_IDENTITY', 'INVALID_KEY'].includes(error.code)
    )
  );
  assert.match(alice.peerId, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(
    Object.keys(alice.exportPublicIdentity()).sort(),
    ['label', 'peerId', 'proof', 'signingKey', 'version']
  );
});

test('the v2 handshake uses fresh signed ephemeral keys on both sides', () => {
  const alice = new SecureIdentity('alice', { clock: () => baseTime });
  const bob = new SecureIdentity('bob', { clock: () => baseTime });
  const bobIdentity = bob.exportPublicIdentity();
  const first = alice.createSessionOffer(bobIdentity);
  const second = alice.createSessionOffer(bobIdentity);

  assert.equal(first.version, SESSION_OFFER_VERSION);
  assert.equal(alice.exportPublicIdentity().version, SECURE_IDENTITY_VERSION);
  assert.equal('exchangeKey' in alice.exportPublicIdentity(), false);
  assert.notEqual(first.ephemeralKey, second.ephemeralKey);

  const accepted = bob.acceptSession(alice.exportPublicIdentity(), first);
  assert.equal(accepted.acceptance.version, SESSION_ACCEPTANCE_VERSION);
  assert.notEqual(accepted.acceptance.ephemeralKey, first.ephemeralKey);

  const aliceSession = alice.completeSession(
    bobIdentity,
    first,
    accepted.acceptance
  );
  const frame = aliceSession.seal({ fresh: true });
  assert.equal(JSON.parse(frame).version, SECURE_FRAME_VERSION);
  assert.deepEqual(accepted.session.open(frame).payload, { fresh: true });
  alice.cancelSessionOffer(second.sessionId);
});

test('acceptance tampering and cross-offer substitution preserve pending state', () => {
  const alice = new SecureIdentity('alice', { clock: () => baseTime });
  const bob = new SecureIdentity('bob', { clock: () => baseTime });
  const first = alice.createSessionOffer(bob.exportPublicIdentity());
  const second = alice.createSessionOffer(bob.exportPublicIdentity());
  const firstAccepted = bob.acceptSession(
    alice.exportPublicIdentity(),
    first
  );

  const tampered = {
    ...firstAccepted.acceptance,
    ephemeralKey: second.ephemeralKey
  };
  assert.throws(
    () => alice.completeSession(
      bob.exportPublicIdentity(),
      first,
      tampered
    ),
    error => (
      error instanceof SecureSessionError
      && ['INVALID_ACCEPTANCE', 'INVALID_KEY'].includes(error.code)
    )
  );

  const secondBob = new SecureIdentity('second-bob', {
    clock: () => baseTime
  });
  const foreignOffer = alice.createSessionOffer(
    secondBob.exportPublicIdentity()
  );
  const foreignAcceptance = secondBob.acceptSession(
    alice.exportPublicIdentity(),
    foreignOffer
  ).acceptance;
  assert.throws(
    () => alice.completeSession(
      bob.exportPublicIdentity(),
      first,
      foreignAcceptance
    ),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_ACCEPTANCE'
    )
  );

  const recovered = alice.completeSession(
    bob.exportPublicIdentity(),
    first,
    firstAccepted.acceptance
  );
  assert.deepEqual(
    recovered.open(firstAccepted.session.seal({ recovered: true })).payload,
    { recovered: true }
  );
  alice.cancelSessionOffer(second.sessionId);
  alice.cancelSessionOffer(foreignOffer.sessionId);
});

test('handshake byte and temporal bounds fail before session creation', () => {
  const alice = new SecureIdentity('alice', { clock: () => baseTime });
  const bob = new SecureIdentity('bob', { clock: () => baseTime });
  const offer = alice.createSessionOffer(bob.exportPublicIdentity());

  assert.throws(
    () => bob.acceptSession(alice.exportPublicIdentity(), {
      ...offer,
      ephemeralKey: 'A'.repeat(9_000)
    }),
    error => (
      error instanceof SecureSessionError
      && error.code === 'HANDSHAKE_TOO_LARGE'
    )
  );
  assert.throws(
    () => bob.acceptSession(
      alice.exportPublicIdentity(),
      offer,
      {
        acceptedAt: new Date(baseTime - 30_001).toISOString()
      }
    ),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_ACCEPTANCE'
    )
  );

  const accepted = bob.acceptSession(alice.exportPublicIdentity(), offer);
  const session = alice.completeSession(
    bob.exportPublicIdentity(),
    offer,
    accepted.acceptance
  );
  assert.deepEqual(
    accepted.session.open(session.seal({ bounded: true })).payload,
    { bounded: true }
  );
});

test('v2 refuses handshake downgrade instead of negotiating legacy crypto', () => {
  const alice = new SecureIdentity('alice', { clock: () => baseTime });
  const bob = new SecureIdentity('bob', { clock: () => baseTime });
  const offer = alice.createSessionOffer(bob.exportPublicIdentity());

  assert.throws(
    () => bob.acceptSession(alice.exportPublicIdentity(), {
      ...offer,
      version: 'session-offer/v1'
    }),
    error => (
      error instanceof SecureSessionError
      && error.code === 'DOWNGRADE_REFUSED'
    )
  );

  const accepted = bob.acceptSession(alice.exportPublicIdentity(), offer);
  assert.throws(
    () => alice.completeSession(
      bob.exportPublicIdentity(),
      offer,
      {
        ...accepted.acceptance,
        version: 'session-acceptance/v1'
      }
    ),
    error => (
      error instanceof SecureSessionError
      && error.code === 'DOWNGRADE_REFUSED'
    )
  );
  alice.completeSession(
    bob.exportPublicIdentity(),
    offer,
    accepted.acceptance
  );
  assert.throws(
    () => alice.completeSession(
      bob.exportPublicIdentity(),
      offer,
      accepted.acceptance
    ),
    error => (
      error instanceof SecureSessionError
      && error.code === 'SESSION_REUSE'
    )
  );
});

test('pending offers are cancellable, expiring, and strictly bounded', () => {
  let now = baseTime;
  const clock = () => now;
  const alice = new SecureIdentity('alice', { clock });
  const bob = new SecureIdentity('bob', { clock });
  const limits = { maxPendingOffers: 1 };
  const first = alice.createSessionOffer(bob.exportPublicIdentity(), {
    limits
  });

  assert.throws(
    () => alice.createSessionOffer(bob.exportPublicIdentity(), { limits }),
    error => (
      error instanceof SecureSessionError
      && error.code === 'PENDING_LIMIT'
    )
  );
  assert.equal(alice.cancelSessionOffer(first.sessionId), true);
  assert.equal(alice.cancelSessionOffer(first.sessionId), false);

  const expiring = alice.createSessionOffer(bob.exportPublicIdentity(), {
    limits
  });
  now += 300_001;
  const replacement = alice.createSessionOffer(bob.exportPublicIdentity(), {
    limits
  });
  assert.notEqual(replacement.sessionId, expiring.sessionId);
  assert.equal(alice.cancelSessionOffer(expiring.sessionId), false);
  assert.equal(alice.cancelSessionOffer(replacement.sessionId), true);
});

test('disposed identities refuse new or pending handshake work', () => {
  const alice = new SecureIdentity('alice', { clock: () => baseTime });
  const bob = new SecureIdentity('bob', { clock: () => baseTime });
  const offer = alice.createSessionOffer(bob.exportPublicIdentity());
  const accepted = bob.acceptSession(alice.exportPublicIdentity(), offer);

  alice.dispose();
  alice.dispose();
  assert.throws(
    () => alice.completeSession(
      bob.exportPublicIdentity(),
      offer,
      accepted.acceptance
    ),
    error => (
      error instanceof SecureSessionError
      && error.code === 'IDENTITY_CLOSED'
    )
  );
  assert.throws(
    () => alice.createSessionOffer(bob.exportPublicIdentity()),
    error => (
      error instanceof SecureSessionError
      && error.code === 'IDENTITY_CLOSED'
    )
  );
  accepted.session.dispose();
});

test('ciphertext, metadata, and signatures reject tampering', () => {
  const pair = createPair();
  const serialized = pair.aliceSession.seal({ signal: 'untampered' });
  const tamperedCiphertext = JSON.parse(serialized);
  tamperedCiphertext.ciphertext = (
    tamperedCiphertext.ciphertext.slice(0, -1)
    + (tamperedCiphertext.ciphertext.endsWith('A') ? 'B' : 'A')
  );
  assert.throws(
    () => pair.bobSession.open(JSON.stringify(tamperedCiphertext)),
    error => (
      error instanceof SecureSessionError
      && ['INVALID_ENCODING', 'INVALID_FRAME'].includes(error.code)
    )
  );

  const tamperedTtl = JSON.parse(serialized);
  tamperedTtl.ttl = 2;
  assert.throws(
    () => pair.bobSession.open(JSON.stringify(tamperedTtl)),
    error => (
      error instanceof SecureSessionError
      && ['INVALID_FRAME', 'INVALID_SIGNATURE'].includes(error.code)
    )
  );

  const tamperedSignature = JSON.parse(serialized);
  tamperedSignature.signature = (
    tamperedSignature.signature.slice(0, -1)
    + (tamperedSignature.signature.endsWith('A') ? 'B' : 'A')
  );
  assert.throws(
    () => pair.bobSession.open(JSON.stringify(tamperedSignature)),
    error => (
      error instanceof SecureSessionError
      && ['INVALID_ENCODING', 'INVALID_SIGNATURE'].includes(error.code)
    )
  );
});

test('strict sequence tracking rejects replay and reordering', () => {
  const replayPair = createPair();
  const first = replayPair.aliceSession.seal({ sequence: 1 });
  replayPair.bobSession.open(first);
  assert.throws(
    () => replayPair.bobSession.open(first),
    error => error instanceof SecureSessionError && error.code === 'REPLAY'
  );

  const reorderPair = createPair();
  const earlier = reorderPair.aliceSession.seal({ sequence: 1 });
  const later = reorderPair.aliceSession.seal({ sequence: 2 });
  assert.equal(reorderPair.bobSession.open(later).payload.sequence, 2);
  assert.throws(
    () => reorderPair.bobSession.open(earlier),
    error => error instanceof SecureSessionError && error.code === 'REPLAY'
  );
});

test('frames are bound to their intended peer and session', () => {
  const pair = createPair();
  const charlie = new SecureIdentity('charlie', { clock: () => baseTime });
  const offer = pair.alice.createSessionOffer(
    charlie.exportPublicIdentity(),
    { createdAt: new Date(baseTime).toISOString() }
  );
  const accepted = charlie.acceptSession(
    pair.alice.exportPublicIdentity(),
    offer
  );
  const aliceCharlie = pair.alice.completeSession(
    charlie.exportPublicIdentity(),
    offer,
    accepted.acceptance
  );
  const frameForBob = pair.aliceSession.seal({ intended: 'bob' });

  assert.throws(
    () => aliceCharlie.open(frameForBob),
    error => (
      error instanceof SecureSessionError
      && error.code === 'WRONG_SESSION'
    )
  );
});

test('payload, frame, TTL, and forwarding budgets are bounded', () => {
  const pair = createPair({
    limits: {
      maxPayloadBytes: 512,
      maxFrameBytes: 2048
    }
  });
  assert.throws(
    () => pair.aliceSession.seal({ text: 'x'.repeat(600) }),
    error => (
      error instanceof SecureSessionError
      && error.code === 'PAYLOAD_TOO_LARGE'
    )
  );
  assert.throws(
    () => pair.bobSession.open('x'.repeat(2049)),
    error => (
      error instanceof SecureSessionError
      && error.code === 'FRAME_TOO_LARGE'
    )
  );
  assert.throws(
    () => pair.aliceSession.seal({ value: 1 }, { ttl: 9 }),
    error => error instanceof SecureSessionError && error.code === 'INVALID_TTL'
  );

  const firstHop = pair.bobSession.open(
    pair.aliceSession.seal({ value: 'bounded' }, { ttl: 2 })
  );
  const finalHop = pair.aliceSession.open(
    pair.bobSession.forward(firstHop)
  );
  assert.equal(Object.isFrozen(firstHop), true);
  assert.equal(Object.isFrozen(firstHop.payload), true);
  assert.equal(finalHop.remainingHops, 0);
  assert.equal(finalHop.payload.previousMessageId, firstHop.messageId);
  assert.throws(
    () => pair.aliceSession.forward(finalHop),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_FORWARD'
    )
  );
  assert.throws(
    () => pair.bobSession.forward(firstHop),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_FORWARD'
    )
  );
  assert.throws(
    () => pair.bobSession.forward({
      ...firstHop,
      remainingHops: 8
    }),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_FORWARD'
    )
  );
});

test('token bucket limits accepted-session frame work', () => {
  const pair = createPair({
    limits: { rateCapacity: 2, ratePerSecond: 1 }
  });
  const frames = [
    pair.aliceSession.seal({ n: 1 }),
    pair.aliceSession.seal({ n: 2 }),
    pair.aliceSession.seal({ n: 3 })
  ];
  assert.equal(pair.bobSession.open(frames[0]).payload.n, 1);
  assert.equal(pair.bobSession.open(frames[1]).payload.n, 2);
  assert.throws(
    () => pair.bobSession.open(frames[2]),
    error => (
      error instanceof SecureSessionError
      && error.code === 'RATE_LIMITED'
    )
  );
  pair.advance(1000);
  assert.equal(pair.bobSession.open(frames[2]).payload.n, 3);
});

test('expired and reused offers are refused', () => {
  let now = baseTime;
  const clock = () => now;
  const alice = new SecureIdentity('alice', { clock });
  const bob = new SecureIdentity('bob', { clock });
  const expired = alice.createSessionOffer(bob.exportPublicIdentity(), {
    createdAt: new Date(now - 300_001).toISOString()
  });
  assert.throws(
    () => bob.acceptSession(alice.exportPublicIdentity(), expired),
    error => (
      error instanceof SecureSessionError
      && error.code === 'EXPIRED_HANDSHAKE'
    )
  );

  const current = alice.createSessionOffer(bob.exportPublicIdentity(), {
    createdAt: new Date(now).toISOString()
  });
  const modified = { ...current, maxTtl: current.maxTtl - 1 };
  assert.throws(
    () => bob.acceptSession(alice.exportPublicIdentity(), modified),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_OFFER'
    )
  );
  bob.acceptSession(alice.exportPublicIdentity(), current);
  assert.throws(
    () => bob.acceptSession(alice.exportPublicIdentity(), current),
    error => (
      error instanceof SecureSessionError
      && error.code === 'SESSION_REUSE'
    )
  );
});

test('stale signed frames are rejected before decryption', () => {
  const pair = createPair();
  const frame = pair.aliceSession.seal({ observed: 'then' });
  pair.advance(300_001);

  assert.throws(
    () => pair.bobSession.open(frame),
    error => (
      error instanceof SecureSessionError
      && error.code === 'STALE_FRAME'
    )
  );
});

test('malformed inputs fail closed and disposed sessions stay closed', () => {
  const pair = createPair();
  for (const malformed of [
    '',
    'not json',
    '{}',
    '{"version":"secure-frame/v2"}'
  ]) {
    assert.throws(
      () => pair.bobSession.open(malformed),
      SecureSessionError
    );
  }
  const validFrame = pair.aliceSession.seal({ canonical: true });
  assert.throws(
    () => pair.bobSession.open(` ${validFrame}`),
    error => (
      error instanceof SecureSessionError
      && error.code === 'NON_CANONICAL_FRAME'
    )
  );
  assert.throws(
    () => pair.aliceSession.seal({ invalid: undefined }),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_PAYLOAD'
    )
  );

  pair.aliceSession.dispose();
  pair.aliceSession.dispose();
  assert.throws(
    () => pair.aliceSession.seal({ after: 'dispose' }),
    error => (
      error instanceof SecureSessionError
      && error.code === 'SESSION_CLOSED'
    )
  );
});

test('identities, offers, timestamps, and clocks reject ambiguous input', () => {
  const alice = new SecureIdentity('alice', { clock: () => baseTime });
  const bob = new SecureIdentity('bob', { clock: () => baseTime });
  const identityWithAccessor = bob.exportPublicIdentity();
  let accessorRead = false;
  Object.defineProperty(identityWithAccessor, 'signingKey', {
    enumerable: true,
    get() {
      accessorRead = true;
      return bob.exportPublicIdentity().signingKey;
    }
  });
  assert.throws(
    () => alice.createSessionOffer(identityWithAccessor),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_IDENTITY'
    )
  );
  assert.equal(accessorRead, false);

  assert.throws(
    () => alice.createSessionOffer(bob.exportPublicIdentity(), {
      createdAt: 'not-a-timestamp'
    }),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_TIMESTAMP'
    )
  );

  const brokenClock = new SecureIdentity('broken-clock', {
    clock: () => Number.POSITIVE_INFINITY
  });
  assert.throws(
    () => brokenClock.createSessionOffer(bob.exportPublicIdentity()),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_CLOCK'
    )
  );

  const offer = alice.createSessionOffer(bob.exportPublicIdentity());
  let offerAccessorRead = false;
  Object.defineProperty(offer, 'maxTtl', {
    enumerable: true,
    get() {
      offerAccessorRead = true;
      return 8;
    }
  });
  assert.throws(
    () => bob.acceptSession(alice.exportPublicIdentity(), offer),
    error => (
      error instanceof SecureSessionError
      && error.code === 'INVALID_OFFER'
    )
  );
  assert.equal(offerAccessorRead, false);
});

test('the finite session demonstration keeps its transport claim local', () => {
  const result = spawnSync(process.execPath, [
    'scripts/secure-session-demo.js'
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);

  const transcript = JSON.parse(result.stdout);
  assert.equal(transcript.protocol, 'secure-frame/v2');
  assert.match(transcript.transport, /in-process demonstration/);
  assert.equal(transcript.remainingHops, 1);
  assert.deepEqual(transcript.algorithms, [
    'Ed25519',
    'X25519',
    'HKDF-SHA-256',
    'AES-256-GCM'
  ]);
});
