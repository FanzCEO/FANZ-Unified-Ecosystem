import { router } from '../trpc';
import { authRouter } from './auth';
import { userRouter } from './user';
import { creatorRouter } from './creator';
import { contentRouter } from './content';
import { tagRouter } from './tag';
import { subscriptionRouter } from './subscription';
import { walletRouter } from './wallet';
import { messageRouter } from './message';
import { liveRouter } from './live';
import { adminRouter } from './admin';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  creator: creatorRouter,
  content: contentRouter,
  tag: tagRouter,
  subscription: subscriptionRouter,
  wallet: walletRouter,
  message: messageRouter,
  live: liveRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
