import * as d3 from 'd3';

import {
  voronoi
} from 'd3-voronoi';

import {
  appendSelect
} from 'd3-appendselect';
import merge from 'lodash/merge';
import * as utils from './utils';
import D3Locale from '@reuters-graphics/d3-locale';
import {
  polygonLength
} from 'd3';

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

  checkLabelOverlap(lineSeries, endDate) {

    let vals = lineSeries.map(d => {
        let yPos = this.yScale(d.values[d.values.length - 1]);
        console.log(d.id, d.values, yPos);
        return Object.assign(d, d.yPos = yPos)
      })
      .sort((a, b) => a.yPos - b.yPos);


    let diff = vals[0].yPos - vals[1].yPos;

    if (Math.abs(diff) < 30) {
      vals[0].yPosNew = vals[0].yPos - (30 - Math.abs(diff));
      vals[1].yPosNew = vals[1].yPos + (20 - Math.abs(diff));
    }

    let obj = {};
    vals.forEach(d => {
      obj[d.id] = d.yPosNew ? d.yPosNew : d.yPos;
    });

    return obj;

  }

  defaultData = [];

  defaultProps = {
    aspectHeight: 0.7,
    margin: {
      top: 20,
      right: 60,
      bottom: 50,
      left: 55,
    },
    smallChart : false,
    locale: 'en'
  };

  /**
   * Write all your code to draw your chart in this function!
   * Remember to use appendSelect!
   */
  draw() {
    const data = this.data(); // Data passed to your chart
    const props = this.props(); // Props passed to your chart

    let lang = props.locale ? props.locale : 'en';
    const locale = new D3Locale(props.locale);

    if (lang == 'en') {
      locale.apStyle();
    }

    const {
      margin
    } = props;

    const container = this.selection().node();
    const {
      width: containerWidth
    } = container.getBoundingClientRect(); // Respect the width of your container!

    const width = containerWidth - margin.left - margin.right;
    const height =
      containerWidth * props.aspectHeight - margin.top - margin.bottom;

    this.parseDate = d3.timeParse('%Y-%m-%d');

    let lineSeries = props.lineVars.map((v) => {
      return {
        id: v.key,
        display: v.display[lang] ? v.display[lang] : v.display['en'],
        hex: v.hex,
        values: data[v.key],
      };
    });

    lineSeries = lineSeries.filter((d) => {
      return d3.sum(d.values) > 0;
    });

    let startDate = props.dates[0].split(' - ')[1];
    let endDate = props.dates[props.dates.length - 1].split(' - ')[1];
    let allDates = props.dates.map((d) => this.parseDate(d.split(' - ')[1]));
    let xDom = [this.parseDate(startDate), this.parseDate(endDate)];
    let yDom = [0, 100];

    let sampleSize = data['Total - Unweighted Count'];

    this.xScale = d3.scaleTime().domain(xDom).range([0, width]);
    this.yScale = d3.scaleLinear().domain(yDom).range([height, 0]);

    const xAxis = d3
      .axisBottom(this.xScale)
      .tickSize(20)
      .tickValues(allDates)
      .tickFormat((d) => locale.formatTime('%b %e, %Y')(d));

    let yTicks = props.smallChart ? [0,50,100] : [0, 25, 50, 75, 100];

    const yAxis = d3
      .axisLeft(this.yScale)
      .ticks(5)
      .tickValues(yTicks)
      .tickSize(-20 - width)
      //.tickFormat((d) => `${d}%`);

    const makeLine = d3
      .line()
      .x((d, i) => {
        let dateStr = props.dates[i].split(' - ')[1];
        let dateVal = this.parseDate(dateStr);
        return this.xScale(dateVal);
      })
      .y((d) => this.yScale(d));

    const makeArea = d3
      .area()
      .x((d, i) => {
        let dateStr = props.dates[i].split(' - ')[1];
        let dateVal = this.parseDate(dateStr);
        return this.xScale(dateVal);
      })
      .y0((d, i) => {
        let moe = Math.sqrt(1.3 / sampleSize[i]) * 100;
        return this.yScale(d) + moe;
      })
      .y1((d, i) => {
        let moe = Math.sqrt(1.3 / sampleSize[i]) * 100;
        return this.yScale(d) - moe;
      });

    const makeVoronoi = voronoi()
      .x((d, i) => {
        let dateVal = this.parseDate(d.dateStr);
        return this.xScale(dateVal);
      })
      .y((d) => this.yScale(d.val))
      .extent([
        [0, 0],
        [width, height],
      ]);

    let _this = this;

    const plot = this.selection()
      .appendSelect('svg') // 👈 Use appendSelect instead of append for non-data-bound elements!
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .appendSelect('g.plot')
      .classed('small-chart', props.smallChart)
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const transition = plot.transition().duration(500);

    plot
      .appendSelect('g.axis.x')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('.tick')
      .each((d, i, e) => {
        let dateStr = d3.timeFormat('%Y-%m-%d')(d);
        d3.select(e[i]).classed(`d-${dateStr}`, true);
      })
      .classed('active', (d, i) => i === 0 || i === allDates.length - 1);

    plot
      .appendSelect('g.axis.y')
      .attr('transform', `translate(-20,0)`)
      .call(yAxis)
      .selectAll('g.tick')
      .classed('mid', (d) => d === 50)
      .classed('zero', (d) => d === 0);


    let lineGroup = plot
      .selectAll('g.line-group')
      .data(lineSeries, (d) => {
        return d.id;
      })
      .join(
        enter => {
          let lineGroup = enter
            .append('g')
            .attr('class', (d) => `line-group ${utils.slugify(d.id)}`);

          lineGroup
            .appendSelect('path.moe')
            .attr('d', (d) => makeArea(d.values))
            .style('fill', (d) => d.hex);

          lineGroup
            .appendSelect('path.line')
            .attr('d', (d) => makeLine(d.values))
            .style('stroke', (d) => d.hex);
        },

        update => {
          update
            .select('path.moe')
            .transition(transition)
            .attr('d', (d) => makeArea(d.values));

          update
            .select('path.line')
            .transition(transition)
            .attr('d', (d) => makeLine(d.values));

        },

        exit => {
          exit.transition(transition).style('opacity', 0).remove();
        }
      );

    let voronoiGroup = plot.appendSelect('g.voronoi');

    let allVals = [];
    lineSeries.forEach((d) => {

      d.values.forEach((dd, i) => {
        allVals.push({
          dateStr: props.dates[i].split(' - ')[1],
          val: dd,
          id: utils.slugify(d.id),
          hex: d.hex,
          display: d.display
        });
      });

    });

    let tt = plot
      .selectAll('g.tt')
      .data(allVals)
      .join(enter => {
          let sel = enter.append('g')
            .attr('class', (d) => `tt ${utils.slugify(d.id)} d-${d.dateStr}`)
            .classed('last active', d => d.dateStr == endDate)
            .attr('transform', (d) => {
              let dateVal = _this.parseDate(d.dateStr);
              let xPos = this.xScale(dateVal);
              let yPos = this.yScale(d.val);
              return `translate(${xPos}, ${yPos})`;
            });

          sel.append('circle')
            .attr('r', 5)
            .style('fill', (d) => d.hex);

          sel.appendSelect('text.val.bkgd');
          sel.appendSelect('text.val.fore').style('fill', (d) => d.hex);
          sel.selectAll('text.val')
            .attr('y', d => d.val > 50 ? -12 : +24)
            .text((d) => locale.format('.1%')(d.val / 100))

          let lastVal = sel.filter(d => {
            return d.dateStr == endDate;
          });

          lastVal.appendSelect('text.cat.bkgd');
          lastVal.appendSelect('text.cat.fore').style('fill', (d) => d.hex);
          lastVal.selectAll('text.cat')
            .attr('y', d => d.val > 50 ? -32 : +40)
            .text((d) => {
              return d.display;
            })



        },
        update => {

          update.transition(transition).attr('transform', (d) => {
            let dateVal = _this.parseDate(d.dateStr);
            let xPos = this.xScale(dateVal);
            let yPos = this.yScale(d.val);
            return `translate(${xPos}, ${yPos})`;
          });

          update.select('text.val.bkgd')
            .text((d) => locale.format('.1%')(d.val / 100))
            .transition(transition)
            .attr('y', d => {
              return d.val > 50 ? -12 : +24
            })

          update.select('text.val.fore')
            .text((d) => locale.format('.1%')(d.val / 100))
            .transition(transition)
            .attr('y', d => {
              return d.val > 50 ? -12 : +24
            })

          let lastVal = update.filter(d => {
            return d.dateStr == endDate;
          })

          lastVal.select('text.cat.bkgd')
            .text(d => d.display)
            .transition(transition)
            .attr('y', d => d.val > 50 ? -32 : +40)

          lastVal.select('text.cat.fore')
            .text(d => d.display)
            .transition(transition)
            .attr('y', d => d.val > 50 ? -32 : +40)
        }
      )

    let vVals = makeVoronoi.polygons(allVals);

    let vPaths = voronoiGroup
      .selectAll('path')
      .data(vVals)
      .join('path')
      .attr('d', (d) => {
        return d ? 'M' + d.join('L') + 'Z' : null;
      })
      .style('fill', 'white')
      .style('stroke', 'magenta')
      .style('opacity', 0);

    vPaths
      .on('mouseover', function (event, d) {

        plot.selectAll('g.tt').classed('active', (t) => {
          return t.dateStr === d.data.dateStr;
        });

        plot.selectAll('.x.axis .tick').classed('active', false);
        plot
          .selectAll(`.x.axis .tick.d-${d.data.dateStr}`)
          .classed('active', true);


      })
      .on('mouseout', (d) => {
        plot.selectAll('g.tt').classed('active', false);
        plot.selectAll('g.tt.last').classed('active', true);

        plot
          .selectAll('.x.axis .tick')
          .classed('active', (d, i) => i === 0 || i === allDates.length - 1);
      });

    return this; // Generally, always return the chart class from draw!
  }
}

export default MyChartModule;