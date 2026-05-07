export interface SaleRecord {
  id: string;
  companyName?: string;
  packageName?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  status?: string;
  totalAmount?: number;
  applicant?: {
    names?: string;
    surnames?: string;
    email?: string;
  };
  userEmail?: string | null;
  userId?: string | null;
  fecha?: unknown;
  createdAt?: unknown;
  requestDate?: unknown;
  onapiCertificate?: string | null;
  paymentReceipt?: string | null;
  estatutosUrl?: string | null;
  registroMercantilUrl?: string | null;
  rncUrl?: string | null;
}

export interface CommentRecord {
  id: string;
  message: string;
  createdAt?: unknown;
  author?: string | null;
  authorUid?: string | null;
}