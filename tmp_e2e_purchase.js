(async () => {
  try {
    const base = 'http://localhost:4000';
    const regResp = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'e2e.script.' + Date.now() + '@example.com', password: 'Test1234!', firstName: 'E2E', lastName: 'Script' })
    });
    const reg = await regResp.json();
    console.log('REGISTER_STATUS', regResp.status);
    console.log(JSON.stringify(reg, null, 2));

    if (regResp.status !== 201 && !reg.token && !reg.accessToken) {
      console.error('Registration failed or returned no token; aborting');
      process.exit(1);
    }

    const token = reg.token || reg.accessToken;

    const purchaseResp = await fetch(base + '/api/plans/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ planName: 'ScriptPlan', price: 99 })
    });

    const purchase = await purchaseResp.json();
    console.log('PURCHASE_STATUS', purchaseResp.status);
    console.log(JSON.stringify(purchase, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('E2E ERROR', err);
    process.exit(1);
  }
})();
