const mongoose = require('mongoose');

// Use the real MONGODB_URI from .env.test (loaded by jest.setup.js).
// Connect before tests and ensure DB is clean between tests.
beforeAll(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not set in environment; ensure .env.test is present');
  }
  // Use a short timeout for CI responsiveness
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
});

// Clear all collections between tests to keep isolation
beforeEach(async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const name of collections) {
    const coll = mongoose.connection.collections[name];
    try {
      await coll.deleteMany({});
    } catch (e) {
      // ignore errors for system collections
    }
  }
});

afterAll(async () => {
  try {
    // Optionally drop the test database to leave a clean state
    if (mongoose.connection.db) {
      try { await mongoose.connection.db.dropDatabase(); } catch (e) { /* ignore */ }
    }
  } finally {
    await mongoose.connection.close();
  }
});
