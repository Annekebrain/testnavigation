export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export interface GameState {
  currentNodeIndex: number;
  visitedNodes: boolean[];
  userLocation: GeolocationPosition | null;
  gameStarted: boolean;
  gameCompleted: boolean;
}

export interface CompassData {
  heading: number;
  accuracy: number;
}