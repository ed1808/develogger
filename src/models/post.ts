export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  communityId?: number;
  status: 'approved' | 'pending' | 'rejected' | null;
  createdAt: string;
  approvedAt?: string;
}
