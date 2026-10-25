/**
 * SecretPixel Storage & Privacy Verification Test Suite
 * 
 * Verifies local enclave storage, zero-database architecture,
 * privacy invariants (zero-plaintext persistence), and offline resilience.
 */

import {
  getUserPreferences,
  saveUserPreferences,
  recordOperationHistory,
  getOperationHistory,
  clearOperationHistory,
  getDatabaseStatus
} from '../services/databaseService';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

export async function runDatabaseTests() {
  console.log('\n========================================');
  console.log(' SecretPixel Enclave Storage & Privacy Verification');
  console.log('========================================\n');

  // --- GROUP 1: Zero-Database Architecture ---
  console.log('--- 1. Zero-Database Architecture & Enclave Storage ---');

  const status = await getDatabaseStatus();
  assert(status.isConfigured === true, 'Enclave storage is configured');
  assert(status.provider === 'local-offline-storage', `Provider is local-offline-storage (${status.provider})`);

  // Verify that supabase is removed from package.json
  const pkgContent = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');
  assert(!pkgContent.includes('@supabase/supabase-js'), 'Package.json excludes @supabase/supabase-js');

  // Verify that Python backend exists
  assert(fs.existsSync(path.resolve(process.cwd(), 'python_backend/steganography.py')), 'Python steganography engine exists');
  assert(fs.existsSync(path.resolve(process.cwd(), 'python_backend/app.py')), 'Python Flask app exists');
  assert(fs.existsSync(path.resolve(process.cwd(), 'requirements.txt')), 'requirements.txt exists');

  // --- GROUP 2: Preferences Read/Write ---
  console.log('\n--- 2. Enclave Preferences Management ---');

  const prefs = await getUserPreferences();
  assert(prefs.default_output_format === 'PNG', 'Default output format is strictly lossless PNG');

  const updatedPrefs = await saveUserPreferences({ theme: 'dark', save_operation_history: true, engine_preference: 'python' });
  assert(updatedPrefs.theme === 'dark', 'Preferences update handles theme setting');
  assert(updatedPrefs.save_operation_history === true, 'Preferences update handles save_operation_history toggle');
  assert(updatedPrefs.engine_preference === 'python', 'Preferences remembers engine preference');

  // --- GROUP 3: Strict Data Privacy Safeguards ---
  console.log('\n--- 3. Strict Data Privacy Invariants (Zero-Plaintext) ---');

  const opRecord = await recordOperationHistory({
    operation_type: 'encode',
    status: 'success',
    image_width: 800,
    image_height: 600,
    image_format: 'PNG',
    payload_size_bytes: 256,
    processing_duration_ms: 18
  });

  assert(opRecord !== null, 'Operation history records non-sensitive summary');
  assert(opRecord?.operation_type === 'encode', 'Recorded operation type matches');
  assert(opRecord?.image_width === 800 && opRecord?.image_height === 600, 'Recorded dimensions match');
  assert(opRecord?.payload_size_bytes === 256, 'Recorded payload size matches byte count');

  // Ensure record has NO sensitive fields
  const recordKeys = Object.keys(opRecord || {});
  assert(!recordKeys.includes('message'), 'History record contains no "message" key');
  assert(!recordKeys.includes('password'), 'History record contains no "password" key');
  assert(!recordKeys.includes('key'), 'History record contains no "key" key');
  assert(!recordKeys.includes('ciphertext'), 'History record contains no "ciphertext" key');

  // Fetch history
  const historyList = await getOperationHistory(10);
  assert(Array.isArray(historyList), 'getOperationHistory returns array of records');

  // Clear history
  const cleared = await clearOperationHistory();
  assert(cleared === true, 'clearOperationHistory successfully purges saved history');

  // Verify .env.example
  const envExample = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf-8');
  assert(!envExample.includes('VITE_SUPABASE_URL='), '.env.example removes VITE_SUPABASE_URL');
  assert(envExample.includes('PYTHON_PORT='), '.env.example documents PYTHON_PORT');

  console.log('\n========================================');
  console.log(` Storage Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDatabaseTests().catch((err) => {
    console.error('Storage tests failed:', err);
    process.exit(1);
  });
}
