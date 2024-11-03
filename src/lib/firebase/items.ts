import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Item } from '@/types/warehouse';

const COLLECTION = 'items';

export async function addItem(item: Omit<Item, 'id' | 'lastUpdated'>) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...item,
    lastUpdated: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateItem(id: string, data: Partial<Item>) {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    lastUpdated: serverTimestamp(),
  });
}

export async function deleteItem(id: string) {
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getItems() {
  const querySnapshot = await getDocs(collection(db, COLLECTION));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Item[];
}

export async function getItemsByLocation(location: string) {
  const q = query(
    collection(db, COLLECTION),
    where('location', '==', location)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Item[];
}

export async function getItemsByStatus(status: string) {
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', status)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Item[];
}