# 大标题[01]()

段落文字

菜单链接：鼠标移至标题上访问（正文不会显示）

[菜单链接1](*https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)

[菜单链接2](*https://marked.js.org/using_pro#renderer)

[回主页](*../index.html)

使用方法：用链接

```
markdown.html?title=<你的标题>&src=<encoded markdown 链接>
```

内嵌网页（找不到encoded markdown 链接的时候是404），拖动右下角调整大小：

![FRAME](../markdown.html)

![FRAME](//bing.com)

会自动处理相对路径。

## 二级标题

**粗体文字**和*斜体文字*。

上标<sup>1</sup>和下标<sub>2</sub>。

<u>下划线</u>和<del>删除线</del>。

[页面内链接](#第二个三级标题)

[页面内查找（目前似乎不够好用）](#:~:text=markdown)

> 引文
>
> * 一级列表
>   * 二级列表
>     * 三级列表
>     * 三级列表
> * 一级列表
>
> 一些想说的话
>
> * [ ] 勾选框
> * [ ] 勾选框2
> * [x] 选中勾选框
>
> > 二级引文
> >
> > > 引文可以嵌套。
> >
> > 1. 有序列表
> > 2. 有序列表
> > 3. 还是有序列表

### 三级标题

支持代码`Code.render`的书写。块级代码如下：

```javascript
function initPage(){
	marked.setOptions({
		highlight: function(code,lang,callback) {
			require('pygmentize-bundled')({lang: lang,format: 'html'},code,function(err,result) {
				callback(err,result.toString());
			});
		}
	});
	loadMarkdownFile().then(content=>{
		parseAndInsertMarkdown(content);
	}); // kick at first
}
```


> 块级代码过长时可以左右滑动！

页面内公式：$\alpha_r=\alpha_c+\alpha_b(1-\alpha_c) 10^{-4}$。公式可以超链接[$\alpha_r=\alpha_c+\alpha_b(1-\alpha_c)$](//en.wikipedia.org/wiki/URI_fragment)

音频和视频（必须使用AUDIO，VIDEO标签）：

![AUDIO](../resources/d.mp3)

![VIDEO](../resources/tower.mp4)

> 如果视频太大可以指定手动视频宽度、高度
> 仅适用于宽屏，不适用于手机
> 注意链接文件名大小写！
> 
> ---
>
> <video controls width="200"><source src="../resources/tower.mp4"></video>

靠左

<center>居中</center>

<div align="right">靠右的一段<br>文字</div>

图片：（JPEG或OPAQUE名的图片表示居中强调）

![JPEG](https://upload.wikimedia.org/wikipedia/en/7/7b/Aspheric_navitar_elgeet.jpg)

![OPAQUE](https://upload.wikimedia.org/wikipedia/commons/8/8d/Euler_factorial_paper.png)

想手动指定长宽需要完整`<img>`标签：

<img src="https://upload.wikimedia.org/wikipedia/commons/6/63/Logistic_Map_Animation.gif" width="400" />

### 第二个三级标题

#### 四级标题

块级公式换行请打4个反斜杠！（markdown转义）

$$
\begin{aligned}
	\alpha_r &= 1-\prod_{i=1}^N (1-f_i\alpha_c) \\\\
	&= 1-\exp\left[\sum_{i=1}^N \ln\left[1-f_i\left(1-(1-\alpha)^{1/N}\right)\right]\right] \\\\
	&\approx 1-\exp\left[\sum_{i=1}^N \ln(1-f_i\alpha/N)\right] \\\\
	&\approx 1-\exp(-\frac{\alpha}{N}\sum_{i=1}^N f_i) \\\\
	&\approx \frac{\alpha}{N}\sum_{i=1}^N f_i
\end{aligned}
$$

表格（鼠标在表头上高亮列）：

| 本列居左 | 本列居中 | 本列靠右 |
| :--- | :---: | ---: |
| 1 | * 列表<br />* 换行 |  2 |
| 嵌入文字的<img src="https://upload.wikimedia.org/wikipedia/commons/7/70/Rainbow1.svg" width="200" />图片 | SVG图片和视频  | <video controls width="200"><source src="../resources/tower.mp4"></video> |

分割线：

---

下一段落

## XSS防御

以下攻击脚本会被本页过滤：

| 类型         | 示例（已被过滤）                                             |
| ----------: | :----------------------------------------------------------: |
| 脚本嵌入     | `![img](javascript:alert(1))`<br>![img](javascript:alert(1)) |
| 转义脚本嵌入 | `[bad-link](&#0000106&#0000097&#0000118&#0000097`<br/>`&#0000115&#0000099&#0000114&#0000105&#0000112`<br/>`&#0000116&#0000058&#0000097&#0000108&#0000101`<br/>`&#0000114&#0000116&#0000040&&#0000048&&#0000041)`<br/>[bad-link](&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&&#0000048&&#0000041) |
| CSS攻击      | `<div style='background-image:url("javascript:alert(1)")'>para</div>`<br><div style='background-image:url("javascript:alert(1)")'>para</div> |

[一般而言，本页不允许 `style, href="某些脚本", onxxx=某些脚本` 等行为。这些内容在解释.md文件时会被过滤掉。]()