import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { SaleRecord, CommentRecord } from '../types';

const ventasCollection = collection(db, 'ventas');

export const fetchLatestSale = async (uid: string): Promise<SaleRecord | null> => {
  if (!uid) return null;

  const q = query(
    ventasCollection,
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(1),
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...(doc.data() as SaleRecord) };
};

export const subscribeComments = async (saleId: string): Promise<CommentRecord[]> => {
  const commentsRef = collection(db, 'ventas', saleId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(20));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as CommentRecord),
  }));
};

export const addComment = async (saleId: string, message: string, authorUid: string) => {
  const commentsRef = collection(db, 'ventas', saleId, 'comments');
  await addDoc(commentsRef, {
    message,
    authorUid,
    createdAt: serverTimestamp(),
  });
};