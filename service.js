/** Default options for the addon to use */
const options = {
	'hide-get-parameters': {
		type: 'toggle',
		default: true,
		current: null
	},
	'exclude-versions': {
		type: 'text',
		default: false,
		current: null
	},
	'skin': {
		type: 'selection',
		default: 'vector',
		current: null
	}
};

/** Set default storage values */
Object.keys(options).forEach((key) =>
{
	chrome.storage.local.get(key, (result) =>
	{
		if(!result.hasOwnProperty(key))
		{
			let value = new Object();
			value[key] = options[key].default;
			chrome.storage.local.set(value);
		}
	});
});

/**
 * Sets the current values of the options
 */
const updateCurrentOptions = async () =>
{
	for(const key in options)
	{
		await chrome.storage.local.get(key, (result) =>
		{
			options[key].current = result[key];
		});
	}

	return options;
};

/**
 * Options getter
 */
const optionsGet = (args) =>
{
   return args.sendResponse(options);
};

/**
 * `onMessage` listener
 */
chrome.runtime.onMessage.addListener((data, sender, sendResponse) =>
{
	/** Task IDs and their corresponding functions */
	let tasks = {
		optionsGet: optionsGet,
		getStoredSetting: async (args) =>
		{
			const storedValue = options[args.data.key]?.current;

			return args.sendResponse(storedValue !== null
				? storedValue
				: await chrome.storage.local.get(args.data.key)
			);
		},
		updateCurrentOptions: async (args) =>
		{
			await updateCurrentOptions();
			return args.sendResponse(options);
		},
	};

	if(tasks[data.task])
	{
		/** Perform task */
		tasks[data.task]({ data, sender, sendResponse });
	}
});

/** Update current values */
updateCurrentOptions();

/**
 * Fetches a stored setting
 * 
 * @param {string} key 
 */
const getStoredSetting = async (key, fallback = null) =>
{
	const storedValue = options[key]?.current;

	const keyValue = storedValue !== null
		? storedValue
		: await chrome.storage.local.get(key);

	return keyValue !== null ? keyValue : fallback;
};

let expectRedirect = false;

const urlFilter = { url: [
	{ hostSuffix: 'wikipedia.org', pathPrefix: '/wiki/' },
	{ hostSuffix: 'wikipedia.org', pathPrefix: '/w/' }
]};

const handleTab = async (tab) =>
{
	/** Get current location */
	const currentLocation = tab.url;

	/** New URL object */
	const currentUrl = new URL(currentLocation);

	/** Get stored settings */
	const excludedSubdomains = await getStoredSetting('exclude-versions', null);

	/** Get current skin */
	let currentSkin = await getStoredSetting('skin', 'vector');

	/** Check if the current subdomain is excluded */
	if(excludedSubdomains
		&& excludedSubdomains.length > 0)
	{
		const matches = /([^\/\.]+)\.wikipedia\.org\/wiki\//g.exec(currentLocation);

		if(matches)
		{
			const subDomain = matches[1].toLowerCase();

			if(excludedSubdomains.split(',').map((s) => s.trim().toLowerCase()).includes(subDomain))
			{
				/** Don't use a skin if site is excluded */
				currentSkin = null;
			}
		}
	}

	/** Set parameters that'd indicate a redirection */
	expectRedirect = [
		'search'
	].map((p) => currentUrl.searchParams.get(p)).filter((p) => p).length > 0 ? true : false;

	if((!(currentUrl.searchParams.get('useskin') === currentSkin) && currentSkin !== null))
	{
		/** If no `useskin=vector` parameter is set, set it */
		currentUrl.searchParams.set('useskin', currentSkin);

		/** Redirect page */
		chrome.tabs.update(tab.tabId, {
			url: currentUrl.href
		});
	}
};

chrome.webNavigation.onBeforeNavigate.addListener(async (tab) =>
{
	handleTab(tab);
}, urlFilter);

chrome.webNavigation.onCommitted.addListener(async (tab) =>
{
	/** Handle expected redirections */
	if(expectRedirect
		&& tab.transitionQualifiers.includes('server_redirect'))
	{
		handleTab(tab);
	}
}, urlFilter);