import QueryBuilder from '../../builder/QueryBuilder';
import { Subscription } from '../subscription/subscription.model';

const getTotalEarningsFromDB = async (query: Record<string, any>) => {
  const searchableFields = ['userId.email', 'trxId'];
  const qb = new QueryBuilder(Subscription.find(), query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .fields()
    .populate(['userId', 'packageId'], {
      userId: 'name email phone role profileImage status',
      packageId:
        'planName isUnionized billingCycle currency discount discountValue pricePerEmployee',
    });

  const [data, meta] = await Promise.all([
    qb.modelQuery.exec(),
    qb.getPaginationInfo(),
  ]);

  return { data: data ?? [], meta };
};

export const EarningServices = {
  getTotalEarningsFromDB,
};
