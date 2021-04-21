![](./badge.svg)

# LineChart

See the [demo page](https://reuters-graphics.github.io/chart-module-polling-lines/).

### Install

```
$ yarn add https://github.com/reuters-graphics/chart-module-polls-line-chart.git
```

### Use

```javascript
import LineChart from '@reuters-graphics/chart-module-polls-line-chart';
```

## Chart configuration options:

`$: chartProps`: (Object) Passed to the chart via the props() method.
 
`dates`: (Array) The top-level unformatted dates array from the data. (Ex: data.dates). Used to define xScale domain
`lineVars` : (Object array) Variables for which we want to draw lines.

  * `key` : (String) Keys for series we wish to plot. `Total approve` or `Total disapprove`
  * `display` : (Object) This is where we set translations. Ex: {`en` : `Approve`}
  * `hex` : (String) Hex display color for line series.
  
`selection` : (String) The default key for this chart. Format is Demo:Subgroup (Ex: `Party:Democrat`).
`locale` : (String) The 2-letter language abbreviation. Sets translation and number/date formatting. (Ex: `de` for German.)
`smallChart` (Boolean) Style changes for small rail charts
  * yAxis tick marks at 0,50,100
  * No category labels on lines
  * No mouseover interactions

### Example usage: 

```javascript
  $: chartProps = {
    dates: [
      "2021-01-20 - 2021-01-21",
      "2021-02-02 - 2021-02-03",
      "2021-02-09 - 2021-02-10",
      "2021-02-17 - 2021-02-18",
      "2021-02-24 - 2021-02-25",
      "2021-03-03 - 2021-03-04",
      "2021-03-10 - 2021-03-11",
      "2021-03-17 - 2021-03-18"
    ],
    lineVars: [{
        key: 'Total approve',
        display: {
          'en' : 'Approve',
          'de' : 'Zustimmung'
        },
        hex: '#31a354'
      },
      {
        key: 'Total disapprove',
        display: {
          'en' : 'Disapprove',
          'de' : 'Missbilligung'
        },
        hex: '#e6550d'
    }],
    selected: 'Respondents:AllRespondents',
    locale: 'de',
    smallChart: false
    };

  const chart = new LineChart();

  // To create your chart, pass a selector string to the chart's selection method,
  // as well as any props or data to their respective methods. Then call draw.
  chart
    .selection('#chart')
    .data()
    .props(chartProps)
    .draw();

  // You can call any method again to update the chart.
  chart
    .data([3, 4, 5])
    .draw();

  // Or just call the draw function alone, which is useful for resizing the chart.
  chart.draw();
```

To apply this chart's default styles when using SCSS, simply define the variable `$LineChart-container` to represent the ID or class of the chart's container(s) and import the `_chart.scss` partial.

```CSS
$LineChart-container: '#chart';

@import '~@reuters-graphics/chart-module-polls-line-chart/src/scss/chart';
```

## Developing chart modules

Read more in the [DEVELOPING docs](./DEVELOPING.md) about how to write your chart module.