import {
  CountryData,
  CountryDataArray,
  EmissionData,
  EmissionDataArray,
  EmissionType,
} from './interface';
import {
  scalePow,
  Selection,
  BaseType,
  geoMercator,
  geoPath,
  max,
  select,
  selectAll,
  GeoProjection,
  GeoPath,
} from 'd3';

class Map {
  private countries: CountryDataArray;
  private data: EmissionDataArray;
  private colors = ['#f1c40f', '#c0392b'];
  private colorScale = scalePow<string>().range(this.colors);
  private width: number;
  private height: number;
  private svg: Selection<SVGSVGElement, CountryDataArray, HTMLElement, any>;
  private title: Selection<SVGTextElement, CountryDataArray, HTMLElement, any>;
  private projection: GeoProjection;
  private path: GeoPath;
  public emissionType: EmissionType = 'emissions';
  public tooltip: Selection<HTMLDivElement, unknown, BaseType, any> | undefined;

  constructor(
    countries: CountryDataArray,
    data: EmissionDataArray,
    container: Selection<HTMLDivElement, unknown, HTMLElement, any>,
    width: number,
    height: number
  ) {
    this.countries = countries;
    this.data = data;
    this.width = width;
    this.height = height;

    this.svg = container
      .append('svg')
      .data([this.countries])
      .classed('map', true)
      .attr('width', this.width)
      .attr('height', this.height);

    this.title = this.svg
      .append('text')
      .classed('title', true)
      .attr('x', this.width / 2)
      .attr('y', '1em');

    this.projection = geoMercator()
      .scale(140)
      .translate([this.width / 2, this.height / 1.4]);

    this.path = geoPath().projection(this.projection);
  }

  public draw(year: EmissionData['year']) {
    const yearData = this.data.filter((d) => d.year === year);
    const titleText =
      this.emissionType === 'emissions' ? 'emissions' : 'emissions per capita';

    this.colorScale.domain([
      0,
      max(yearData, (d) => d[this.emissionType]) as number,
    ]);
    this.title.text(`Carbon dioxide ${titleText}, ${year}`);

    const update = this.svg
      .selectAll<SVGPathElement, unknown>('.country')
      .data(this.countries);

    const enter = update.enter().append('path');

    enter.classed('country', true).attr('d', this.path);

    update
      .merge(enter)
      .on(
        'mousemove touchmove',
        (e, d) => this.tooltip && this.onCountryHover(e, d, year)
      )
      .on('mouseout touchend', () => this.tooltip && this.onCountryHoverOut())
      .transition()
      .duration(500)
      .attr('fill', (d) => {
        const countryYearData = yearData.find(
          (data) => data.countryCode === d.id
        );

        return countryYearData && countryYearData[this.emissionType]
          ? this.colorScale(countryYearData[this.emissionType])
          : '#ccc';
      });
  }

  public onCountryClick(callback: (countryCode?: CountryData['id']) => void) {
    this.svg
      .selectAll<SVGPathElement, CountryData>('.country')
      .on('click', (e, d) => {
        const country = select(e.target);
        const isActive = country.classed('active');

        selectAll('.country').classed('active', false);
        country.classed('active', !isActive);

        callback(isActive ? undefined : d.id);
      });
  }

  private onCountryHover(
    e: MouseEvent,
    d: CountryData,
    year: EmissionData['year']
  ) {
    const countryData = this.data.filter((data) => data.countryCode === d.id);
    const node = this.tooltip?.node() as HTMLDivElement;
    const units =
      (this.emissionType === 'emissions' ? 'thousand ' : '') + 'metric tons';

    const countryYearData = countryData.find((data) => data.year === year);

    const dataValue = countryYearData?.[this.emissionType]
      ? `${countryYearData[this.emissionType].toLocaleString()} ${units}`
      : 'Data Not Available';

    const emissionsLabel =
      this.emissionType === 'emissions' ? 'Emissions' : 'Emissions per capita';

    this.tooltip
      ?.style('opacity', 1)
      .style('top', e.pageY - node.offsetHeight - 10 + 'px')
      .style('left', e.pageX - node.offsetWidth / 2 + 'px');

    this.tooltip?.html(`
        <p><b>Country</b>: ${countryData[0]?.country}</p>
        <p><b>${emissionsLabel}</b>: ${dataValue}</p>
    `);
  }

  private onCountryHoverOut() {
    this.tooltip
      ?.style('opacity', 0)
      .style('transition', 'opacity 180ms ease-in');
  }
}

export default Map;
