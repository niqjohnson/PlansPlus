// Revision History
// 1.0 - Initial release
// 1.0.1 - Added a new keyboard shortcut: "m" goes to the plan at the top of the autoread list
// 1.0.2 - Added keyboard shortcuts for numberpad keys as well as regular number keys
// 1.0.3 - Added autofinger polling and notifications to tab title -- [nichols]
// 1.1 - Added AJAX-updated autofinger list
// Thanks to [youngian] and [nichols] for all their work on the original Newlove script!
// ==UserScript==
// @name           PlansPlus
// @namespace      http://www.grinnellplans.com
// @description    Enhancements to GrinnellPlans: Newlove, keybord navigation, new windows for external links, and an updating autofinger list
// @version        1.1
// @include        http://grinnellplans.com/*
// @include        http://www.grinnellplans.com/*
// @match          http://grinnellplans.com/*
// @match          http://www.grinnellplans.com/*
// ==/UserScript==

function plansPlus () {

	// **********************
	// Reusable functions ---
	// **********************
	
	function showNotification (notificationText) {
		$('#plansPlusNotification').clearQueue().remove();
		var notificationContainer = $('<div id="plansPlusNotification"><div id="plansPlusNotificationClose">X</div></div>');
		notificationContainer.append(notificationText).prependTo('body').show().animate({top: '+=41'}, 1000).delay(10000).animate({top: '-=41'}, 1000, function () {notificationContainer.remove();});
		$('#plansPlusNotificationClose').bind('click', function() {notificationContainer.clearQueue().animate({top: '-=41'}, 1000, function() {notificationContainer.remove()});});
	}
	
	// **********************
	// Get all preferences --
	// **********************
	
	var linkTarget = window.localStorage.getItem('linkTarget');
	var quickLoveUser = window.localStorage.getItem('plansPlusUser');
	var notificationSide = window.localStorage.getItem("notification") || 'left';
	var notificationLevel = window.localStorage.getItem("notificationLevel") || "3";
	var currentPathname = window.location.pathname;
	
	// **********************
	// Keyboard navigation --
	// **********************
	
	window.localStorage.setItem('inputFocused', 'false');
	
	$('textarea, input:text').live('focus', function() {
		window.localStorage.setItem('inputFocused', 'true');
	}).blur(function() {
		window.localStorage.setItem('inputFocused', 'false');
	});
	
	$(document.documentElement).keyup(function (event) {
		var inputFocused = window.localStorage.getItem('inputFocused');
		if (inputFocused == 'false' && $('input[value="Guest"]').length !== 1) {
			if (event.which == 49 || event.which == 97) {
				window.location = 'setpriv.php?myprivl=1';
			 } else if (event.which == 50 || event.which == 98) {
				window.location = 'setpriv.php?myprivl=2';
			 } else if (event.which == 51 || event.which == 99) {
				window.location = 'setpriv.php?myprivl=3';
			 } else if (event.which == 78) {
			 	if ($('#autoread').length === 1) {
					var nextPlan = $('.autoreadentry.last a').attr('href');
				}
				else if ($('table.mainpanel').length > 0) {
					var nextPlan = $('table.mainpanel a[href ^= "read.php"]:last').attr('href');
				}
				if (nextPlan) {
					window.location = nextPlan;
				}
			} else if (event.which == 77) {
				if ($('#autoread').length === 1) {
					var topPlan = $('.autoreadentry.first a').attr('href');
				}
				else if ($('table.mainpanel').length > 0) {
					var topPlan = $('table.mainpanel a[href ^= "read.php"]:first').attr('href');
				}
				if (topPlan) {
					window.location = topPlan;
				}
			} else if (event.which == 81) {
				window.location = 'quicklove.php';
			}
		}
	});
	
	// **********************
	// External links -------
	// **********************
	
	if (linkTarget === null) {
		window.localStorage.setItem('linkTarget', '_blank');
		var linkTarget = window.localStorage.getItem('linkTarget');
	}
	$('a[href ^= "http"]').attr('target', linkTarget);
	
	// **********************
	// Newlove ------------
	// **********************
	
	$('head').prepend('<style>.oldLove .result_sublist {display: none;} #plansPlusNotification {display: none; background: #F1EFC2; position: fixed; text-align: center; top: -41px; width: 100%; z-index: 1000; border-bottom: 1px solid #999; opacity: 0.9; line-height: 40px; height: 40px;} #plansPlusNotificationClose {color: #444444; font-family: Verdana, sans-serif; font-weight: bold; height: 40px; line-height: 40px; position: absolute; right: 5px; top: 0; cursor: pointer;} #plansPlusPreferences div {margin: 0 0 5px 0;}</style>');
	if (currentPathname === '/search.php') {
		var currentSearch = window.location.search;
		var currentUserStartIndex = currentSearch.indexOf("mysearch=") + 9;
		var currentUserEndIndex = currentSearch.indexOf("&", currentUserStartIndex);
		var currentSearchUser = currentSearch.substring(currentUserStartIndex, currentUserEndIndex);
		if (quickLoveUser === null) {
			window.localStorage.setItem('plansPlusUser', currentSearchUser);
			showNotification('<strong>Now watching for new love for [' + currentSearchUser + '].</strong> You can change the user on <a href="customize.php">the preferences page</a>.');
			var quickLoveUser = window.localStorage.getItem('plansPlusUser');
		}
		if (quickLoveUser === currentSearchUser) {
			if (window.localStorage.getItem('prefsRecentlyChanged') === 'user') {
				showNotification('<strong>You recently started watching for new love for [' + quickLoveUser + '].</strong> If it isn&rsquo;t already, love will be filtered the next time you visit this page.');
				window.localStorage.removeItem('prefsRecentlyChanged');
			}
			var currentLove = {};
			var oldLove = JSON.parse(window.localStorage.getItem('oldLove'));
			if (oldLove === null) {
				var oldLove = {};
			}
			$('#search_results>li').each(function () {
				var lover = $(this).find('a.planlove').text();
				var loving = $(this).find('ul.result_sublist').text();
				var oldLoving = oldLove[lover];
				if(loving === oldLoving) {
					$(this).addClass('oldLove');
				}
				else {
					$(this).addClass('newLove');
				}
				currentLove[lover] = loving;
			});
			window.localStorage.setItem('oldLove', JSON.stringify(currentLove));
		}
	}
	
	// **********************
	// Preferences ----------
	// **********************
	
	if (currentPathname === '/customize.php') {
		var plansPlusPreferences = $('\
			<div id="plansPlusPreferences">\
				<h1 class="heading">PlansPlus Preferences</h1>\
				<form action="#"><p>PlansPlus is tracking newlove for <input id="plansPlusUserInput" type="text" value="' + quickLoveUser + '" /> and opening links in <select id="plansPlusLinkTargetSelect"><option value="_blank">a new tab or window</option><option value="_self">the same tab or window</option></select>. Don&rsquo;t like that? Change a preference and hit the update button, and viola! And remember, <strong>1, 2, 3</strong> = autoread level, <strong>n</strong> = next plan (the bottom one) in autoread, <strong>m</strong> = most recent plan (the top one) in autoread, <strong>q</strong> = quicklove.</p>\
				<h3>Unread plan notifications:</h3>\
				<input id="notify3" type="radio" name="_notifylevel" value="3" checked="checked"/> All levels \
				<input id="notify2" type="radio" name="_notifylevel" value="2"/> Levels 1 and 2 \
				<input id="notify1" type="radio" name="_notifylevel" value="1"/> Level 1 \
				<input id="notify0" type="radio" name="_notifylevel" value="0"/> Turn off notifications \
				<br/>Show notifications on the: \
				<input id="notificationLeft" type="radio" name="_notification" value="left" checked="checked"/> left \
				<input id="notificationRight" type="radio" name="_notification" value="right"/> right (relative to the page title)<br/>\
				<input id="plansPlusUpdateButton" type="submit" value="Update PlansPlus Preferences" /></form>\
			</div>\
		');
		$('#preflist').after(plansPlusPreferences);
		$('#plansPlusLinkTargetSelect option[value="' + linkTarget + '"]').attr('selected', 'selected');
		if(notificationSide == 'right') {
			$('#notificationRight').attr('checked', 'checked');
		}
		$('#notify' + notificationLevel).attr('checked', 'checked');
		$('#plansPlusUpdateButton').bind('click', function(event) {
			event.preventDefault();
			window.localStorage.setItem('plansPlusUser', $('#plansPlusUserInput').val());
			window.localStorage.setItem('linkTarget', $('#plansPlusLinkTargetSelect option:selected').val());
			window.localStorage.setItem('inputFocused', 'false');
			window.localStorage.setItem('notification', $('input[name="_notification"]:checked').val());
			window.localStorage.setItem('notificationLevel', $('input[name="_notifylevel"]:checked').val());
			if(quickLoveUser !== window.localStorage.getItem('plansPlusUser')) {
				window.localStorage.setItem('prefsRecentlyChanged', 'user');
			}
			showNotification('<strong>PlansPlus preferences have been updated.</strong>');
		});
	}
	
	// **********************
	// Poll the API ---------
	// **********************

	function poll() {
	    $.ajax({ url: "/api/1/?task=autofingerlist", success: function(data) {
            var updated = 0;
            if(data && data.autofingerList) {
                for(var i=0; i<data.autofingerList.length; i++) {
                    if(data.autofingerList[i].level <= Number(notificationLevel)) {
                        updated += data.autofingerList[i].usernames.length;
                    }
                }
            }
            if(updated > 0) {
                // update the page title (to update the tab, indicating new plans were found)
                if(document.title.match(/\(\d+\)/)){
                    $(document).attr('title', document.title.replace(/\(\d+\)/, '(' + updated + ')'));
                } else {
                    if(notificationSide == 'right') {
                        $(document).attr('title', document.title + ' (' + updated + ')');
                    } else {
                        $(document).attr('title', '(' + updated + ') ' + document.title);
                    }
                }
            }
        }, dataType: "json", timeout: 10000});
	}
	if(Number(notificationLevel) > 0) {
	    poll();
	    setInterval(poll, 30000);
	}
}

var plansPlusToInject = document.createElement("script");
plansPlusToInject.textContent = "(" + plansPlus.toString() + ")();";
document.body.appendChild(plansPlusToInject);
