import { SecureIdentity } from '../secure-session.js';

const alice = new SecureIdentity('dawn');
const bob = new SecureIdentity('dusk');
const offer = alice.createSessionOffer(bob.exportPublicIdentity(), {
  maxTtl: 3
});
const accepted = bob.acceptSession(alice.exportPublicIdentity(), offer);
const dawnSession = alice.completeSession(
  bob.exportPublicIdentity(),
  offer,
  accepted.acceptance
);
const duskSession = accepted.session;

const frame = dawnSession.seal({
  type: 'partial-view/demo-v1',
  truthLabel: 'encrypted local protocol demonstration',
  observation: 'Connection follows explicit session acceptance.'
}, {
  ttl: 2
});
const opened = duskSession.open(frame);

console.log(JSON.stringify({
  protocol: 'secure-frame/v2',
  handshake: 'offer → acceptance → completion',
  algorithms: [
    'Ed25519',
    'X25519',
    'HKDF-SHA-256',
    'AES-256-GCM'
  ],
  transport: 'in-process demonstration; no socket opened',
  from: opened.provenance.from,
  to: opened.provenance.to,
  frameBytes: Buffer.byteLength(frame),
  messageId: opened.messageId,
  remainingHops: opened.remainingHops,
  payload: opened.payload
}, null, 2));

dawnSession.dispose();
duskSession.dispose();
