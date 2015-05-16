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
			// Step one: Get auth token and secret
			oauth.request({
				'method': 'GET', 
				'url': hostName + '/oauth', 
				'success': function(res) {
					console.log("Evernote getting creds");
					console.print(_config.redirectUri);
					var resArray = res.text.split('&');
					if (resArray.length < 2) { errorCb("Evernote response for oauth invalid: " + resArray); return; }
					console.print(res.text);
					var oauthToken = resArray[0].split('=')[1];
					var oauthTokenSecret = resArray[1].split('=')[1];

					// Step two: redirect user to Evernote to log in to verify our token
					chrome.identity.launchWebAuthFlow({
						url: _providers.evernote.url.redirect_authorize+'?'+
						'oauth_token='+oauthToken,
						interactive: true
					}, function(getVerifierUrl) {

						// Get verifier from url on callback from Evernote
						var oauthVerifier = $.getUrlParam("oauth_verifier", getVerifierUrl);
						if (oauthVerifier == null) { errorCb("Could not get verifier from Evernote"); return; }
						oauth.setVerifier(oauthVerifier);
						oauth.setAccessToken([oauthToken,oauthTokenSecret]);

						// Last step: Get access token
						oauth.request({
							'method': 'GET', 
							'url': hostName + '/oauth',
           					'success': function(finalRes) {
           						if (finalRes == null || finalRes.text == null) { errorCb("Could not do final stage of getting access token from Evernote"); return; }
           						var noteStoreUrl = $.paramFromText('edam_noteStoreUrl', finalRes.text);
           						var accessToken = $.paramFromText('oauth_token', finalRes.text);
           						successCb({'note_store_url': noteStoreUrl, 'access_token': accessToken});
           					}, 
           					'failure': errorCb
           				});
					});
				}, 
				'failure': errorCb
			});
		},
		saveNotes: function(creds, successCb, errorCb) {
			console.log("Saving notes for Evernote");
			var noteStoreTransport = new Thrift.BinaryHttpTransport(creds['note_store_url']);
			var noteStoreProtocol = new Thrift.BinaryProtocol(noteStoreTransport);
			var noteStore = new NoteStoreClient(noteStoreProtocol);

			// First, find remember tag
			noteStore.listTags(creds['access_token'], function (tags) {
			        if (tags == null) { errorCb("No tags"); return; }
			        console.log("Got tags");

			        // Search through all tags
			        for (var idx in tags) {
			        	var tag = tags[idx];

			        	if (tag.name.toLowerCase() == "remember") {
			        		console.log("Found remember tag in evernote!");

			        		var rememberTagGuid = tag.guid;
			        		var filter = new NoteFilter();
			        		filter.tagGuids = [rememberTagGuid];
			        		var spec = new NotesMetadataResultSpec();
			        		spec.includeTitle = true;
			        		spec.includeNotebookGuid = true;

			        		// Get notes with the remember tag (using the NoteFilter obj)
			        		noteStore.findNotesMetadata(creds['access_token'], filter, 0, 1000, spec, function(retObj) {
			        			console.print("Found all Evernote remember notes: ", retObj);
			        			if (retObj == null || retObj.notes == null) { return; } // Maybe do errorCb

			        			var notes = retObj.notes;
			        			var notesToSave = []; // will hold all notes we get
			        			var noteUrlPrefix = "https://www.evernote.com/Home.action#st=p&n=";
			        			var numNotesSaved = 0;

			        			// We have to make queries for each note to get the notebook title
			        			var notebookTitles = {}; // Cache those we already have

			        			for (var idx in notes) {
			        				var note = notes[idx];

			        				if (notebookTitles[note.notebookGuid] == null) {
			        					// Case where notebook title was note cached. We must query Evernote API.
			        					(function(note) { // Closure needed bec we are in for loop with changing 'note' variable
				        					noteStore.getNotebook(creds['access_token'], note.notebookGuid, function(notebookData) {
				        						notesToSave.push(new Note(_providers.evernote.name, note.guid, notebookData.name + ": " + note.title, noteUrlPrefix+note.guid));

				        						// We must only update our saved notes after all notes have been saved. Each is async, so all have to check if we are done
					        					numNotesSaved++;
					        					if (numNotesSaved == notes.length) {
					        						_storage.updateNotesForProvider(_providers.evernote.name, notesToSave, successCb, errorCb);
					        					}
				        					});
			        					})(note);

			        				} else {
			        					notesToSave.push(new Note(_providers.evernote.name, note.guid, notebookName + ": " + note.title, noteUrlPrefix+note.guid));

			        					// We must only update our saved notes after all notes have been saved. Each is async, so all have to check if we are done
			        					numNotesSaved++;
			        					if (numNotesSaved == notes.length) {
			        						_storage.updateNotesForProvider(_providers.evernote.name, notesToSave, successCb, errorCb);
			        					}
			        				}
			        			}
			        		});
			        		return;
			        	}
			        }
			    },
			    function onerror(error) {
			        errorCb(error);
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

		getCreds: function(successCb, errorCb) {
			// First, get req token
			ajaxPost(_providers.pocket.url.request, {
				consumer_key: _providers.pocket.consumerKey,
				redirect_uri: _config.redirectUri
			}, 'application/x-www-form-urlencoded; charset=UTF8', true,
			function(res) {
				if (res == null) { errorCb(); return; }
				var requestToken = JSON.parse(res).code;

				// Then redirect user to verify req token
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

						// Access token now valid. Can save
						var json = JSON.parse(res);
						successCb({access_token: json.access_token, username: json.username});
					}, errorCb);
				});
			}, errorCb);
		},
		
		saveNotes: function(creds, successCb, errorCb) {

			// First, get notes using ajax
			ajaxPost(_providers.pocket.url.get, {
				access_token: creds['access_token'],
				consumer_key: _providers.pocket.consumerKey,
				tag: _config.defaultTag
			}, 'application/json; charset=UTF8', true, function(res) {
				if (res == null) { errorCb("Error getting pocket data."); return; }
				var json = JSON.parse(res);
				if (json.error !== null) {console.error(res.error); return; }

				var pocketNoteObj;
				var notesToSave = [];
				for (var idx in json.list) {
					pocketNoteObj = json.list[idx];
					notesToSave.push(new Note(_providers.pocket.name, pocketNoteObj.resolved_id, pocketNoteObj.resolved_title, pocketNoteObj.resolved_url));
				}
				
				_storage.updateNotesForProvider(_providers.pocket.name, notesToSave, successCb, errorCb);
			}, errorCb);
		}
	})
			
};