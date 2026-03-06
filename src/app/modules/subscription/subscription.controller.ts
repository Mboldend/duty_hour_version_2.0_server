import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SubscriptionServices } from './subscription.service';

const createStripeCustomerAccount = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await SubscriptionServices.createStripeCustomerAccountToDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Stripe customer account is created successfully',
    data: result,
  });
});

const createSubscriptionCheckoutSession = catchAsync(async (req, res) => {
  const { id } = req.user;
  const packageData = req.body;
  const result = await SubscriptionServices.createSubscriptionCheckoutSession(
    id,
    packageData,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Create checkout session successfully',
    data: result,
  });
});

// const updateSubscription = catchAsync(async (req, res) => {
//     const { id } = req.user;
//     const updatedPayload = req.body;
//     const result = await SubscriptionServices.updateSubscriptionToDB(id, updatedPayload);
//     sendResponse(res, {
//         success: true,
//         statusCode: 200,
//         message: "Subscription updated successfully",
//         data: result,
//     })
// })

const getBillingPortalSession = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await SubscriptionServices.handleGetBillingPortalSession(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Billing portal get successfully',
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await SubscriptionServices.cancelSubscriptionToDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Subscription cancelled successfully',
    data: result,
  });
});

const getRemainingSubscription = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await SubscriptionServices.getRemainingSubscriptionFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Get remaining subscription is retrieved successfully',
    data: result,
  });
});


const getMySubscriptionDetails = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await SubscriptionServices.subscriptionDetailsFromDB(user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Subscription details are retrieved successfully',
    data: result,
  });
});

export const SubscriptionControllers = {
  createStripeCustomerAccount,
  createSubscriptionCheckoutSession,
  getMySubscriptionDetails,
  // updateSubscription,
  getBillingPortalSession,
  cancelSubscription,
  getRemainingSubscription,
};
