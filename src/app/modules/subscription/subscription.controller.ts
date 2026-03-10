import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SubscriptionServices } from './subscription.service';
import { Request, Response } from 'express';

const createStripeCustomerAccount = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.user;
    const result =
      await SubscriptionServices.createStripeCustomerAccountToDB(id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Stripe customer account is created successfully',
      data: result,
    });
  },
);

const createSubscriptionCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubscriptionServices.createSubscriptionCheckoutSession(
      req.user.id!,
      req.body,
    );
    if (result?.status === 'USER_NOT_FOUND') {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'User not found',
        data: result,
      });
      return;
    }
    if (result?.status === 'ONLY_BUSINESS_OWNERS_CAN_PURCHASE_SUBSCRIPTION') {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Only business owners can purchase subscription',
        data: result,
      });
      return;
    }
    if (result?.status === 'YOU_ALREADY_HAVE_AN_ACTIVE_SUBSCRIPTION') {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.CONFLICT,
        message: 'You already have an active subscription',
        data: result,
      });
      return;
    }
    if (result?.status === 'PACKAGE_NOT_FOUND') {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Package not found',
        data: result,
      });
      return;
    }
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Create checkout session successfully',
      data: result,
    });
  },
);

const getBillingPortalSession = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.user;
    const result = await SubscriptionServices.handleGetBillingPortalSession(id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Billing portal get successfully',
      data: result,
    });
  },
);

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const result = await SubscriptionServices.cancelSubscriptionToDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Subscription cancelled successfully',
    data: result,
  });
});

const getRemainingSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.user;
    const result =
      await SubscriptionServices.getRemainingSubscriptionFromDB(id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Get remaining subscription is retrieved successfully',
      data: result,
    });
  },
);

const getMySubscriptionDetails = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubscriptionServices.subscriptionDetailsFromDB(
      req.user,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Subscription details are retrieved successfully',
      data: result,
    });
  },
);

export const SubscriptionControllers = {
  createStripeCustomerAccount,
  createSubscriptionCheckoutSession,
  getMySubscriptionDetails,
  // updateSubscription,
  getBillingPortalSession,
  cancelSubscription,
  getRemainingSubscription,
};
