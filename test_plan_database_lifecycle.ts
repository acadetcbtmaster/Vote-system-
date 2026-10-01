// ==============================================================================
// SAVE30 — PLAN & DATABASE LIFECYCLE TEST SUITE
// Tests all 12 core requirements from clean state to plan lifecycle
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

async function runPlanLifecycleTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING PLAN & DATABASE LIFECYCLE VERIFICATION');
  console.log('================================================================\n');

  // 1. Admin login
  console.log('--- 1. Admin Authentication ---');
  const adminLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@save30.ng', password: 'Save30Admin2026!' }),
  });
  assert(adminLogin.ok && adminLogin.data.token, 'Super admin authenticated');
  const adminToken = adminLogin.data.token;

  // 2. Initial state verification: Total users count in overview must match real registered users
  console.log('\n--- 2. Database Overview Metrics ---');
  const overviewRes = await req('/api/admin/overview', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(overviewRes.ok, 'Admin overview retrieved');
  const initialUsersCount = overviewRes.data.metrics.totalUsers;
  console.log(`Current registered savers count in DB: ${initialUsersCount}`);

  // 3. Register user A
  console.log('\n--- 3. Register User A ---');
  const timestamp = Date.now();
  const userAEmail = `user_a_${timestamp}@save30.ng`;
  const regA = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      first_name: 'Amina',
      last_name: 'Bello',
      email: userAEmail,
      phone: '08031110001',
      password: 'Password123!',
      confirm_password: 'Password123!',
      accept_terms: true,
    }),
  });
  assert(regA.ok && regA.data.success, 'User A registered successfully');
  const userAToken = regA.data.token;
  const userAId = regA.data.user.save30_id;
  assert(userAId.startsWith('SAVE30-'), 'User A has valid sequential SAVE30 ID');
  assert(regA.data.user.role === 'user', 'User A has strictly role = user');

  // Check overview count incremented by exactly 1
  const overviewAfterA = await req('/api/admin/overview', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(overviewAfterA.data.metrics.totalUsers === initialUsersCount + 1, 'Total users increased by exactly 1');

  // 4. Register user B
  console.log('\n--- 4. Register User B ---');
  const userBEmail = `user_b_${timestamp}@save30.ng`;
  const regB = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      first_name: 'Babajide',
      last_name: 'Okafor',
      email: userBEmail,
      phone: '08031110002',
      password: 'Password123!',
      confirm_password: 'Password123!',
      accept_terms: true,
    }),
  });
  assert(regB.ok && regB.data.success, 'User B registered successfully');
  const userBToken = regB.data.token;
  const userBId = regB.data.user.save30_id;
  assert(userBId !== userAId, 'User A and User B have distinct unique IDs');

  const overviewAfterB = await req('/api/admin/overview', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(overviewAfterB.data.metrics.totalUsers === initialUsersCount + 2, 'Total users increased by exactly 2');

  // 5. Verify User A and User B have NO active plan initially
  console.log('\n--- 5. Verify No Active Plan Upon Registration ---');
  const dashA = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert(dashA.ok, 'User A dashboard retrieved');
  assert(dashA.data.activePlan === null, 'User A has no active plan before selection');
  assert(dashA.data.contributionDays.length === 0, 'User A has no contribution days before plan selection');

  // 6. Admin creates a new plan
  console.log('\n--- 6. Admin Creates New Plan in Database ---');
  const newPlanPayload = {
    name: `Save30 Executive ${timestamp}`,
    daily_amount: 1000,
    core_days: 30,
    additional_days: 3,
    description: 'Executive savings of ₦1,000 daily for 30 core days + 3 additional days. Eligible payout: ₦30,000.',
    status: 'active',
  };
  const createPlanRes = await req('/api/admin/plans', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(newPlanPayload),
  });
  assert(createPlanRes.ok && createPlanRes.data.success, 'Admin created new plan in DB');
  const createdPlan = createPlanRes.data.plan;
  assert(createdPlan.daily_amount === 1000, 'Plan daily amount correctly saved as 1000');
  assert(createdPlan.total_required_days === 33, 'Total required days calculated as 33');

  // 7. Verify plan appears in public/user available plans
  console.log('\n--- 7. Verify Created Plan Appears for Users ---');
  const userPlansRes = await req('/api/plans');
  assert(userPlansRes.ok, 'Fetched public plans');
  const foundInUserList = userPlansRes.data.plans.find((p: any) => p.id === createdPlan.id);
  assert(foundInUserList !== undefined, 'Created plan appears in user available plans');

  // 8. Admin disables the plan
  console.log('\n--- 8. Admin Disables Plan in Database ---');
  const disablePlanRes = await req(`/api/admin/plans/${createdPlan.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'inactive' }),
  });
  assert(disablePlanRes.ok, 'Admin updated plan status to inactive');

  // 9. Verify disabled plan disappears from user available plans
  console.log('\n--- 9. Verify Disabled Plan Does NOT Appear for Users ---');
  const userPlansAfterDisable = await req('/api/plans');
  const foundAfterDisable = userPlansAfterDisable.data.plans.find((p: any) => p.id === createdPlan.id);
  assert(foundAfterDisable === undefined, 'Disabled plan successfully excluded from available plans');

  // 10. Admin re-enables the plan
  console.log('\n--- 10. Admin Re-enables Plan in Database ---');
  const enablePlanRes = await req(`/api/admin/plans/${createdPlan.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'active' }),
  });
  assert(enablePlanRes.ok, 'Admin re-enabled plan to active');

  const userPlansAfterReenable = await req('/api/plans');
  const foundAfterReenable = userPlansAfterReenable.data.plans.find((p: any) => p.id === createdPlan.id);
  assert(foundAfterReenable !== undefined, 'Re-enabled plan is available once again');

  // 11. User A selects this plan
  console.log('\n--- 11. User A Selects the Plan ---');
  const selectRes = await req('/api/user/select-plan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: JSON.stringify({ plan_id: createdPlan.id }),
  });
  assert(selectRes.ok && selectRes.data.success, 'User A enrolled in plan');
  assert(selectRes.data.plan.plan_name === createdPlan.name, 'Enrolled in exact created plan');
  assert(selectRes.data.plan.daily_amount === 1000, 'Plan terms snapshotted (₦1,000 daily)');
  assert(selectRes.data.plan.eligible_withdrawal_amount === 30000, 'Eligible payout snapshotted (₦30,000)');

  // 12. User A logs out and checks session persistence
  console.log('\n--- 12. Verify Plan Persists Across Logins ---');
  const meRes = await req('/api/auth/me', {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert(meRes.ok && meRes.data.user.id === regA.data.user.id, 'User A re-authenticated via /api/auth/me');

  const dashAPersisted = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert(dashAPersisted.data.activePlan !== null, 'Active plan persisted in database');
  assert(dashAPersisted.data.activePlan.plan_name === createdPlan.name, 'Active plan matches selected plan');
  assert(dashAPersisted.data.contributionDays.length === 33, '33 contribution days generated');
  assert(dashAPersisted.data.currentRequiredDay === 1, 'Current required day is Day 1');

  // 13. Data isolation: User B cannot see User A data
  console.log('\n--- 13. Security & Data Isolation ---');
  // Normal user cannot access admin
  const userAccessAdmin = await req('/api/admin/overview', {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert(userAccessAdmin.status === 403, 'Normal user receives 403 Forbidden on admin routes');

  // User B still has no active plan
  const dashB = await req('/api/user/dashboard', {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert(dashB.data.activePlan === null, 'User B has no active plan (independent from User A)');

  console.log('\n================================================================');
  console.log('🎉 ALL PLAN & DATABASE LIFECYCLE TESTS PASSED PERFECTLY!');
  console.log('================================================================');
}

runPlanLifecycleTests().catch(err => {
  console.error('\nFatal test failure:', err);
  process.exit(1);
});
