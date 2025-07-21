export interface PostApproval {
  id: number;
  postId: number;
  approvedBy: number;
  status: 'approved' | 'rejected';
  decisionAt: string;
  reason?: string;
}
