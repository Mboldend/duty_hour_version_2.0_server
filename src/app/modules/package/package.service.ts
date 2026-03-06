import { JwtPayload } from 'jsonwebtoken';
import stripe from '../../../config/stripe';
import ApiError from '../../../errors/ApiError';
import { SUBSCRIPTION_STATUS } from '../subscription/subscription.constant';
import { Subscription } from '../subscription/subscription.model';
import { IPackage } from './package.interface';
import { Package } from './package.model';
import { User } from '../user/user.model';
import { createSubscriptionProduct } from '../../../helpers/createSubscriptionProduct';
import QueryBuilder from '../../builder/QueryBuilder';

const CreatePackageToDB = async (user: JwtPayload, payload: IPackage) => {
  payload.isAdmin = user.id;

  const isAdmin = await User.findById(user.id).lean().exec()
  if (!isAdmin) {
    return { status: "FAILED" as const, message: "Unauthorized Access" }
  };
  const packageLinkCreate = await createSubscriptionProduct({
    planName: payload.planName,
    price: payload.price,
    billingCycle: payload.billingCycle,
  })
  if (packageLinkCreate) {
    payload.paymentLink = packageLinkCreate.paymentLink
    payload.stripeProductId = packageLinkCreate.productId
    payload.stripePriceId = packageLinkCreate.priceId
  }
  const result = await Package.create(payload);

  if (!result) {
    return { status: "FAILED" as const }
  }
  return result;
};

const getPackagesFromDB = async (query: Record<string, any>, user: JwtPayload) => {
  const qb = new QueryBuilder<IPackage>(Package.find(), query).sort().paginate().fields().search(['planName']).filter();
  const [data, meta, currentUser] = await Promise.all([
    qb.modelQuery.exec(),
    qb.getPaginationInfo(),
    User.findById(user.id).lean(),
  ]);
  const packagesWithEmail = data.map((pkg: any) => ({
    ...pkg.toObject(),
    paymentLink: `${pkg.paymentLink}?prefilled_email=${encodeURIComponent(currentUser?.email || '')}`,
  }));
  return { data: packagesWithEmail, meta };
};

const getActivePackageFromDB = async (userId: string) => {
  const subscription = await Subscription.findOne({
    userId: userId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });

  const packageId = subscription?.packageId;

  const result = await Package.findOne({ _id: packageId });

  if (!result) {
    return {};
  }

  return result;
};

const getPackageByIdFromDB = async (id: string) => {
  const result = await Package.findById(id);
  if (!result) {
    return {};
  }
  return result;
};



const deletePackageByIdFromDB = async (id: string) => {
  const existing = await Package.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Subscription plan not found');
  }

  try {
    // deactivate all active prices
    if (existing.stripeProductId) {
      const prices = await stripe.prices.list({
        product: existing.stripeProductId,
      });


      for (const price of prices.data) {
        if (price.active) {
          await stripe.prices.update(price.id, { active: false });
        }
      }

      // archive the product
      await stripe.products.update(existing.stripeProductId, {
        active: false,
        metadata: {
          deleted_at: new Date().toISOString(),
          deleted_by: 'system',
        },
      });
    }

    const result = await Package.findByIdAndDelete(id);
    return result;
  } catch (err: any) {
    throw new ApiError(
      400,
      `Failed to delete subscription plan: ${err.message}`,
    );
  }
};

export const PackageServices = {
  CreatePackageToDB,
  getPackagesFromDB,
  getPackageByIdFromDB,
  deletePackageByIdFromDB,
  getActivePackageFromDB,
};
