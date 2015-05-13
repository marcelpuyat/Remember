chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.type) {
		case "getProviders":
			console.log("Get providers req");
			_chromeStorageWrapper.getCredsStore(function(credsStore) {
				console.dir(credsStore);
				var providersObj = {};
				var provider;
				var obj;
				for (provider in _providers) {
					var providerName = _providers[provider].readableName;
					providersObj[providerName] = {};
					providersObj[providerName]["id"] = _providers[provider].id;
					providersObj[providerName]["icon"] = _providers[provider].icon;
					if (credsStore == null || credsStore[provider] == null) {
						providersObj[providerName]["authenticated"] = false;
					} else {
						providersObj[providerName]["authenticated"] = true;
					}
				}
				console.log("Sending response to get providers");
				console.dir(providersObj);
				sendResponse({providers: providersObj});
			});
			return true; // Must return true in onMessage to indicate we are waiting for an async function

		case "authenticateProvider":
			console.log("Authenticating provider: " + request.provider);
			var providerToAuthenticate = request.provider;
			if (_providers[providerToAuthenticate] == null) { 
				console.error("Error authenticating provider: " + 
				providerToAuthenticate + ". Does not exist.");
				sendResponse({error: "Error authenticating provider: " + 
				providerToAuthenticate + ". Does not exist."});
			} else {
				_providers[providerToAuthenticate].getCreds(
					function(creds) {
						_providers[providerToAuthenticate].saveNotesAndCreds(creds, function() {
							sendResponse({success: 'true'});
						}); // TODO: catch error when can't save.
					},
					function() {
						sendResponse({error: "Error authenticating provider: " +
							providerToAuthenticate + ". Error getting creds."});
					}
				);
			}
			return true;
		case "deleteProvider":

			return true;
		default:
			sendResponse({error: "Illegal request type"});
	}
});