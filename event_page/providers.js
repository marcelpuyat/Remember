var _providers = {

	evernote: new Provider({
		id: _config.providerToIdMap.evernote,
		name: 'evernote',
		readableName: 'Evernote',
		icon: 'images/evernote_icon.png',
		url: {
			redirect_authorize: 'https://www.evernote.com/OAuth.action'
		},
		getCreds: function(successCb, errorCb) {
			var hostName = "https://www.evernote.com";
			var options,oauth;
			options = {
				consumerKey: "marcelp0-7910",
				consumerSecret: "3dcc555c8a1b5f01",
				callbackUrl : _config.redirectUri,
				signatureMethod : "HMAC-SHA1",
			};
			oauth = OAuth(options);
			oauth.request({
				'method': 'GET', 
				'url': hostName + '/oauth', 
				'success': function(res) {
					console.log(_config.redirectUri);
					var resArray = res.text.split('&');
					if (resArray.length < 2) { errorCb("Evernote response for oauth invalid: " + resArray); return; }
					console.log(res.text);
					var oauthToken = resArray[0].split('=')[1];
					var oauthTokenSecret = resArray[1].split('=')[1];
					chrome.identity.launchWebAuthFlow({
						url: _providers.evernote.url.redirect_authorize+'?'+
						'oauth_token='+oauthToken,
						interactive: true
					}, function(getVerifierUrl) {
						var oauthVerifier = $.urlParam("oauth_verifier", getVerifierUrl);
						if (oauthVerifier == null) { errorCb("Could not get verifier from Evernote"); return; }
						oauth.setVerifier(oauthVerifier);
						oauth.setAccessToken([oauthToken,oauthTokenSecret]);
						oauth.request({
							'method': 'GET', 
							'url': hostName + '/oauth',
           					'success': function(finalRes) {
           						if (finalRes == null || finalRes.text == null) { errorCb("Could not do final stage of getting access token from Evernote"); return; }
           						var noteStoreUrl = $.paramFromText('edam_noteStoreUrl', finalRes.text);
           						var accessToken = $.paramFromText('oauth_token', finalRes.text);
           						successCb({'note_store_url': noteStoreUrl, 'access_token': accessToken});
           					}, 
           					'failure': function(err) {
           						console.error(err);
           						errorCb(err);
           						return;
           					}
           				});
					});
				}, 
				'failure': function(error) {
					console.error("Error: " + error);
				}
			});
		},
		saveNotes: function(creds) {
			console.log("Saving notes for Evernote");
			var noteStoreTransport = new Thrift.BinaryHttpTransport(creds['note_store_url']);
			var noteStoreProtocol = new Thrift.BinaryProtocol(noteStoreTransport);
			var noteStore = new NoteStoreClient(noteStoreProtocol);

			noteStore.listTags(creds['access_token'], function (tags) {
			        if (tags == null) { console.error("No tags"); return; } // Maybe do errorCb
			        console.log("Got tags");
			        for (var idx in tags) {
			        	var tag = tags[idx];
			        	console.log("Going over tag: " + tag.name);
			        	if (tag.name.toLowerCase() == "remember") {
			        		console.log("Found remember tag!");
			        		var rememberTagGuid = tag.guid;
			        		var filter = new NoteFilter();
			        		filter.tagGuids = [rememberTagGuid];
			        		var spec = new NotesMetadataResultSpec();
			        		spec.includeTitle = true;
			        		noteStore.findNotesMetadata(creds['access_token'], filter, 0, 1000, spec, function(retObj) {
			        			console.log("Found all remember notes");
			        			console.dir(retObj);
			        			if (retObj == null || retObj.notes == null) { return; } // Maybe do errorCb
			        			var notes = retObj.notes;
			        			var notesToSave = [];
			        			var noteUrlPrefix = "https://www.evernote.com/Home.action#st=p&n=";
			        			for (var idx in notes) {
			        				var note = notes[idx];
			        				var noteUrl = 
			        				notesToSave.push(new Note(_providers.evernote.name, note.guid, note.title, noteUrlPrefix+note.guid));
			        			}
			        			_chromeStorageWrapper.updateNotesForProvider(_providers.evernote.name, notesToSave);
			        		});
			        		return;
			        	}
			        }
			    },
			    function onerror(error) {
			        console.error(error);
			    }
			);
		}
	}),



	pocket: new Provider({
		id: _config.providerToIdMap.pocket,
		name: 'pocket',
		readableName: 'Pocket',
		icon: 'images/pocket_icon.png',
		url: {
			request : 'https://getpocket.com/v3/oauth/request',
			redirect_authorize: 'https://getpocket.com/auth/authorize',
			authorize : 'https://getpocket.com/v3/oauth/authorize',
			get: 'https://getpocket.com/v3/get',
			add: 'https://getpocket.com/v3/add',
			modify: 'https://getpocket.com/v3/send'
		},
		consumerKey: '41045-c15029fc5174a3c9f01a4278',

		getCreds: function (successCb, errorCb) {
			ajaxPost(_providers.pocket.url.request, {
				consumer_key: _providers.pocket.consumerKey,
				redirect_uri: _config.redirectUri
			}, 'application/x-www-form-urlencoded; charset=UTF8', true,
			function(res) {
				if (res == null) { errorCb(); return; }
				var requestToken = JSON.parse(res).code;

				chrome.identity.launchWebAuthFlow({
					url: _providers.pocket.url.redirect_authorize+'?'+
					'redirect_uri='+_config.redirectUri+'&'+
					'request_token='+requestToken,
					interactive: true
				}, function() {
					// At this point, request token is authorized and we can get access token
					ajaxPost(_providers.pocket.url.authorize, {
						consumer_key: _providers.pocket.consumerKey,
						code: requestToken
					}, 'application/x-www-form-urlencoded; charset=UTF8', true,
					function(res) {
						if (res == null) { errorCb(); return; }
						var json = JSON.parse(res);
						successCb({access_token: json.access_token, username: json.username});
					});
				});
			});
		},
		
		saveNotes: function(creds) {
			ajaxPost(_providers.pocket.url.get, {
				access_token: creds['access_token'],
				consumer_key: _providers.pocket.consumerKey,
				tag: _config.defaultTag
			}, 'application/json; charset=UTF8', true, function(res) {
				if (res == null) { console.error("Error getting pocket data."); return; }
				var json = JSON.parse(res);
				if (json.error !== null) {console.error(res.error); return; }
				var pocketNoteObj;
				var notesToSave = [];
				for (var idx in json.list) {
					pocketNoteObj = json.list[idx];
					notesToSave.push(new Note(_providers.pocket.name, pocketNoteObj.resolved_id, pocketNoteObj.resolved_title, pocketNoteObj.resolved_url));
				}
				_chromeStorageWrapper.updateNotesForProvider(_providers.pocket.name, notesToSave);
			});
		}
	})
			
}