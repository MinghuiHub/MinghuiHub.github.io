$(initPage); // Main program entrance

function hoverHint($el,hint){
	$el.on("mouseenter pointerenter",e=>{
		const hintBar=$("#content-hint-bar");
		hintBar.text(hint);
		hintBar.css("opacity","0.6");
	});
	$el.on("mouseleave pointerleave",e=>{
		const hintBar=$("#content-hint-bar");
		hintBar.css("opacity","0");
	});
}

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
	const $list=$("#content-list");
	for(const item of mainPageItems){
		const $el=$("<div>");
		$el.html("&bullet;&nbsp;"+item.name);

		const $elHint=$("<div class='extra-hint'>").text(item.hint);
		$el.append($elHint);

		hoverHint($el,item.hint);
		$list.append($el);

		if(item.url){
			$el.click(e=>{
				jumpTo(item.url);
			});
		}
	}
	arriving();

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
	const newStyleHREF=x>y?"./styles/main-style-wide.css":"./styles/main-style-thin.css";
	if(newStyleHREF!=nowStyle){ // update
		$style.attr("href",newStyleHREF);
		nowStyle=newStyleHREF;
	}
}