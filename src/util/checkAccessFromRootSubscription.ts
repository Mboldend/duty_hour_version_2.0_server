import { NextFunction, Request, Response } from 'express';
import { User } from '../app/modules/user/user.model';

const getRootOwner = async (userId: string) => {
  let currentUser = await User.findById(userId)
    .select('_id createdBy hasAccess')
    .lean();

  while (currentUser?.createdBy) {
    currentUser = await User.findById(currentUser.createdBy)
      .select('_id createdBy hasAccess')
      .lean();
  }

  return currentUser || null;
};

export const checkAccessFromRootSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user.id;

  const rootOwner = await getRootOwner(userId);
  // console.log(rootOwner,"Root Owner")

  if (!rootOwner || !rootOwner.hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  next();
};
