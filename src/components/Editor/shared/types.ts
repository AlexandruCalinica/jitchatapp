export type User = {
  id: string;
  username: string;
  color: string;
};

export const isSameUser = (nodeUser: User | undefined | null, currentUser: User | undefined | null): boolean => {
  if (!nodeUser || !currentUser) return false;
  if (nodeUser.id && currentUser.id) {
    return nodeUser.id === currentUser.id;
  }
  return nodeUser.username === currentUser.username;
};
