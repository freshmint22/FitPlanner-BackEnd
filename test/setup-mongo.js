const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// Start an in-memory MongoDB before the test suite and set the env var
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
});

// Stop the in-memory server after all tests in the file complete.
// Do NOT disconnect mongoose here — test files manage their own connections.
afterAll(async () => {
  if (mongod) {
    try {
      await mongod.stop();
    } catch (e) {
      // ignore stop errors
    }
  }
});
