function loadBackground($el,url){
	const img=new Image();
	img.src=url;

	return new Promise((res,rej)=>{
		img.onload=res;
		img.onerror=rej;
	}).then(()=>{ // loaded
		const nowBGColor=$.Color($el,"background-color");

		(nowBGColor.lightness()<0.01?Promise.resolve():new Promise(res=>{
			$el.animate({"background-color":"#000"},500,"swing",res);
		})).then(()=>new Promise(res=>{
			$el.css("background-image",`url("${url}")`);
			$el.animate({"background-color":"#888"},500,"swing",res);
		}));
	});
}