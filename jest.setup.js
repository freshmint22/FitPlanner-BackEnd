require("dotenv").config({ path: ".env.test" });

// Ensure a JWT secret exists for tests so token generation is deterministic
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

