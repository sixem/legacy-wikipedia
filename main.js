(() =>
{
	/** Get current location */
	const currentLocation = document.location.href;

	/** New URL object */
	const currentUrl = new URL(currentLocation);

	if(!(currentUrl.searchParams.get('useskin') === 'vector'))
	{
		/** If no `useskin=vector` parameter is set, set it */
		currentUrl.searchParams.set('useskin', 'vector');

		/** Redirect page */
		window.location.replace(currentUrl);
	} else {
		/** Remove the `useskin` parameter */
		currentUrl.searchParams.delete('useskin');

		/** Hide the parameter from the URL without reloading the page */
		window.history.replaceState(null, null, currentUrl);
	}
})();