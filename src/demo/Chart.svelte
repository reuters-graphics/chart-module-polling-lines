<!-- ⭐ Write an interactive DEMO of your chart in this component.
Follow the notes below! -->
<script>
  export let responsive; // eslint-disable-line
  import { afterUpdate } from 'svelte';
  import { tick } from 'svelte';
  import Docs from './App/Docs.svelte';
  import Explorer from './App/Explorer.svelte';
  import LineChart from '../js/index';
  import testData from '../js/test-data.json';

  let chart = new LineChart();
  let chartContainer;

  // 🎚️ Create variables for any data or props you want users to be able
  // to update in the demo. (And write buttons to update them below!)
  let defaultKey = 'Respondents:AllRespondents'
  let dropDownArray = setDropdownData();
  let chartData = testData.demographics[defaultKey]; 

  // ...

  // 🎈 Tie your custom props back together into one chartProps object.
  $: chartProps = {
    dates: testData.dates,
    lineVars: ['Total approve', 'Total disapprove'],
    selected: defaultKey
  };

  console.log(testData)

  afterUpdate(() => {

    console.log('afterUpdate')

    // 💪 Create a new chart instance of your module.
    chart = new LineChart();
    
    // ⚡ And let's use your chart!
    chart
      .selection(chartContainer)
      .data(chartData) // Pass your chartData
      .props(chartProps) // Pass your chartProps
      .draw(); // 🚀 DRAW IT!

  });

  
  function setDropdownData() {
    
    let map = {};

    Object.keys(testData.demographics).forEach(d=> {
      let parent = d.split(":")[0];
      let child = d.split(":")[1];

      map[parent] = map[parent] ? map[parent] : {id: parent, values: []};
      map[parent].values.push(child);

    });

    return Object.values(map);

  }

  function getVal() {
    chartProps.selected = document.getElementById("dropdown").value;
    chartData = testData.demographics[chartProps.selected];
  }

  

</script>

<!-- 🖌️ Style your demo page here -->
<style lang="scss">
  .chart-options {
    button {
      padding: 5px 15px;
    }
  }
</style>

<div id="polls-line-chart-container" bind:this={chartContainer} />

<div class="chart-options">

  <!-- svelte-ignore a11y-no-onchange -->
  <select bind:value={chartProps.selected} name="dropdown" id="dropdown" on:change={()=> getVal()}>
    
    {#each dropDownArray as demo}
      <optgroup label="{demo.id}">
        {#each demo.values as demoVal}
          <option value="{demo.id}:{demoVal}">{demoVal}</option>
        {/each}
      </optgroup>
    {/each}

  </select>
</div>

<!-- ⚙️ These components will automatically create interactive documentation for you chart! -->
<Docs />
<Explorer title='Data' data={chart.data()} />
<Explorer title='Props' data={chart.props()} />
