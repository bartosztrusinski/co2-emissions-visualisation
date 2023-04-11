import './style.css';
import App from './App';
import { CountryDataArray, EmissionDataArray } from './interface';
import { feature } from 'topojson-client';
import { csv, json, select } from 'd3';
import { Topology, Objects } from 'topojson-specification';
import { GeoJsonProperties, FeatureCollection, Geometry } from 'geojson';

const jsonUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
const csvUrl = './co2Emissions.csv';

const appElement = select('.app');
const currentYearLabel = select<HTMLElement, unknown>('.current-year');
const yearRangeInput = select<HTMLInputElement, unknown>('.year-range');
const currentEmissionTypeInput = select<HTMLSelectElement, unknown>(
  '.emissions-select'
);
const mainChart = appElement.append('div').classed('main-chart', true);
const sideChart = appElement.append('div').classed('side-chart', true);
const tooltip = appElement.append('div').classed('tooltip', true);

const chartWidth = window.innerWidth * 0.45;
const chartHeight = 300;

try {
  const { countries, emissionData } = await fetchData();
  const app = new App(countries, emissionData);

  app.currentYearLabel = currentYearLabel;
  app.tooltip = tooltip;

  app.listenForYearInput(yearRangeInput);
  app.listenForEmissionTypeInput(currentEmissionTypeInput);

  app.addChart('Map', mainChart, chartWidth, chartWidth * 0.73);
  app.addChart('PieChart', sideChart, chartWidth, chartHeight);
  app.addChart('Histogram', sideChart, chartWidth, chartHeight);

  app.drawCharts();
} catch (error) {
  const errorElement = appElement.append('p').classed('error', true);

  if (error instanceof Error) {
    console.error(error.message);
    errorElement.text(error.message);
  } else {
    errorElement.text('Error setting up app');
  }
}

async function fetchData(): Promise<{
  countries: CountryDataArray;
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

    const formattedFeatures = features.map((feature) => ({
      ...feature,
      id: Number(feature.id),
    }));

    return { countries: formattedFeatures, emissionData };
  } catch (error) {
    throw new Error('Error fetching data');
  }
}
