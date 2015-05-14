function ChromeStorageWrapper() {
	var _this = this;
	// Keys for various key value stores
	var providersStoreKey = "providers";
	var credsStoreKey = "creds";
	var lastPopupTimeKey = "lastPopup";

	/* Popup methods */

	this.updateLastPopupTime = function() {
		var currTime = (new Date()).getTime();
		console.log("Setting last popup time to: " + currTime);
		storeKeyVal(lastPopupTimeKey, currTime);
	};

	this.getLastPopupTime = function(callback) {
		chrome.storage.local.get(lastPopupTimeKey, function(returnObj) {
			callback(returnObj[lastPopupTimeKey]);
		});
	};

	/* End popup methods */

	/* Note methods */

	/* Will erase all notes previously associated with provider and update them
	 * to just include the ones passed in here */
	this.updateNotesForProvider = function(provider, notes) {
		storeKeyVal(provider, notes);
		chrome.storage.local.get(providersStoreKey, function(returnObj) {
			if (returnObj[providersStoreKey] == null) {
				// Create new providers store
				var newProvidersStore = {};
				newProvidersStore[provider] = true;
				console.log("Creating new provider store: " + JSON.stringify(newProvidersStore));
				storeKeyVal(providersStoreKey, newProvidersStore);
			} else {
				returnObj[providersStoreKey][provider] = true;
				storeKeyVal(providersStoreKey, returnObj[providersStoreKey]);
			}
		});
	};

	this.deleteNotesForProvider = function(provider, successCb, errorCb) {
		chrome.storage.local.get(providersStoreKey, function(returnObj) {
			if (returnObj[providersStoreKey] == null || returnObj[providersStoreKey][provider] == null) {
				if (errorCb)
					errorCb("Provider " + provider + " does not exist");
			} else {
				returnObj[providersStoreKey][provider] = null;
				storeKeyVal(providersStoreKey, returnObj[providersStoreKey], successCb, errorCb);
				storeKeyVal(provider, null, successCb, errorCb);
			}
		});
	}

	/* Returns all notes from all providers */
	this.getNotes = function(callback) {
		var allNotes = [];
		console.log("Trying to get notes");
		chrome.storage.local.get(providersStoreKey, function(returnObj) {
			var providers = returnObj.providers;
			var provider;
			var numProvidersQueried = 0;
			for (provider in providers) {
				// Iterate over all provider names
				(function(provider) {
					console.log("Getting notes for provider: " + provider);
					chrome.storage.local.get(provider, function(retObj) {
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
							callback(allNotes);
						}
					});
				})(provider);
			}
		});
	};

	this.refreshAllProviderNotes = function() {
		console.log("Refreshing all provider notes");
		var provider;
		for (var providerName in _providers) {
			provider = _providers[providerName];
			_this.getStoredCreds(provider.name, function(creds) {
				if (creds == null) {
					console.error("Creds for provider: " + provider + " is null");
					return;
				}
				console.log("Refreshing notes now!");
				provider.saveNotes(creds);
			});
		}
	};

	/* End note methods */

	/* Creds stuff */

	this.getCredsStore = function(callback) {
		console.log("Gettig provider auth info");
		chrome.storage.local.get(credsStoreKey, function(returnObj) {
			console.log(returnObj);
			callback(returnObj[credsStoreKey]);
		});
	}

	this.getStoredCreds = function(provider, callback) {
		console.log("Getting creds for provider: " + provider);
		chrome.storage.local.get(credsStoreKey, function(returnObj) {
			if (returnObj[credsStoreKey] == null) {
				return null;
			} else {
				callback(returnObj[credsStoreKey][provider]);
			}
		});
	};

	this.saveCredsForProvider = function(provider, creds) {
		chrome.storage.local.get(credsStoreKey, function(returnObj) {
			if (returnObj[credsStoreKey] == null) {
				// Create new creds store
				console.log("Creating new creds store");
				var newCredsStore = {};
				newCredsStore[provider] = creds;
				storeKeyVal(credsStoreKey, newCredsStore);
			} else {
				console.log("Adding new creds");
				returnObj[credsStoreKey][provider] = creds;
				storeKeyVal(credsStoreKey, returnObj[credsStoreKey]);
			}
		});
	};

	this.deleteCredsForProvider = function(provider, successCb, errorCb) {
		chrome.storage.local.get(credsStoreKey, function(returnObj) {
			console.log("Trying to delete creds for provider: " + provider);
			if (returnObj[credsStoreKey] == null || returnObj[credsStoreKey][provider] == null) {
				if (errorCb)
					errorCb("Unable to delete creds for provider: " + provider);
			} else {
				returnObj[credsStoreKey][provider] = null;
				storeKeyVal(credsStoreKey, returnObj[credsStoreKey], successCb, errorCb);
			}
		});
	}

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