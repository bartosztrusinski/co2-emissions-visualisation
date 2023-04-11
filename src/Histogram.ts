import { EmissionData, EmissionDataArray, EmissionType } from './interface';
import {
  BaseType,
  easeBounceOut,
  transition,
  Selection,
  scaleLinear,
  extent,
  axisBottom,
  format,
  ScaleLinear,
  max,
  axisLeft,
} from 'd3';

class Histogram {
  private data: EmissionDataArray;
  private svg: Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private title: Selection<SVGTextElement, unknown, HTMLElement, any>;
  private label: Selection<SVGTextElement, unknown, HTMLElement, any>;
  private yAxis: Selection<SVGGElement, unknown, HTMLElement, any>;
  private yScale: ScaleLinear<number, number, never>;
  private xScale: ScaleLinear<number, number, never>;
  private width: number;
  private height: number;
  private barWidth: number;
  private getTransition = () => transition().duration(1000).ease(easeBounceOut);
  private padding = {
    top: 40,
    right: 30,
    bottom: 30,
    left: 120,
    barGap: 1,
  };
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

    this.svg = container
      .append('svg')
      .classed('histogram', true)
      .attr('width', this.width)
      .attr('height', this.height);

    this.title = this.svg
      .append('text')
      .classed('title', true)
      .attr('x', this.width / 2)
      .attr('dy', '1em');

    this.label = this.svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle');

    this.yScale = scaleLinear().range([
      this.height - this.padding.bottom,
      this.padding.top,
    ]);

    this.xScale = scaleLinear()
      .domain(extent(this.data, (d) => d.year) as [number, number])
      .range([this.padding.left, this.width - this.padding.right]);

    this.barWidth =
      this.xScale(this.xScale.domain()[0] + 1) -
      this.xScale(this.xScale.domain()[0]);

    // xAxis
    this.svg
      .append('g')
      .attr('transform', `translate(0, ${this.height - this.padding.bottom})`)
      .call(axisBottom(this.xScale).tickFormat(format('d')));

    this.yAxis = this.svg
      .append('g')
      .attr(
        'transform',
        `translate(${this.padding.left - this.barWidth / 2 - 1}, 0)`
      );
  }

  public draw(countryCode?: EmissionData['countryCode']) {
    const countryData = this.data
      .filter((d) => d.countryCode === countryCode)
      .sort((a, b) => a.year - b.year);

    const axisLabel = `CO2 emissions, ${
      this.emissionType === 'emissions'
        ? 'thousand metric tons'
        : 'metric tons per capita'
    }`;

    const barTitle = countryCode
      ? `Carbon dioxide emissions, ${countryData[0].country ?? 'No data'}`
      : 'Click on a country to see annual trends';

    this.yScale.domain([
      0,
      max(countryData, (d) => d[this.emissionType]) as number,
    ]);
    this.yAxis.transition().duration(800).call(axisLeft(this.yScale));
    this.label.html(axisLabel);
    this.title.html(barTitle);

    const update = this.svg
      .selectAll<SVGRectElement, unknown>('.bar')
      .data(countryData);

    const exit = update.exit();

    const enter = update.enter().append('rect');

    exit
      .transition(this.getTransition())
      .delay((_d, i, nodes) => (nodes.length - i - 1) * 25)
      .attr('y', this.height - this.padding.bottom)
      .attr('height', 0)
      .on('.', null)
      .remove();

    enter
      .classed('bar', true)
      .attr('fill', '#8c47f0')
      .attr('y', this.height - this.padding.bottom)
      .attr('height', 0);

    update
      .merge(enter)
      .on(
        'mousemove touchmove',
        (e, data) => this.tooltip && this.onBarHover(e, data)
      )
      .on('mouseout touchend', () => this.tooltip && this.onBarHoverOut())
      .attr('x', (d) => (this.xScale(d.year) + this.xScale(d.year - 1)) / 2)
      .attr('width', this.barWidth - this.padding.barGap)
      .transition(this.getTransition())
      .delay((_d, i) => i * 25)
      .attr('y', (d) => this.yScale(d[this.emissionType]))
      .attr(
        'height',
        (d) =>
          this.height - this.padding.bottom - this.yScale(d[this.emissionType])
      );
  }

  public highlightBar(year: EmissionData['year']) {
    this.svg
      .selectAll<SVGRectElement, EmissionData>('.bar')
      .attr('fill', (d) => (d.year === year ? '#16a085' : '#1abc9c'));
  }

  private onBarHover(e: MouseEvent, data: EmissionData) {
    const node = this.tooltip?.node() as HTMLDivElement;
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
        <p><b>Year</b>: ${data.year}</p>
        <p><b>${emissionsLabel}</b>: ${dataValue}</p>
    `);
  }

  private onBarHoverOut() {
    this.tooltip
      ?.style('opacity', 0)
      .style('transition', 'opacity 180ms ease-in');
  }
}

export default Histogram;
