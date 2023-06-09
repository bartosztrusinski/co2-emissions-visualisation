import { DSVParsedArray } from 'd3';
import { Feature, Geometry, GeoJsonProperties } from 'geojson';

interface EmissionData {
  continent: string | undefined;
  country: string | undefined;
  countryCode: number;
  emissions: number;
  emissionsPerCapita: number;
  region: string | undefined;
  year: number;
}
type EmissionDataArray = DSVParsedArray<EmissionData>;

type EmissionType = keyof Pick<
  EmissionData,
  'emissions' | 'emissionsPerCapita'
>;

type CountryData = Feature<Geometry, GeoJsonProperties> & {
  id: number;
};
type CountryDataArray = CountryData[];

export type {
  EmissionData,
  EmissionDataArray,
  EmissionType,
  CountryData,
  CountryDataArray,
};
