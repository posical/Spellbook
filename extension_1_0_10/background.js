//On first install open onboarding
chrome.runtime.onInstalled.addListener(r => {
	if(r.reason == 'install'){
		//first install
		//show onboarding page
		chrome.tabs.create({
			url: 'onboarding-page.html'
		});
	};
});

//Setup listeners for update
chrome.bookmarks.onMoved.addListener(onBookmarkMoved);
chrome.bookmarks.onRemoved.addListener(onBookmarkRemoved);
chrome.bookmarks.onCreated.addListener(onBookmarkCreated);
chrome.bookmarks.onChanged.addListener(onBookmarkChanged);



var ROOT_FOLDER_NAME = chrome.i18n.getMessage('DefaultRootFolder');
var rootContextMenuID;
var bookmarkRootNode;
var isBuiltMiscMenu = false;
var resetTimeoutID;

resetMenu();


function delayReset()
{
	clearTimeout(resetTimeoutID);
	resetTimeoutID = setTimeout(resetMenu, 200);
}

function resetMenu()
{
	//alert("reset");
	isBuiltMiscMenu = false;
	chrome.contextMenus.removeAll(
		function(){
			rootContextMenuID = chrome.contextMenus.create({"title":"SpellBook", "contexts":["all"] });
			chrome.bookmarks.getTree(
				function(nodes){
					bookmarkRootNode = nodes[0].children[0];
					findRootNode(bookmarkRootNode.children, bookmarkRootNode.id);
				}
			);
		}
	)
}		



function findRootNode(nodes, parentId)
{
	var n = nodes.length;
	for(var i=0; i<n; i++)
	{
		var node = nodes[i];
		if(node.title==ROOT_FOLDER_NAME && node.url==undefined)
		{
			buildBookmark(node.children, rootContextMenuID);
			createMiscMenu();
			return;
		}
	}
	//alert("create own bookmark" + parentId);
	chrome.bookmarks.create({title:ROOT_FOLDER_NAME, index:0, parentId:parentId}, 
							function(node){
									buildBookmark(node.children, rootContextMenuID);
									alert(chrome.i18n.getMessage('AboutExtensionDescription'));
									createMiscMenu();
								})
}

function buildBookmark(nodes, parentContextID)
{
	if(nodes){
	nodes.forEach(function(node) { 
		if(node.url){
			if(node.url.indexOf("javascript:")==0){
				chrome.contextMenus.create({ "parentId": parentContextID, "contexts": ["all"], "title": node.title, "onclick":function(nd){return function(){ invokeBookmarklet(nd)} }(node)});
			}
		}else{
			var folderID = chrome.contextMenus.create({ "parentId": parentContextID, "contexts": ["all"], "title": node.title });
			if(node.children){
				buildBookmark(node.children, folderID);
			}
		}
	})
	}
	//alert("build createMiscMenu");
	
}


function createSampleBookmarklets(parentId){
	var codes = [];
	
	var hatebu = "javascript:window.open('http://b.hatena.ne.jp/add?mode=confirm&is_bm=1&title=SpellBook&url='+escape('http://artandmobile.com'),'_blank','width=550,height=600,resizable=1,scrollbars=1');";
	var tweet = "javascript:window.open('http://twitter.com/share?url='+escape('http://artandmobile.com'),'_blank','width=550,height=450,resizable=1,scrollbars=1')";
	var facebook ="javascript:var d=document,f='http://www.facebook.com/share',l=d.location,e=encodeURIComponent,p='.php?src=bm&v=4&i=1298229605&u='+e(l.href)+'&t='+e(d.title);1;try{if (!/^(.*\.)?facebook\.[^.]*$/.test(l.host))throw(0);share_internal_bookmarklet(p)}catch(z) {a=function() {if (!window.open(f+'r'+p,'sharer','toolbar=0,status=0,resizable=1,width=626,height=436'))l.href=f+p};if (/Firefox/.test(navigator.userAgent))setTimeout(a,0);else{a()}}void(0)"
	
	codes.push(hatebu);
	codes.push(tweet);
	codes.push(facebook);
	
	//"Sample: Tweet About SpeellBook";
	chrome.bookmarks.create({title:"Sample: Tweet about SpellBook", index:0, parentId:parentId, url:tweet});
	chrome.bookmarks.create({title:"Share on Facebook", index:0, parentId:parentId, url:facebook});
}

//Add other contexts
function createMiscMenu(){
	if(!isBuiltMiscMenu){
		chrome.contextMenus.create({ "parentId": rootContextMenuID, "contexts": ["all"], "type": "separator" });
		chrome.contextMenus.create({ "parentId": rootContextMenuID, "contexts": ["all"], "title": chrome.i18n.getMessage('FindBookmarklet'), "onclick":onFindBookmarklet}); 
		chrome.contextMenus.create({ "parentId": rootContextMenuID, "contexts": ["all"], "title": chrome.i18n.getMessage('BookmarkManager'), "onclick":onClickBookmarkManager});
		chrome.contextMenus.create({ "parentId": rootContextMenuID, "contexts": ["all"], "title": chrome.i18n.getMessage('AboutExtension'), "onclick":onClickAbout}); 
		isBuiltMiscMenu = true;
	}
}


/*
----------------------------------------------------------------------
	Event Listeners
----------------------------------------------------------------------
*/
function onBookmarkMoved(id, info){ delayReset() }
function onBookmarkRemoved(id, info){ delayReset() }
function onBookmarkCreated(id, node){ delayReset() }
function onBookmarkChanged(id, node){ delayReset() }


/*
----------------------------------------------------------------------
	Run bookmarklet code
	This part is already optimized
----------------------------------------------------------------------
*/

function invokeBookmarklet(node)
{
	if(!node)
		return;
	var code = node.url.split("%20").join(" ");	
	if (code.indexOf("javascript:")==0) {	
		chrome.tabs.getSelected( null, function(myTab){
				chrome.scripting.executeScript(myTab.id, { code:code });
			} 
		);
	}
}



/*
----------------------------------------------------------------------
	Submenu Actions
----------------------------------------------------------------------
*/

function onClickBookmarkManager()
{
	chrome.tabs.create({url: "chrome://bookmarks"});
}

function onFindBookmarklet()
{
	chrome.tabs.create({url: "http://marklets.com/"});
}

function onClickAbout()
{
	alert(chrome.i18n.getMessage('AboutExtensionDescription'));
}
