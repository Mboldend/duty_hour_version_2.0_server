import { User } from '../app/modules/user/user.model';


export const getAllUserIdsUnderRootOwner = async (rootOwnerId: string) => {
  // Step 1: Get all users who have a createdBy field (i.e., not root users)
  const allUsers = await User.find({}).select('_id createdBy');

  // Step 2: Build a map: createdBy => [users]
  const graph = new Map<string, string[]>();
  for (const user of allUsers) {
    const parentId = user.createdBy?.toString();
    const userId = user._id.toString();
    if (parentId) {
      if (!graph.has(parentId)) graph.set(parentId, []);
      graph.get(parentId)!.push(userId);
    }
  }

  // Step 3: BFS traversal
  const allUserIds = new Set<string>();
  const queue = [rootOwnerId];

  while (queue.length) {
    const current = queue.shift();
    if (!current) continue;

    allUserIds.add(current);
    const children = graph.get(current) || [];

    for (const childId of children) {
      if (!allUserIds.has(childId)) {
        queue.push(childId);
      }
    }
  }

  return Array.from(allUserIds);
};
