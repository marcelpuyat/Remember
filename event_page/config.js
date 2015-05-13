var _config = {
	appId: chrome.runtime.id,
	hoursBetweenPopups: 24,
	defaultTag: 'remember',
	appUri: 'https://'+chrome.runtime.id+'.chromiumapp.org/',
	redirectUri: 'https://'+chrome.runtime.id+'.chromiumapp.org/provider_cb/', // For OAuth
	idToProviderMap: {
		evernote: 1,
		pocket: 2
	}
};