import * as d3 from 'd3';
import {
  appendSelect
} from 'd3-appendselect';
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
      right: 20,
      bottom: 25,
      left: 30,
    },
    lineVars: ['Total approve', 'Total disapprove']
  };

  /**
   * Write all your code to draw your chart in this function!
   * Remember to use appendSelect!
   */
  draw() {
    const data = this.data(); // Data passed to your chart
    const props = this.props(); // Props passed to your chart

    const {
      margin
    } = props;

    const container = this.selection().node();
    const {
      width: containerWidth
    } = container.getBoundingClientRect(); // Respect the width of your container!

    const width = containerWidth - margin.left - margin.right;
    const height = (containerWidth * props.aspectHeight) - margin.top - margin.bottom;

    const parseDate = d3.timeParse("%Y-%m-%d")

    let start = props.dates[0].split(" - ")[1];
    let end = props.dates[props.dates.length - 1].split(" - ")[1];
    let xDom = [parseDate(start), parseDate(end)]

    let lineSeries = props.lineVars.map(v => {
      return {
        id: v,
        values: data[v]
      }
    })

    const xScale = d3.scaleTime()
      .domain(xDom)
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    const makeLine = d3
      .line()
      .x((d,i) => {
        let dateStr = props.dates[i].split(' - ')[1];
        let dateVal = parseDate(dateStr);
        return xScale(dateVal);
      })
      .y(d=> yScale(d))

    const plot = this.selection()
      .appendSelect('svg') // 👈 Use appendSelect instead of append for non-data-bound elements!
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .appendSelect('g.plot')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    plot
      .appendSelect('g.axis.x')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    plot
      .appendSelect('g.axis.y')
      .call(d3.axisLeft(yScale));

    let lineGroup = plot.selectAll('g.line-group')
      .data(lineSeries)
      .join('g')
      .attr('class', d => `line-group ${utils.slugify(d.id)}`)

    lineGroup.appendSelect('path')
      .attr('d', d => makeLine(d.values))

    const transition = plot.transition().duration(500);

    return this; // Generally, always return the chart class from draw!
  }
}

export default MyChartModule;