export interface Station {
  id: string;
  name: string;
  nameEn?: string;
  operator: string;
  railway: string;
  location: {
    latitude: number;
    longitude: number;
  };
  stationCode?: string;
}