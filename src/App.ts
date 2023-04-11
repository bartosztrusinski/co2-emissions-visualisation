import Map from './Map';
import PieChart from './PieChart';
import Histogram from './Histogram';
import {
  CountryData,
  CountryDataArray,
  EmissionDataArray,
  EmissionType,
} from './interface';
import { BaseType, extent, select, Selection } from 'd3';

class App {
  private countries: CountryDataArray;
  private emissionData: EmissionDataArray;
  private currentEmissionType: EmissionType;
  private currentYear: number;
  private minYear: number;
  private maxYear: number;
  public map: Map | undefined;
  public pieChart: PieChart | undefined;
  public histogram: Histogram | undefined;
  private _currentYearLabel:
    | Selection<HTMLElement, unknown, HTMLElement, unknown>
    | undefined;
  public _tooltip:
    | Selection<HTMLDivElement, unknown, HTMLElement, undefined>
    | undefined;

  constructor(countries: CountryDataArray, emissionData: EmissionDataArray) {
    this.countries = countries;
    this.emissionData = emissionData;
    this.currentEmissionType = 'emissions';
    [this.minYear, this.maxYear] = extent(
      this.emissionData,
      (d) => d.year
    ) as number[];
    this.currentYear = this.minYear;
    this.currentYearLabel?.text(this.currentYear);
  }

  public set currentYearLabel(
    label: Selection<HTMLElement, unknown, HTMLElement, unknown> | undefined
  ) {
    this._currentYearLabel = label;
    this._currentYearLabel?.text(this.currentYear);
  }

  public set tooltip(
    tooltip:
      | Selection<HTMLDivElement, unknown, HTMLElement, undefined>
      | undefined
  ) {
    this._tooltip = tooltip;
    if (this.map) this.map.tooltip = tooltip;
    if (this.pieChart) this.pieChart.tooltip = tooltip;
    if (this.histogram) this.histogram.tooltip = tooltip;
  }

  public listenForYearInput(
    input: Selection<HTMLInputElement, unknown, HTMLElement, undefined>
  ) {
    input
      .property('min', this.minYear)
      .property('max', this.maxYear)
      .property('value', this.currentYear)
      .on('input', (e) => {
        this.currentYear = Number(e.target.value);
        this._currentYearLabel?.text(this.currentYear);

        if (this.map) {
          this.map.emissionType = this.currentEmissionType;
          this.map.draw(this.currentYear);
        }

        if (this.pieChart) {
          this.pieChart.draw(this.currentYear);
        }

        if (this.histogram) {
          this.histogram.highlightBar(this.currentYear);
        }
      });
  }

  public listenForEmissionTypeInput(
    input: Selection<HTMLSelectElement, unknown, HTMLElement, undefined>
  ) {
    this.currentEmissionType = input.node()?.value as EmissionType;
    input.on('input', (e) => {
      const activeCountry = select<BaseType, CountryData>('.active').data()[0];
      this.currentEmissionType = e.target.value;

      if (this.map) {
        this.map.emissionType = this.currentEmissionType;
        this.map.draw(this.currentYear);
      }

      if (this.histogram) {
        this.histogram.emissionType = this.currentEmissionType;
        this.histogram.draw(activeCountry?.id);
      }
    });
  }

  public addChart(
    chartType: 'Map' | 'PieChart' | 'Histogram',
    container: Selection<HTMLDivElement, unknown, HTMLElement, undefined>,
    width: number,
    height: number
  ) {
    switch (chartType) {
      case 'Map':
        this.map = new Map(
          this.countries,
          this.emissionData,
          container,
          width,
          height
        );
        this.map.tooltip = this._tooltip;
        this.map.emissionType = this.currentEmissionType;
        break;
      case 'PieChart':
        this.pieChart = new PieChart(
          this.emissionData,
          container,
          width,
          height
        );
        this.pieChart.tooltip = this._tooltip;
        this.pieChart.emissionType = this.currentEmissionType;
        break;
      case 'Histogram':
        this.histogram = new Histogram(
          this.emissionData,
          container,
          width,
          height
        );
        this.histogram.tooltip = this._tooltip;
        this.histogram.emissionType = this.currentEmissionType;
        break;

      default:
        break;
    }
  }

  public drawCharts() {
    this.pieChart?.draw(this.currentYear);
    this.histogram?.draw();
    this.map?.draw(this.currentYear);
    this.map?.onCountryClick((countryCode) => {
      this.histogram?.draw(countryCode);
      this.histogram?.highlightBar(this.currentYear);
    });
  }
}

export default App;
