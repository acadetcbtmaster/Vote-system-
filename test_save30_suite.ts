// ==============================================================================
// SAVE30 — COMPREHENSIVE AUTOMATED VERIFICATION TEST SUITE
// Tests all 18 mandatory scenarios specified in Section 51 of the requirement.
// ==============================================================================

const BASE_URL = 'http://localhost:3000';

async function req(endpoint: string, options: any = {}) {
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING SAVE30 MANDATORY TEST SUITE (18 TEST SCENARIOS)');
  console.log('================================================================\n');

  // Test 1: Register first user -> Expected: SAVE30-001 (or next valid seq)
  const timestamp = Date.now();
  console.log('--- Test 1: Register first user ---');
  const user1Email = `user1_${timestamp}@save30.ng`;
  const reg1 = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      first_name: 'Adewale',
      last_name: 'Johnson',
      email: user1Email,
      phone: '08011112222',
      password: 'Password123!',
      confirm_password: 'Password123!',
      accept_terms: true,
    }),
  });
  assert(reg1.ok && reg1.data.success, 'User 1 registered successfully');
  const user1 = reg1.data.user;
  const user1Token = reg1.data.token;
  console.log(`User 1 generated ID: ${user1.save30_id}`);
  assert(user1.save30_id.startsWith('SAVE30-'), 'User 1 ID starts with SAVE30-');

  // Test 2: Register second user -> Expected: Sequential User ID (e.g. SAVE30-002)
  console.log('\n--- Test 2: Register second user ---');
  const user2Email = `user2_${timestamp}@save30.ng`;
  const reg2 = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      first_name: 'Fatima',
      last_name: 'Bello',
      email: user2Email,
      phone: '08033334444',
      password: 'Password123!',
      confirm_password: 'Password123!',
      accept_terms: true,
    }),
  });
  assert(reg2.ok && reg2.data.success, 'User 2 registered successfully');
  const user2 = reg2.data.user;
  const user2Token = reg2.data.token;
  console.log(`User 2 generated ID: ${user2.save30_id}`);
  assert(user2.sequence_number === user1.sequence_number + 1, 'User 2 sequence number incremented sequentially');
  assert(user2.save30_id !== user1.save30_id, 'User 1 and User 2 have distinct, unique IDs');

  // Test 3: User pays Day 1 -> Expected: Day 1 = Successful, Day 2 unlocked
  console.log('\n--- Test 3: User pays Day 1 ---');
  const initDay1 = await req('/api/payments/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ day_number: 1 }),
  });
  assert(initDay1.ok && initDay1.data.success, 'Day 1 payment initialized');
  const verifyDay1 = await req('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ reference: initDay1.data.reference, simulate_success: true }),
  });
  assert(verifyDay1.ok && verifyDay1.data.success, 'Day 1 payment verified as successful');

  const dashAfterDay1 = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const day1Record = dashAfterDay1.data.contributionDays.find((d: any) => d.day_number === 1);
  const day2Record = dashAfterDay1.data.contributionDays.find((d: any) => d.day_number === 2);
  assert(day1Record.status === 'successful', 'Day 1 status is successful');
  assert(day2Record.status === 'unpaid', 'Day 2 is unlocked (status: unpaid)');
  assert(dashAfterDay1.data.currentRequiredDay === 2, 'Current required day is now Day 2');

  // Test 4: User attempts Day 3 before Day 2 -> Expected: Payment rejected
  console.log('\n--- Test 4: User attempts Day 3 before Day 2 ---');
  const skipAttempt = await req('/api/payments/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ day_number: 3 }),
  });
  assert(!skipAttempt.ok && skipAttempt.status === 400, 'Payment for Day 3 rejected before Day 2 is completed');
  assert(skipAttempt.data.error.includes('Sequential rule'), 'Error explains sequential rule');

  // Test 5: Payment fails -> Expected: Day remains incomplete
  console.log('\n--- Test 5: Payment fails ---');
  const initFail = await req('/api/payments/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ day_number: 2 }),
  });
  const failVerify = await req('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ reference: initFail.data.reference, simulate_success: false }),
  });
  assert(!failVerify.ok, 'Failed verification correctly reported');
  const dashAfterFail = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const day2AfterFail = dashAfterFail.data.contributionDays.find((d: any) => d.day_number === 2);
  assert(day2AfterFail.status !== 'successful', 'Day 2 remains incomplete after failed attempt');

  // Test 6: Payment is pending -> Expected: Day remains pending and does not advance
  console.log('\n--- Test 6: Payment is pending ---');
  const initPending = await req('/api/payments/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ day_number: 2 }),
  });
  assert(initPending.ok, 'Payment initialized to pending');
  const dashPending = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const day2Pending = dashPending.data.contributionDays.find((d: any) => d.day_number === 2);
  assert(day2Pending.status === 'pending', 'Day 2 status is pending');
  assert(dashPending.data.stats.totalSuccessfulDays === 1, 'Completed days does not advance while pending');

  // Verify Day 2 properly
  await req('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ reference: initPending.data.reference, simulate_success: true }),
  });

  // Pay Days 3 through 30 sequentially
  console.log('\n--- Completing Days 3 through 30 sequentially ---');
  for (let d = 3; d <= 30; d++) {
    const init = await req('/api/payments/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ day_number: d }),
    });
    await req('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ reference: init.data.reference, simulate_success: true }),
    });
  }

  // Test 7: Day 30 completed -> Expected: Withdrawal remains locked
  console.log('\n--- Test 7: Day 30 completed ---');
  const dashDay30 = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(dashDay30.data.stats.totalSuccessfulDays === 30, 'All 30 core days completed');
  assert(!dashDay30.data.isWithdrawalAvailable, 'Withdrawal remains locked after Day 30');
  assert(dashDay30.data.withdrawalReason.includes('Core contribution completed'), 'Shows core completed message');

  // Test 8: Day 31 completed -> Expected: Withdrawal remains locked
  console.log('\n--- Test 8: Day 31 completed ---');
  const init31 = await req('/api/payments/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ day_number: 31 }),
  });
  await req('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ reference: init31.data.reference, simulate_success: true }),
  });
  const dashDay31 = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(dashDay31.data.stats.totalSuccessfulDays === 31, 'Day 31 completed');
  assert(!dashDay31.data.isWithdrawalAvailable, 'Withdrawal remains locked after Day 31');

  // Test 9: Day 32 completed -> Expected: Withdrawal remains locked
  console.log('\n--- Test 9: Day 32 completed ---');
  const init32 = await req('/api/payments/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ day_number: 32 }),
  });
  await req('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ reference: init32.data.reference, simulate_success: true }),
  });
  const dashDay32 = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(dashDay32.data.stats.totalSuccessfulDays === 32, 'Day 32 completed');
  assert(!dashDay32.data.isWithdrawalAvailable, 'Withdrawal remains locked after Day 32');

  // Test 10: Day 33 completed -> Expected: Withdrawal becomes available
  console.log('\n--- Test 10: Day 33 completed ---');
  const init33 = await req('/api/payments/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ day_number: 33 }),
  });
  await req('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ reference: init33.data.reference, simulate_success: true }),
  });
  const dashDay33 = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(dashDay33.data.stats.totalSuccessfulDays === 33, 'Day 33 completed (33/33 total)');
  assert(dashDay33.data.isWithdrawalAvailable === true, 'Withdrawal is now unlocked and AVAILABLE (🟢)');
  assert(dashDay33.data.stats.eligibleWithdrawalAmount === 6000, 'Eligible withdrawal amount is ₦6,000');

  // Test 11: User submits withdrawal -> Expected: Admin receives PENDING request
  console.log('\n--- Test 11: User submits withdrawal ---');
  const wthSubmit = await req('/api/withdrawals/request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({
      full_name: 'Adewale Johnson',
      bank_name: 'GTBank',
      account_number: '0123456789',
      account_name: 'Adewale Johnson',
    }),
  });
  assert(wthSubmit.ok && wthSubmit.data.success, 'Withdrawal request submitted successfully');
  const wthId = wthSubmit.data.withdrawal.id;
  assert(wthSubmit.data.withdrawal.status === 'pending', 'Withdrawal status is PENDING');

  // Verify Admin sees the pending request
  const adminLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@save30.ng', password: 'Save30Admin2026!' }),
  });
  assert(adminLogin.ok, 'Super Admin logged in');
  const adminToken = adminLogin.data.token;

  const adminWths = await req('/api/admin/withdrawals', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const foundWth = adminWths.data.withdrawals.find((w: any) => w.id === wthId);
  assert(foundWth && foundWth.status === 'pending', 'Admin received PENDING request');

  // Test 12: Admin changes withdrawal to PROCESSING -> Expected: User sees PROCESSING
  console.log('\n--- Test 12: Admin changes withdrawal to PROCESSING ---');
  const updateToProc = await req(`/api/admin/withdrawals/${wthId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'processing', admin_notes: 'Under review by treasury' }),
  });
  assert(updateToProc.ok, 'Admin updated status to processing');

  const dashUnderProc = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(dashUnderProc.data.activeWithdrawal.status === 'processing', 'User sees withdrawal status is PROCESSING');

  // Test 13: Admin changes withdrawal to SUCCESSFUL -> Expected: User sees SUCCESSFUL, Plan becomes COMPLETED
  console.log('\n--- Test 13: Admin changes withdrawal to SUCCESSFUL ---');
  const updateToSuccess = await req(`/api/admin/withdrawals/${wthId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: 'successful',
      payment_reference: 'NUBAN-TRF-GTB-894723984',
      admin_notes: 'Transfer dispatched successfully',
    }),
  });
  assert(updateToSuccess.ok, 'Admin marked withdrawal successful');

  const userPlans = await req('/api/user/plans', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const completedPlan = userPlans.data.plans.find((p: any) => p.cycle_number === 1);
  assert(completedPlan.status === 'completed', 'User active plan has automatically become COMPLETED');

  // Test 14: User attempts another withdrawal from completed plan -> Expected: Rejected
  console.log('\n--- Test 14: User attempts another withdrawal from completed plan ---');
  const doubleWth = await req('/api/withdrawals/request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({
      full_name: 'Adewale Johnson',
      bank_name: 'GTBank',
      account_number: '0123456789',
      account_name: 'Adewale Johnson',
    }),
  });
  assert(!doubleWth.ok, 'Duplicate withdrawal request rejected');

  // Test 15: Duplicate payment webhook -> Expected: No duplicate contribution
  console.log('\n--- Test 15: Duplicate payment webhook / idempotency check ---');
  const doubleVerify = await req('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: JSON.stringify({ reference: initDay1.data.reference, simulate_success: true }),
  });
  assert(doubleVerify.ok && doubleVerify.data.already_processed === true, 'Duplicate verification handled idempotently without double credit');

  // Test 16: Unauthorized user attempts to access another user data -> Expected: Access denied
  console.log('\n--- Test 16: Unauthorized user access test ---');
  const unauthorizedVerify = await req('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user2Token}` }, // User 2 trying to verify User 1's payment
    body: JSON.stringify({ reference: initDay1.data.reference }),
  });
  assert(!unauthorizedVerify.ok && unauthorizedVerify.status === 403, 'Unauthorized access to another user payment denied with 403');

  // Test 17: Normal admin / unauthorized role attempts super-admin action -> Expected: Access denied
  console.log('\n--- Test 17: Role permission boundary check ---');
  const supportLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'support@save30.ng', password: 'Save30Support2026!' }),
  });
  assert(supportLogin.ok, 'Support Admin logged in');
  const supportToken = supportLogin.data.token;

  // Support Admin cannot create or edit plans (Super Admin only)
  const illegalPlanCreate = await req('/api/admin/plans', {
    method: 'POST',
    headers: { Authorization: `Bearer ${supportToken}` },
    body: JSON.stringify({ name: 'Illegal Plan', daily_amount: 500, core_days: 30, additional_days: 3 }),
  });
  assert(!illegalPlanCreate.ok && illegalPlanCreate.status === 403, 'Support admin prohibited from Super Admin action (403)');

  // Test 18: Two users register simultaneously -> Expected: Unique User IDs with no duplicate sequence
  console.log('\n--- Test 18: Simultaneous registration race-condition test ---');
  const regA = req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      first_name: 'SimultaneousA',
      last_name: 'Tester',
      email: `sim_a_${timestamp}@save30.ng`,
      phone: '08099990001',
      password: 'Password123!',
      confirm_password: 'Password123!',
      accept_terms: true,
    }),
  });
  const regB = req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      first_name: 'SimultaneousB',
      last_name: 'Tester',
      email: `sim_b_${timestamp}@save30.ng`,
      phone: '08099990002',
      password: 'Password123!',
      confirm_password: 'Password123!',
      accept_terms: true,
    }),
  });

  const [resA, resB] = await Promise.all([regA, regB]);
  assert(resA.ok && resB.ok, 'Both simultaneous registrations succeeded');
  const idA = resA.data.user.save30_id;
  const idB = resB.data.user.save30_id;
  console.log(`Concurrent registration IDs: ${idA} and ${idB}`);
  assert(idA !== idB, 'Simultaneous registrations generated distinct unique User IDs');
  assert(Math.abs(resA.data.user.sequence_number - resB.data.user.sequence_number) === 1, 'Sequential order preserved exactly without collisions');

  console.log('\n================================================================');
  console.log('🎉 ALL 18 MANDATORY TEST CASES PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
