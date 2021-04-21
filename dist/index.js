'use strict';

var d3 = require('d3');
var d3Voronoi = require('d3-voronoi');
var d3Appendselect = require('d3-appendselect');
var merge = require('lodash/merge');
var d3Format = require('d3-format');
var D3Locale = require('@reuters-graphics/d3-locale');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var merge__default = /*#__PURE__*/_interopDefaultLegacy(merge);
var D3Locale__default = /*#__PURE__*/_interopDefaultLegacy(D3Locale);

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function slugify(text) {
  return text.toString().toLowerCase().replace(/\s+/g, '-') // Replace spaces with -
  .replace(/[^\w\-]+/g, '') // Remove all non-word chars
  .replace(/\-\-+/g, '-') // Replace multiple - with single -
  .replace(/^-+/, '') // Trim - from start of text
  .replace(/-+$/, ''); // Trim - from end of text
}
d3Format.formatLocale({
  shortMonths: ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.']
});

d3.selection.prototype.appendSelect = d3Appendselect.appendSelect;
/**
 * Write your chart as a class with a single draw method that draws
 * your chart! This component inherits from a base class you can
 * see and customize in the baseClasses folder.
 */

var MyChartModule = /*#__PURE__*/function () {
  function MyChartModule() {
    _classCallCheck(this, MyChartModule);

    _defineProperty(this, "defaultData", []);

    _defineProperty(this, "defaultProps", {
      aspectHeight: 0.7,
      margin: {
        top: 20,
        right: 60,
        bottom: 50,
        left: 55
      },
      smallChart: false,
      locale: 'en'
    });
  }

  _createClass(MyChartModule, [{
    key: "selection",
    value: function selection(selector) {
      if (!selector) return this._selection;
      this._selection = d3.select(selector);
      return this;
    }
  }, {
    key: "data",
    value: function data(newData) {
      if (!newData) return this._data || this.defaultData;
      this._data = newData;
      return this;
    }
  }, {
    key: "props",
    value: function props(newProps) {
      if (!newProps) return this._props || this.defaultProps;
      this._props = merge__default['default'](this._props || this.defaultProps, newProps);
      return this;
    }
  }, {
    key: "checkLabelOverlap",
    value: function checkLabelOverlap(lineSeries, endDate) {
      var _this2 = this;

      var vals = lineSeries.map(function (d) {
        var yPos = _this2.yScale(d.values[d.values.length - 1]);

        console.log(d.id, d.values, yPos);
        return Object.assign(d, d.yPos = yPos);
      }).sort(function (a, b) {
        return a.yPos - b.yPos;
      });
      var diff = vals[0].yPos - vals[1].yPos;

      if (Math.abs(diff) < 30) {
        vals[0].yPosNew = vals[0].yPos - (30 - Math.abs(diff));
        vals[1].yPosNew = vals[1].yPos + (20 - Math.abs(diff));
      }

      var obj = {};
      vals.forEach(function (d) {
        obj[d.id] = d.yPosNew ? d.yPosNew : d.yPos;
      });
      return obj;
    }
  }, {
    key: "draw",

    /**
     * Write all your code to draw your chart in this function!
     * Remember to use appendSelect!
     */
    value: function draw() {
      var _this3 = this;

      var data = this.data(); // Data passed to your chart

      var props = this.props(); // Props passed to your chart

      var lang = props.locale ? props.locale : 'en';
      var locale = new D3Locale__default['default'](props.locale);

      if (lang == 'en') {
        locale.apStyle();
      }

      var margin = props.margin;
      var container = this.selection().node();

      var _container$getBoundin = container.getBoundingClientRect(),
          containerWidth = _container$getBoundin.width; // Respect the width of your container!


      var width = containerWidth - margin.left - margin.right;
      var height = containerWidth * props.aspectHeight - margin.top - margin.bottom;
      this.parseDate = d3.timeParse('%Y-%m-%d');
      var lineSeries = props.lineVars.map(function (v) {
        return {
          id: v.key,
          display: v.display[lang] ? v.display[lang] : v.display['en'],
          hex: v.hex,
          values: data[v.key]
        };
      });
      lineSeries = lineSeries.filter(function (d) {
        return d3.sum(d.values) > 0;
      });
      var startDate = props.dates[0].split(' - ')[1];
      var endDate = props.dates[props.dates.length - 1].split(' - ')[1];
      var allDates = props.dates.map(function (d) {
        return _this3.parseDate(d.split(' - ')[1]);
      });
      var xDom = [this.parseDate(startDate), this.parseDate(endDate)];
      var yDom = [0, 100];
      var sampleSize = data['Total - Unweighted Count'];
      this.xScale = d3.scaleTime().domain(xDom).range([0, width]);
      this.yScale = d3.scaleLinear().domain(yDom).range([height, 0]);
      var xAxis = d3.axisBottom(this.xScale).tickSize(20).tickValues(allDates).tickFormat(function (d) {
        return locale.formatTime('%b %e, %Y')(d);
      });
      var yTicks = props.smallChart ? [0, 50, 100] : [0, 25, 50, 75, 100];
      var yAxis = d3.axisLeft(this.yScale).ticks(5).tickValues(yTicks).tickSize(-20 - width); //.tickFormat((d) => `${d}%`);

      var makeLine = d3.line().x(function (d, i) {
        var dateStr = props.dates[i].split(' - ')[1];

        var dateVal = _this3.parseDate(dateStr);

        return _this3.xScale(dateVal);
      }).y(function (d) {
        return _this3.yScale(d);
      });
      var makeArea = d3.area().x(function (d, i) {
        var dateStr = props.dates[i].split(' - ')[1];

        var dateVal = _this3.parseDate(dateStr);

        return _this3.xScale(dateVal);
      }).y0(function (d, i) {
        var moe = Math.sqrt(1.3 / sampleSize[i]) * 100;
        return _this3.yScale(d) + moe;
      }).y1(function (d, i) {
        var moe = Math.sqrt(1.3 / sampleSize[i]) * 100;
        return _this3.yScale(d) - moe;
      });
      var makeVoronoi = d3Voronoi.voronoi().x(function (d, i) {
        var dateVal = _this3.parseDate(d.dateStr);

        return _this3.xScale(dateVal);
      }).y(function (d) {
        return _this3.yScale(d.val);
      }).extent([[0, 0], [width, height]]);

      var _this = this;

      var plot = this.selection().appendSelect('svg') // 👈 Use appendSelect instead of append for non-data-bound elements!
      .attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).appendSelect('g.plot').classed('small-chart', props.smallChart).attr('transform', "translate(".concat(margin.left, ",").concat(margin.top, ")"));
      var transition = plot.transition().duration(500);
      plot.appendSelect('g.axis.x').attr('transform', "translate(0,".concat(height, ")")).call(xAxis).selectAll('.tick').each(function (d, i, e) {
        var dateStr = d3.timeFormat('%Y-%m-%d')(d);
        d3.select(e[i]).classed("d-".concat(dateStr), true);
      }).classed('active', function (d, i) {
        return i === 0 || i === allDates.length - 1;
      });
      plot.appendSelect('g.axis.y').attr('transform', "translate(-20,0)").call(yAxis).selectAll('g.tick').classed('mid', function (d) {
        return d === 50;
      }).classed('zero', function (d) {
        return d === 0;
      });
      plot.selectAll('g.line-group').data(lineSeries, function (d) {
        return d.id;
      }).join(function (enter) {
        var lineGroup = enter.append('g').attr('class', function (d) {
          return "line-group ".concat(slugify(d.id));
        });
        lineGroup.appendSelect('path.moe').attr('d', function (d) {
          return makeArea(d.values);
        }).style('fill', function (d) {
          return d.hex;
        });
        lineGroup.appendSelect('path.line').attr('d', function (d) {
          return makeLine(d.values);
        }).style('stroke', function (d) {
          return d.hex;
        });
      }, function (update) {
        update.select('path.moe').transition(transition).attr('d', function (d) {
          return makeArea(d.values);
        });
        update.select('path.line').transition(transition).attr('d', function (d) {
          return makeLine(d.values);
        });
      }, function (exit) {
        exit.transition(transition).style('opacity', 0).remove();
      });
      var voronoiGroup = plot.appendSelect('g.voronoi');
      var allVals = [];
      lineSeries.forEach(function (d) {
        d.values.forEach(function (dd, i) {
          allVals.push({
            dateStr: props.dates[i].split(' - ')[1],
            val: dd,
            id: slugify(d.id),
            hex: d.hex,
            display: d.display
          });
        });
      });
      plot.selectAll('g.tt').data(allVals).join(function (enter) {
        var sel = enter.append('g').attr('class', function (d) {
          return "tt ".concat(slugify(d.id), " d-").concat(d.dateStr);
        }).classed('last active', function (d) {
          return d.dateStr == endDate;
        }).attr('transform', function (d) {
          var dateVal = _this.parseDate(d.dateStr);

          var xPos = _this3.xScale(dateVal);

          var yPos = _this3.yScale(d.val);

          return "translate(".concat(xPos, ", ").concat(yPos, ")");
        });
        sel.append('circle').attr('r', 5).style('fill', function (d) {
          return d.hex;
        });
        sel.appendSelect('text.val.bkgd');
        sel.appendSelect('text.val.fore').style('fill', function (d) {
          return d.hex;
        });
        sel.selectAll('text.val').attr('y', function (d) {
          return d.val > 50 ? -12 : +24;
        }).text(function (d) {
          return locale.format('.1%')(d.val / 100);
        });
        var lastVal = sel.filter(function (d) {
          return d.dateStr == endDate;
        });
        lastVal.appendSelect('text.cat.bkgd');
        lastVal.appendSelect('text.cat.fore').style('fill', function (d) {
          return d.hex;
        });
        lastVal.selectAll('text.cat').attr('y', function (d) {
          return d.val > 50 ? -32 : +40;
        }).text(function (d) {
          return d.display;
        });
      }, function (update) {
        update.transition(transition).attr('transform', function (d) {
          var dateVal = _this.parseDate(d.dateStr);

          var xPos = _this3.xScale(dateVal);

          var yPos = _this3.yScale(d.val);

          return "translate(".concat(xPos, ", ").concat(yPos, ")");
        });
        update.select('text.val.bkgd').text(function (d) {
          return locale.format('.1%')(d.val / 100);
        }).transition(transition).attr('y', function (d) {
          return d.val > 50 ? -12 : +24;
        });
        update.select('text.val.fore').text(function (d) {
          return locale.format('.1%')(d.val / 100);
        }).transition(transition).attr('y', function (d) {
          return d.val > 50 ? -12 : +24;
        });
        var lastVal = update.filter(function (d) {
          return d.dateStr == endDate;
        });
        lastVal.select('text.cat.bkgd').text(function (d) {
          return d.display;
        }).transition(transition).attr('y', function (d) {
          return d.val > 50 ? -32 : +40;
        });
        lastVal.select('text.cat.fore').text(function (d) {
          return d.display;
        }).transition(transition).attr('y', function (d) {
          return d.val > 50 ? -32 : +40;
        });
      });
      var vVals = makeVoronoi.polygons(allVals);
      var vPaths = voronoiGroup.selectAll('path').data(vVals).join('path').attr('d', function (d) {
        return d ? 'M' + d.join('L') + 'Z' : null;
      }).style('fill', 'white').style('stroke', 'magenta').style('opacity', 0);
      vPaths.on('mouseover', function (event, d) {
        plot.selectAll('g.tt').classed('active', function (t) {
          return t.dateStr === d.data.dateStr;
        });
        plot.selectAll('.x.axis .tick').classed('active', false);
        plot.selectAll(".x.axis .tick.d-".concat(d.data.dateStr)).classed('active', true);
      }).on('mouseout', function (d) {
        plot.selectAll('g.tt').classed('active', false);
        plot.selectAll('g.tt.last').classed('active', true);
        plot.selectAll('.x.axis .tick').classed('active', function (d, i) {
          return i === 0 || i === allDates.length - 1;
        });
      });
      return this; // Generally, always return the chart class from draw!
    }
  }]);

  return MyChartModule;
}();

module.exports = MyChartModule;
