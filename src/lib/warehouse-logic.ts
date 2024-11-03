import type { Location } from '@/types/warehouse';

// Weight limits per level (in kg)
export const LEVEL_MAX_WEIGHTS = {
  '0': 2000, // Ground level
  '1': 1500, // First level
  '2': 1000, // Second level
  '3': 750,  // Third level
  '4': 500,  // Fourth level
};

// Maximum weight per bay (sum of all locations in the bay)
export const BAY_MAX_WEIGHT = 6000; // Total max weight per bay

export const LOCATION_STATUS = {
  EMPTY: 'empty',
  PARTIAL: 'partial',
  FULL: 'full',
} as const;

export type LocationStatus = typeof LOCATION_STATUS[keyof typeof LOCATION_STATUS];

export function getLocationStatus(currentWeight: number, maxWeight: number): LocationStatus {
  if (currentWeight === 0) return LOCATION_STATUS.EMPTY;
  if (currentWeight >= maxWeight) return LOCATION_STATUS.FULL;
  return LOCATION_STATUS.PARTIAL;
}

export function getBayId(location: Location): string {
  return `${location.row}${location.bay}`;
}

export function getBayWeight(locations: Location[]): number {
  return locations.reduce((total, loc) => total + loc.currentWeight, 0);
}

export function canAcceptWeight(location: Location, weight: number, bayLocations: Location[]): boolean {
  // Check if location is empty
  if (location.status !== LOCATION_STATUS.EMPTY) {
    return false;
  }

  // Check location level weight limit
  if (weight > LEVEL_MAX_WEIGHTS[location.level as keyof typeof LEVEL_MAX_WEIGHTS]) {
    return false;
  }

  // Calculate current bay weight including the new weight
  const currentBayWeight = getBayWeight(bayLocations);
  const newBayWeight = currentBayWeight + weight;

  // Check bay weight limit
  if (newBayWeight > BAY_MAX_WEIGHT) {
    return false;
  }

  return true;
}

// Calculate distance score (lower is better)
function calculateDistanceScore(row: string, bay: string): number {
  const rowScore = (row.charCodeAt(0) - 'A'.charCodeAt(0)) * 100;
  const bayScore = parseInt(bay) - 1;
  return rowScore + bayScore;
}

// Calculate weight suitability score (lower is better)
function calculateWeightScore(weight: number, level: string, bayLocations: Location[]): number {
  const levelNum = parseInt(level);
  
  // Heavy penalty for exceeding level weight limits
  const levelMaxWeight = LEVEL_MAX_WEIGHTS[level as keyof typeof LEVEL_MAX_WEIGHTS];
  if (weight > levelMaxWeight) {
    return Number.MAX_SAFE_INTEGER;
  }

  // Check bay weight limit
  const currentBayWeight = getBayWeight(bayLocations);
  if (currentBayWeight + weight > BAY_MAX_WEIGHT) {
    return Number.MAX_SAFE_INTEGER;
  }

  // Penalize putting heavy items on higher levels
  const heightPenalty = weight * levelNum * 2;
  
  // Penalize inefficient use of weight capacity
  const capacityScore = Math.abs(levelMaxWeight - weight);
  
  // Additional penalty for nearly full bays
  const bayUtilization = (currentBayWeight + weight) / BAY_MAX_WEIGHT;
  const bayPenalty = bayUtilization * 1000;

  return heightPenalty + capacityScore + bayPenalty;
}

export function findOptimalLocation(locations: Location[], weight: number): Location | null {
  // Group locations by bay
  const bayGroups = locations.reduce((groups, loc) => {
    const bayId = getBayId(loc);
    if (!groups[bayId]) {
      groups[bayId] = [];
    }
    groups[bayId].push(loc);
    return groups;
  }, {} as Record<string, Location[]>);

  // Filter out bays that can't accept the weight
  const availableBays = Object.entries(bayGroups)
    .filter(([_, bayLocs]) => {
      const currentWeight = getBayWeight(bayLocs);
      return currentWeight + weight <= BAY_MAX_WEIGHT;
    })
    .map(([_, locs]) => locs)
    .flat();

  if (availableBays.length === 0) {
    return null;
  }

  // Score each location based on multiple factors
  const scoredLocations = availableBays
    .filter(loc => loc.status === LOCATION_STATUS.EMPTY)
    .map(location => {
      const bayLocations = bayGroups[getBayId(location)];
      const distanceScore = calculateDistanceScore(location.row, location.bay);
      const weightScore = calculateWeightScore(weight, location.level, bayLocations);
      
      // Combine scores with appropriate weights
      const score = distanceScore + weightScore;

      return {
        location,
        score
      };
    })
    .filter(scored => scored.score !== Number.MAX_SAFE_INTEGER);

  if (scoredLocations.length === 0) {
    return null;
  }

  // Sort by score (lower is better) and return the best location
  scoredLocations.sort((a, b) => a.score - b.score);
  return scoredLocations[0].location;
}

export function getBayStatus(locations: Location[]): LocationStatus {
  const currentWeight = getBayWeight(locations);
  
  if (currentWeight === 0) return LOCATION_STATUS.EMPTY;
  if (currentWeight >= BAY_MAX_WEIGHT) return LOCATION_STATUS.FULL;
  return LOCATION_STATUS.PARTIAL;
}