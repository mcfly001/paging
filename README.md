﻿paging
这是一个关于分页的插件

#首先说明一下各个结构
  
>>fw-module是各个模块，里面的js分为fw.js(里面主要是写了类似jquery的选择器以及extend函数),main.js（模块的主入口文件）,paging.js是分页插件的主要逻辑
  
>>build的文件夹里面的是把fw-module里面的3个js模块文件通过require打包压缩后的总和。
  
>>demo.html是用require打包后的案例，demo2是未打包的时候的案例

#接下来插件的使用方式
 
##本插件一共有20个配置项
	
####当前页，默认为第一页

pageIndex: 1

####每页的条数,默认为每页为10条数据，这里的条数一定要是下面pageSizeItems数组里面的一个

pageSize: 10

####总数据数(这个值一般不需要设置，由第一次请求时候返回)

total: 0

####按钮的个数包含首页这种建议取基数，当showFirstLastBtn的值为true时候,该取值要大于5。

pageBtnCount: 7

####是否显示首尾页  

showFirstLastBtn: true,

####首页显示的文字，不填写就显示数字 string '首页'

firstBtnText: null,

####尾页显示的文字，不填就显示数字  string  '尾页'

lastBtnText: null

####上一页显示的文字，不填写显示<< string '上一页'

prevBtnText: "&laquo;"

####下一页显示的文字，不填写显示>> string '下一页'

nextBtnText: "&raquo;"

####远程请求的配置项

remote: {
	url: null,//ajax请求地址
	
	type: null,//请求类型 
	
	pageParams: function(data){//这里的data就是所有的20个配置项		
		return {
		 'size':data.pageSize,  //请求参数		
		 'index':data.pageIndex
		}
	},	
	success: null,//请求成功事件
	
	fail:null, 请求失败事件
	
	totalName: 'total',//这里的值是第一次请求时候json里面关于总计的字符串，比如案例里面返回的总计的字符串为'aID'	
},

####排序,这4个值可以改变位置 比如['page', 'jump', 'info' ,'size']

pageElementSort: ['page', 'size', 'jump', 'info']

####是否显示分页信息(1到20条共200条)

showInfo: true,//

####分页信息的内容,{start}的为该页开始的值，{end}为该页的最后一个值，{pageNumber}总页数 {total}为总的值，如果只想显示总的值，这3个值可以填也可以选择省略。

infoFormat: '{start} ~ {end} 共{pageNumber}页 {total} 条'

####没有数据时候显示信息

noInfoText: '目前没有数据'

####是否显示跳转页

showJump: true

####跳转页的文字

jumpBtnText: '跳转'

####是否显示每页的数量

showPageSizes: true

####配置每页的可选数量 

pageSizeItems: [5, 10, 15, 20]

