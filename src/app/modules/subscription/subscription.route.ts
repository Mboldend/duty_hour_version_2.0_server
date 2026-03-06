import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { SubscriptionControllers } from './subscription.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';

const router = express.Router();

router.post(
  '/create-customer-account',
  auth(USER_ROLES.BUSINESS_OWNER),
  SubscriptionControllers.createStripeCustomerAccount,
);

router
  .route('/')
  .post(
    auth(USER_ROLES.BUSINESS_OWNER),
    SubscriptionControllers.createSubscriptionCheckoutSession,
  );
// .patch(auth(USER_ROLES.BUSINESS_OWNER), SubscriptionControllers.updateSubscription)
router.get(
  '/remaining',
  auth(USER_ROLES.BUSINESS_OWNER),
  SubscriptionControllers.getRemainingSubscription,
);

router.route("/my-subscription").get(
  auth(USER_ROLES.BUSINESS_OWNER),
  SubscriptionControllers.getMySubscriptionDetails,
);

router.post(
  '/billing-portal',
  auth(USER_ROLES.BUSINESS_OWNER),
  SubscriptionControllers.getBillingPortalSession,
);
router.patch(
  '/cancel',
  auth(USER_ROLES.BUSINESS_OWNER),
  checkAccessFromRootSubscription,
  SubscriptionControllers.cancelSubscription,
);


export const SubscriptionRoutes = router;
