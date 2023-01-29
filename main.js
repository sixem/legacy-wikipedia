/** Get current location */
const currentLocation = document.location.href;

if(!currentLocation.includes('useskin=vector'))
{
	/** If no `useskin=vector` parameter is set, set it */
	const url = new URL(currentLocation);

	url.searchParams.set('useskin', 'vector');

	/** Redirect page */
	window.location.replace(url);
} else {
	/** New URL object */
	const url = new URL(window.location.href);

	/** Remove the `useskin` parameter */
	url.searchParams.delete('useskin');

	/** Hide the parameter from the URL without reloading the page */
	window.history.replaceState(null, null, url);
}