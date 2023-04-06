import './style.css';
import { feature } from 'topojson-client';
import { BaseType, csv, json, select } from 'd3';
import { Topology, Objects } from 'topojson-specification';
import { GeoJsonProperties, FeatureCollection, Geometry } from 'geojson';
import { Countries, EmissionDataArray } from './interface';

const jsonUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
const csvUrl = './co2Emissions.csv';
const appElement = select<BaseType, unknown>('#app')!;

try {
  const { countries, emissionData } = await fetchData();

  console.log(countries, emissionData);

  appElement.append('p').text('Data loaded');
} catch (error) {
  appElement.append('p').text('Error fetching data');
}

async function fetchData(): Promise<{
  countries: Countries;
  emissionData: EmissionDataArray;
}> {
  try {
    const [worldAtlasData, emissionData] = await Promise.all([
      json<Topology<Objects<GeoJsonProperties>>>(jsonUrl),
      csv(csvUrl, (row) => ({
        continent: row.Continent,
        country: row.Country,
        region: row.Region,
        countryCode: Number(row['Country Code']),
        emissions: Number(row.Emissions),
        emissionsPerCapita: Number(row['Emissions Per Capita']),
        year: Number(row.Year),
      })),
    ]);

    if (!worldAtlasData || !emissionData) {
      throw new Error('Data not loaded');
    }

    const { countries } = worldAtlasData.objects;
    const { features } = feature(
      worldAtlasData,
      countries
    ) as FeatureCollection<Geometry, GeoJsonProperties>;

    return { countries: features, emissionData };
  } catch (error) {
    throw new Error('Error fetching data');
  }
}
