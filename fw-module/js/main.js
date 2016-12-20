/**
 * Created by zyj on 2016/12/13.
 */
require.config({
    baseUrl:"fw-module/js/",
    //这个是重命名
    paths : {
        fw:'fw',
        paging:'paging'
    }
});

require(['fw','paging'],function(fw,paging){
    fw('paging').paging({
        pageSize: 10,
        pageIndex:1,
        pageElementSort: ['page','jump', 'info','size'],
        remote: {
            url: './fw-module/json/wechat.js',//ajax请求地址
            type:'GET',
            pageParams:function(data){//请求参数
                return{
                    'index':data.pageIndex,
                    'size':data.pageSize
                }
            },
            success: function(data,options){//请求成功
                var data=JSON.parse(data),
                    $ul=document.getElementsByTagName('ul')[0],
                    length=options.pageSize,
                    out='';
                for(var i=0;i<length;i++){
                    out+='<li style="list-style-type:none;">'+data.dt[i].title+'</li>';
                }
                $ul.innerHTML=out;
            },
            fail: null,//请求失败
            totalName: 'aID'//返回的数量总计
        },
        pageSizeItems: [5, 10, 15, 100],
        nextBtnText:'下一页',
        showJump: true,
        prevBtnText: "上一页",
        firstBtnText:'首页',
        lastBtnText:'末页',
        pageBtnCount: 11,
        showFirstLastBtn: true
    });
});