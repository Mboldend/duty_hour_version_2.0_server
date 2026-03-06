import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { SUBSCRIPTION_STATUS } from './subscription.constant';
import { Subscription } from './subscription.model';
import { User } from '../user/user.model';
import { sendNotifications } from '../../../helpers/notificationHelper';
import { USER_ROLES } from '../../../enums/user';

export const deactivateSubscriptionByStripeId = async (
  stripeSubscriptionId: string,
) => {
  const userSubscription = await Subscription.findOne({
    subscriptionId: stripeSubscriptionId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });

  if (!userSubscription) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Active subscription not found for ID: ${stripeSubscriptionId}`,
    );
  }

  await Subscription.findByIdAndUpdate(
    userSubscription._id,
    {
      status: SUBSCRIPTION_STATUS.CANCELLED,
    },
    { new: true },
  );

  const existingUser = await User.findById(userSubscription.userId);
  if (existingUser) {
    await User.findByIdAndUpdate(
      existingUser._id,
      {
        hasAccess: false,
        isSubscribed: false,
        packageName: '',
      },
      { new: true },
    );

    // send notification to Business Owner
    await sendNotifications({
      title: `${existingUser.name}`,
      receiver: existingUser._id,
      message: `Your subscription has been cancelled.`,
      type: 'BUSINESS_OWNER',
    });

    // send notification to super admin
    const superAdmins = await User.find({ role: USER_ROLES.SUPER_ADMIN });
    for (const admin of superAdmins) {
      await sendNotifications({
        title: `Subscription Cancelled`,
        receiver: admin._id,
        message: `${existingUser.name} (${existingUser.email}) has cancelled their subscription.`,
        type: 'SUPER_ADMIN',
      });
    }
  }
};
