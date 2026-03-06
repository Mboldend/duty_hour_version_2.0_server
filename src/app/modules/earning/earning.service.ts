import QueryBuilder from '../../builder/QueryBuilder';
import { Subscription } from '../subscription/subscription.model';

const getTotalEarningsFromDB = async (query: Record<string, any>) => {
  const searchableFields = ['userId.email', 'trxId'];

  // setup QueryBuilder with base query
  const queryBuilder = new QueryBuilder(
    Subscription.find().populate([
      {
        path: 'userId',
        select: 'name email phone role profileImage status',
      },
      {
        path: 'packageId',
        select:
          'planName isUnionized billingCycle currency discount discountValue pricePerEmployee',
      },
    ]),
    query,
  );

  const finalQuery = queryBuilder
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const subscriptions = await finalQuery.modelQuery;
  const meta = await queryBuilder.getPaginationInfo();

  return {
    meta,
    data: subscriptions,
  };
};

export const EarningServices = {
  getTotalEarningsFromDB,
};
