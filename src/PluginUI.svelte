<script>
  import { onMount } from 'svelte';

  // Components
  import Button from './components/UI/Button/index.svelte';
  import Input from './components/UI/Input/index.svelte';
  import SelectMenu from './components/UI/SelectMenu/index.svelte';
  import Switch from './components/UI/Switch/index.svelte';
  import Icon from './components/UI/Icon/index.svelte';

  // Icons
  import LazyLogo from './components/icons/lazyExportIcon.svg';

  let menuItems = [
    { value: 'IOS', label: 'iOS' },
    { value: 'Android', label: 'Android' },
    { value: 'Web', label: 'Web' },
  ];

  let selectedPlatform = null;
  let userEnteredString = '';
  let isAdvancedExportChecked = false;
  let customPresets = [];
  let newPresetName = '';
  let searchQuery = '';

  onMount(() => {
    // Load custom presets from storage
    parent.postMessage({ pluginMessage: { type: 'loadCustomPresets' } }, '*');
  });

  function applySettings() {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'applySettings',
          platform: selectedPlatform.value,
          name: userEnteredString,
          isAdvanced: isAdvancedExportChecked,
        },
      },
      '*'
    );
  }

  function clearSettings() {
    parent.postMessage({ pluginMessage: { type: 'clearSettings' } }, '*');
  }

  function savePreset() {
    if (!newPresetName) return;
    const newPreset = {
      name: newPresetName,
      platform: selectedPlatform.value,
      isAdvanced: isAdvancedExportChecked,
    };
    parent.postMessage({ pluginMessage: { type: 'saveCustomPreset', preset: newPreset } }, '*');
    newPresetName = '';
  }

  function applyPreset(preset) {
    selectedPlatform = menuItems.find(item => item.value === preset.platform);
    isAdvancedExportChecked = preset.isAdvanced;
    applySettings();
  }

  window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    if (msg.type === 'customPresetsLoaded') {
      customPresets = msg.presets;
    }
  };

  $: filteredPresets = customPresets.filter(preset =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
</script>

<div class="container">
  <header class="header">
    <Icon iconName={LazyLogo} />
    <h1 class="title">Lazy Export</h1>
  </header>

  <main class="main-content">
    <section class="card">
      <h2 class="section-title">Export Settings</h2>
      <SelectMenu bind:menuItems placeholder="Select Platform" bind:value={selectedPlatform} />
      <Input placeholder="Custom Asset Name" bind:value={userEnteredString} />
      <Switch bind:checked={isAdvancedExportChecked}>Advanced Export</Switch>
      <Button on:click={applySettings} disabled={!selectedPlatform}>Apply Export Settings</Button>
      <Button on:click={clearSettings} destructive>Clear Export Selection</Button>
    </section>

    <section class="card">
      <h2 class="section-title">Custom Presets</h2>
      <div class="preset-form">
        <Input placeholder="New Preset Name" bind:value={newPresetName} />
        <Button on:click={savePreset} disabled={!newPresetName || !selectedPlatform}>Save Preset</Button>
      </div>
      <Input placeholder="Search Presets" bind:value={searchQuery} />
      <ul class="preset-list">
        {#each filteredPresets as preset}
          <li class="preset-item" on:click={() => applyPreset(preset)} on:keydown={(e) => { if (e.key === 'Enter') applyPreset(preset); }}>{preset.name}</li>
        {/each}
      </ul>
    </section>
  </main>
</div>

<style>
  .container {
    padding: 16px;
    background-color: #f5f5f5;
  }
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }
  .title {
    margin: 0 0 0 8px;
    font-size: 18px;
  }
  .main-content {
    display: grid;
    gap: 16px;
  }
  .card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .section-title {
    margin: 0 0 16px 0;
    font-size: 16px;
  }
  .preset-form {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }
  .preset-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .preset-item {
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
  }
  .preset-item:hover {
    background-color: #eee;
  }
</style>