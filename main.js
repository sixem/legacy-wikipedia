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

	/** Get stored settings */
	const hideParameters = await getStoredSetting('hide-get-parameters', true);

	if(currentUrl.searchParams.get('useskin') && hideParameters)
	{
		/** Remove the `useskin` parameter */
		currentUrl.searchParams.delete('useskin');

		/** Hide the parameter from the URL without reloading the page */
		window.history.replaceState(null, null, currentUrl);
	}
})();