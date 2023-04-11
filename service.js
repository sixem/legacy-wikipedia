(async () =>
{
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

	/** URL filter */
	const urlFilter = { url: [
		{ hostSuffix: 'wikipedia.org', pathPrefix: '/wiki/' },
		{ hostSuffix: 'wikipedia.org', pathPrefix: '/w/' }
	]};

	const tabCache = {};

	let expectRedirect = false;

	/** Set default storage values */
	const initializeStorage = async () =>
	{
		for(const [key, value] of Object.entries(options))
		{
			await chrome.storage.local.get(key, async (result) =>
			{
				if(!result.hasOwnProperty(key)
					|| result[key] === undefined)
				{
					console.log('Setting default value for', key, 'to', value.default, '...');
	
					await chrome.storage.local.set({
						[key]: value.default
					});
	
					options[key].current = value.default;
				}
			});
		}
	};

	await initializeStorage();

	/**
	 * Sets the current values of the options
	 */
	const updateCurrentOptions = async (options) =>
	{
		console.log('Updating options...', { options });

		for(const [key, value] of Object.entries(options))
		{
			await chrome.storage.local.get(key, (result) =>
			{
				if(result[key] !== undefined)
				{
					console.log('Setting current value for', key, 'to', result[key], '...');
					value.current = result[key];
				}
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
				return args.sendResponse(getStoredSetting(
					args.data.key, args.data.fallback
				));
			},
			updateCurrentOptions: async (args) =>
			{
				await updateCurrentOptions(options);
				return args.sendResponse(options);
			},
		};

		if(tasks[data.task])
		{
			/** Perform task */
			tasks[data.task]({ data, sender, sendResponse });
		}
	});

	/**
	 * Fetches a stored setting
	 * 
	 * @param {string} key 
	 */
	const getStoredSetting = async (key, fallback = null) =>
	{
		const storedValue = options[key].current;

		let keyValue = null;

		if(storedValue === null)
		{
			console.log('Fetching (and updating) value for', key, 'from storage...');
			
			let storageData = await chrome.storage.local.get(key);

			options[key].current = storageData.hasOwnProperty(key) ? (
				storageData[key] !== null ? storageData[key] : fallback
			) : fallback;

			keyValue = options[key].current;
		} else {
			console.log('Fetched value for', key, 'from cache...');

			keyValue = storedValue;
		}

		return (keyValue !== null && keyValue !== undefined)
			? keyValue
			: fallback;
	};

	/**
	 * Handles the URL of a tab
	 * 
	 * @param {object} tab 
	 */
	const handleTab = async (tab) =>
	{
		/** Get current location */
		const currentLocation = tab.url;

		/** New URL object */
		const currentUrl = new URL(currentLocation);

		/** Get excluded subdomains */
		const excludedSubdomains = await getStoredSetting('exclude-versions', []);

		/** Get current skin */
		let currentSkin = await getStoredSetting('skin', 'vector');
		
		/** Check if the current subdomain is excluded */
		if(excludedSubdomains
			&& excludedSubdomains.length > 0)
		{
			const matches = /([^\/\.]+)\.wikipedia\.org\/(wiki|w)\//g.exec(currentLocation);

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
		expectRedirect = currentSkin ? [
			'search'
		].map((p) => currentUrl.searchParams.get(p)).filter((p) => p).length > 0 : false;

		if((!(currentUrl.searchParams.get('useskin') === currentSkin) && currentSkin !== null))
		{
			/** If no `useskin=vector` parameter is set, set it */
			currentUrl.searchParams.set('useskin', currentSkin);

			/** Redirect page */
			chrome.tabs.update(tab.tabId, {
				url: currentUrl.href
			});
		} else if(currentSkin === null && currentUrl.searchParams.get('useskin'))
		{
			currentUrl.searchParams.delete('useskin');

			chrome.tabs.update(tab.tabId, {
				url: currentUrl.href
			});
		}
	};

	/**
	 * [webNavigation] `onBeforeNavigate` listener
	 */
	chrome.webNavigation.onBeforeNavigate.addListener(async (tab) =>
	{
		handleTab(tab);
	}, urlFilter);

	/**
	 * [webNavigation] `onCommitted` listener
	 */
	chrome.webNavigation.onCommitted.addListener(async (tab) =>
	{
		/** Handle expected redirections */
		if(expectRedirect
			&& tab.transitionQualifiers
			&& tab.transitionQualifiers.includes('server_redirect'))
		{
			handleTab(tab);
		}
	}, urlFilter);

	chrome.runtime.onInstalled.addListener(async () =>
	{
		await initializeStorage();
	});
})();