import * as d3 from 'd3';
import { appendSelect } from 'd3-appendselect';
import merge from 'lodash/merge';
import * as utils from './utils';

d3.selection.prototype.appendSelect = appendSelect;

/**
 * Write your chart as a class with a single draw method that draws
 * your chart! This component inherits from a base class you can
 * see and customize in the baseClasses folder.
 */
class MyChartModule {
  selection(selector) {
    if (!selector) return this._selection;
    this._selection = d3.select(selector);
    return this;
  }

  data(newData) {
    if (!newData) return this._data || this.defaultData;
    this._data = newData;
    return this;
  }

  props(newProps) {
    if (!newProps) return this._props || this.defaultProps;
    this._props = merge(this._props || this.defaultProps, newProps);
    return this;
  }

  defaultData = [];

  defaultProps = {
    aspectHeight: 0.7,
    margin: {
      top: 20,
      right: 100,
      bottom: 50,
      left: 60,
    },
    lineVars: ['Total approve', 'Total disapprove'],
  };

  /**
   * Write all your code to draw your chart in this function!
   * Remember to use appendSelect!
   */
  draw() {
    const data = this.data(); // Data passed to your chart
    const props = this.props(); // Props passed to your chart

    const { margin } = props;

    const container = this.selection().node();
    const { width: containerWidth } = container.getBoundingClientRect(); // Respect the width of your container!

    const width = containerWidth - margin.left - margin.right;
    const height =
      containerWidth * props.aspectHeight - margin.top - margin.bottom;

    const parseDate = d3.timeParse('%Y-%m-%d');

    let lineSeries = props.lineVars.map((v) => {
      return {
        id: v,
        values: data[v],
      };
    });

    lineSeries = lineSeries.filter((d) => {
      return d3.sum(d.values) > 0;
    });

    let startDate = props.dates[0].split(' - ')[1];
    let endDate = props.dates[props.dates.length - 1].split(' - ')[1];
    let xDom = [parseDate(startDate), parseDate(endDate)];
    let yDom = [0, 100];

    let sampleSize = data['Total - Unweighted Count'];

    console.log(sampleSize);

    const xScale = d3.scaleTime().domain(xDom).range([0, width]);

    const yScale = d3.scaleLinear().domain(yDom).range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickSize(20).ticks(3);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickValues([0, 25, 50, 75, 100])
      .tickSize(-20 - width)
      .tickFormat((d) => `${d}%`);

    const makeLine = d3
      .line()
      .x((d, i) => {
        let dateStr = props.dates[i].split(' - ')[1];
        let dateVal = parseDate(dateStr);
        return xScale(dateVal);
      })
      .y((d) => yScale(d));

    const makeArea = d3
      .area()
      .x((d, i) => {
        let dateStr = props.dates[i].split(' - ')[1];
        let dateVal = parseDate(dateStr);
        return xScale(dateVal);
      })
      .y0((d, i) => {
        let moe = Math.sqrt(1.3 / sampleSize[i]) * 100;
        return yScale(d) + moe;
      })
      .y1((d, i) => {
        let moe = Math.sqrt(1.3 / sampleSize[i]) * 100;
        return yScale(d) - moe;
      });

    const plot = this.selection()
      .appendSelect('svg') // 👈 Use appendSelect instead of append for non-data-bound elements!
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .appendSelect('g.plot')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const transition = plot.transition().duration(500);

    plot
      .appendSelect('g.axis.x')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    plot
      .appendSelect('g.axis.y')
      .attr('transform', `translate(-20,0)`)
      .call(yAxis)
      .selectAll('g.tick')
      .classed('mid', (d) => d === 50);

    let lineGroup = plot
      .selectAll('g.line-group')
      .data(lineSeries, (d) => {
        return d.id;
      })
      .join(
        (enter) => onEnter(enter),
        (update) => onUpdate(update),
        (exit) => onExit(exit)
      );

    function onEnter(enter) {
      let lineGroup = enter
        .append('g')
        .attr('class', (d) => `line-group ${utils.slugify(d.id)}`);

      lineGroup.appendSelect('path.moe').attr('d', (d) => makeArea(d.values));

      lineGroup.appendSelect('path.line').attr('d', (d) => makeLine(d.values));

      let labelGroup = lineGroup
        .appendSelect('g.lbl-group')
        .attr('transform', (d) => {
          let dateVal = parseDate(endDate);
          let xPos = xScale(dateVal) + 5;
          let yPos = yScale(d.values[d.values.length - 1]) + 5;
          return `translate(${xPos},${yPos})`;
        });

      labelGroup.appendSelect('text.lbl-cat.bkgd');
      labelGroup.appendSelect('text.lbl-cat.fore');

      labelGroup.appendSelect('text.lbl-val.bkgd');
      labelGroup.appendSelect('text.lbl-val.fore');

      labelGroup.selectAll('text.lbl-cat').text((d) => {
        return utils.toTitleCase(d.id.replace('Total', ''));
      });

      labelGroup
        .selectAll('text.lbl-val')
        .text((d) => `${utils.round(d.values[d.values.length - 1], 1)}%`)
        .attr('y', -20);
    }

    function onUpdate(update) {
      update
        .select('path.moe')
        .transition(transition)
        .attr('d', (d) => makeArea(d.values));

      update
        .select('path.line')
        .transition(transition)
        .attr('d', (d) => makeLine(d.values));

      let labelGroup = update
        .select('g.lbl-group')
        .transition(transition)
        .attr('transform', (d) => {
          let dateVal = parseDate(endDate);
          let xPos = xScale(dateVal) + 5;
          let yPos = yScale(d.values[d.values.length - 1]) + 5;
          return `translate(${xPos},${yPos})`;
        });

      update
        .select('g.lbl-group text.lbl-val.fore')
        .text((d) => `${utils.round(d.values[d.values.length - 1], 1)}%`);

      update
        .select('g.lbl-group text.lbl-val.bkgd')
        .text((d) => `${utils.round(d.values[d.values.length - 1], 1)}%`);
    }

    function onExit(exit) {
      exit.transition(transition).style('opacity', 0).remove();
    }

    return this; // Generally, always return the chart class from draw!
  }
}

export default MyChartModule;
