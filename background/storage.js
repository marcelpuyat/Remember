function ChromeStorageWrapper() {

	/*
	 * Schema in chrome.storage.local:
	 * 
	 *   credsStoreKey: {
	 *       'pocket': {access_token: "...", ...},
	 *       'evernote': {...}
	 *   }
	 *
	 *   // Global mapping from provider name to notes saved
	 *   'pocket': [{note obj1}, {note obj2}, ...]
	 *   'evernote': [...]
	 *
	 *   // Simply stores whether a provider exists
	 *   providersStoreKey: {
	 *       'pocket': true,
	 *       'evernote': true,
	 *       ...
	 *   }
	 *
	 *   lastPopupTimeKey: time_in_secs_since_198whatever
	 */


	var _this = this;
	// Keys for various key value stores
	var providersStoreKey = "providers";
	var credsStoreKey = "creds";
	var lastPopupTimeKey = "lastPopup";

	/* Popup methods */

	/* Stores current time in seconds since 198whatever */
	this.updateLastPopupTime = function(successCb, errorCb) {
		var currTime = (new Date()).getTime();
		console.log("Setting last popup time to: " + currTime);
		storeKeyVal(lastPopupTimeKey, currTime, successCb, errorCb);
	};

	/* Returns time in seconds since 198whatever */
	this.getLastPopupTime = function(successCb, errorCb) {
		chrome.storage.local.get(lastPopupTimeKey, function(returnObj) {
			if (chrome.runtime.lastError != null) { if (errorCb) errorCb(chrome.runtime.lastError); return; }
			successCb(returnObj[lastPopupTimeKey]);
		});
	};

	/* End popup methods */

	/* Note methods */

	/* Will erase all notes previously associated with provider and update them
	 * to just include the ones passed in here */
	this.updateNotesForProvider = function(provider, notes, successCb, errorCb) {

		// We first add the notes to the provider
		storeKeyVal(provider, notes, function() {
			// If this succeeds, we then want to update our providers store to include this provider
			chrome.storage.local.get(providersStoreKey, function(returnObj) {
				if (chrome.runtime.lastError != null) { if (errorCb) errorCb(chrome.runtime.lastError); return; }
				if (returnObj[providersStoreKey] == null) {
					// Create new providers store
					var newProvidersStore = {};
					newProvidersStore[provider] = true;
					console.log("Creating new provider store: " + JSON.stringify(newProvidersStore));
					storeKeyVal(providersStoreKey, newProvidersStore, successCb, errorCb);
				} else {
					// Update providers store to say this provider does exist
					returnObj[providersStoreKey][provider] = true;
					storeKeyVal(providersStoreKey, returnObj[providersStoreKey], successCb, errorCb);
				}
			});
		}, errorCb);
	};

	this.deleteNotesForProvider = function(provider, successCb, errorCb) {
		// First check that provider exists
		chrome.storage.local.get(providersStoreKey, function(returnObj) {
			if (chrome.runtime.lastError != null) { if (errorCb) errorCb(chrome.runtime.lastError); return; }
			if (returnObj[providersStoreKey] == null || returnObj[providersStoreKey][provider] == null) {
				// Either providers store is empty or provider does not exist
				if (errorCb) errorCb("Provider " + provider + " does not exist");
			} else {
				// Delete provider from providers store
				returnObj[providersStoreKey][provider] = null;
				storeKeyVal(providersStoreKey, returnObj[providersStoreKey], function() {
					storeKeyVal(provider, null, successCb, errorCb);
				}, errorCb);
			}
		});
	};

	/* Returns all notes from all providers */
	this.getAllNotes = function(successCb, errorCb) {
		var allNotes = [];
		console.log("Trying to get notes");
		chrome.storage.local.get(providersStoreKey, function(returnObj) {
			if (chrome.runtime.lastError) { if (errorCb) errorCb(chrome.runtime.lastError); return; }
			var providers = returnObj.providers;
			var provider;
			var numProvidersQueried = 0;
			for (provider in providers) {
				// Iterate over all provider names

				(function(provider) { // Closure needed to bind provider to function
					console.log("Getting notes for provider: " + provider);
					chrome.storage.local.get(provider, function(retObj) {
						if (chrome.runtime.lastError) { if (errorCb) errorCb(chrome.runtime.lastError); return; }
						var notes = retObj[provider];
						for (var idx in notes) {
							allNotes.push(notes[idx]);
						}
						numProvidersQueried++;
						console.log("Added provider: " + provider);
						console.dir(allNotes);
						console.log("Providers done: " + numProvidersQueried);
						console.log("Total num providers: " + Object.keys(providers).length);
						if (numProvidersQueried == Object.keys(providers).length) {
							// Means all providers are done being queried
							console.log("Callback with all notes triggered");
							successCb(allNotes);
						}
					});
				})(provider);
			}
		});
	};

	this.refreshAllProviderNotes = function(successCb, errorCb) {
		console.log("Refreshing all provider notes");
		var provider;
		for (var providerName in _providers) {
			provider = _providers[providerName];
			(function(provider) {
				_this.getCredsForProvider(provider.name, function(creds) {
					if (creds == null) {
						errorCb("Creds for provider: " + provider + " is null");
						return;
					}
					console.log("Refreshing notes for "+provider.name+" now!");
					provider.saveNotes(creds, successCb, errorCb);
				}, errorCb);
			})(provider);
		}
	};

	/* End note methods */

	/* Creds stuff */

	this.getCredsStore = function(successCb, errorCb) {
		console.log("Gettig provider auth info");
		chrome.storage.local.get(credsStoreKey, function(returnObj) {
			if (chrome.runtime.lastError) { if (errorCb) errorCb(chrome.runtime.lastError); return; }
			console.log(returnObj);
			successCb(returnObj[credsStoreKey]);
		});
	};

	this.getCredsForProvider = function(provider, successCb, errorCb) {
		console.log("Getting creds for provider: " + provider);
		chrome.storage.local.get(credsStoreKey, function(returnObj) {
			if (chrome.runtime.lastError) { if (errorCb) errorCb(chrome.runtime.lastError); return; }
			if (returnObj[credsStoreKey] == null) {
				return null;
			} else {
				successCb(returnObj[credsStoreKey][provider]);
			}
		});
	};

	this.saveCredsForProvider = function(provider, creds, successCb, errorCb) {
		chrome.storage.local.get(credsStoreKey, function(returnObj) {
			if (chrome.runtime.lastError) { if (errorCb) errorCb(chrome.runtime.lastError); return; }
			if (returnObj[credsStoreKey] == null) {
				// Create new creds store
				console.log("Creating new creds store");
				var newCredsStore = {};
				newCredsStore[provider] = creds;
				storeKeyVal(credsStoreKey, newCredsStore, successCb, errorCb);
			} else {
				console.log("Adding new creds");
				returnObj[credsStoreKey][provider] = creds;
				storeKeyVal(credsStoreKey, returnObj[credsStoreKey], successCb, errorCb);
			}
		});
	};

	this.deleteCredsForProvider = function(provider, successCb, errorCb) {
		chrome.storage.local.get(credsStoreKey, function(returnObj) {
			if (chrome.runtime.lastError) { if (errorCb) errorCb(chrome.runtime.lastError); return; }
			console.log("Trying to delete creds for provider: " + provider);
			if (returnObj[credsStoreKey] == null || returnObj[credsStoreKey][provider] == null) {
				if (errorCb)
					errorCb("Unable to delete creds for provider: " + provider);
			} else {
				returnObj[credsStoreKey][provider] = null;
				storeKeyVal(credsStoreKey, returnObj[credsStoreKey], successCb, errorCb);
			}
		});
	};

	/* End access creds stuff */

	// Private functions

	/* Wrapper around chrome.storage.local.set to make syntax easier to use */
	function storeKeyVal(key, val, successCb, errorCb) {
		console.log("Storing key: " + JSON.stringify(key) + " with val: " + JSON.stringify(val));
		var obj = {};
		obj[key] = val;
		chrome.storage.local.set(obj, function() {
			if (chrome.runtime.lastError && errorCb) {
				errorCb(chrome.runtime.lastError);
			} else if (successCb) {
				successCb();
			}
		});
	}
}

var _chromeStorageWrapper = new ChromeStorageWrapper();