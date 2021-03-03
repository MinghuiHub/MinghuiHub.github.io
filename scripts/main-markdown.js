$(initPage); // Main program entrance

function arriving(){
	return new Promise(res=>{
		$("#page-mask").fadeOut(500,res);
	});
}

function jumpTo(url){
	$("#page-mask").fadeIn(500,()=>{
		window.location.href=url;
	});
}

function initPage(){
	arriving();
	marked.use({
		renderer:{
			link:(href,title,text)=>{ // add animation
				return `<a href="javascript:jumpTo('${href}')">${text}</a>`;
			}
		}
	});
	loadMarkdownFile().then(content=>{
		parseAndInsertMarkdown(content);
		hljs.highlightAll();
	});
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
	$el.html(mdHTML);

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