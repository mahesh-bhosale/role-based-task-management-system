import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startDeadlineChecker } from './jobs/deadlineChecker';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  // Start background scheduler only when explicitly enabled
  if (env.ENABLE_SCHEDULER) {
    startDeadlineChecker();
  } else {
    console.log('[DeadlineChecker] Scheduler disabled (ENABLE_SCHEDULER != true)');
  }

  const server = app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
