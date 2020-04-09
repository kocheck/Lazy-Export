<script>
  //import Global CSS from the svelte boilerplate
  //contains Figma color vars, spacing vars, utility classes and more

  //Global CSS
  import GlobalCSS from "./components/Styles/global.css";

  //Components
  import Button from "./components/UI/Button/index.svelte";
  import Disclosure from "./components/UI/Disclosure/index.svelte";
  import Input from "./components/UI/Input/index.svelte";
  import Label from "./components/UI/Label/index.svelte";
  import Section from "./components/UI/Section/index.svelte";
  import SelectMenu from "./components/UI/SelectMenu/index.svelte";
  import Icon from "./components/UI/Icon/index.svelte";
  import Switch from "./components/UI/Switch/index.svelte";

  //Icons
  import LazyLogo from "./components/icons/lazyExportIcon.svg";

  //Menu items, this is an array of objects to populate to our select menus
  let menuItems = [
    { value: "IOS", label: "IOS", group: null, selected: false },
    { value: "Android", label: "Android", group: null, selected: false },
    { value: "Web", label: "Web", group: null, selected: false }
  ];

  let disabled = true;
  let selectedPlatform;
  let UserEnteredString;
  let isAdvancedExportChecked;

  //this is a reactive variable that will return false when a value is selected from
  //the select menu, its value is bound to the primary buttons disabled prop
  $: disabled = selectedPlatform === null;
  // $: disabled = isAdvancedExportChecked === null;

  function applySettings() {
    console.log(`1 Fire Apply Settings`);
    console.log(isAdvancedExportChecked);
    parent.postMessage(
      {
        pluginMessage: {
          type: "applySettings",
          platform: selectedPlatform.value,
          name: UserEnteredString,
          isAdvanced: isAdvancedExportChecked
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

<div class="main">
  <div class="flex pluginTitle">

    <h3 class="title">Lazy Export</h3>
    <Icon iconName={LazyLogo} />
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
      <Input placeholder="Custom Asset Name" bind:value={UserEnteredString} />
      <div class="buttonExport">
        <Button on:click={applySettings} bind:disabled>
          Apply Export Settings
        </Button>
      </div>
    </div>
    <section>
      <Switch bind:checked={isAdvancedExportChecked} bind:disabled>
        Advanced Export
      </Switch>
    </section>
    <!-- ========= Destructive ========= -->
    <div class="flex p-xxsmall mb-xsmall flex-container-align">
      <Button on:click={clearSettings} destructive>
        Clear Export Selection
      </Button>
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
