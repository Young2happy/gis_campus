interface Facility {
  id: string;
  code: string;
  name: string;
  type: 'library' | 'canteen' | 'express';
  maxCount: number;
  location: {
    lat: number;
    lng: number;
  };
}

interface FacilitiesData {
  facilities: Facility[];
}

declare module '*/facilities.json' {
  const value: FacilitiesData;
  export default value;
} 