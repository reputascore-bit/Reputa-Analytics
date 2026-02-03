import assert from 'assert';
import protocol from './protocol';

function testCalculateLevel() {
  assert.strictEqual(protocol.calculateLevelFromPoints(0), 1);
  assert.strictEqual(protocol.calculateLevelFromPoints(5000), 2);
  assert.strictEqual(protocol.calculateLevelFromPoints(10000), 3);
  assert.strictEqual(protocol.calculateLevelFromPoints(95000), 20);
}

function testComputeWalletReputation() {
  const r = protocol.computeWalletReputation(30000, 5000);
  // 0.6*30000 + 0.2*5000 = 18000 + 1000 = 19000
  assert.strictEqual(r, 19000);
}

function testComputeTotalScore() {
  const total = protocol.computeTotalScore(30000, 5000, 200);
  // walletRaw = 35000 -> 0.8*35000 = 28000; +0.2*200 = 40 => 28040
  assert.strictEqual(total, 28040);
}

function testWalletScanDelta() {
  const prev = { transactionCount: 10, contactsCount: 2 };
  const snap = { transactionCount: 15, contactsCount: 4, walletAge: 400 };
  const { delta, details } = protocol.walletScanDelta(prev, snap);
  // txDiff=5 -> min(5*5,50)=25; contactsDiff=2 -> min(2*2,20)=4 => total 29
  assert.strictEqual(delta, 29);
  assert.ok(details.length >= 1);
}

function runAll() {
  testCalculateLevel();
  testComputeWalletReputation();
  testComputeTotalScore();
  testWalletScanDelta();
  console.log('All protocol tests passed');
}

try {
  runAll();
  process.exit(0);
} catch (err: any) {
  console.error('Tests failed', err);
  process.exit(1);
}
