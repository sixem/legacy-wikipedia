/** Options getter */
const getOptions = async () =>
{
	return await chrome.runtime.sendMessage(
		chrome.runtime.id, {
			task: 'optionsGet'
		}
	);
};

const saveOptions = async (options) =>
{
	Object.keys(options).forEach(async (key) =>
	{
		if(options[key].current !== null)
		{
			await chrome.storage.local.set({
				[key]: options[key].current
			});
		}
	});

	await chrome.runtime.sendMessage(
		chrome.runtime.id, {
			task: 'updateCurrentOptions'
		}
	);
};

/** Fired upon DOM load */
window.addEventListener('DOMContentLoaded', async () =>
{
	const manifest = chrome.runtime.getManifest();
	const options = await getOptions();

	for(const item of [
		['div#version', (e) => e.textContent = manifest.version],
		['a#website', (e) => e.setAttribute('href', manifest.homepage_url)]
	])
	{
		const element = document.querySelector(`body > ${item[0]}`);

		if(element)
		{
			item[1](element);
			element.style.visibility = 'visible';
		}
	}

	Object.keys(options).forEach((key) =>
	{
		/** Handle toggleable options (checkboxes) */
		if(options[key].type === 'toggle')
		{
			const element = document.querySelector(`input[type="checkbox"]#${key}`);

			chrome.storage.local.get(key, (result) =>
			{
				const currentValue = result[key];

				/** If value has not been set already, set to default */
				if(!(currentValue === true || currentValue === false))
				{
					let newValue = new Object();
					newValue[key] = options[key].default;

					chrome.storage.local.set(newValue);
				} else {
					element.checked = currentValue;
				}
			});

			/** Detect checked change */
			element.addEventListener('change', (e) =>
			{
				options[key].current = (e.target.checked ? true : false);
			});
		/** Handle text input (textboxes) */
		} else if(options[key].type === 'text')
		{
			const element = document.querySelector(`input[type="text"]#${key}`);

			chrome.storage.local.get(key, (result) =>
			{
				const currentValue = result[key];

				/** If value has not been set already, set to default */
				if(currentValue === false)
				{
					let newValue = new Object();
					newValue[key] = options[key].default;

					chrome.storage.local.set(newValue);
				} else if(typeof currentValue === 'string'
					|| currentValue instanceof String)
				{
					element.value = currentValue;
				}
			});

			/** Detect checked change */
			for(const event of ['change', 'keydown', 'paste', 'input'])
			{
				element.addEventListener(event, (e) =>
				{
					const newValue = e.target.value.trim();
					options[key].current = newValue;
				});
			}
		} else if(options[key].type === 'selection')
		{
			const element = document.querySelector(`select#${key}`);

			chrome.storage.local.get(key, (result) =>
			{
				const currentValue = result[key];

				/** If value has not been set already, set to default */
				if(currentValue === false)
				{
					let newValue = new Object();
					newValue[key] = options[key].default;

					chrome.storage.local.set(newValue);
				} else if(typeof currentValue === 'string'
					|| currentValue instanceof String)
				{
					element.value = currentValue;
				}
			});

			/** Detect selection change */
			for(const event of ['selectionchange', 'change'])
			{
				element.addEventListener(event, (e) =>
				{
					options[key].current = e.target.value;
				});
			}
		}
	});

	const buttonSave = document.querySelector('body > button#settings-save');

	/** Detect save button click */
	buttonSave.addEventListener('click', async () =>
	{
		await saveOptions(options);
		window.close();
	});
});

window.addEventListener('keypress', (e) =>
{
    if(e.key === 'Enter')
	{
		document.querySelector('body > button#settings-save').click();
	}
});