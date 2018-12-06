/* Copyright 2015 Club Elektricity */

(function () {
	API.getWaitListPosition = function(id){
		if(typeof id === 'undefined' || id === null){
			id = API.getUser().id;
		}
		var wl = API.getWaitList();
		for(var i = 0; i < wl.length; i++){
			if(wl[i].id === id){
				return i;
			}
		}
		return -1;
	};

	var kill = function () {
		clearInterval(bot.room.autodisableInterval);
		clearInterval(bot.room.afkInterval);
		bot.status = false;
	};

	var storeToStorage = function () {
		localStorage.setItem("botsettings", JSON.stringify(bot.settings));
		localStorage.setItem("botRoom", JSON.stringify(bot.room));
		var botStorageInfo = {
			time: Date.now(),
			stored: true,
			version: bot.version
		};
		localStorage.setItem("botStorageInfo", JSON.stringify(botStorageInfo));
	};

	var subChat = function (chat, obj) {
		if (typeof chat === "undefined") {
			API.chatLog("There is a chat text missing.");
			console.log("There is a chat text missing.");
			return "[ERROR] No text message found.";
		}
		var lit = '%%';
		for (var prop in obj) {
			chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
		}
		return chat;
	};

	var loadChat = function (cb) {
		if (!cb) cb = function () {};
		$.get("https://cdn.jsdelivr.net/gh/onedollar/bot/lang/langIndex.json", function (json) {
			var link = bot.chatLink;
			if (json !== null && typeof json !== "undefined") {
				langIndex = json;
				link = langIndex[bot.settings.language.toLowerCase()];
				if (bot.settings.chatLink !== bot.chatLink) {
					link = bot.settings.chatLink;
				}
				else {
					if (typeof link === "undefined") {
						link = bot.chatLink;
					}
				}
				$.get(link, function (json) {
					if (json !== null && typeof json !== "undefined") {
						if (typeof json === "string") json = JSON.parse(json);
						bot.chat = json;
						cb();
					}
				});
			}
		});
	};

	var retrieveSettings = function () {
		var settings = JSON.parse(localStorage.getItem("botsettings"));
		if (settings !== null) {
			for (var prop in settings) {
				bot.settings[prop] = settings[prop];
			}
		}
	};

	var retrieveFromStorage = function () {
		var info = localStorage.getItem("botStorageInfo");
		if (info === null) API.chatLog(bot.chat.nodatafound);
		else {
			var settings = JSON.parse(localStorage.getItem("botsettings"));
			var room = JSON.parse(localStorage.getItem("botRoom"));
			var elapsed = Date.now() - JSON.parse(info).time;
			if ((elapsed < 1 * 60 * 60 * 1000)) {
				API.chatLog(bot.chat.retrievingdata);
				for (var prop in settings) {
					bot.settings[prop] = settings[prop];
				}
				bot.room.users = room.users;
				bot.room.afkList = room.afkList;
				bot.room.historyList = room.historyList;
				bot.room.mutedUsers = room.mutedUsers;
				bot.room.autoSkip = room.autoSkip;
				bot.room.roomstats = room.roomstats;
				bot.room.messages = room.messages;
				bot.room.queue = room.queue;
				bot.room.newBlacklisted = room.newBlacklisted;
				API.chatLog(bot.chat.datarestored);
			}
		}
	};

	String.prototype.splitBetween = function (a, b) {
		var self = this;
		self = this.split(a);
		for (var i = 0; i < self.length; i++) {
			self[i] = self[i].split(b);
		}
		var arr = [];
		for (var i = 0; i < self.length; i++) {
			if (Array.isArray(self[i])) {
				for (var j = 0; j < self[i].length; j++) {
					arr.push(self[i][j]);
				}
			}
			else arr.push(self[i]);
		}
		return arr;
	};

	var linkFixer = function (msg) {
		var parts = msg.splitBetween('<a href="', '<\/a>');
		for (var i = 1; i < parts.length; i = i + 2) {
			var link = parts[i].split('"')[0];
			parts[i] = link;
		}
		var m = '';
		for (var i = 0; i < parts.length; i++) {
			m += parts[i];
		}
		return m;
	};

	var botCreator = "Gage (a.k.a Zebruh)";
	var botCreatorIDs = [];
	var bot = {
		version: "1.0",
		status: false,
		name: "Brite Bot",
		loggedInID: null,
		scriptLink: "https://cdn.jsdelivr.net/gh/onedollar/bot/main.js",
		cmdLink: "",
		chatLink: "https://cdn.jsdelivr.net/gh/onedollar/bot/lang/en.json",
		chat: null,
		loadChat: loadChat,
		retrieveSettings: retrieveSettings,
		retrieveFromStorage: retrieveFromStorage,
		settings: {
			botName: "Brite Bot",
			language: "english",
			chatLink: "https://cdn.jsdelivr.net/gh/onedollar/bot/lang/en.json",
			maximumAfk: 120,
			afkRemoval: true,
			maximumDc: 60,
			bouncerPlus: true,
			blacklistEnabled: false,
			lockdownEnabled: false,
			lockGuard: false,
			maximumLocktime: 10,
			cycleGuard: false,
			maximumCycletime: 10,
			voteSkip: true,
			voteSkipLimit: 10,
			timeGuard: true,
			maximumSongLength: 7,
			autodisable: true,
			commandCooldown: 30,
			usercommandsEnabled: true,
			lockskipPosition: 2,
			lockskipReasons: [
				["offtheme", "This song does not fit the room theme. "],
				["op", "This song is overplayed. "],
				["history", "This song has been played recently. "],
				["nosound", "This track does not have any sound. "],
				["nsfw", "This songs video/audio is not fit for our community. "],
				["unavailable", "This song is not avaliable to our users. "]
			],
			afkpositionCheck: 5,
			afkRankCheck: "ambassador",
			motdEnabled: true,
			motdInterval: 5,
			motd: "Apply for staff: [LINK COMING SOON]",
			filterChat: true,
			etaRestriction: false,
			welcome: true,
			opLink: null,
			rulesLink: null,
			themeLink: null,
			fbLink: null,
			youtubeLink: null,
			website: null,
			intervalMessages: [],
			messageInterval: 5,
			songstats: false,
			commandLiteral: "+",
			blacklists: {
				NSFW: "",
				OP: "",
			}
		},
		room: {
			users: [],
			afkList: [],
			mutedUsers: [],
			bannedUsers: [],
			skippable: true,
			usercommand: true,
			allcommand: true,
			afkInterval: null,
			autoskip: false,
			autoskipTimer: null,
			autodisableInterval: null,
			autodisableFunc: function () {
				if (bot.status && bot.settings.autodisable) {
					API.sendChat('+afkdisable');
					API.sendChat('+joindisable');
				}
			},
			queueing: 0,
			queueable: true,
			currentDJID: null,
			historyList: [],
			cycleTimer: setTimeout(function () {}, 1),
			roomstats: {
				accountName: null,
				totalWoots: 0,
				totalGrabs: 0,
				totalMehs: 0,
				launchTime: null,
				songCount: 0,
				chatmessages: 0
			},
			messages: {
				from: [],
				to: [],
				message: []
			},
			queue: {
				id: [],
				position: []
			},
			blacklists: {},
			newBlacklisted: [],
			newBlacklistedSongFunction: null,
			roulette: {
				rouletteStatus: false,
				participants: [],
				countdown: null,
				startRoulette: function () {
					bot.room.roulette.rouletteStatus = true;
					bot.room.roulette.countdown = setTimeout(function () {
						bot.room.roulette.endRoulette();
					}, 60 * 1000);
					API.sendChat(bot.chat.isopen);
				},
				endRoulette: function () {
					bot.room.roulette.rouletteStatus = false;
					var ind = Math.floor(Math.random() * bot.room.roulette.participants.length);
					var winner = bot.room.roulette.participants[ind];
					bot.room.roulette.participants = [];
					var pos = Math.floor((Math.random() * API.getWaitList().length) + 1);
					var user = bot.userUtilities.lookupUser(winner);
					var name = user.username;
					API.sendChat(subChat(bot.chat.winnerpicked, {name: name, position: pos}));
					setTimeout(function (winner, pos) {
						bot.userUtilities.moveUser(winner, pos, false);
					}, 1 * 1000, winner, pos);
				}
			}
		},
		User: function (id, name) {
			this.id = id;
			this.username = name;
			this.jointime = Date.now();
			this.lastActivity = Date.now();
			this.votes = {
				woot: 0,
				grab: 0,
				meh: 0,
			};
			this.lastEta = null,
			this.afkWarningCount = 0;
			this.afkCountdown = null;
			this.inRoom = true;
			this.isMuted = false;
			this.lastDC = {
				time: null,
				position: null,
				songCount: 0
			};
			this.lastKnownPosition = null;
		},
		userUtilities: {
			getJointime: function (user) {
				return user.jointime;
			},
			getUser: function (user) {
				return API.getUSer(user.id);
			},
			updatePosition: function (user, newPos) {
				user.lastKnownPosition = newPos;
			},
			updateDC: function (user) {
				user.lastDC.time = Date.now();
				user.lastDC.position = user.lastKnownPosition;
				user.lastDC.songCount = bot.room.roomstats.songCount;
			},
			setLastActivity: function (user) {
				user.lastActivity = Date.now();
				user.afkWarningCount = 0;
				clearTimeout(user.afkCountdown);
			},
			getWarningCount: function (user) {
				return user.afkWarningCount;
			},
			setWarningCount: function (user, value){
				user.afkWarningCount = value;
			},
			lookupUser: function (id) {
				for (var i = 0; i < bot.room.users.length; i++) {
					if (bot.room.users[i].id === id) {
						return bot.room.users[i];
					}
				}
				return false;
			},
			lookupUserName: function (name){
				for (var i = 0; i < bot.room.users.length; i++) {
					var match = bot.room.users[i].username.trim() == name.trim();
					if (match) {
						return bot.room.users[i];
					}
				}
				return false;
			},
			voteRatio: function(id){
				var user = bot.userUtilities.lookupUser(id);
				var votes = user.votes;
				if (votes.meh === 0) votes.ratio = 1;
				else votes.ratio = (votes.woot / votes.meh).toFixed(2);
				return votes;
			},
			getPermission: function (obj) {
				var u;
				if (typeof obj === "object") u = obj;
				else u = API.getUser(obj);
				if (botCreatorIDs.indexOf(u.id) > -1) return 10;
				if (u.gRole < 2) return u.role;
				else {
					switch (u.gRole) {
						case 2:
							return 7;
						case 3:
							return 8;
						case 4:
							return 9;
						case 5: 
							return 10;
					}
				}
				return 0;
			},
			moveUser: function (id, pos, priority) {
				var user = bot.userUtilities.lookupUser(id);
				var wlist = API.getWaitList();
				if (API.getWaitListPosition(id) === -1) {
					if (wlist.length < 50) {
						API.moderateAddDJ(id);
						if (pos !== 0) setTimeout(function (id, pos) {
							API.moderateMoveDJ(id, pos);
						}, 1250, id, pos);
					}
					else {
						var alreadyQueued = -1;
						for (var i = 0; i < bot.room.queue.id.length; i++) {
							if (bot.room.queue.id[i] === id) alreadyQueued = i;
						}
						if (alreadyQueued !== -1) {
							bot.room.queue.position[alreadyQueued] = pos;
							return API.sendChat(subChat(bot.chat.alreadyadding, {position: bot.room.queue.position[alreadyQueued]}));
						}
						bot.roomUtilites.booth.lockBooth();
						if (priority) {
							bot.room.queue.id.unshift(id);
							bot.room.queue.position.unshift(pos);
						}
						var name = user.username;
						return API.sendChat(subChat(bot.chat.adding, {name: name, position: bot.room.queue.position.length}));
					}
				}
				else API.moderateMoveDJ(id, pos);
			},
			dclookup: function (id) {
				var user = bot.userUtilities.lookupUser(id);
				if (typeof user === 'boolean') return bot.chat.usernotfound;
				var name = user.username;
				if (user.lastDC.time === null) return subChat(bot.chat.notdisconnected, {name: name});
				var dc = user.lastDC.time;
				var pos = user.lastDC.position;
				if (pos === null) return bot.chat.noposition;
				var timeDc = Date.now() - dc;
				var validDC = false;
				if (bot.settings.maximumDc * 60 * 1000 > timeDc) {
					validDC = true;
				}
				var time = bot.roomUtilites.msToStr(timeDc);
				if (!validDC) return (subChat(bot.chat.toolongago, {name: bot.userUtilities.getUser(user).username, time: time}));
				var songsPassed = bot.room.roomstats.songCount - user.lastDC.songCount;
				var afksRemoved = 0;
				var afkList = bot.room.afkList;
				for (var i = 0; i < afkList.length; i++) {
					var timeAfk = afkList[i][1];
					var posAfk = afkList[i][2];
					if (dc < timeAfk && posAfk < pos) {
						afksRemoved++;
					}
				}
				var newPosition = user.lastDC.position - songsPassed - afksRemoved;
				if (newPosition <= 0) newPosition = 1;
				var msg = subChat(bot.chat.vaild, {name: bot.userUtilities.getUser(user).username, time: time, position: newPosition});
				bot.userUtilities.moveUser(user.id, newPosition, true);
				return msg;
			}
		},
		roomUtilites: {
			rankToNumber: function (rankString) {
				var rankInt = null;
				switch (rankString) {
					case "admin":
						rankInt = 10;
						break;
					case "ambassador":
						rankInt = 7;
						break;
					case "host":
						rankInt = 5;
						break;
					case "cohost":
						rankInt = 4;
						break;
					case "manager":
						rankInt = 3;
						break;
					case "bouncer":
						rankInt = 2;
						break;
					case "residentdj":
						rankInt = 1;
						break;
					case "user":
						rankInt = 0;
						break;
				}
				return rankInt;
			},
			msToStr: function (msTime) {
				var ms, msg, timeAway;
				msg = '';
				timeAway = {
					'days': 0,
					'hours': 0,
					'minutes': 0,
					'seconds': 0
				};
				ms = {
					'day': 24 * 60 * 60 * 1000,
					'hour': 60 * 60 * 1000,
					'minute': 60 * 1000,
					'second': 1000
				};
				if (msTime > ms.day) {
					timeAway.days = Math.floor(mstime / ms.day);
					msTime = msTime % ms.day;
				}
				if (msTime > ms.hour) {
					timeAway.hours = Math.floor(msTime / ms.hour);
					msTime = msTime % ms.hour;
				}
				if (msTime > ms.minute) {
					timeaway.minutes = Math.floor(msTime / ms.minute);
					msTime = msTime % ms.minute;
				}
				if (msTime > ms.second) {
					timeAway.seconds = Math.floor(msTime / ms.second);
				}
				if (timeAway.days !== 0) {
					msg += timeAway.days.toString() + 'd';
				}
				if (timeAway.hours !== 0) {
					msg += timeAway.hours.toString() + 'h';
				}
				if (timeAway.minutes !== 0) {
					msg += timeAway.minutes.toString() + 'm';
				}
				if (timeAway.seconds !== 0) {
					msg += timeAway.seconds.toString() + 's';
				}
				if (msg !== '') {
					return msg;
				} else {
					return false;
				}
			},
			booth: {
				lockTimer: setTimeout(function () {}, 1000),
				locked: false,
				lockBooth: function () {
					API.moderateLockWaitList(!bot.roomUtilites.booth.locked);
					bot.roomUtilites.booth.locked = false;
					if (bot.settings.lockGuard) {
						bot.roomUtilites.booth.lockTimer = setTimeout(function () {
							API.moderateLockWaitList(bot.roomUtilites.booth.locked);
						}, bot.settings.maximumLockTime * 60 * 1000);
					}
				},
				unlockBooth: function () {
					API.moderateLockWaitList(bot.roomUtilites.booth.locked);
					clearTimeout(bot.roomUtilites.booth.lockTimer);
				}
			},
			afkCheck: function () {
				if (!bot.status || !bot.settings.afkRemoval) return void (0);
				var rank = bot.roomUtilites.rankToNumber(bot.settings.afkRankCheck);
				var djlist = API.getWaitList();
				var lastPos = Math.min(djlist.length, bot.settings.afkpositionCheck);
				if (lastPos - 1 > djlist.length) return void (0);
				for (var i = 0; i < lastPos; i++) {
					if (typeof djlist[i] !== 'undefined') {
						var id = djlist[i].id;
						var user = bot.userUtilities.lookupUser(id);
						if (typeof user !== 'boolean') {
							var plugUser = bot.userUtilities.getUser(user);
							if (rank !== null && bot.userUtilities.getPermission(plugUser) <= rank) {
								var name = plugUser.username;
								var lastActive = bot.userUtilities.getLastActivity(user);
								var inactivity = Date.now() - lastActive;
								var time = bot.roomUtilities.msToStr(inactivity);
								var warncount = user.afkWarningCount;
								if (inactivity > bot.settings.maximumAfk * 60 * 1000) {
									if (warncount === 0) {
										API.sendChat(subChat(bot.chat.warning1, {name: name, time: time}));
										user.afkWarningCount = 3;
										user.afkCountdown = setTimout(function (userToChange) {
											userToChange.afkWarningCount = 2;
										}, 30 * 1000, user);
									}
									else if (warncount === 2) {
										var pos = API.getWaitListPosition(id);
										if (pos !== -1) {
											pos++;
											bot.room.afkList.push([id, Date.now(), pos]);
											user.lastDC = {
												time: null,
												position: null,
												songCount: 0
											};
											API.moderateRemoveDJ(id);
											API.sendChat(subChat(bot.chat.afkremove, {name: name, time: time, position: pos, maximumafk: bot.settings.maximumAfk}));
										}
										user.afkWarningCount = 0;
									}
								}
							}
						}
					}
				}
			},
			changeDJCycle: function () {
				var toggle = $(".cycle-toggle");
				if (toggle.hasClass("disabled")) {
					toggle.click();
					if (bot.settings.cycleGuard) {
						bot.room.cycleTimer = setTimeout(function () {
							if (toggle.hasClass("enabled")) toggle.click();
						}, bot.settings.cycleMaxTime * 60 * 1000);
					}
				}
				else {
					toggle.click();
					clearTimeout(bot.room.cycleTimer);
				}
			},
			intervalMessage: function () {
				var interval;
				if (bot.settings.motdEnabled) interval = bot.settings.motdInterval;
				else interval = bot.settings.messageInterval;
				if ((bot.room.roomstats.songCount % interval) === 0 && bot.status) {
					var msg;
					if (bot.settings.motdEnabled) {
						msg = bot.settings.motd;
					}
					else {
						if (bot.settings.intervalMessages.length === 0) return void (0);
						var messageNumber = bot.room.roomstats.songCount % bot.settings.intervalMessages.length;
						msg = bot.settings.intervalMessages[messageNumber];
					}
					API.sendChat('/me ' + msg);
				}
			},
			updateBlacklists: function () {
				for (var bl in bot.settings.blacklists) {
					bot.room.blacklists[bl] = [];
					if (typeof bot.settings.blacklists[bl] === 'function') {
						bot.room.blacklists[bl] = bot.settings.blacklists();
					}
					else if (typeof bot.settings.blacklists[bl] === 'string') {
						if (bot.settings.blacklists[bl] === '') {
							continue;
						}
						try {
							(function (l) {
								$.get(bot.settings.blacklists[l], function (data) {
									if (typeof data === 'string') {
										data = JSON.parse(data);
									}
									var list = [];
									for (var prop in data) {
										if (typeof data[prop].mid !== 'undefined') {
											list.push(data[prop].mid);
										}
									}
									bot.room.blacklists[l] = list;
								})
							})(bl);
						}
						catch (e) {
							API.chatLog('Error setting' + bl + 'blacklist.');
							console.log('Error setting' + bl + 'blacklist.');
							console.log(e);
						}
					}
				}
			},
			logNewBlacklistedSongs: function () {
				if (typeof console.table !== 'undefined') {
					console.table(bot.room.newBlacklisted);
				}
				else {
					console.log(bot.room.newBlacklisted);
				}
			},
			exportNewBlacklistedSongs: function () {
				var list = {};
				for (var i = 0; i < bot.room.newBlacklisted.length; i++) {
					var track = bot.room.newBlacklisted[i];
					list[track.list] = [];
					list[track.list].push({
						title: track.title,
						author: track.author,
						mid: track.mid
					});
				}
				return list;
			}
		},
		eventChat: function () {
			chat.message = linkFixer(chat.message);
			chat.message = chat.message.trim();
			for (var i = 0; i < bot.room.users.length; i++) {
				if (bot.room.users[i].id === chat.uid) {
					bot.userUtilities.setLastActivity(bot.room.users[i]);
					if (bot.room.users[i].username !== chat.un) {
						bot.room.users[i].username = chat.un;
					}
				}
			}
			if (bot.chatUtilities.chatFixer(chat)) return void (0);
			if (!bot.chatUtilities.chatFixer(chat))
				bot.chatUtilities.action(chat);
		},
		eventUserjoin: function (user) {
			var known = false;
			var index = null;
			for (var i = 0; i < bot.room.users.length; i++) {
				if (bot.room.users[i].id === user.id) {
					known = true;
					index = i;
				}
			}
			var greet = true;
			var welcomeback = null;
			if (known) {
				bot.room.users[index].inRoom = true;
				var u = bot.userUtilities.lookupUser(user.id);
				var jt = u.jointime;
				var t = Date.now() - jt;
				if (t < 10 * 1000) greet = false;
				else welcomeback = true;
			}
			else {
				bot.room.users.push(new bot.User(user.id, user.username));
				welcomeback = false;
			}
			for (var j = 0; j < bot.room.users.length; j++) {
				if (bot.userUtilities.getUser(bot.room.users[j]).id === user.id) {
					bot.userUtilities.setLastActivity(bot.room.users[j]);
					bot.room.users[j].jointime = Date.now();
				}
			}
			if (bot.settings.welcome && greet) {
				welcomeback ?
					setTimeout(function (user) {
						API.sendChat(subChat(bot.chat.welcomeback, {name: user.username}));
					}, 1 * 1000, user)
					:
					setTimeout(function (user) {
						API.sendChat(subChat(bot.chat.welcome, {name: user.username}));
					}, 1 * 1000, user);
			}
		},
		eventUserleave: function (user) {
			for (var i = 0; i < bot.room.users.length; i++) {
				if (bot.room.users[i].id === user.id) {
					bot.userUtilities.updateDC(bot.room.users[i]);
					bot.room.users[i].inRoom = false;
				}
			}
		},
		eventVoteupdate: function (obj) {
			for (var i = 0; i < bot.room.users.length; i++) {
				if (bot.room.users[i].id === obj.user.id) {
					if (obj.vote === 1) {
						bot.room.users[i].votes.woot++;
					}
					else {
						bot.room.users[i].votes.meh++;
					}
				}
			}
			var mehs = API.getScore().negative;
			var woots = API.getScore().positive;
			var dj = API.getDJ();
			if (bot.settings.voteSkip) {
				if ((mehs - woots) >= (bot.settings.voteSkipLimit)) {
					API.sendChat(subChat(bot.chat.voteskipexceededlimit, {name: dj.username, limit: bot.settings.voteSkipLimit}));
					API.moderateForceSkip();
				}
			}
		},
		eventCurateupdate: function (obj) {
			for (var i = 0; i < bot.room.users.length; i++) {
				if (bot.room.users[i].id === obj.user.id) {
					bot.room.users[i].votes.curate++;
				}
			}
		},
		eventDjadvance: function (obj) {
			var user = bot.userUtilities.lookupUser(obj.dj.id)
			for(var i = 0; i < bot.room.users.length; i++){
				if(bot.room.users[i].id === user.id){
					bot.room.user[i].lastDC = {
						time: null,
						position: null,
						songCount: 0
					};
				}
			}
			var lastplay = obj.lastPlay;
			if (typeof lastplay === 'undefined') return;
			if (bot.settings.songstats) {
				if (typeof bot.chat.songstatistics === "undefined") {
					API.sendChat("/me" + lastplay.media.author + " - " + lastplay.media.title + ": " + lastplay.score.positive + "W/" + lastplay.score.grabs + "G/" + lastplay.score.negative + "M.")
				}
				else {
					API.sendChat(subChat(bot.chat.songstatistics, {artist: lastplay.media.author, title: lastplay.media.title, woots: lastplay.score.positive, grabs: lastplay.score.grabs, mehs: lastplay.score.negative}))
				}
			}
			bot.room.roomstats.totalWoots += lastplay.score.positive;
			bot.room.roomstats.totalMehs += lastplay.score.negative;
			bot.room.roomstats.totalGrabs += lastplay.score.grabs;
			bot.room.roomstats.songCount++;
			bot.roomUtilites.intervalMessage();
			bot.room.room.currentDJID = obj.dj.id;
			var mid = obj.media.format + ':' + obj.media.cid;
			for (var bl in bot.room.blacklists) {
				if (bot.settings.blacklistEnabled) {
					if (bot.room.blacklists[bl].indexOf(mid) > -1) {
						API.sendChat(subChat(bot.chat.isblacklisted, {blacklist: bl}));
						return API.moderateForceSkip();
					}
				}
			}
			var alreadyPlayed = false;
			for (var i = 0; i < bot.room.historyList.length; i++) {
				if (bot.room.historyList[i][0] === obj.media.cid) {
					var firstPlayed = bot.room.historyList[i][1];
					var plays = bot.room.historyList[i].length - 1;
					var lastPlayed = bot.room.historyList[i][plays];
					API.sendChat(subChat(bot.chat.songknown, {plays: plays, timetotal: bot.roomUtilites.msToStr(Date.now() - firstPlayed), lasttime: bot.roomUtilites.msToStr(Date.now() - lastPlayed)}));
					bot.room.historyList[i].push(+new Date());
					alreadyPlayed = true;
				}
			}
			if (!alreadyPlayed) {
				bot.room.historyList.push([obj.media.cid, +new Date()]);
			}
			var newMedia = obj.media;
			if (bot.settings.timeGuard && newMedia.duration > bot.settings.maximumSongLength * 60 && !bot.room.roomevent) {
				var name = obj.dj.username;
				API.sendChat(subChat(bot.chat.timelimit, {name: name, maxlength: bot.settings.maximumSongLength}));
				API.moderateForceSkip();
			}
			if (user.ownSong) {
				API.sendChat(subChat(bot.chat.permissionownsong, {name: user.username}));
				user.ownSong = false;
			}
			clearTimeout(bot.room.autoskipTimer);
			if (bot.room.autoskip) {
				var remaining = obj.media.duration * 1000;
				bot.room.autoskipTimer = setTimeout(function () {
					console.log("Skipping track.");
					API.sendChat('Song stuck, skipping...');
					API.moderateForceSkip();
				}, remaining + 3000);
			}
			storeToStorage();
		},
		eventWaitlistupdate: function (users) {
			if (users.length < 50) {
				if (bot.room.queue.id.length > 0 && bot.room.queueable) {
					bot.room.queueable = false;
					setTimeout(function () {
						bot.room.queueable = true;
					}, 500);
					bot.room.queueing++;
					var id, pos;
					setTimeout(
						function () {
							id = bot.room.queue.id.splice(0, 1)[0];
							pos = bot.room.queue.position.splice(0, 1)[0];
							API.moderateAddDJ(id, pos);
							setTimeout(
								function (id, pos) {
									API.moderateMoveDJ(id, pos);
									bot.room.queueing--;
									if (bot.room.queue.id.length === 0) setTimeout(function () {
										bot.roomUtilites.booth.unlockBooth();
									}, 1000);
								}, 1000, id, pos);
						}, 1000 + bot.room.queueing * 2500);
				}
			}
			for (var i = 0; i < users.length; i++) {
				var user = bot.userUtilities.lookupUser(users[i].id);
				bot.userUtilities.updatePosition(user, API.getWaitListPosition(users[i].id) + 1);
			}
		},
		chatcleaner: function (chat) {
			if (!bot.settings.filterChat) return false;
			if (bot. userUtilities.getPermission(chat.uid) > 1) return false;
			var msg = chat.message;
			var containsLetters = false;
			for (var i = 0; i < msg.length; i++) {
				ch = msg.charAt(i);
				if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
			}
			if (msg === '') {
				return true;
			}
			if (!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
			msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&@#]/g, '');
			var capitals = 0;
			var ch;
			for (var i = 0; i < msg.length; i++) {
				ch.msg.charAt(i);
				if (ch >= 'A' && ch <= 'Z') capitals++;
			}
			if (capitals >= 40) {
				API.sendChat(subChat(bot.chat.caps, {name: chat.un}));
				return true;
			}
			msg = msg.toLowerCase();
			if (msg === 'skip') {
				API.sendChat(subChat(bot.chat.askskip, {name: chat.un}));
				return true;
			}
			for (var j = 0; j < bot.chatUtilities.spam.length; j++) {
				if (msg === bot.chatUtilities.spam[j]) {
					API.sendChat(subChat(bot.chat.spam, {name: chat.un}));
					return true;
				}
			}
			return false;
		},
		chatUtilities: {
			chatFilter: function (chat) {
				var msg = chat.message;
				var perm = bot.userUtilities.getPermission(chat.uid);
				var user = bot.userUtilities.lookupUser(chat.uid);
				var isMuted = false;
				for (var i = 0; i < bot.room.mutedUsers.length; i++) {
					if (bot.room.mutedUsers[i] === chat.uid) isMuted = true;
				}
				if (isMuted) {
					API.moderateDeleteChat(chat.cid);
					return true;
				}
				if (bot.settings.lockdownEnabled) {
					if (perm === 0) {
						API.moderateDeleteChat(chat.cid);
						return true;
					}
				}
				if (bot.chatcleaner(chat)) {
					API.moderateDeleteChat(chat.cid);
					return true;
				}
				if (msg.indexOf('http://adf.ly/') > -1) {
					API.moderateDeleteChat(chat.cid);
					API.sendChat(subChat(bot.chat.adfly, {name: chat.un}));
					return true;
				}
				if (msg.indexOf('autojoin was not enabled') > 0 || msg.indexOf('AFK message was not enabled') > 0 || msg.indexOf('+afkdisable') > 0 || msg.indexOf('+joindisable') > 0 || msg.indexOf('autojoin disabled') > 0 || msg.indexOf('AFK message disabled') > 0) {
					API.moderateDeleteChat(chat.cid);
					return true;
				}
				var rlJoinChat = bot.chat.roulettejoin;
				var rlLeaveChat = bot.chat.rouletteleave;
				var joinedroulette = rlJoinChat.split('%%NAME%%');
				if (joinedroulette[1].length > joinedroulette[0].length) joinedroulette = joinedroulette[1];
				else joinedroulette = joinedroulette[0];
				var leftroulette = rlLeaveChat.split('%%NAME%%');
				if (leftroulette[1].length > leftroulette[0].length) leftroulette = leftroulette[1];
				else leftroulette = leftroulette[0];
				if ((msg.indexOf(joinedroulette) > -1 || msg.indexOf(leftroulette) > -1) && chat.uid === bot.loggedInID) {
					setTimeout(function (id) {
						API.moderateDeleteChat(id);
					}, 2 * 1000, chat.uid);
				}
				return false;
			},
			commandCheck: function (chat) {
				var cmd;
				if (chat.message.charAt(0) === '+') {
					var space = chat.message.indexOf(' ');
					if (space === - 1) {
						cmd = chat.message;
					}
					else cmd = chat.message.substring(0, space);
				}
				else return false;
				var userPerm = bot.userUtilities.getPermission(chat.uid);
				if (chat.message !== "+join" && chat.message !== "+leave") {
					if (userPerm === 0 && !bot.room.usercommand) return void (0);
					if (!bot.room.allcommand) return void (0);
				}
				if (chat.message === '+eta' && bot.settings.etaRestriction) {
					if (userPerm < 2) {
						var u = bot.userUtilities.lookupUser(chat.uid);
						if (u.lastEta !== null && (Date.now() - u.lastEta) < 1 * 60 * 60 * 1000) {
							API.moderateDeleteChat(chat.cid);
							return void (0);
						}
						else u.lastEta = Date.now();
					}
				}
				var executed = false;
				for (var comm in bot.commands) {
					var cmdCall = bot.commands[comm].command;
					if (!Array.isArray(cmdCall)) {
						cmdCall = [cmdCall]
					}
					for (var i = 0; i < cmdCall.length; i++) {
						if (bot.settings.commandLiteral + cmdCall[i] === cmd) {
							bot.commands[comm].functionality(chat, bot.settings.commandLiteral + cmdCall[i]);
							executed = true;
							break;
						}
					}
				}
				if (executed && userPerm === 0) {
					bot.room.usercommand = false;
					setTimeout(function () {
						bot.room.usercommand = true;
					}, bot.settings.commandCooldown * 1000);
				}
				if (executed) {
					API.moderateDeleteChat(chat.cid);
					bot.room.allcommand = false;
					setTimeout(function () {
						bot.room.allcommand = true;
					}, 5 * 1000);
				}
				return executed;
			},
			action: function (chat) {
				var user = bot.userUtilities.lookupUser(chat.uid);
				if (chat.type === 'message') {
					for (var j = 0; j < bot.room.users.length; j++) {
						if (bot.userUtilities.getUser(bot.room.users[j]).id === chat.uid) {
							bot.userUtilities.setLastActivity(bot.room.users[j]);
						}
					}
				}
				bot.room.roomstats.chatmessages++;
			},
			spam: [
				'hueh', 'hu3', 'brbr', 'heu', 'brbr', 'kkkk', 'spoder', 'mafia', 'zuera', 'zueira',
                'zueria', 'aehoo', 'aheu', 'alguem', 'algum', 'brazil', 'zoeira', 'fuckadmins', 'affff', 'vaisefoder', 'huenaarea',
                'hitler', 'ashua', 'ahsu', 'ashau', 'lulz', 'huehue', 'hue', 'huehuehue', 'merda', 'pqp', 'puta', 'mulher', 'pula', 'retarda', 'caralho', 'filha', 'ppk',
                'gringo', 'fuder', 'foder', 'hua', 'ahue', 'modafuka', 'modafoka', 'mudafuka', 'mudafoka', 'ooooooooooooooo', 'foda'
			],
			curses: [
				'nigger', 'faggot', 'nigga', 'niqqa', 'motherfucker', 'modafocka'
			]

		},
		connectAPI: function() {
			this.proxy = {
				eventChat: $.proxy(this.eventChat, this),
				eventUserskip: $.proxy(this.eventUserskip, this),
                eventUserjoin: $.proxy(this.eventUserjoin, this),
                eventUserleave: $.proxy(this.eventUserleave, this),
                eventUserfan: $.proxy(this.eventUserfan, this),
                eventFriendjoin: $.proxy(this.eventFriendjoin, this),
                eventFanjoin: $.proxy(this.eventFanjoin, this),
                eventVoteupdate: $.proxy(this.eventVoteupdate, this),
                eventCurateupdate: $.proxy(this.eventCurateupdate, this),
                eventRoomscoreupdate: $.proxy(this.eventRoomscoreupdate, this),
                eventDjadvance: $.proxy(this.eventDjadvance, this),
                eventDjupdate: $.proxy(this.eventDjupdate, this),
                eventWaitlistupdate: $.proxy(this.eventWaitlistupdate, this),
                eventVoteskip: $.proxy(this.eventVoteskip, this),
                eventModskip: $.proxy(this.eventModskip, this),
                eventChatcommand: $.proxy(this.eventChatcommand, this),
                eventHistoryupdate: $.proxy(this.eventHistoryupdate, this)
			};
			API.on(API.CHAT, this.proxy.eventChat);
            API.on(API.USER_SKIP, this.proxy.eventUserskip);
            API.on(API.USER_JOIN, this.proxy.eventUserjoin);
            API.on(API.USER_LEAVE, this.proxy.eventUserleave);
            API.on(API.USER_FAN, this.proxy.eventUserfan);
            API.on(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.on(API.GRAB_UPDATE, this.proxy.eventCurateupdate);
            API.on(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.on(API.ADVANCE, this.proxy.eventDjadvance);
            API.on(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.on(API.MOD_SKIP, this.proxy.eventModskip);
            API.on(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.on(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
		},
		disconnectAPI: function () {
            API.off(API.CHAT, this.proxy.eventChat);
            API.off(API.USER_SKIP, this.proxy.eventUserskip);
            API.off(API.USER_JOIN, this.proxy.eventUserjoin);
            API.off(API.USER_LEAVE, this.proxy.eventUserleave);
            API.off(API.USER_FAN, this.proxy.eventUserfan);
            API.off(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.off(API.CURATE_UPDATE, this.proxy.eventCurateupdate);
            API.off(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.off(API.ADVANCE, this.proxy.eventDjadvance);
            API.off(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.off(API.MOD_SKIP, this.proxy.eventModskip);
            API.off(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.off(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        startup: function () {
            Function.prototype.toString = function () {
                return 'Function.'
            };
            var u = API.getUser();
            if (bot.userUtilities.getPermission(u) < 2) return API.chatLog(bot.chat.greyuser);
            if (bot.userUtilities.getPermission(u) === 2) API.chatLog(bot.chat.bouncer);
            bot.connectAPI();
            API.moderateDeleteChat = function (cid) {
                $.ajax({
                    url: "https://plug.dj/_/chat/" + cid,
                    type: "DELETE"
                })
            };
            retrieveSettings();
            retrieveFromStorage();
            window.bot = bot;
            bot.roomUtilities.updateBlacklists();
            setInterval(bot.roomUtilities.updateBlacklists, 60 * 60 * 1000);
            bot.getNewBlacklistedSongs = bot.roomUtilities.exportNewBlacklistedSongs;
            bot.logNewBlacklistedSongs = bot.roomUtilities.logNewBlacklistedSongs;
            if (bot.room.roomstats.launchTime === null) {
                bot.room.roomstats.launchTime = Date.now();
            }
            for (var j = 0; j < bot.room.users.length; j++) {
                bot.room.users[j].inRoom = false;
            }
            var userlist = API.getUsers();
            for (var i = 0; i < userlist.length; i++) {
                var known = false;
                var ind = null;
                for (var j = 0; j < bot.room.users.length; j++) {
                    if (bot.room.users[j].id === userlist[i].id) {
                        known = true;
                        ind = j;
                    }
                }
                if (known) {
                    bot.room.users[ind].inRoom = true;
                }
                else {
                    bot.room.users.push(new bot.User(userlist[i].id, userlist[i].username));
                    ind = bot.room.users.length - 1;
                }
                var wlIndex = API.getWaitListPosition(bot.room.users[ind].id) + 1;
                bot.userUtilities.updatePosition(bot.room.users[ind], wlIndex);
            }
            bot.room.afkInterval = setInterval(function () {
                bot.roomUtilities.afkCheck()
            }, 10 * 1000);
            bot.room.autodisableInterval = setInterval(function () {
                bot.room.autodisableFunc();
            }, 60 * 60 * 1000);
            bot.loggedInID = API.getUser().id;
            bot.status = true;
            API.sendChat('/cap 1');
            API.setVolume(0);
            var emojibutton = $(".icon-emoji-on");
            if (emojibutton.length > 0) {
                emojibutton[0].click();
            }
            loadChat(API.sendChat(subChat(bot.chat.online, {botname: bot.settings.botName, version: bot.version})));
        },
        commands: {
            executable: function (minRank, chat) {
                var id = chat.uid;
                var perm = bot.userUtilities.getPermission(id);
                var minPerm;
                switch (minRank) {
                    case 'admin':
                        minPerm = 10;
                        break;
                    case 'ambassador':
                        minPerm = 7;
                        break;
                    case 'host':
                        minPerm = 5;
                        break;
                    case 'cohost':
                        minPerm = 4;
                        break;
                    case 'manager':
                        minPerm = 3;
                        break;
                    case 'mod':
                        if (bot.settings.bouncerPlus) {
                            minPerm = 2;
                        }
                        else {
                            minPerm = 3;
                        }
                        break;
                    case 'bouncer':
                        minPerm = 2;
                        break;
                    case 'residentdj':
                        minPerm = 1;
                        break;
                    case 'user':
                        minPerm = 0;
                        break;
                    default:
                        API.chatLog('error assigning minimum permission');
                }
                return perm >= minPerm;
            },
            activeCommand: {
                command: 'active',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var now = Date.now();
                        var chatters = 0;
                        var time;
                        if (msg.length === cmd.length) time = 60;
                        else {
                            time = msg.substring(cmd.length + 1);
                            if (isNaN(time)) return API.sendChat(subChat(bot.chat.invalidtime, {name: chat.un}));
                        }
                        for (var i = 0; i < bot.room.users.length; i++) {
                            userTime = bot.userUtilities.getLastActivity(bot.room.users[i]);
                            if ((now - userTime) <= (time * 60 * 1000)) {
                                chatters++;
                            }
                        }
                        API.sendChat(subChat(bot.chat.activeusersintime, {name: chat.un, amount: chatters, time: time}));
                    }
                }
            },
            addCommand: {
                command: 'add',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = bot.userUtilities.lookupUserName(name);
                        if (msg.length > cmd.length + 2) {
                            if (typeof user !== 'undefined') {
                                if (bot.room.roomevent) {
                                    bot.room.eventArtists.push(user.id);
                                }
                                API.moderateAddDJ(user.id);
                            } else API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        }
                    }
                }
            },
            afklimitCommand: {
                command: 'afklimit',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nolimitspecified, {name: chat.un}));
                        var limit = msg.substring(cmd.length + 1);
                        if (!isNaN(limit)) {
                            bot.settings.maximumAfk = parseInt(limit, 10);
                            API.sendChat(subChat(bot.chat.maximumafktimeset, {name: chat.un, time: bot.settings.maximumAfk}));
                        }
                        else API.sendChat(subChat(bot.chat.invalidlimitspecified, {name: chat.un}));
                    }
                }
            },
            afkremovalCommand: {
                command: 'afkremoval',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.afkRemoval) {
                            bot.settings.afkRemoval = !bot.settings.afkRemoval;
                            clearInterval(bot.room.afkInterval);
                            API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.afkremoval}));
                        }
                        else {
                            bot.settings.afkRemoval = !bot.settings.afkRemoval;
                            bot.room.afkInterval = setInterval(function () {
                                bot.roomUtilities.afkCheck()
                            }, 2 * 1000);
                            API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.afkremoval}));
                        }
                    }
                }
            },
            afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = bot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        bot.userUtilities.setLastActivity(user);
                        API.sendChat(subChat(bot.chat.afkstatusreset, {name: chat.un, username: name}));
                    }
                }
            },
            afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = bot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        var lastActive = bot.userUtilities.getLastActivity(user);
                        var inactivity = Date.now() - lastActive;
                        var time = bot.roomUtilities.msToStr(inactivity);
                        API.sendChat(subChat(bot.chat.inactivefor, {name: chat.un, username: name, time: time}));
                    }
                }
            },
            autoskipCommand: {
                command: 'autoskip',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.room.autoskip) {
                            bot.room.autoskip = !bot.room.autoskip;
                            clearTimeout(bot.room.autoskipTimer);
                            return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.autoskip}));
                        }
                        else {
                            bot.room.autoskip = !bot.room.autoskip;
                            return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.autoskip}));
                        }
                    }
                }
            },
            autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(bot.chat.autowoot);
                    }
                }
            },
            baCommand: {
                command: 'ba',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(bot.chat.brandambassador);
                    }
                }
            },
            banCommand: {
                command: 'ban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = bot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        API.moderateBanUser(user.id, 1, API.BAN.DAY);
                    }
                }
            },
            blacklistCommand: {
                command: ['blacklist', 'bl'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nolistspecified, {name: chat.un}));
                        var list = msg.substr(cmd.length + 1);
                        if (typeof bot.room.blacklists[list] === 'undefined') return API.sendChat(subChat(bot.chat.invalidlistspecified, {name: chat.un}));
                        else {
                            var media = API.getMedia();
                            var track = {
                                list: list,
                                author: media.author,
                                title: media.title,
                                mid: media.format + ':' + media.cid
                            };
                            bot.room.newBlacklisted.push(track);
                            bot.room.blacklists[list].push(media.format + ':' + media.cid);
                            API.sendChat(subChat(bot.chat.newblacklisted, {name: chat.un, blacklist: list, author: media.author, title: media.title, mid: media.format + ':' + media.cid}));
                            API.moderateForceSkip();
                            if (typeof bot.room.newBlacklistedSongFunction === 'function') {
                                bot.room.newBlacklistedSongFunction(track);
                            }
                        }
                    }
                }
            },
            blinfoCommand: {
                command: 'blinfo',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var author = API.getMedia().author;
                        var title = API.getMedia().title;
                        var name = chat.un;
                        var format = API.getMedia().format;
                        var cid = API.getMedia().cid;
                        var songid = format + ":" + cid;

                        API.sendChat(subChat(bot.chat.blinfo, {name: name, author: author, title: title, songid: songid}));
                    }
                }
            },
            bouncerPlusCommand: {
                command: 'bouncer+',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (bot.settings.bouncerPlus) {
                            bot.settings.bouncerPlus = false;
                            return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': 'Bouncer+'}));
                        }
                        else {
                            if (!bot.settings.bouncerPlus) {
                                var id = chat.uid;
                                var perm = bot.userUtilities.getPermission(id);
                                if (perm > 2) {
                                    bot.settings.bouncerPlus = true;
                                    return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': 'Bouncer+'}));
                                }
                            }
                            else return API.sendChat(subChat(bot.chat.bouncerplusrank, {name: chat.un}));
                        }
                    }
                }
            },
            clearchatCommand: {
                command: 'clearchat',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var currentchat = $('#chat-messages').children();
                        for (var i = 0; i < currentchat.length; i++) {
                            API.moderateDeleteChat(currentchat[i].getAttribute("data-cid"));
                        }
                        return API.sendChat(subChat(bot.chat.chatcleared, {name: chat.un}));
                    }
                }
            },
            commandsCommand: {
                command: 'commands',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(bot.chat.commandslink, {botname: bot.settings.botName, link: bot.cmdLink}));
                    }
                }
            },
            cycleCommand: {
                command: 'cycle',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        bot.roomUtilities.changeDJCycle();
                    }
                }
            },
            cycleguardCommand: {
                command: 'cycleguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.cycleGuard) {bot
                            bot.settings.cycleGuard = !bot.settings.cycleGuard;
                            return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.cycleguard}));
                        }
                        else {
                            bot.settings.cycleGuard = !bot.settings.cycleGuard;
                            return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.cycleguard}));
                        }
                    }
                }
            },
            cycletimerCommand: {
                command: 'cycletimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cycleTime = msg.substring(cmd.length + 1);
                        if (!isNaN(cycleTime) && cycleTime !== "") {
                            bot.settings.maximumCycletime = cycleTime;
                            return API.sendChat(subChat(bot.chat.cycleguardtime, {name: chat.un, time: bot.settings.maximumCycletime}));
                        }
                        else return API.sendChat(subChat(bot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },
             voteskipCommand: {
                command: 'voteskip',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(bot.chat.voteskiplimit, {name: chat.un, limit: bot.settings.voteSkipLimit}));
                        var argument = msg.substring(cmd.length + 1);
                        if (!bot.settings.voteSkip) bot.settings.voteSkip = !bot.settings.voteSkip;
                        if (isNaN(argument)) {
                            API.sendChat(subChat(bot.chat.voteskipinvalidlimit, {name: chat.un}));
                        }
                        else {
                            bot.settings.voteSkipLimit = argument;
                            API.sendChat(subChat(bot.chat.voteskipsetlimit, {name: chat.un, limit: bot.settings.voteSkipLimit}));
                        }
                    }
                }
            },
            togglevoteskipCommand: {
                command: 'togglevoteskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.voteSkip) {
                            bot.settings.voteSkip = !bot.settings.voteSkip;
                            API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.voteskip}));
                        }
                        else {
                            bot.settings.motdEnabled = !bot.settings.motdEnabled;
                            API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.voteskip}));
                        }
                    }
                }
            },
            dclookupCommand: {
                command: ['dclookup', 'dc'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substring(cmd.length + 2);
                            var perm = bot.userUtilities.getPermission(chat.uid);
                            if (perm < 2) return API.sendChat(subChat(bot.chat.dclookuprank, {name: chat.un}));
                        }
                        var user = bot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        var toChat = bot.userUtilities.dclookup(user.id);
                        API.sendChat(toChat);
                    }
                }
            },
            deletechatCommand: {
                command: 'deletechat',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = bot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        var chats = $('.from');
                        for (var i = 0; i < chats.length; i++) {
                            var n = chats[i].textContent;
                            if (name.trim() === n.trim()) {
                                var cid = $(chats[i]).parent()[0].getAttribute('data-cid');
                                API.moderateDeleteChat(cid);
                            }
                        }
                        API.sendChat(subChat(bot.chat.deletechat, {name: chat.un, username: name}));
                    }
                }
            },
            emojiCommand: {
                command: 'emoji',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = 'http://www.emoji-cheat-sheet.com/';
                        API.sendChat(subChat(bot.chat.emojilist, {link: link}));
                    }
                }
            },
            etaCommand: {
                command: 'eta',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var perm = bot.userUtilities.getPermission(chat.uid);
                        var msg = chat.message;
                        var name;
                        if (msg.length > cmd.length) {
                            if (perm < 2) return void (0);
                            name = msg.substring(cmd.length + 2);
                        } else name = chat.un;
                        var user = bot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        var pos = API.getWaitListPosition(user.id);
                        if (pos < 0) return API.sendChat(subChat(bot.chat.notinwaitlist, {name: name}));
                        var timeRemaining = API.getTimeRemaining();
                        var estimateMS = ((pos + 1) * 4 * 60 + timeRemaining) * 1000;
                        var estimateString = bot.roomUtilities.msToStr(estimateMS);
                        API.sendChat(subChat(bot.chat.eta, {name: name, time: estimateString}));
                    }
                }
            },
            fbCommand: {
                command: 'fb',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof bot.settings.fbLink === "string")
                            API.sendChat(subChat(bot.chat.facebook, {link: bot.settings.fbLink}));
                    }
                }
            },
            filterCommand: {
                command: 'filter',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.filterChat) {
                            bot.settings.filterChat = !bot.settings.filterChat;
                            return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.chatfilter}));
                        }
                        else {
                            bot.settings.filterChat = !bot.settings.filterChat;
                            return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.chatfilter}));
                        }
                    }
                }
            },
            helpCommand: {
                command: 'help',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = "http://i.imgur.com/SBAso1N.jpg";
                        API.sendChat(subChat(bot.chat.starterhelp, {link: link}));
                    }
                }
            },
            joinCommand: {
                command: 'join',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.room.roulette.rouletteStatus && bot.room.roulette.participants.indexOf(chat.uid) < 0) {
                            bot.room.roulette.participants.push(chat.uid);
                            API.sendChat(subChat(bot.chat.roulettejoin, {name: chat.un}));
                        }
                    }
                }
            },
            jointimeCommand: {
                command: 'jointime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = bot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        var join = bot.userUtilities.getJointime(user);
                        var time = Date.now() - join;
                        var timeString = bot.roomUtilities.msToStr(time);
                        API.sendChat(subChat(bot.chat.jointime, {namefrom: chat.un, username: name, time: timeString}));
                    }
                }
            },
            kickCommand: {
                command: 'kick',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var lastSpace = msg.lastIndexOf(' ');
                        var time;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            time = 0.25;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            time = msg.substring(lastSpace + 1);
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }

                        var user = bot.userUtilities.lookupUserName(name);
                        var from = chat.un;
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));

                        var permFrom = bot.userUtilities.getPermission(chat.uid);
                        var permTokick = bot.userUtilities.getPermission(user.id);

                        if (permFrom <= permTokick)
                            return API.sendChat(subChat(bot.chat.kickrank, {name: chat.un}));

                        if (!isNaN(time)) {
                            API.sendChat(subChat(bot.chat.kick, {name: chat.un, username: name, time: time}));
                            if (time > 24 * 60 * 60) API.moderateBanUser(user.id, 1, API.BAN.PERMA);
                            else API.moderateBanUser(user.id, 1, API.BAN.DAY);
                            setTimeout(function (id, name) {
                                API.moderateUnbanUser(id);
                                console.log('Unbanned @' + name + '. (' + id + ')');
                            }, time * 60 * 1000, user.id, name);
                        }
                        else API.sendChat(subChat(bot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },
            killCommand: {
                command: 'kill',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        storeToStorage();
                        API.sendChat(bot.chat.kill);
                        bot.disconnectAPI();
                        setTimeout(function () {
                            kill();
                        }, 1000);
                    }
                }
            },
            leaveCommand: {
                command: 'leave',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var ind = bot.room.roulette.participants.indexOf(chat.uid);
                        if (ind > -1) {
                            bot.room.roulette.participants.splice(ind, 1);
                            API.sendChat(subChat(bot.chat.rouletteleave, {name: chat.un}));
                        }
                    }
                }
            },
            linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var media = API.getMedia();
                        var from = chat.un;
                        var user = bot.userUtilities.lookupUser(chat.uid);
                        var perm = bot.userUtilities.getPermission(chat.uid);
                        var dj = API.getDJ().id;
                        var isDj = false;
                        if (dj === chat.uid) isDj = true;
                        if (perm >= 1 || isDj) {
                            if (media.format === 1) {
                                var linkToSong = "https://www.youtube.com/watch?v=" + media.cid;
                                API.sendChat(subChat(bot.chat.songlink, {name: from, link: linkToSong}));
                            }
                            if (media.format === 2) {
                                SC.get('/tracks/' + media.cid, function (sound) {
                                    API.sendChat(subChat(bot.chat.songlink, {name: from, link: sound.permalink_url}));
                                });
                            }
                        }
                    }
                }
            },
            lockCommand: {
                command: 'lock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        bot.roomUtilities.booth.lockBooth();
                    }
                }
            },
            lockdownCommand: {
                command: 'lockdown',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = bot.settings.lockdownEnabled;
                        bot.settings.lockdownEnabled = !temp;
                        if (bot.settings.lockdownEnabled) {
                            return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.lockdown}));
                        }
                        else return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.lockdown}));
                    }
                }
            },
            lockguardCommand: {
                command: 'lockguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.lockGuard) {
                            bot.settings.lockGuard = !bot.settings.lockGuard;
                            return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.lockdown}));
                        }
                        else {
                            bot.settings.lockGuard = !bot.settings.lockGuard;
                            return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.lockguard}));
                        }
                    }
                }
            },
            lockskipCommand: {
                command: 'lockskip',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.room.skippable) {
                            var dj = API.getDJ();
                            var id = dj.id;
                            var name = dj.username;
                            var msgSend = '@' + name + ': ';
                            bot.room.queueable = false;

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(bot.chat.usedlockskip, {name: chat.un}));
                                bot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    bot.room.skippable = false;
                                    setTimeout(function () {
                                        bot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        bot.userUtilities.moveUser(id, bot.settings.lockskipPosition, false);
                                        bot.room.queueable = true;
                                        setTimeout(function () {
                                            bot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < bot.settings.lockskipReasons.length; i++) {
                                var r = bot.settings.lockskipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += bot.settings.lockskipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(bot.chat.usedlockskip, {name: chat.un}));
                                bot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    bot.room.skippable = false;
                                    API.sendChat(msgSend);
                                    setTimeout(function () {
                                        bot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        bot.userUtilities.moveUser(id, bot.settings.lockskipPosition, false);
                                        bot.room.queueable = true;
                                        setTimeout(function () {
                                            bot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                        }
                    }
                }
            },
            lockskipposCommand: {
                command: 'lockskippos',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var pos = msg.substring(cmd.length + 1);
                        if (!isNaN(pos)) {
                            bot.settings.lockskipPosition = pos;
                            return API.sendChat(subChat(bot.chat.lockskippos, {name: chat.un, position: bot.settings.lockskipPosition}));
                        }
                        else return API.sendChat(subChat(bot.chat.invalidpositionspecified, {name: chat.un}));
                    }
                }
            },
            locktimerCommand: {
                command: 'locktimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var lockTime = msg.substring(cmd.length + 1);
                        if (!isNaN(lockTime) && lockTime !== "") {
                            bot.settings.maximumLocktime = lockTime;
                            return API.sendChat(subChat(bot.chat.lockguardtime, {name: chat.un, time: bot.settings.maximumLocktime}));
                        }
                        else return API.sendChat(subChat(bot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },
            maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            bot.settings.maximumSongLength = maxTime;
                            return API.sendChat(subChat(bot.chat.maxlengthtime, {name: chat.un, time: bot.settings.maximumSongLength}));
                        }
                        else return API.sendChat(subChat(bot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },
             motdCommand: {
                command: 'motd',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat('/me MotD: ' + bot.settings.motd);
                        var argument = msg.substring(cmd.length + 1);
                        if (!bot.settings.motdEnabled) bot.settings.motdEnabled = !bot.settings.motdEnabled;
                        if (isNaN(argument)) {
                            bot.settings.motd = argument;
                            API.sendChat(subChat(bot.chat.motdset, {msg: bot.settings.motd}));
                        }
                        else {
                            bot.settings.motdInterval = argument;
                            API.sendChat(subChat(bot.chat.motdintervalset, {interval: bot.settings.motdInterval}));
                        }
                    }
                }
            },
            moveCommand: {
                command: 'move',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var pos;
                        var name;
                        if (isNaN(parseInt(msg.substring(lastSpace + 1)))) {
                            pos = 1;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            pos = parseInt(msg.substring(lastSpace + 1));
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var user = bot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        if (user.id === bot.loggedInID) return API.sendChat(subChat(bot.chat.addbotwaitlist, {name: chat.un}));
                        if (!isNaN(pos)) {
                            API.sendChat(subChat(bot.chat.move, {name: chat.un}));
                            bot.userUtilities.moveUser(user.id, pos, false);
                        } else return API.sendChat(subChat(bot.chat.invalidpositionspecified, {name: chat.un}));
                    }
                }
            },
            muteCommand: {
                command: 'mute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var lastSpace = msg.lastIndexOf(' ');
                        var time = null;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            name = msg.substring(cmd.length + 2);
                            time = 45;
                        }
                        else {
                            time = msg.substring(lastSpace + 1);
                            if (isNaN(time) || time == "" || time == null || typeof time == "undefined") {
                                return API.sendChat(subChat(bot.chat.invalidtime, {name: chat.un}));
                            }
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var from = chat.un;
                        var user = bot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        var permFrom = bot.userUtilities.getPermission(chat.uid);
                        var permUser = bot.userUtilities.getPermission(user.id);
                        if (permFrom > permUser) {
                        	if (time > 45) {
                                API.sendChat(subChat(bot.chat.mutedmaxtime, {name: chat.un, time: "45"}));
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                            }
                            else if (time === 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(bot.chat.mutedtime, {name: chat.un, username: name, time: time}));

                            }
                            else if (time > 30) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(bot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                            else if (time > 15) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.MEDIUM);
                                API.sendChat(subChat(bot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                            else {
                                API.moderateMuteUser(user.id, 1, API.MUTE.SHORT);
                                API.sendChat(subChat(bot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                        }
                        else API.sendChat(subChat(bot.chat.muterank, {name: chat.un}));
                    }
                }
            },
            opCommand: {
                command: 'op',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof bot.settings.opLink === "string")
                            return API.sendChat(subChat(bot.chat.oplist, {link: bot.settings.opLink}));
                    }
                }
            },
            pingCommand: {
                command: 'ping',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(bot.chat.pong)
                    }
                }
            },
            refreshCommand: {
                command: 'refresh',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        storeToStorage();
                        bot.disconnectAPI();
                        setTimeout(function () {
                            window.location.reload(false);
                        }, 1000);

                    }
                }
            },
            reloadCommand: {
                command: 'reload',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(bot.chat.reload);
                        storeToStorage();
                        bot.disconnectAPI();
                        kill();
                        setTimeout(function () {
                            $.getScript(bot.scriptLink);
                        }, 2000);
                    }
                }
            },
            removeCommand: {
                command: 'remove',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length > cmd.length + 2) {
                            var name = msg.substr(cmd.length + 2);
                            var user = bot.userUtilities.lookupUserName(name);
                            if (typeof user !== 'boolean') {
                                user.lastDC = {
                                    time: null,
                                    position: null,
                                    songCount: 0
                                };
                                if (API.getDJ().id === user.id) {
                                    API.moderateForceSkip();
                                    setTimeout(function () {
                                        API.moderateRemoveDJ(user.id);
                                    }, 1 * 1000, user);
                                }
                                else API.moderateRemoveDJ(user.id);
                            } else API.sendChat(subChat(bot.chat.removenotinwl, {name: chat.un, username: name}));
                        } else API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                    }
                }
            },
            restrictetaCommand: {
                command: 'restricteta',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.etaRestriction) {
                            bot.settings.etaRestriction = !bot.settings.etaRestriction;
                            return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.etarestriction}));
                        }
                        else {
                            bot.settings.etaRestriction = !bot.settings.etaRestriction;
                            return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.etarestriction}));
                        }
                    }
                }
            },
            rouletteCommand: {
                command: 'roulette',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (!bot.room.roulette.rouletteStatus) {
                            bot.room.roulette.startRoulette();
                        }
                    }
                }
            },
            rulesCommand: {
                command: 'rules',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof bot.settings.rulesLink === "string")
                            return API.sendChat(subChat(bot.chat.roomrules, {link: bot.settings.rulesLink}));
                    }
                }
            },
            sessionstatsCommand: {
                command: 'sessionstats',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var woots = bot.room.roomstats.totalWoots;
                        var mehs = bot.room.roomstats.totalMehs;
                        var grabs = bot.room.roomstats.totalCurates;
                        API.sendChat(subChat(bot.chat.sessionstats, {name: from, woots: woots, mehs: mehs, grabs: grabs}));
                    }
                }
            },
            skipCommand: {
                command: 'skip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(bot.chat.skip, {name: chat.un}));
                        API.moderateForceSkip();
                        bot.room.skippable = false;
                        setTimeout(function () {
                            bot.room.skippable = true
                        }, 5 * 1000);
                    }
                }
            },
            songstatsCommand: {
                command: 'songstats',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.songstats) {
                            bot.settings.songstats = !bot.settings.songstats;
                            return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.songstats}));
                        }
                        else {
                            bot.settings.songstats = !bot.settings.songstats;
                            return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.songstats}));
                        }
                    }
                }
            },
            sourceCommand: {
                command: 'source',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat('/me This bot was made by ' + botCreator + '.');
                    }
                }
            },
            statusCommand: {
                command: 'status',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var msg = '/me [@' + from + '] ';
                        msg += bot.chat.afkremoval + ': ';
                        if (bot.settings.afkRemoval) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += bot.chat.afksremoved + ": " + bot.room.afkList.length + '. ';
                        msg += bot.chat.afklimit + ': ' + bot.settings.maximumAfk + '. ';
                        msg += 'Bouncer+: ';
                        if (bot.settings.bouncerPlus) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';					
                        msg += bot.chat.blacklist + ': ';
                        if (bot.settings.blacklistEnabled) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += bot.chat.lockguard + ': ';
                        if (bot.settings.lockGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += bot.chat.cycleguard + ': ';
                        if (bot.settings.cycleGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += bot.chat.timeguard + ': ';
                        if (bot.settings.timeGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += bot.chat.chatfilter + ': ';
                        if (bot.settings.filterChat) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += bot.chat.voteskip + ': ';
                        if (bot.settings.voteskip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        var launchT = bot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = bot.roomUtilities.msToStr(durationOnline);
                        msg += subChat(bot.chat.activefor, {time: since});
                        return API.sendChat(msg);
                    }
                }
            },
            swapCommand: {
                command: 'swap',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var name1 = msg.substring(cmd.length + 2, lastSpace);
                        var name2 = msg.substring(lastSpace + 2);
                        var user1 = bot.userUtilities.lookupUserName(name1);
                        var user2 = bot.userUtilities.lookupUserName(name2);
                        if (typeof user1 === 'boolean' || typeof user2 === 'boolean') return API.sendChat(subChat(bot.chat.swapinvalid, {name: chat.un}));
                        if (user1.id === bot.loggedInID || user2.id === bot.loggedInID) return API.sendChat(subChat(bot.chat.addbottowaitlist, {name: chat.un}));
                        var p1 = API.getWaitListPosition(user1.id) + 1;
                        var p2 = API.getWaitListPosition(user2.id) + 1;
                        if (p1 < 0 || p2 < 0) return API.sendChat(subChat(bot.chat.swapwlonly, {name: chat.un}));
                        API.sendChat(subChat(bot.chat.swapping, {'name1': name1, 'name2': name2}));
                        if (p1 < p2) {
                            bot.userUtilities.moveUser(user2.id, p1, false);
                            setTimeout(function (user1, p2) {
                                bot.userUtilities.moveUser(user1.id, p2, false);
                            }, 2000, user1, p2);
                        }
                        else {
                            bot.userUtilities.moveUser(user1.id, p2, false);
                            setTimeout(function (user2, p1) {
                                bot.userUtilities.moveUser(user2.id, p1, false);
                            }, 2000, user2, p1);
                        }
                    }
                }
            },
            themeCommand: {
                command: 'theme',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof bot.settings.themeLink === "string")
                            API.sendChat(subChat(bot.chat.genres, {link: bot.settings.themeLink}));
                    }
                }
            },
            timeguardCommand: {
                command: 'timeguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.timeGuard) {
                            bot.settings.timeGuard = !bot.settings.timeGuard;
                            return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.timeguard}));
                        }
                        else {
                            bot.settings.timeGuard = !bot.settings.timeGuard;
                            return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.timeguard}));
                        }
                    }
                }
            },
            toggleblCommand: {
                command: 'togglebl',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = bot.settings.blacklistEnabled;
                        bot.settings.blacklistEnabled = !temp;
                        if (bot.settings.blacklistEnabled) {
                          return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.blacklist}));
                        }
                        else return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.blacklist}));
                    }
                }
            },
            togglemotdCommand: {
                command: 'togglemotd',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.motdEnabled) {
                            bot.settings.motdEnabled = !bot.settings.motdEnabled;
                            API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.motd}));
                        }
                        else {
                            bot.settings.motdEnabled = !bot.settings.motdEnabled;
                            API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.motd}));
                        }
                    }
                }
            },
            unbanCommand: {
                command: 'unban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $(".icon-population").click();
                        $(".icon-ban").click();
                        setTimeout(function (chat) {
                            var msg = chat.message;
                            if (msg.length === cmd.length) return API.sendChat();
                            var name = msg.substring(cmd.length + 2);
                            var bannedUsers = API.getBannedUsers();
                            var found = false;
                            var bannedUser = null;
                            for (var i = 0; i < bannedUsers.length; i++) {
                                var user = bannedUsers[i];
                                if (user.username === name) {
                                    bannedUser = user;
                                    found = true;
                                }
                            }
                            if (!found) {
                                $(".icon-chat").click();
                                return API.sendChat(subChat(bot.chat.notbanned, {name: chat.un}));
                            }
                            API.moderateUnbanUser(bannedUser.id);
                            console.log("Unbanned " + name);
                            setTimeout(function () {
                                $(".icon-chat").click();
                            }, 1000);
                        }, 1000, chat);
                    }
                }
            },
            unlockCommand: {
                command: 'unlock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        bot.roomUtilities.booth.unlockBooth();
                    }
                }
            },
            unmuteCommand: {
                command: 'unmute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var permFrom = bot.userUtilities.getPermission(chat.uid);
                        var from = chat.un;
                        var name = msg.substr(cmd.length + 2);

                        var user = bot.userUtilities.lookupUserName(name);

                        if (typeof user === 'boolean') return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));

                        var permUser = bot.userUtilities.getPermission(user.id);
                        if (permFrom > permUser) {
                        	try {
                                API.moderateUnmuteUser(user.id);
                                API.sendChat(subChat(bot.chat.unmuted, {name: chat.un, username: name}));
                            }
                            catch (e) {
                                API.sendChat(subChat(bot.chat.notmuted, {name: chat.un}));
                            }
                        }
                        else API.sendChat(subChat(bot.chat.unmuterank, {name: chat.un}));
                    }
                }
            },
            usercmdcdCommand: {
                command: 'usercmdcd',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cd = msg.substring(cmd.length + 1);
                        if (!isNaN(cd)) {
                            bot.settings.commandCooldown = cd;
                            return API.sendChat(subChat(bot.chat.commandscd, {name: chat.un, time: bot.settings.commandCooldown}));
                        }
                        else return API.sendChat(subChat(bot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },
            usercommandsCommand: {
                command: 'usercommands',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.usercommandsEnabled) {
                            API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.usercommands}));
                            bot.settings.usercommandsEnabled = !bot.settings.usercommandsEnabled;
                        }
                        else {
                            API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.usercommands}));
                            bot.settings.usercommandsEnabled = !bot.settings.usercommandsEnabled;
                        }
                    }
                }
            },
            voteratioCommand: {
                command: 'voteratio',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(bot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = bot.userUtilities.lookupUserName(name);
                        if (user === false) return API.sendChat(subChat(bot.chat.invaliduserspecified, {name: chat.un}));
                        var vratio = user.votes;
                        var ratio = vratio.woot / vratio.meh;
                        API.sendChat(subChat(bot.chat.voteratio, {name: chat.un, username: name, woot: vratio.woot, mehs: vratio.meh, ratio: ratio.toFixed(2)}));
                    }
                }
            },
            welcomeCommand: {
                command: 'welcome',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (bot.settings.welcome) {
                            bot.settings.welcome = !bot.settings.welcome;
                            return API.sendChat(subChat(bot.chat.toggleoff, {name: chat.un, 'function': bot.chat.welcomemsg}));
                        }
                        else {
                            bot.settings.welcome = !bot.settings.welcome;
                            return API.sendChat(subChat(bot.chat.toggleon, {name: chat.un, 'function': bot.chat.welcomemsg}));
                        }
                    }
                }
            },
            websiteCommand: {
                command: 'website',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof bot.settings.website === "string")
                            API.sendChat(subChat(bot.chat.website, {link: bot.settings.website}));
                    }
                }
            }
        }
	};
	loadChat(bot.startup);
}).call(this);
