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
chrome.runtime.onMessage.addListener(async (data, sender, sendResponse) =>
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

	return true;
});

/** Update current values */
updateCurrentOptions();