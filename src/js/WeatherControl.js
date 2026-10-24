export class WeatherControl {
  constructor(configuration, onChange) {
    const label = document.createElement('label');
    label.className = 'fixed bottom-3 left-3 z-20 flex items-center gap-2 rounded border-2 border-black bg-white px-3 py-2 font-bold text-black';
    label.textContent = 'Clima';
    const select = document.createElement('select');
    select.className = 'rounded border border-gray-400 bg-white p-1 text-black';
    select.setAttribute('aria-label', 'Clima della gara');
    for (const id of configuration.allowedStyles) {
      const option = document.createElement('option');
      option.value = id; option.textContent = configuration.styles[id].name; select.append(option);
    }
    select.value = configuration.weatherId;
    label.append(select); document.body.append(label);
    select.addEventListener('change', () => {
      configuration.weatherId = select.value;
      configuration.weather = configuration.styles[select.value];
      onChange(configuration.weather);
    });
  }
}
