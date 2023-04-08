(async () =>
{
	/**
	 * Fetches a stored setting
	 * 
	 * @param {string} key 
	 */
	const getStoredSetting = async (key, fallback = null) =>
	{
		const stored = await chrome.runtime.sendMessage(
			chrome.runtime.id, {
				task: 'getStoredSetting', key
			}
		);

		return stored !== null
			? stored
			: fallback;
	};

	/** Get current location */
	const currentLocation = document.location.href;

	/** New URL object */
	const currentUrl = new URL(currentLocation);

	if(currentUrl.searchParams.get('useskin') === null)
	{
		/**
		 * This is a sort of "hacky" way of stopping the page from flashing
		 * with the default style before it's changed.
		 * 
		 * This happens because we are using asynchronous functions to access
		 * stored settings, and the page is loaded before the settings are retrieved, thus
		 * we get a quick default style flash before the page is handled by the addon.
		 * 
		 * This stops the page from loading if the `useskin` parameter is not set at all.
		 * 
		 * This assumes that it'll always be set by the addon once it has been handled.
		 */
		window.stop();
	}

	/** Get stored settings */
	const hideParameters = await getStoredSetting('hide-get-parameters', true);
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
				/**
				 * If the subdomain is excluded, use the default skin
				 * 
				 * There is no "default" skin, but since we're assuming the addon
				 * to always set a skin, we can use that as the default, as it'll
				 * have no effect on the page.
				 */
				currentSkin = 'default';
			}
		}
	}

	if(!(currentUrl.searchParams.get('useskin') === currentSkin))
	{
		/** If no `useskin=vector` parameter is set, set it */
		currentUrl.searchParams.set('useskin', currentSkin);

		/** Redirect page */
		window.location.replace(currentUrl);
	} else {
		if(hideParameters)
		{
			/** Remove the `useskin` parameter */
			currentUrl.searchParams.delete('useskin');

			/** Hide the parameter from the URL without reloading the page */
			window.history.replaceState(null, null, currentUrl);
		}
	}
})();