$(initPage); // Main program entrance

function arriving(){
	loadBackground($("body"),PAGE_BG||"./resources/main-bg.jpg").catch(()=>{
		// default image
		loadBackground($("body"),"./resources/main-bg.jpg");
	});
	$(window).on("focus",e => {
		$("#page-mask").fadeOut(500);
	});
	return new Promise(res=>{
		$("#page-mask").fadeOut(500,res);
	});
}

function jumpTo(url){
	$("#page-mask").fadeIn(500,()=>{
		window.location.href=url;
	});
}

// @TODO: XSS filter after pasing the whole page
function XSSCheck(url){ // XSS filter
	const link=`<a href="${url}"></a>`;
	const filtered=filterXSS(link);
	return link!==filtered;
}

function initPage(){
	arriving();
	marked.use({
		renderer:{
			link:(href,title,text)=>{ // add animation
				if(href.startsWith("*")){ // in title block
					let url=href.substring(1);
					if(XSSCheck(url)){
						return "";
					}
					if(url.match(/^\.*\/[^\/].*$/)){ // relative route
						url=PAGE_ROUTE+url;
					}
					appendTitleBlock(url,text);
					return "";
				}

				return `<a href="${href}">${text}</a>`;
			},
			table:(header,body)=>{ // add surroundings fow overflow
				return `<div class="table-container"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
			},
			image:(href,title,text)=>{
				if(text=="FRAME"){
					return `<div class="iframe-container"><iframe src="${href}"></iframe><div class="iframe-resizer"></div></div>`;
				}
				if(text=="AUDIO"){
					return `<div class="audio-container"><audio controls src="${href}" crossorigin="use-credentials">Your browser does not support <code>audio</code> element.</audio></div>`;
				}
				if(text=="VIDEO"){
					return `<video controls crossorigin="use-credentials"><source src="${href}">Your browser does not support <code>video</code> element.</video>`;
				}
				if(text=="OPAQUE"){
					return `<img class="opaque" src="${href}" alt="${text}">`;
				}
				return `<img src="${href}" alt="${text}">`;
			}
		}
	});
	loadMarkdownFile().then(content=>{
		parseAndInsertMarkdown(content);
		hljs.highlightAll();
		$("#content-list img:only-child") // center-align single images
			.parent()
			.filter(function(){return !$(this).text().length})
			.addClass("oneline-img-container");
		$("#content-list img")
			.filter(function(){
				return this.src.endsWith(".jpg")||
					this.src.endsWith(".jpeg")||
					this.src.endsWith(".jfif")||
					this.src.endsWith(".bmp")||
					this.src.endsWith(".gif");
			})
			.addClass("opaque");

		function modifyRelativeURL($el,attribute){
			const a=$el.attr(attribute);
			if(a){
				$el.attr(attribute,PAGE_ROUTE+a);
			}
		}
		$("#content-list").find("img, audio, iframe, source").each(function(){
			const $this=$(this);
			if($this.attr("src").match(/^\.*\/[^\/].*$/)){
				modifyRelativeURL($this,"src");
			}
		});
		$("#content-list").find("a").each(function(){
			const $this=$(this);
			const href=$this.attr("href");
			if(!href){ // filtered or no content
				return;
			}
			if(href.match(/^\.*\/[^\/].*$/)){
				modifyRelativeURL($this,"href");
			}
			if(!href.startsWith("#")){ // not modified also
				const newHref=$this.attr("href");
				$this.attr("href",`javascript:jumpTo("${newHref}")`);
			}
		});
	}).catch(err=>{
		$("#content-list").addClass("error-block");
		$("#page-content").addClass("error-container");
		if(err.status){
			$("#content-list").text(err.status);
		}
		else{
			$("#content-list").text("Error");
		}
	});
	$("#title-text").text(PAGE_TITLE||"Null");

	$(window).on("resize",e=>{
		const x=window.innerWidth;
		const y=window.innerHeight;
		onResize(x,y);
	});
	onResize(window.innerWidth,window.innerHeight); // kick at first
}

let nowStyle="";
function onResize(x,y){
	const $style=$("#page-style");
	const newStyleHREF=x>y?"./styles/main-markdown-style-wide.css":"./styles/main-markdown-style-thin.css";
	if(newStyleHREF!=nowStyle){ // update
		$style.attr("href",newStyleHREF);
		nowStyle=newStyleHREF;
	}
}

// ================ markdown loading ================

function loadMarkdownFile(){
	if(!PAGE_CONTENT){
		throw new Error("No PAGE_CONTENT found.");
	}
	const TIMEOUT_DOWNLOAD=10000; // there should be progress in 10s
	return new Promise((res,rej)=>{
		const req=new XMLHttpRequest();
		let abortTimer=0;
		function clearAbortTimer(){
			if(abortTimer){
				clearTimeout(abortTimer);
				abortTimer=0;
			}
		}
		function restartAbortTimer(){
			clearAbortTimer();
			abortTimer=setTimeout(()=>{ // cancel download
				req.abort();
			},TIMEOUT_DOWNLOAD);
		}

		req.open("GET",PAGE_CONTENT);
		req.responseType="text"; // require text
		req.onload=()=>{ // 100% is also captured by onprogress
			if(req.status>=400){
				rej(req);
			}
			else{
				res(req.response);
			}
		};
		req.onprogress=event=>{ // download process can be monitored
			restartAbortTimer(); // restart download monitoring
		}
		req.ontimeout=()=>rej("Timeout");
		req.onabort=()=>rej("Timeout");
		req.onerror=()=>rej(req);
		req.send();
		restartAbortTimer(); // start countdown
	});
}

function parseAndInsertMarkdown(content){
	const $el=$("#content-list");
	const mdHTML=marked(content); // parse markdown source into HTML
	const docIndex=[];
	const whiteList=filterXSS.whiteList;
	whiteList["iframe"]=["src"];
	whiteList["source"]=["src"];
	whiteList["input"]=["checked","disabled","type"];
	whiteList["title"]=[];
	const filtered=filterXSS(mdHTML,{
		onIgnoreTagAttr: (tag,name,value)=>{
			switch(name){
				case "class": return `class="${value}"`;
				case "align": return `align="${value}"`;
				case "id": return `id="${value}"`;
				case "name": return `name="${value}"`;
			}
		},
		onTagAttr: (tag,name,value)=>{ // get headings
			if(tag.match(/^h[1-6]$/)&&name=="id"){
				docIndex.push({
					level: Number.parseInt(tag.charAt(1)),
					id: value
				});
			}
		}
	});
	$el.html(filtered);
	renderLaTeX();
	try{
		// docIndex is the current index of all headings
		createIndex(docIndex);
	}
	catch(err){
		console.warn(err);
	}
}

function renderLaTeX(){
	try{
		MathJax.Hub.Queue(["Typeset",MathJax.Hub,"content-list"]);
		// Do not use MathJax V3: not better than V2 effect now
		// MathJax.typesetPromise($("#content-list"));
	}
	catch(err){
		if(err instanceof ReferenceError){ // not loaded, try again later
			setTimeout(renderLaTeX,1000);
		}
		else{ // other types of error
			throw err;
		}
	}
}

function createIndex(docIndex){
	const $container=$("#index-list");
	let isIndex=false;
	for(const item of docIndex){
		if(item.level>3)continue;
		const content=$(`#${item.id}`).text();
		const $ui=$(`
			<h${item.level}>
				<a href="#${item.id}">${content}</a>
			</h${item.level}>
		`);
		$container.append($ui);
		isIndex=true;
	}
	if(isIndex){
		$("#index-block").css("display","block");
	}
}

function appendTitleBlock(url,text){
	$el=$("<div class='title-item'>");
	$el.text(text);
	$el.click(()=>jumpTo(url));
	$("#title-container").append($el);
}