var _config = {
	appId: chrome.runtime.id,
	hoursBetweenPopups: 6,
	defaultTag: 'remember',
	appUri: 'https://'+chrome.runtime.id+'.chromiumapp.org/',
	redirectUri: 'https://'+chrome.runtime.id+'.chromiumapp.org/provider_cb/', // For OAuth
	idToProviderMap: {
		1: 'evernote',
		2: 'pocket'
	}
};
_config.providerToIdMap = invert(_config.idToProviderMap);