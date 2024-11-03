import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  LEVEL_MAX_WEIGHTS, 
  BAY_MAX_WEIGHT, 
  getLocationStatus, 
  LOCATION_STATUS,
  getBayWeight,
  canAcceptWeight
} from '../warehouse-logic';
import type { Location } from '@/types/warehouse';

const COLLECTION = 'locations';

export async function getAvailableLocations(requiredWeight: number) {
  try {
    // Get all empty locations
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', LOCATION_STATUS.EMPTY)
    );
    
    const querySnapshot = await getDocs(q);
    const locations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Location[];

    // Group locations by bay
    const bayLocations = locations.reduce((acc, location) => {
      const bayKey = `${location.row}${location.bay}`;
      if (!acc[bayKey]) acc[bayKey] = [];
      acc[bayKey].push(location);
      return acc;
    }, {} as Record<string, Location[]>);

    // Filter locations that can accept the weight
    const availableLocations = locations.filter(location => {
      const bayKey = `${location.row}${location.bay}`;
      return canAcceptWeight(location, requiredWeight, bayLocations[bayKey]);
    });

    return availableLocations;
  } catch (error) {
    console.error('Error getting available locations:', error);
    throw error;
  }
}

export async function addLocation(location: Omit<Location, 'id'>) {
  const maxWeight = LEVEL_MAX_WEIGHTS[location.level];
  
  const locationWithDefaults = {
    ...location,
    maxWeight,
    currentWeight: 0,
    status: LOCATION_STATUS.EMPTY,
  };

  const docRef = await addDoc(collection(db, COLLECTION), locationWithDefaults);
  return docRef.id;
}

export async function updateLocation(id: string, data: Partial<Location>) {
  return runTransaction(db, async (transaction) => {
    const locationRef = doc(db, COLLECTION, id);
    const locationDoc = await transaction.get(locationRef);

    if (!locationDoc.exists()) {
      throw new Error('Location not found');
    }

    const currentLocation = locationDoc.data() as Location;
    const newWeight = data.currentWeight ?? currentLocation.currentWeight;

    // Get all locations in the same bay
    const bayLocations = await getBayLocations(currentLocation.row, currentLocation.bay);
    
    // Calculate new bay weight
    const otherLocationsWeight = bayLocations
      .filter(loc => loc.id !== id)
      .reduce((sum, loc) => sum + loc.currentWeight, 0);
    const newBayWeight = otherLocationsWeight + newWeight;

    // Validate weight limits
    if (newWeight > currentLocation.maxWeight) {
      throw new Error(`Cannot exceed location weight limit of ${currentLocation.maxWeight}kg`);
    }
    if (newBayWeight > BAY_MAX_WEIGHT) {
      throw new Error(`Cannot exceed bay weight limit of ${BAY_MAX_WEIGHT}kg`);
    }

    // Update location with new status
    const updates = {
      ...data,
      currentWeight: newWeight,
      status: getLocationStatus(newWeight, currentLocation.maxWeight),
    };

    transaction.update(locationRef, updates);
  });
}

export async function getBayLocations(row: string, bay: string) {
  const q = query(
    collection(db, COLLECTION),
    where('row', '==', row),
    where('bay', '==', bay)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Location[];
}

export async function getLocations() {
  const querySnapshot = await getDocs(collection(db, COLLECTION));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Location[];
}

export async function getLocationByCode(code: string) {
  const q = query(
    collection(db, COLLECTION),
    where('code', '==', code)
  );
  const querySnapshot = await getDocs(q);
  const locations = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Location[];
  return locations[0] || null;
}

export async function initializeLocationIndexes() {
  const querySnapshot = await getDocs(collection(db, COLLECTION));
  const batch = writeBatch(db);
  let updates = 0;

  for (const docSnapshot of querySnapshot.docs) {
    const location = docSnapshot.data() as Location;
    const maxWeight = LEVEL_MAX_WEIGHTS[location.level] || 500;
    
    if (!location.maxWeight || location.status === undefined) {
      const locationRef = doc(db, COLLECTION, docSnapshot.id);
      batch.update(locationRef, {
        maxWeight,
        currentWeight: location.currentWeight || 0,
        status: getLocationStatus(location.currentWeight || 0, maxWeight),
      });
      updates++;
    }
  }

  if (updates > 0) {
    await batch.commit();
  }

  return updates;
}