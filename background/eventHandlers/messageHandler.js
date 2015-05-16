(function() {
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		switch (request.type) {
			case "getProviders":
				console.log("Get providers request");
				_chromeStorageWrapper.getCredsStore(function(credsStore) {
					console.print("Creds store: ", credsStore);
					var providersObj = {}; // Obj to be returned, holding all other providers
					var provider;
					var obj;
					for (provider in _providers) {
						// We only want to reveal the information index.html will need. So this
						// converts a Provider instance into pretty much just a struct with
						// the fields needed to display on front end.
						var providerName = _providers[provider].readableName;
						providersObj[providerName] = {};
						providersObj[providerName].id = _providers[provider].id;
						providersObj[providerName].icon = _providers[provider].icon;
						if (credsStore == null || credsStore[provider] == null) {
							providersObj[providerName]["authenticated"] = false;
						} else {
							providersObj[providerName]["authenticated"] = true;
						}
					}
					console.log("Sending response to get providers");
					console.print("Response: ", providersObj);
					sendResponse({providers: providersObj});
				}, function(ex) {
					var errorMsg = "Could not get providers information";
					console.error(errorMsg + " " + ex);
					_notifHandler.notifError("Error", "Sorry :( An unexpected error occurred when "+
						"retrieving your settings. Please contact us for further support.");
					sendResponse({error: errorMsg});
				});
				return true; // Must return true in onMessage to indicate we are waiting for an async function

			case "authenticateProvider":
				var providerId = request.providerId;
				console.log("Authenticating provider id: " + request.providerId);
				if (_config.idToProviderMap[providerId] == null) { sendErrorBadProviderId(sendResponse, providerId); return; }
				var providerToAuthenticate = _providers[_config.idToProviderMap[providerId]];

				providerToAuthenticate.getCreds(
					function(creds) { 
					// Successful getting creds from provider api
						providerToAuthenticate.saveNotesAndCreds(creds, 
							function() { 
							// Successful saving of notes and creds
								_notifHandler.notifAuth(true, true, _config.idToProviderMap[providerId]);
								sendResponse({success: 'true'});
							},
							function(error) { 
							// Error saving notes and creds
								if (error) { console.error(error); }
								else { console.error("Unable to save notes and creds for provider: " + providerToAuthenticate.name); }
								sendResponse({error: "Error saving provider notes/creds. Error: " + error});
							}
						);
					},
					function(err) { 
					// Error authenticating
						console.error("Error authenticating: "+err);
						_notifHandler.notifAuth(true, false, _config.idToProviderMap[providerId]);
						sendResponse({error: "Error authenticating provider: " +
							providerToAuthenticate.name + ". Error getting creds."});
					}
				);
				return true;

			case "deleteProvider":
				var providerId = request.providerId;
				console.log("Deleting auth for provider id: " + request.providerId);
				if (_config.idToProviderMap[providerId] == null) { sendErrorBadProviderId(sendResponse, providerId); return; }
				var providerToDelete = _providers[_config.idToProviderMap[providerId]];

				providerToDelete.deleteNotesAndCreds(
					function() { 
					// Success deleting creds
						console.log("Deleted creds for provider: " + providerId);
						_notifHandler.notifAuth(false, true, _config.idToProviderMap[providerId]);
						sendResponse({success: 'true'});
					},
					function(err) { 
					// Error deleting creds
						_notifHandler.notifAuth(false, false, _config.idToProviderMap[providerId]);
						console.error("Unable to delete provider: " + providerToDelete.name + ". Error: " + err);
					}
				);
				return true;
			default:
				sendResponse({error: "Illegal request type"});
		}
	});
	function sendErrorBadProviderId(sendResponseFn, badId) {
		var errorMsg = "Bad provider id: " + badId + ". Does not exist.";
		console.error(errorMsg);
		sendResponseFn({error: errorMsg});
	}
})();