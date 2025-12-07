import app from './app';
import { connectDB } from './db';

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB();
    // eslint-disable-next-line no-console
    console.log('Connected to database');
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
