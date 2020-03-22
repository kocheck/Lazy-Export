<script>
  //import Global CSS from the svelte boilerplate
  //contains Figma color vars, spacing vars, utility classes and more

  import { GlobalCSS } from "figma-plugin-ds-svelte";

  //import some Svelte Figma UI components
  import {
    Button,
    Input,
    Label,
    Disclosure,
    Section,
    SelectMenu
  } from "figma-plugin-ds-svelte";

  //menu items, this is an array of objects to populate to our select menus
  let menuItems = [
    { value: "IOS", label: "IOS Assets", group: null, selected: false },
    { value: "Android", label: "Android Assets", group: null, selected: false },
    { value: "Web", label: "Web Assets", group: null, selected: false }
  ];

  var disabled = true;
  var selectedPlatform;

  //this is a reactive variable that will return false when a value is selected from
  //the select menu, its value is bound to the primary buttons disabled prop
  $: disabled = selectedPlatform === null;

  function applySettings() {
    console.log(`1 Fire Apply Settings`);
    parent.postMessage(
      {
        pluginMessage: {
          type: "applySettings",
          platform: selectedPlatform.value
        }
      },
      "*"
    );
  }

  function cancel() {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  }

  function clearSettings() {
    console.log(`1 Fire Clear Settings`);
    parent.postMessage(
      {
        pluginMessage: {
          type: "clearSettings"
        }
      },
      "*"
    );
  }
</script>

<style>
  /* Add additional global or scoped styles here */
  .main {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: Inter, sans-serif;
    overflow: hidden;
    text-align: center;
    background-color: whitesmoke;
  }

  .pluginTitle {
    margin: 8px 0 0 12px;
  }
  .pluginTitle svg {
    margin-left: 12px;
  }
  .sectionWrapper {
    background-color: white;
    border-radius: 5px;
    border: 1px solid lightgray;
    padding: 4px 8px 8px 8px;
    margin: 6px;
  }
  .buttonExport {
    width: 100%;
    display: flex;
    padding: 12px 0 4px 0;
  }
  .flex-container-align {
    flex-wrap: wrap;
    display: flex;
    align-content: center;
    justify-content: center;
  }
</style>

<div class="main">
  <div class="flex pluginTitle">

    <h3 class="title">Lazy Export</h3>
    <svg
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      width="20px"
      class="icon">
      <path
        fill="currentColor"
        d="M288 29V16a16 16 0 0 0-16-16H160a16 16 0 0 0-16 16v16a16 16 0 0 0 16
        16h58.12l-82.2 93.94A32 32 0 0 0 128 163v13a16 16 0 0 0 16 16h112a16 16
        0 0 0 16-16v-16a16 16 0 0 0-16-16h-58.13l82.21-93.94A32 32 0 0 0 288
        29zm-88 227H32a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h99.34L9.53
        440.06A32.09 32.09 0 0 0 0 462.86V488a24 24 0 0 0 24 24h184a16 16 0 0 0
        16-16v-32a16 16 0 0 0-16-16H92.66l121.81-120.06a32.09 32.09 0 0 0
        9.53-22.8V280a24 24 0 0 0-24-24zm232-32H320a16 16 0 0 0-16 16v16a16 16 0
        0 0 16 16h58.12l-82.2 93.94A32 32 0 0 0 288 387v13a16 16 0 0 0 16
        16h112a16 16 0 0 0 16-16v-16a16 16 0 0 0-16-16h-58.13l82.21-93.94A32 32
        0 0 0 448 253v-13a16 16 0 0 0-16-16z" />
    </svg>
  </div>

  <div class="wrapper p-xxsmall">
    <div class="sectionWrapper">
      <div class="descriptorTitle">
        <Label>
          <p style="font-weight: 400; color:black; ">Export Type</p>
        </Label>
      </div>

      <SelectMenu
        bind:menuItems
        placeholder="Select Platform"
        bind:value={selectedPlatform} />
      <div class="buttonExport">
        <Button on:click={applySettings} bind:disabled>
          Apply Export Settings
        </Button>
      </div>
    </div>
    <!-- ========= Destructive ========= -->
    <div class="flex p-xxsmall mb-xsmall flex-container-align">
      <Button on:click={clearSettings} destructive>
        Clear Export Selection
      </Button>
      <!-- <div class="closeButton">
        <Button on:click={cancel}>Close</Button>
      </div> -->
    </div>
    <Section>
      <div style="text-align: Left;">
        <p style="font-weight: 400; color:slategray; ">
          Select Platform to apply default export settings to your figma
          selection.
        </p>
      </div>
    </Section>

  </div>
</div>
