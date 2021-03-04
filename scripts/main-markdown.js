$(initPage); // Main program entrance

function arriving(){
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

				if(XSSCheck(href)){
					return "";
				}
				if(href.startsWith("#")){ // this page, no animation
					return `<a href="${href}">${text}</a>`;
				}
				if(href.match(/^\.*\/[^\/].*$/)){ // relative route
					href=PAGE_ROUTE+href;
				}
				return `<a href="javascript:jumpTo('${href}')">${text}</a>`;
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
					return `<img class="opaque-img" src="${href}" alt="${text}">`;
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
			.addClass("opaque-img");

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
				$this.attr("href",`javascript:jumpTo(${newHref})`);
			}
		});
	});
	$("#title-text").text(PAGE_TITLE);

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
			res(req.response);
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
	const whiteList=filterXSS.whiteList;
	whiteList["iframe"]=["src"];
	whiteList["source"]=["src"];
	whiteList["input"]=["checked","disabled","type"];
	whiteList["title"]=[];
	const filtered=filterXSS(mdHTML,{
		onIgnoreTagAttr: function(tag, name, value, isWhiteAttr) {
			if (name==="class") {
				return `class="${value}"`;
			}
		}
	});
	$el.html(filtered);
	renderLaTeX();
}

function renderLaTeX(){
	try{
		MathJax.Hub.Queue(["Typeset",MathJax.Hub,"content-list"]);
		// Do not use MathJax V3: not better than V2 effect now
		// MathJax.typesetPromise($("#content-list")).then(() => {
		// 	// the new content is has been typeset
		// 	console.log("Set");
		// });
	}
	catch(err){
		if(err instanceof ReferenceError){ // not loaded, try again later
			setTimeout(renderLaTeX,1000);
		}
		else{
			throw err;
		}
		// else: other type of error
	}
}

function appendTitleBlock(url,text){
	$el=$("<div class='title-item'>");
	$el.text(text);
	$el.click(()=>jumpTo(url));
	$("#title-container").append($el);
}