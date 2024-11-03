import { Timestamp } from 'firebase/firestore';

export interface Item {
  id: string;
  itemCode: string;
  name: string;
  description: string;
  weight: number;
  location?: string;
  category: string;
  status: 'pending' | 'placed' | 'removed';
  locationVerified: boolean;
  lastUpdated: Timestamp;
}

export interface Movement {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  weight: number;
  timestamp: Timestamp;
  operator: string;
  reference: string;
  notes?: string;
}

export interface Location {
  id: string;
  code: string;
  row: string;
  bay: string;
  level: string;
  location: string;
  maxWeight: number;
  currentWeight: number;
  status: 'empty' | 'partial' | 'full';
}