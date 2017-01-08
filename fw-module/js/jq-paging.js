/**
 * Created by Administrator on 2017/1/6.
 */
(function($){
    $.fn.extend({
        paging:function(options){
            var self=this;//这个self指向的是选中的那个对象即$('#paging')
            var defaultoptions={
                options : {
                    pageIndex: 1,//当前页，默认为第一页
                    pageSize: 10,//每页的条数
                    total: 0,//总数据数
                    pageBtnCount: 7,//按钮的个数包含首页这种建议取基数，当刚好等于中间的那个值的时候刚好可以出现上一页和下一页 当设置了pageSize的值的时候这个值无效。
                    showFirstLastBtn: true,//是否显示首尾页              *
                    firstBtnText: null,//首页显示的文字，不填写就显示数字
                    lastBtnText: null,//尾页显示的文字，不填就显示数字
                    prevBtnText: "&laquo;",//上一页显示的文字，不填写显示<<
                    nextBtnText: "&raquo;",//下一页显示的文字，不填写显示>>
                    remote: {
                        url: null,//ajax请求地址
                        type:'GET',//请求的类型
                        pageParams: function(options){},//一个函数返回一个请求参数的对象
                        success: null,//请求成功的回调函数
                        fail: null,//请求失败的回调函数
                        totalName: 'total'//返回的json里面关于总计的字符串名称
                    },
                    pageElementSort: ['page', 'size', 'jump', 'info'],//排序
                    showInfo: true,//是否显示分页信息(1到20条共200条)
                    infoFormat: '{start} ~ {end} 共 {countIndex} 页 {total} 条',//分页信息的内容
                    noInfoText: '目前没有数据',//没有数据时候显示信息
                    showJump: true,//是否显示跳转页
                    jumpBtnText: '跳转',//跳转页的文字
                    showPageSizes: true,//是否显示每页的数量
                    pageSizeItems: [5, 10, 15, 20]//配置每页的可选数量
                },
                page : '<ul id="paging-page"></ul>',//1 2 3
                size : '<div id="paging-size"></div>',//[5,10,15,20]
                jump : '<div id="paging-jump"></div>',//跳转页
                info : '<div id="paging-info"></div>'//信息栏
            };
            var paging=function(){
                var mergeoptions= $.extend(defaultoptions.options,options),
                    _self=this;//这个_self指向的是paging这个方法
                this.ajax(mergeoptions,function(total){
                    var options=$.extend(true,mergeoptions,total),
                        content='',
                        $size,$jump,$info;
                    for(var i=0;i<4;i++){
                        content+=defaultoptions[options.pageElementSort[i]];
                    }
                    //把page,size,jump,info这4块渲染出来
                    if(options.total){
                        //把size,jump,info这4块渲染出来
                        self.html(content);
                        $size=$('#paging-size');
                        $info=$('#paging-info');
                        $jump=$('#paging-jump');
                        //初始展现页数的按钮
                        _self.initPage(options);
                        //初始展现选项卡[5,10,20,100]
                        options.showPageSizes ? _self.renderPageSizes(options.pageSizeItems,options.pageSize) : $size.addClass('none');
                        //初始展现信息框 1~8 共80条
                        options.showInfo ? _self.renderInfo(options,1) : $info.addClass('none');
                        //初始展现跳转框 输入跳转的页数就可以跳转了
                        options.showJump ? _self.renderJump(options.jumpBtnText) : $jump.addClass('none');
                        //跳转事件绑定
                        $('#paging-jump').click(function(){
                            _self.jumpClick(options);
                        });
                        //每页显示的条数变化
                        $('#paging-size').change(function(){
                            var pageSize=$(this).find('option:selected').val();
                            _self.changeSize(options,pageSize);
                        })
                    }
                    else{
                        $('#paging').html(options.noInfoText);
                    }
                });
            };

            paging.prototype={
                //这里是ajax请求,第一次请求的时候回有callback，因为要获取到total的值，其余时候只更改页数不更改total的值
                'ajax':function(options,callback){
                    remote = options.remote || {};
                    remote.type = (remote.type || "GET").toUpperCase();
                    remote.dataType = remote.dataType || "json";
                    var params = this.formatParams(remote.pageParams(options));
                    //创建 - 非IE6 - 第一步
                    if (window.XMLHttpRequest) {
                        var xhr = new XMLHttpRequest();
                    } else { //IE6及其以下版本浏览器
                        var xhr = new ActiveXObject('Microsoft.XMLHTTP');
                    }
                    //接收 - 第三步
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                            var status = xhr.status;
                            if (status >= 200 && status < 300) {
                                remote.success && remote.success(xhr.responseText, options);
                                callback ? callback({total:JSON.parse(xhr.responseText)[remote.totalName]}) : '';
                            } else {
                                remote.fail && remote.fail(status);
                            }
                        }
                    }
                    //连接 和 发送 - 第二步
                    if (remote.type == "GET") {
                        xhr.open("GET", remote.url + "?" + params, true);
                        xhr.send(null);
                    } else if (remote.type == "POST") {
                        xhr.open("POST", remote.url, true);
                        //设置表单提交时的内容类型
                        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                        xhr.send(params);
                    }
                },
                //配置请求参数
                'formatParams':function(data){
                    var arr = [];
                    for (var name in data) {
                        arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
                    }
                    arr.push(("v=" + Math.random()).replace(".",""));
                    return arr.join("&");
                },
                //这里是渲染出首页、尾页、上一页和下一页，以及这4个按钮的事件绑定
                'initPage':function(options){
                    var pagecontent='',//这个是用于渲染出列表的 1 2 3
                        $page=$('#paging-page'),
                        countIndex=Math.ceil(options.total/options.pageSize),//总共有多少页
                        pageBtnCount=options.pageBtnCount,
                        showFirstLastBtn=options.showFirstLastBtn,
                        firstBtnText=options.firstBtnText,
                        lastBtnText=options.lastBtnText,
                        prevBtnText=options.prevBtnText,
                        nextBtnText=options.nextBtnText,
                        _self=this;
                    //当页数超过设置的按钮数的时候
                    if(countIndex > pageBtnCount){
                        //判断是否要显示首尾页，如果true 添加首页的按钮，按钮默认是隐藏的
                        pagecontent='<li><span class="paging-prev">'+prevBtnText+'</span></li><li><span class="paging-next">'+nextBtnText+'</span></li>';
                        if(showFirstLastBtn){
                            pagecontent= '<li><span class="paging-first">'+(firstBtnText ? firstBtnText : 1)+'</span></li>'+pagecontent+
                                '<li><span class="paging-last">'+(lastBtnText ? lastBtnText : countIndex)+'</span></li>';
                        }
                        $page.html(pagecontent);
                        //渲染序号列
                        this.renderPage(options,1,3);
                        //上一页按钮事件绑定
                        $('.paging-prev').click(function(){
                            _self.prvebtnClick(options,$page.find('.active').attr('data-index'));
                        });
                        //下一页按钮事件绑定
                        $('.paging-next').click(function(){
                            _self.nextbtnClick(options,$page.find('.active').attr('data-index'));
                        });
                        //首页事件绑定
                        if(options.showFirstLastBtn){
                            $page.on('click','.paging-first',function(){
                                _self.renderPage(options,1,3);
                                _self.renderInfo(options,1);
                                _self.changeIndex(options,1);
                            })
                        }
                        //尾页事件绑定
                        if(options.showFirstLastBtn){
                            $page.find('.paging-last').click(function(){
                                _self.renderPage(options,countIndex,1);
                                _self.renderInfo(options,Math.ceil(options.total/options.pageSize));
                                _self.changeIndex(options,Math.ceil(options.total/options.pageSize));
                            });
                        }
                    }
                    //当页数小于等于按钮数的时候
                    else if(countIndex <= pageBtnCount){
                        for(var i=0;i<countIndex;i++){
                            pagecontent+='<li><a data-index='+(i+1)+'>'+(i+1)+'</a></li>';
                        }
                        $page.html(pagecontent);
                        $page.find('a:eq(0)').addClass('active');
                        //给页码按钮添加点击事件 如1 2 3 4
                        $page.find('a').click(function(){
                            var index=$(this).attr('data-index');
                            _self.defaultClick(index);
                        });
                    }
                },
                //把1 2 3这种序列号渲染出来 number:当前点击的按钮的index值 type：1表示显示上一页和首页 2表示显示上一页和上一页以及首尾页 3表示显示下一页和尾页
                'renderPage':function(options,number,type,where){
                    var $page=$('#paging-page'),
                        countIndex=Math.ceil(options.total/options.pageSize),//一共有几页
                        pageBtnCount=options.pageBtnCount,
                        showFirstLastBtn=options.showFirstLastBtn,
                        startIndex,//从左到右最左边的那个值
                        activeIndex,//需要高亮显示的那个按钮
                        length,//1 2 3 这种按钮的个数
                        location, //在那个按钮前面插入
                        _self=this;
                    //删除里面的li标签（除了首尾页以及上下页的li）
                    $page.find('.commonbtn').remove();
                    //这时候显示上一页和首页（如果true）
                    if(type==1){
                        if(showFirstLastBtn){
                            length=pageBtnCount-2;
                            location=1;
                        }
                        else{
                            length=pageBtnCount-1;
                            location=0;
                        }
                        for(var i=0;i<length;i++){
                            $page.children('li').eq(location+i).after('<li class="commonbtn"><a data-index='+(countIndex-pageBtnCount+i+location+2)+'>'+(countIndex-pageBtnCount+i+location+2)+'</a></li>')
                            //如果当前a里面的值和number相等，那么这个就高亮显示
                            if(countIndex-pageBtnCount+i+location+2==number){
                                activeIndex=i;
                            }
                        }
                        $page.find('.paging-last').addClass('none');
                        $page.find('.paging-next').addClass('none');
                        $page.find('.paging-first').removeClass('none');
                        $page.find('.paging-prev').removeClass('none');
                        $page.find('a').eq(activeIndex).addClass('active');
                    }
                    //这时候显示上一页和上一页以及首尾页（如果true）
                    else if(type==2){
                        if(showFirstLastBtn){
                            length=pageBtnCount-6;
                            location=1;
                        }
                        else{
                            length=pageBtnCount-4;
                            location=0;
                        }
                        //这里统一第一个a的html的值都是从startIndex开始
                        if(where=='fsecond'){
                            startIndex=number-1;
                            activeIndex=1;
                        }
                        else{
                            startIndex=number-length;
                            activeIndex=length;
                        }
                        for(var i=0;i<length+2;i++){
                            $page.children('li').eq(location+i).after('<li class="commonbtn"><a data-index='+(startIndex+i)+'>'+(startIndex+i)+'</a></li>');
                        }
                        $page.find('.paging-first').removeClass('none');
                        $page.find('.paging-prev').removeClass('none');
                        $page.find('.paging-last').removeClass('none');
                        $page.find('.paging-next').removeClass('none');
                        $page.find('a').eq(activeIndex).addClass('active');
                    }
                    //这时候显示下一页和尾页（如果true）
                    else if(type==3){
                        if(showFirstLastBtn){
                            length=pageBtnCount-2;
                            location=1;
                        }
                        else{
                            length=pageBtnCount-1;
                            location=0;
                        }
                        for(var i=0;i<length;i++){
                            $page.children('li').eq(location+i).after('<li class="commonbtn"><a data-index='+(i+1)+'>'+(i+1)+'</a></li>');
                        }
                        $page.find('.paging-first').addClass('none');
                        $page.find('.paging-prev').addClass('none');
                        $page.find('.paging-last').removeClass('none');
                        $page.find('.paging-next').removeClass('none');
                        $page.find('a').eq(number-1).addClass('active');
                    }
                    else{
                        console.log('不存在当前的类型');
                    }
                    //给页码按钮添加点击事件 如1 2 3 4
                    $page.find('a').click(function(){
                        var index=$(this).attr('data-index');
                        _self.btnClick(options,index);
                    });
                },
                //渲染出select选项卡
                'renderPageSizes':function(pageSizeItems,pageSize){
                    var selehtml='<select>',
                        $size=$('#paging-size'),
                        $options;
                    for(var i=0;i<pageSizeItems.length;i++){
                        selehtml+='<option value='+pageSizeItems[i]+'>'+pageSizeItems[i]+'</option>';
                    }
                    selehtml+='</select>';
                    $size.html(selehtml);
                    $options=$size.find('option');
                    for(var i=0;i<$options.length;i++){
                        if($options[i].value == pageSize){
                            $options[i].setAttribute('selected','selected');
                            return;
                        }
                    }
                },
                //渲染出说明 1-10 共200页 info的信息
                'renderInfo':function(options,index){
                    var start= (index-1)*options.pageSize + 1 ,
                        end=(index==Math.ceil(options.total/options.pageSize)) ? options.total : parseInt(index)*options.pageSize,
                        countIndex=Math.ceil(options.total/options.pageSize),
                        $info=$('#paging-info'),
                        infoFormat=options.infoFormat;
                    infoFormat.indexOf('{start}') >= 0 ? infoFormat=infoFormat.replace(/\{start\}/g,start) : '';
                    infoFormat.indexOf('{end}') >= 0 ? infoFormat=infoFormat.replace(/\{end\}/g,end) : '';
                    infoFormat.indexOf('{countIndex}') >= 0 ? infoFormat=infoFormat.replace(/\{countIndex\}/g,countIndex) : '';
                    infoFormat.indexOf('{total}') >= 0 ? infoFormat=infoFormat.replace(/\{total\}/g,options.total) : '';
                    $info.html(infoFormat);
                },
                //渲染出跳转页  []跳转
                'renderJump':function(jumpBtnText){
                    var jump='<div class="paging-group"><input type="text" class="jump"><button type="button">'+jumpBtnText+'</button>',
                        $jump=$('#paging-jump');
                    $jump.html(jump);
                },
                //点击跳转按钮事件
                'jumpClick':function(options){
                    var countIndex=Math.ceil(options.total/options.pageSize),
                        index=$('#paging-jump').find('input').val(),
                        minIndex,
                        maxIndex;
                    //如果输入的值小于total/pagesize的值的时候
                    if(index<=countIndex && index>0){
                        if(options.showFirstLastBtn){
                            minIndex=options.pageBtnCount-2;
                            maxIndex=countIndex-options.pageBtnCount + 3;
                        }
                        else{
                            minIndex=options.pageBtnCount-1;
                            maxIndex=countIndex-options.pageBtnCount + 2;
                        }
                        //把1 2 3这种按钮先重新渲染出来
                        if(0<index && index<minIndex){
                            this.renderPage(options,index,3);
                        }
                        else if(index>=minIndex  && index<=maxIndex){
                            this.renderPage(options,index,2,'fsecond');
                        }
                        else{
                            this.renderPage(options,index,1);
                        }
                        this.renderInfo(options,index);//重新渲染info信息
                        this.changeIndex(options,index);//重新渲染数据
                        $('#paging-jump').find('input').val('');
                    }
                },
                //改变每页显示的数目
                'changeSize':function(options,pageSize){
                    options.pageSize=pageSize;
                    options.pageIndex=1;
                    this.ajax(options);
                    $('#paging-page').html('');
                    this.initPage(options);
                    this.renderInfo(options,1);
                },
                //按钮的点击事件（在不发生按钮数目变化的情况下）
                'defaultClick':function(index){
                    var $page=$('#paging-page'),
                        length=$page.find('a').length;
                    $page.find('.active').removeClass('active');
                    for(var i=0;i<length;i++){
                        if($page.find('a').eq(i).attr('data-index')==index){
                            $page.find('a').eq(i).addClass('active');
                        }
                    }
                },
                //按钮的点击事件（在发生按钮数目变化的情况下）
                'btnClick':function(options,index){
                    var countIndex=Math.ceil(options.total/options.pageSize),
                        $page=$('#paging-page'),
                        length=$page.find('a').length,
                        lefeaIndex=$page.find('a').eq(0).attr('data-index'),
                        rightaIndex=$page.find('a').eq(length-1).attr('data-index'),
                        dealIndex;
                    this.changeIndex(options,index);//重新获取数据；
                    $page.find('.active').removeClass('active');
                    //判断是否在最左边
                    if(lefeaIndex==index){
                        //这里加上<的原因是如果左边是1的话就会出现负数
                        if((options.showFirstLastBtn && index<=options.pageBtnCount-3) || (!options.showFirstLastBtn && index<=options.pageBtnCount-2)){
                            this.renderPage(options,index,3);
                        }
                        //这里加上>的原因是如果右边是最大值的话就会出现超过最大值的情况
                        else if((options.showFirstLastBtn && index>=countIndex-options.pageBtnCount+3) || (!options.showFirstLastBtn && index>=countIndex-options.pageBtnCount+2)){
                            this.renderPage(options,index,2,'lsecond');
                        }
                        else{
                            options.showFirstLastBtn ? dealIndex=parseInt(index)-options.pageBtnCount+6 : dealIndex=parseInt(index)-options.pageBtnCount+4;
                            for(var i=0;i<length;i++){
                                $page.find('a').eq(i).html(dealIndex+i);
                                $page.find('a').eq(i).attr('data-index',dealIndex+i);
                            }
                            $page.find('a').eq(length-2).addClass('active');
                        }
                    }
                    //最右边
                    else if(rightaIndex==index){
                        if((options.showFirstLastBtn && index<=options.pageBtnCount-2) || (!options.showFirstLastBtn && index<=options.pageBtnCount-1)){
                            this.renderPage(options,index,2,'fsecond');
                        }
                        else if((options.showFirstLastBtn && index>=countIndex-options.pageBtnCount+4) || (!options.showFirstLastBtn && index>=countIndex-options.pageBtnCount+3)){
                            this.renderPage(options,index,1);
                        }
                        else{
                            for(var i=0;i<length;i++){
                                $page.find('a').eq(i).html(parseInt(index)+i-1);
                                $page.find('a').eq(i).attr('data-index',parseInt(index)+i-1);
                            }
                            $page.find('a').eq(1).addClass('active');
                        }
                    }
                    else{
                        this.defaultClick(index);
                    }
                    this.renderInfo(options,index);
                },
                //点击上一页
                'prvebtnClick':function(options,index){
                    var countIndex=Math.ceil(options.total/options.pageSize),//共有几页
                        $page=$('#paging-page'),
                        alength=$page.find('a').length,//当前按钮的个数
                        $secondaIndex=$page.find('a')[1].getAttribute('data-index'),//当前第二个按钮的index值
                        minIndex,//上界限
                        maxIndex,//下界限
                        activeIndex;//当前active的按钮索引
                    this.changeIndex(options,index-1);
                    //根据是否显示首尾页就上下边界也会变化
                    if(options.showFirstLastBtn){
                        minIndex=options.pageBtnCount-2;//上界限
                        maxIndex=countIndex-options.pageBtnCount + 4;//下界限
                    }
                    else{
                        minIndex=options.pageBtnCount-1;//上界限
                        maxIndex=countIndex-options.pageBtnCount + 3;//下界限
                    }
                    //如果刚好在max边界的话说明按钮要变多了
                    if(index==maxIndex){
                        this.renderPage(options,index-1,2,'lsecond');
                    }
                    //当处于min边界的时候按钮又变少了
                    else if(index==minIndex){
                        this.renderPage(options,index-1,3);
                    }
                    //当处于正数第二个的时候就要全部按钮都减小
                    else if($secondaIndex==index){
                        activeIndex=$page.find('.active').attr('data-index');
                        for(var i=0;i<$page.find('a').length;i++){
                            options.showFirstLastBtn ? $page.find('a').eq(i).html(activeIndex-options.pageBtnCount+5+i):
                                $page.find('a').eq(i).html(activeIndex-options.pageBtnCount+3+i);
                            $page.find('a').eq(i).attr('data-index',$page.find('a').eq(i).html());
                        }
                        $page.find('.active').removeClass('active');
                        $page.find('a').eq(alength-2).addClass('active');
                    }
                    //当处于中间的话就只需要改变高亮
                    else{
                        for(var i=0;i<$page.find('a').length;i++){
                            if($page.find('a').eq(i).attr('data-index')==index){
                                $page.find('a').eq(i-1).addClass('active');
                                $page.find('a').eq(i).removeClass('active');
                            }
                        }
                    }
                    this.renderInfo(options,index);
                },
                //点击下一页
                'nextbtnClick':function(options,index){
                    var countIndex=Math.ceil(options.total/options.pageSize),//共有几页
                        $page=$('#paging-page'),
                        alength=$page.find('a').length,//当前按钮的个数
                        $secondaIndex=$page.find('a').eq(alength-2).attr('data-index'),
                        minIndex,//上界限
                        maxIndex,//下界限
                        activeIndex;
                    this.changeIndex(options,parseInt(index)+1);
                    //根据是否显示首尾页就上下边界也会变化
                    if(options.showFirstLastBtn){
                        minIndex=options.pageBtnCount-3;//上界限
                        maxIndex=countIndex-options.pageBtnCount + 3;//下界限
                    }
                    else{
                        minIndex=options.pageBtnCount-2;//上界限
                        maxIndex=countIndex-options.pageBtnCount + 2;//下界限
                    }
                    //如果刚好在max边界的话说明按钮要变多了
                    if(index==maxIndex){
                        this.renderPage(options,parseInt(index)+1,1);
                    }
                    //当处于min边界的时候按钮又变少了
                    else if(index==minIndex){
                        this.renderPage(options,parseInt(index)+1,2,'fsecond');
                    }
                    //当处于倒数第二个的时候就要全部按钮都加
                    else if($secondaIndex==index){
                        activeIndex=$page.find('.active').attr('data-index');
                        for(var i=0;i<$page.find('a').length;i++){
                            $page.find('a').eq(i).html(parseInt(activeIndex)+i);
                            $page.find('a').eq(i).attr('data-index',$page.find('a').eq(i).html());
                        }
                        $page.find('.active').removeClass('active');
                        $page.find('a').eq(1).addClass('active');
                    }
                    //当处于中间的话就只需要改变高亮
                    else{
                        for(var i=0;i<$page.find('a').length;i++){
                            if($page.find('a').eq(i).attr('data-index')==index){
                                $page.find('a').eq(i+1).addClass('active');
                                $page.find('a').eq(i).removeClass('active');
                            }
                        }
                    }
                    this.renderInfo(options,index);
                },
                //根据index值不同请求数据重新渲染数据
                'changeIndex':function(options,index){
                    options.pageIndex=index;
                    this.ajax(options);
                }
            };
            return new paging();
        }
    })
})(jQuery);

/*
有首尾
    0<x<pageBtnCount-2                            type=3
    pageBtnCount-2<=x<=countIndex-pageBtnCount+4  type=2
    countIndex-pageBtnCount+4<=x<countIndex       type=1
无首尾
    0<x<pageBtnCount-1                            type=3
    pageBtnCount-1<=x<=countIndex-pageBtnCount+3  type=2
    countIndex-pageBtnCount+3<=x<countIndex       type=1
*/