import * as d3 from 'd3';

import { voronoi } from 'd3-voronoi';

import { appendSelect } from 'd3-appendselect';
import merge from 'lodash/merge';
import * as utils from './utils';
import D3Locale from '@reuters-graphics/d3-locale';
import { polygonLength } from 'd3';

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

  rankVals(lineSeries, props) {
    let byDate = {};
    lineSeries.forEach((d) => {
      d.values.forEach((v, i) => {
        let dateStr = props.dates[i].split(' - ')[1];
        byDate[dateStr] = byDate[dateStr] ? byDate[dateStr] : [];
        byDate[dateStr].push(v);
      });
    });

    Object.keys(byDate).forEach((key) => {
      byDate[key] = d3.max(byDate[key]);
    });

    return byDate;
  }

  defaultData = [];

  defaultProps = {
    aspectHeight: 0.7,
    margin: {
      top: 20,
      right: 60,
      bottom: 50,
      left: 58,
    },
    smallChart: false,
    locale: 'en',
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

    const { margin } = props;

    const container = this.selection().node();
    const { width: containerWidth } = container.getBoundingClientRect(); // Respect the width of your container!

    margin.left = props.smallChart ? 30 : margin.left;
    margin.right = props.smallChart ? 18 : margin.right;

    const width = containerWidth - margin.left - margin.right;
    let height =
      containerWidth * props.aspectHeight - margin.top - margin.bottom;

    if (props.fixedHeight) {
      height = props.fixedHeight - margin.top - margin.bottom;
    }

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
    let rankedVals = this.rankVals(lineSeries, props);
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

    let yTicks = props.smallChart ? [0, 50, 100] : [0, 25, 50, 75, 100];
    let yTickSize = props.smallChart ? -width - 20 : -12;

    const yAxis = d3
      .axisLeft(this.yScale)
      .ticks(5)
      .tickValues(yTicks)
      .tickSize(yTickSize)
      .tickFormat((d) => (d == 100 ? `${d}%` : d));

    const makeLine = d3
      .line()
      .curve(d3.curveCatmullRom.alpha(1))
      .x((d, i) => {
        let dateStr = props.dates[i].split(' - ')[1];
        let dateVal = this.parseDate(dateStr);
        return this.xScale(dateVal);
      })
      .y((d) => this.yScale(d));

    const makeArea = d3
      .area()
      .curve(d3.curveCatmullRom.alpha(1))
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

    const clipPath = plot
      .appendSelect('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', width)
      .attr('height', height);

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

    let yAxisPos = props.smallChart ? -20 : -20;

    plot
      .appendSelect('g.axis.y')
      .attr('transform', `translate(-20,0)`)
      .call(yAxis)
      .selectAll('g.tick')
      .classed('mid', (d) => d === 50)
      .selectAll('.tick text');

    if (props.smallChart) {
      let lbl100 = plot
        .appendSelect('g.lbl-100')
        .attr('transform', `translate(-20,${this.yScale(100) + 4})`);

      lbl100
        .appendSelect('rect')
        .attr('width', 40)
        .attr('height', 20)
        .attr('y', -13)
        .attr('x', -4)
        .style('fill', 'white');

      lbl100.appendSelect('text.fore').text('100%');
    }

    plot
      .selectAll('g.axis.y .tick')
      .filter((d) => d !== 100)
      .selectAll('text')
      .attr('x', -6);

    let zx1 = props.smallChart ? -20 : -20;
    let zx2 = props.smallChart ? Math.abs(yTickSize) - 20 : width;

    plot
      .appendSelect('line.zero')
      .attr('x1', zx1)
      .attr('x2', zx2)
      .attr('y1', this.yScale(0))
      .attr('y2', this.yScale(0))
      .raise();

    let lineGroup = plot
      .selectAll('g.line-group')
      .data(lineSeries, (d) => {
        return d.id;
      })
      .join(
        (enter) => {
          let lineGroup = enter
            .append('g')
            .attr('class', (d) => `line-group ${utils.slugify(d.id)}`)
            .attr('clip-path', 'url(#clip)');

          lineGroup
            .appendSelect('path.moe')
            .attr('d', (d) => makeArea(d.values))
            .style('fill', (d) => d.hex);

          lineGroup
            .appendSelect('path.line')
            .attr('d', (d) => makeLine(d.values))
            .style('stroke', (d) => d.hex);
        },

        (update) => {
          update
            .select('path.moe')
            .transition(transition)
            .attr('d', (d) => makeArea(d.values));

          update
            .select('path.line')
            .transition(transition)
            .attr('d', (d) => makeLine(d.values));
        },

        (exit) => {
          exit.transition(transition).style('opacity', 0).remove();
        }
      );

    let voronoiGroup = plot.appendSelect('g.voronoi');

    let allVals = [];
    lineSeries.forEach((d, i) => {
      d.values.forEach((dd, ii) => {
        allVals.push({
          dateStr: props.dates[ii].split(' - ')[1],
          val: dd,
          id: utils.slugify(d.id),
          hex: d.hex,
          display: d.display,
        });
      });
    });

    let labelOffset = (d, type) => {
      let isHighest = rankedVals[d.dateStr] == d.val;

      let pos = {
        cat: {
          top: -32,
          bot: 40,
        },
        val: {
          top: -12,
          bot: 24,
        },
      };

      if (isHighest && d.val < 80) {
        return pos[type].top;
      } else if (isHighest && d.val >= 80) {
        return pos[type].bot;
      } else if (!isHighest && d.val < 20) {
        return pos[type].top;
      } else {
        return pos[type].bot;
      }
    };

    let tt = plot
      .selectAll('g.tt')
      .data(allVals)
      .join(
        (enter) => {
          let sel = enter
            .append('g')
            .attr('class', (d) => `tt ${utils.slugify(d.id)} d-${d.dateStr}`)
            .classed('last active', (d) => d.dateStr == endDate)
            .attr('transform', (d) => {
              let dateVal = _this.parseDate(d.dateStr);
              let xPos = this.xScale(dateVal);
              let yPos = this.yScale(d.val);
              return `translate(${xPos}, ${yPos})`;
            });

          sel
            .append('circle')
            .attr('r', 5)
            .style('fill', (d) => d.hex);

          sel.appendSelect('text.val.bkgd');
          sel.appendSelect('text.val.fore').style('fill', (d) => d.hex);
          sel
            .selectAll('text.val')
            .attr('y', (d) => labelOffset(d, 'val'))
            .text((d) => locale.format('.0%')(d.val / 100));

          sel.appendSelect('text.cat.bkgd');
          sel.appendSelect('text.cat.fore').style('fill', (d) => d.hex);
          sel
            .selectAll('text.cat')
            .attr('y', (d) => labelOffset(d, 'cat'))
            .text((d) => {
              return d.display;
            });
        },
        (update) => {
          update.transition(transition).attr('transform', (d) => {
            let dateVal = _this.parseDate(d.dateStr);
            let xPos = this.xScale(dateVal);
            let yPos = this.yScale(d.val);
            return `translate(${xPos}, ${yPos})`;
          });

          update
            .select('text.val.bkgd')
            .text((d) => locale.format('.0%')(d.val / 100))
            .transition(transition)
            .attr('y', (d) => labelOffset(d, 'val'));

          update
            .select('text.val.fore')
            .text((d) => locale.format('.0%')(d.val / 100))
            .transition(transition)
            .attr('y', (d) => labelOffset(d, 'val'));

          update
            .select('text.cat.bkgd')
            .text((d) => d.display)
            .transition(transition)
            .attr('y', (d) => labelOffset(d, 'cat'));

          update
            .select('text.cat.fore')
            .text((d) => d.display)
            .transition(transition)
            .attr('y', (d) => labelOffset(d, 'cat'));
        }
      );

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
