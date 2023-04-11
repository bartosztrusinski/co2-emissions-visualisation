import { EmissionData, EmissionDataArray, EmissionType } from './interface';
import {
  Arc,
  arc,
  BaseType,
  Pie,
  pie,
  PieArcDatum,
  scaleOrdinal,
  Selection,
} from 'd3';

class PieChart {
  private data: EmissionDataArray;
  private continents = [
    'Asia',
    'Europe',
    'Africa',
    'Americas',
    'Oceania',
    'No data',
  ];
  private colors = [
    '#ab47bc',
    '#7e57c2',
    '#26a69a',
    '#42a5f5',
    '#78909c',
    '#bdbdbd',
  ];
  private colorScale = scaleOrdinal<string>()
    .domain(this.continents)
    .range(this.colors);
  private width: number;
  private height: number;
  private svg: Selection<SVGSVGElement, EmissionDataArray, HTMLElement, any>;
  private chart: Selection<SVGGElement, EmissionDataArray, HTMLElement, any>;
  private title: Selection<SVGTextElement, EmissionDataArray, HTMLElement, any>;
  private pie: Pie<any, EmissionData>;
  private arc: Arc<any, PieArcDatum<EmissionData>>;
  public emissionType: EmissionType = 'emissions';
  public tooltip: Selection<HTMLDivElement, unknown, BaseType, any> | undefined;

  constructor(
    data: EmissionDataArray,
    container: Selection<HTMLDivElement, unknown, HTMLElement, any>,
    width: number,
    height: number
  ) {
    this.data = data;
    this.width = width;
    this.height = height;

    this.pie = pie<EmissionData>()
      .value((d) => d.emissions)
      .sort((a, b) => {
        if (a.continent && b.continent) {
          if (a.continent < b.continent) return -1;
          if (a.continent > b.continent) return 1;
        }
        return a.emissions - b.emissions;
      });

    this.arc = arc<PieArcDatum<EmissionData>>()
      .innerRadius(0)
      .outerRadius(this.height / 2 - 20);

    this.svg = container
      .append('svg')
      .data([this.data])
      .classed('pie', true)
      .attr('width', this.width)
      .attr('height', this.height);

    this.chart = this.svg
      .append('g')
      .classed('chart', true)
      .attr(
        'transform',
        `translate(${this.width / 2}, ${this.height / 2 + 15})`
      );

    this.title = this.svg
      .append('text')
      .classed('title', true)
      .attr('x', this.width / 2)
      .attr('y', '1em');
  }

  public draw(year: EmissionData['year']) {
    const yearData = this.data.filter((d) => d.year === year);

    this.title.text(`Total emissions by continent and region, ${year}`);

    const update = this.chart
      .selectAll<SVGPathElement, unknown>('.arc')
      .data(this.pie(yearData));

    const exit = update.exit();

    const enter = update.enter().append('path');

    exit.on('.', null).remove();

    enter.classed('arc', true);

    update
      .merge(enter)
      .attr('d', this.arc)
      .attr('fill', (d) => this.colorScale(d.data.continent ?? 'No data'))
      .on(
        'mousemove touchmove',
        (e, d) => this.tooltip && this.onArcHover(e, d)
      )
      .on('mouseout touchend', () => this.tooltip && this.onArcHoverOut());
  }

  private onArcHover(e: MouseEvent, d: PieArcDatum<EmissionData>) {
    const { data, startAngle, endAngle } = d;
    const angle = endAngle - startAngle;
    const fraction = (100 * angle) / (Math.PI * 2);
    const percentage = fraction.toFixed(2) + '%';
    const node = this.tooltip?.node() as HTMLElement;
    const units =
      (this.emissionType === 'emissions' ? 'thousand ' : '') + 'metric tons';

    const dataValue = data[this.emissionType]
      ? `${data[this.emissionType].toLocaleString()} ${units}`
      : 'Data Not Available';

    const emissionsLabel =
      this.emissionType === 'emissions' ? 'Emissions' : 'Emissions per capita';

    this.tooltip
      ?.style('opacity', 1)
      .style('top', e.pageY - node.offsetHeight - 10 + 'px')
      .style('left', e.pageX - node.offsetWidth / 2 + 'px');

    this.tooltip?.html(`
        <p><b>Country</b>: ${data.country ?? 'No data'}</p>
        <p><b>${emissionsLabel}</b>: ${dataValue}</p>
        <p><b>Percentage of total</b>: ${percentage}</p>
    `);
  }

  private onArcHoverOut() {
    this.tooltip
      ?.style('opacity', 0)
      .style('transition', 'opacity 180ms ease-in');
  }
}

export default PieChart;
