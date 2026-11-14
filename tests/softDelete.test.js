/**
 * Soft Delete & Restore Verification Test Suite
 *
 * Verifies the 4 exact required demonstration tests:
 * TEST 1: DELETE /rooms/3 -> Expected: 200 OK
 * TEST 2: GET /rooms/3 -> Expected: 404 Not Found
 * TEST 3: POST /rooms/3/restore -> Expected: 200 OK
 * TEST 4: GET /rooms/3 -> Expected: 200 OK
 */

const assert = require('node:assert');
const test = require('node:test');
const http = require('node:http');
const app = require('../server');

test('Special Requirement: Soft Delete and Restore Workflow', async (t) => {
  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // PRE-CHECK: Ensure room 3 exists and is initially active
    const preCheckRes = await fetch(`${baseUrl}/rooms/3`);
    assert.strictEqual(
      preCheckRes.status,
      200,
      'Pre-condition: Room 3 should exist and be active before soft delete'
    );
    const preCheckData = await preCheckRes.json();
    assert.strictEqual(preCheckData.data.is_deleted, 0);

    // ==========================================
    // TEST 1: DELETE /rooms/3 -> Expected: 200 OK
    // ==========================================
    await t.test('TEST 1: DELETE /rooms/3 returns 200 OK', async () => {
      const res = await fetch(`${baseUrl}/rooms/3`, {
        method: 'DELETE'
      });
      const data = await res.json();

      console.log(`[TEST 1] DELETE /rooms/3 -> Status: ${res.status}, Response:`, data);
      assert.strictEqual(res.status, 200, 'TEST 1 failed: Expected status 200 OK');
      assert.strictEqual(data.success, true);
      assert.ok(
        data.message && data.message.includes('soft deleted'),
        'TEST 1 failed: Expected soft delete confirmation message'
      );
    });

    // ==============================================
    // TEST 2: GET /rooms/3 -> Expected: 404 Not Found
    // ==============================================
    await t.test('TEST 2: GET /rooms/3 returns 404 Not Found after soft delete', async () => {
      const res = await fetch(`${baseUrl}/rooms/3`);
      const data = await res.json();

      console.log(`[TEST 2] GET /rooms/3 -> Status: ${res.status}, Response:`, data);
      assert.strictEqual(res.status, 404, 'TEST 2 failed: Expected status 404 Not Found');
      assert.strictEqual(data.success, false);
      assert.ok(
        data.message && data.message.includes('not found or has been deactivated'),
        'TEST 2 failed: Expected deactivated/not found message'
      );

      // Verify GET /rooms list does NOT include room 3
      const listRes = await fetch(`${baseUrl}/rooms`);
      const listData = await listRes.json();
      const room3InList = listData.data.find((r) => r.id === 3);
      assert.strictEqual(
        room3InList,
        undefined,
        'GET /rooms should never display soft-deleted rooms'
      );
    });

    // ==================================================
    // TEST 3: POST /rooms/3/restore -> Expected: 200 OK
    // ==================================================
    await t.test('TEST 3: POST /rooms/3/restore returns 200 OK', async () => {
      const res = await fetch(`${baseUrl}/rooms/3/restore`, {
        method: 'POST'
      });
      const data = await res.json();

      console.log(`[TEST 3] POST /rooms/3/restore -> Status: ${res.status}, Response:`, data);
      assert.strictEqual(res.status, 200, 'TEST 3 failed: Expected status 200 OK');
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.is_deleted, 0);
      assert.ok(
        data.message && data.message.includes('restored'),
        'TEST 3 failed: Expected restore confirmation message'
      );
    });

    // ==========================================
    // TEST 4: GET /rooms/3 -> Expected: 200 OK
    // ==========================================
    await t.test('TEST 4: GET /rooms/3 returns 200 OK after restore', async () => {
      const res = await fetch(`${baseUrl}/rooms/3`);
      const data = await res.json();

      console.log(`[TEST 4] GET /rooms/3 -> Status: ${res.status}, Response:`, data);
      assert.strictEqual(res.status, 200, 'TEST 4 failed: Expected status 200 OK');
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.id, 3);
      assert.strictEqual(data.data.is_deleted, 0);

      // Verify GET /rooms list now includes room 3 again
      const listRes = await fetch(`${baseUrl}/rooms`);
      const listData = await listRes.json();
      const room3InList = listData.data.find((r) => r.id === 3);
      assert.ok(room3InList, 'GET /rooms should now display restored room 3');
      assert.strictEqual(room3InList.is_deleted, 0);
    });
  } finally {
    server.close();
  }
});
