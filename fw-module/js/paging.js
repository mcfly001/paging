/**
 * Created by zyj on 2016/12/14.
 */
define(['fw'],function(fw){
    //定义一些默认值
    var component={
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
                pageParams: null,//一个函数返回一个请求参数的对象
                success: null,//请求成功的回调函数
                fail: null,//请求失败的回调函数
                totalName: 'total'//返回的json里面关于总计的字符串名称
            },
            pageElementSort: ['page', 'size', 'jump', 'info'],//排序
            showInfo: true,//是否显示分页信息(1到20条共200条)
            infoFormat: '{start} ~ {end} 共 {pageNumber} 页 {total} 条',//分页信息的内容
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

    //给选择对象添加paging的这个方法
    fw.fn.extend({
        'formatParams':function(data){
            var arr = [];
            for (var name in data) {
                arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
            }
            arr.push(("v=" + Math.random()).replace(".",""));
            return arr.join("&");
        },
        'ajax':function(remote,customoptions,callback){
            options = remote || {};
            options.type = (options.type || "GET").toUpperCase();
            options.dataType = options.dataType || "json";
            var params = this.formatParams(options.pageParams(customoptions));
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
                        options.success && options.success(xhr.responseText, customoptions);
                        callback ? callback({total:JSON.parse(xhr.responseText)[options.totalName]}) : '';
                    } else {
                        options.fail && options.fail(status);
                    }
                }
            }
            //连接 和 发送 - 第二步
            if (options.type == "GET") {
                xhr.open("GET", options.url + "?" + params, true);
                xhr.send(null);
            } else if (options.type == "POST") {
                xhr.open("POST", options.url, true);
                //设置表单提交时的内容类型
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.send(params);
            }
        },
        //产生分页
        'paging':function(options){
            var _self=this;
            _self.options=options;
            this.ajax(options.remote,options,function(total){
                var options=fw.extend(true,component.options,_self.options,total),
                    i= 0,
                    content='',//这个是把4块添加到内容里面去；
                    $page,$size,$jump,$info;
                for(;i<4;i++){
                    content+=component[options.pageElementSort[i]];
                }
                //当有数据的时候
                if(options.total){
                    //把page,size,jump,info这4块渲染出来
                    _self[0].innerHTML=content;
                    $page=document.getElementById('paging-page');
                    $size=document.getElementById('paging-size');
                    $jump=document.getElementById('paging-jump');
                    $info=document.getElementById('paging-info');
                    //初始展现页数的按钮
                    _self.initPage(options);
                    //初始展现选项卡[5,10,20,100]
                    options.showPageSizes ? _self.renderPageSizes(options.pageSizeItems,options.pageSize) : $size.className='none';
                    //初始展现信息框 1~8 共80条
                    options.showInfo ? _self.renderInfo(options,0) : $info.className='none';
                    //初始展现跳转框 输入跳转的页数就可以跳转了
                    options.showJump ? _self.renderJump(options.jumpBtnText) : $jump.className='none';
                    //跳转事件绑定
                    _self.addClick($jump.getElementsByTagName('button')[0],function(){
                        _self.jumpClick(options)
                    });
                    //每页显示的条数变化
                    $size.getElementsByTagName('select')[0].onchange=function(){
                        var pageSize=this.value;
                        _self.changeSize(options,pageSize);
                    };
                }
                else{//当没有数据的时候
                    _self[0].innerHTML=options.noInfoText;
                }
            })
        },
        //这里是渲染出首页、尾页、上一页和下一页，以及这4个按钮的事件绑定
        'initPage':function(options){
            var pagecontent='',//这个是用于渲染出列表的 1 2 3
                $page=document.getElementById('paging-page'),
                countIndex=Math.ceil(options.total/options.pageSize),//总共有多少页
                pageBtnCount=options.pageBtnCount,
                showFirstLastBtn=options.showFirstLastBtn,
                firstBtnText=options.firstBtnText,
                lastBtnText=options.lastBtnText,
                prevBtnText=options.prevBtnText,
                nextBtnText=options.nextBtnText,
                _self=this;
            //当页数超过按钮数的时候
            if(countIndex > pageBtnCount){
                //判断是否要显示首尾页，如果true 添加首页的按钮，按钮默认是隐藏的
                pagecontent='<li><span class="paging-prev">'+prevBtnText+'</span></li><li><span class="paging-next">'+nextBtnText+'</span></li>';
                if(showFirstLastBtn){
                    pagecontent= '<li><span class="paging-first">'+(firstBtnText ? firstBtnText : 1)+'</span></li>'+pagecontent+
                        '<li><span class="paging-last">'+(lastBtnText ? lastBtnText : countIndex)+'</span></li>';
                }
                $page.innerHTML=pagecontent;
                //渲染序号列
                this.renderPage(options,1,3);
                //上一页按钮事件绑定
                this.addClick(document.getElementsByClassName('paging-prev')[0],function(){
                    _self.prvebtnClick(options,$page.getElementsByClassName('active')[0].getAttribute('data-index'));
                });
                //下一页按钮事件绑定
                this.addClick(document.getElementsByClassName('paging-next')[0],function(){
                    _self.nextbtnClick(options,$page.getElementsByClassName('active')[0].getAttribute('data-index'));
                });
                //首页按钮事件绑定
                options.showFirstLastBtn ? this.addClick(document.getElementsByClassName('paging-first')[0],function(){
                    _self.renderPage(options,1,3);
                    _self.renderInfo(options,0);
                    _self.changeIndex(options,1);
                }) : '';
                //尾页按钮事件绑定
                options.showFirstLastBtn ? this.addClick(document.getElementsByClassName('paging-last')[0],function(){
                    _self.renderPage(options,countIndex,1);
                    _self.renderInfo(options,Math.ceil(options.total/options.pageSize));
                    _self.changeIndex(options,Math.ceil(options.total/options.pageSize));
                }) : '';
            }
            //当页数小于等于按钮数的时候
            else if(countIndex <= pageBtnCount){
                for(var i=0;i<countIndex;i++){
                    pagecontent+='<li><a data-index='+(i+1)+'>'+(i+1)+'</a></li>';
                }
                $page.innerHTML=pagecontent;
                $page.getElementsByTagName('li')[0].getElementsByTagName('a')[0].className='active';
                for(var i=0;i<$page.getElementsByTagName('a').length;i++){
                    this.addClick($page.getElementsByTagName('a')[i],function(){
                        $page.getElementsByClassName('active')[0].className='';
                        _self.defaultClick(this.getAttribute('data-index'));
                    })
                }
            }
        },
        'renderPage':function(options,number,type,where){
            var $page=document.getElementById('paging-page'),
                $prev=document.getElementsByClassName('paging-prev')[0].className,
                $next=document.getElementsByClassName('paging-next')[0].className,
                countIndex=Math.ceil(options.total/options.pageSize),//一共有几页
                pageBtnCount=options.pageBtnCount,
                showFirstLastBtn=options.showFirstLastBtn,
                $first,
                $last,
                startIndex,
                _self=this,
                lilength,
                activeIndex;
            //删除里面的li标签（除了首尾页以及上下页的li）
            if($page.getElementsByClassName('number').length){
                lilength=$page.getElementsByClassName('number').length;
                for(var i=0;i<lilength;i++){
                    $page.removeChild($page.getElementsByClassName('number')[0])
                }
            }
            //判断是否显示首尾页
            if(showFirstLastBtn){
                $first=document.getElementsByClassName('paging-first')[0].className;
                $last=document.getElementsByClassName('paging-last')[0].className;
                //显示首页和上一页以及7个按钮
                if(type==1){
                    for(var i=0;i<pageBtnCount-2;i++){
                        $page.insertBefore(document.createElement('li'),$page.childNodes[2]);
                    }
                    for(var i=0;i<pageBtnCount-2;i++){
                        $page.getElementsByTagName('li')[2+i].className='number';
                        $page.getElementsByTagName('li')[2+i].innerHTML='<a data-index='+(countIndex-pageBtnCount+i+3)+'>'+(countIndex-pageBtnCount+i+3)+'</a>';
                        //如果当前a里面的值和number相等，那么这个就高亮显示
                        if(countIndex-pageBtnCount+i+3==number){
                            activeIndex=i;
                        }
                    }
                    document.getElementsByClassName('paging-prev')[0].className=$prev.replace('none','');
                    document.getElementsByClassName('paging-next')[0].className='paging-next none';
                    document.getElementsByClassName('paging-first')[0].className=$first.replace('none','');
                    document.getElementsByClassName('paging-last')[0].className='paging-last none';
                    $page.getElementsByTagName('a')[activeIndex].className='active';
                }
                //显示首尾页以及5个按钮
                else if(type==2){
                    //这里统一第一个a的html的值都是从startIndex开始
                    if(where=='fsecond'){
                        startIndex=number-1;
                        activeIndex=1;
                    }
                    else{
                        startIndex=number-pageBtnCount+6;
                        activeIndex=pageBtnCount-6;
                    }
                    for(var i=0;i<pageBtnCount-4;i++){
                        $page.insertBefore(document.createElement('li'),$page.childNodes[2]);
                    }
                    for(var i=0;i<pageBtnCount-4;i++){
                        $page.getElementsByTagName('li')[2+i].className='number';
                        $page.getElementsByTagName('li')[2+i].innerHTML='<a data-index='+(startIndex+i)+'>'+(startIndex+i)+'</a>';
                    }
                    document.getElementsByClassName('paging-prev')[0].className=$prev.replace('none','');
                    document.getElementsByClassName('paging-next')[0].className=$next.replace('none','');
                    document.getElementsByClassName('paging-first')[0].className=$first.replace('none','');
                    document.getElementsByClassName('paging-last')[0].className=$last.replace('none','');
                    $page.getElementsByTagName('a')[activeIndex].className='active';
                }
                //显示尾页和下一页以及7个按钮
                else if(type==3){
                    for(var i=0;i<pageBtnCount-2;i++){
                        $page.insertBefore(document.createElement('li'),$page.childNodes[2]);
                    }
                    for(var i=0;i<pageBtnCount-2;i++){
                        $page.getElementsByTagName('li')[2+i].className='number';
                        $page.getElementsByTagName('li')[2+i].innerHTML='<a data-index='+(i+1)+'>'+(i+1)+'</a>';
                    }
                    document.getElementsByClassName('paging-prev')[0].className='paging-prev none';
                    document.getElementsByClassName('paging-next')[0].className=$next.replace('none','');
                    document.getElementsByClassName('paging-first')[0].className='paging-first none';
                    document.getElementsByClassName('paging-last')[0].className=$last.replace('none','');
                    $page.getElementsByTagName('a')[number-1].className='active';
                }
            }
            else{
                //显示上一页以及7个按钮
                if(type==1){
                    for(var i=0;i<pageBtnCount-1;i++){
                        $page.insertBefore(document.createElement('li'),$page.childNodes[1]);
                    }
                    for(var i=0;i<pageBtnCount-1;i++){
                        $page.getElementsByTagName('li')[1+i].className='number';
                        $page.getElementsByTagName('li')[1+i].innerHTML='<a data-index='+(countIndex-pageBtnCount+i+2)+'>'+(countIndex-pageBtnCount+i+2)+'</a>';
                        //如果当前a里面的值和number相等，那么这个就高亮显示
                        if(countIndex-pageBtnCount+i+2==number){
                            activeIndex=i;
                        }
                    }
                    document.getElementsByClassName('paging-prev')[0].className=$prev.replace('none','');
                    document.getElementsByClassName('paging-next')[0].className='paging-next none';
                    $page.getElementsByTagName('a')[activeIndex].className='active';
                }
                //显示首尾页以及5个按钮
                else if(type==2){
                    //这里统一第一个a的html的值都是从startIndex开始
                    if(where=='fsecond'){
                        startIndex=number-1;
                        activeIndex=1;
                    }
                    else{
                        startIndex=number-pageBtnCount+4;
                        activeIndex=pageBtnCount-4;
                    }
                    for(var i=0;i<pageBtnCount-2;i++){
                        $page.insertBefore(document.createElement('li'),$page.childNodes[1]);
                    }
                    for(var i=0;i<pageBtnCount-2;i++){
                        $page.getElementsByTagName('li')[1+i].className='number';
                        $page.getElementsByTagName('li')[1+i].innerHTML='<a data-index='+(startIndex+i)+'>'+(startIndex+i)+'</a>';
                    }
                    document.getElementsByClassName('paging-prev')[0].className=$prev.replace('none','');
                    document.getElementsByClassName('paging-next')[0].className=$next.replace('none','');
                    $page.getElementsByTagName('a')[activeIndex].className='active';
                }
                //显示尾页和下一页以及7个按钮
                else if(type==3){
                    for(var i=0;i<pageBtnCount-1;i++){
                        $page.insertBefore(document.createElement('li'),$page.childNodes[1]);
                    }
                    for(var i=0;i<pageBtnCount-1;i++){
                        $page.getElementsByTagName('li')[1+i].className='number';
                        $page.getElementsByTagName('li')[1+i].innerHTML='<a data-index='+(i+1)+'>'+(i+1)+'</a>';
                    }
                    document.getElementsByClassName('paging-prev')[0].className='paging-prev none';
                    document.getElementsByClassName('paging-next')[0].className=$next.replace('none','');
                    $page.getElementsByTagName('a')[number-1].className='active';
                }
            }
            //给按钮添加事件
            for(var i=0;i<$page.getElementsByTagName('a').length;i++){
                this.addClick($page.getElementsByTagName('a')[i],function(){
                    _self.btnClick(options,this.getAttribute('data-index'));
                })
            }
        },
        'renderPageSizes':function(pageSizeItems,pageSize){
            var selehtml='<select>',
                $size=document.getElementById('paging-size'),
                $options;
            for(var i=0;i<pageSizeItems.length;i++){
                selehtml+='<option value='+pageSizeItems[i]+'>'+pageSizeItems[i]+'</option>';
            }
            selehtml+='</select>';
            $size.innerHTML=selehtml;
            $options=$size.getElementsByTagName('select')[0].getElementsByTagName('option');
            for(var i=0;i<$options.length;i++){
                if($options[i].value == pageSize){
                    $options[i].setAttribute('selected','selected');
                    return;
                }
            }
        },
        'renderJump':function(jumpBtnText){
            var jump='<div class="paging-group"><input type="text" class="jump"><button type="button">'+jumpBtnText+'</button>',
                $jump=document.getElementById('paging-jump');
            $jump.innerHTML=jump;
        },
        'renderInfo':function(options,index){
            var start= index*options.pageSize + 1 ,
                end=(index==Math.ceil(options.total/options.pageSize)) ? options.total : (parseInt(index)+1)*options.pageSize,
                pageNumber=Math.ceil(options.total/options.pageSize),
                $info=document.getElementById('paging-info'),
                infoFormat=options.infoFormat;
            infoFormat.indexOf('{start}') >= 0 ? infoFormat=infoFormat.replace(/\{start\}/g,start) : '';
            infoFormat.indexOf('{end}') >= 0 ? infoFormat=infoFormat.replace(/\{end\}/g,end) : '';
            infoFormat.indexOf('{pageNumber}') >= 0 ? infoFormat=infoFormat.replace(/\{pageNumber\}/g,pageNumber) : '';
            infoFormat.indexOf('{total}') >= 0 ? infoFormat=infoFormat.replace(/\{total\}/g,options.total) : '';
            $info.innerHTML=infoFormat;
        },
        'btnClick':function(options,index){
            var countIndex=Math.ceil(options.total/options.pageSize),
                $page=document.getElementById('paging-page'),
                length=$page.getElementsByTagName('a').length,
                lefeaIndex=$page.getElementsByTagName('a')[0].getAttribute('data-index'),
                rightaIndex=$page.getElementsByTagName('a')[length-1].getAttribute('data-index'),
                dealIndex;
            this.changeIndex(options,index);//重新获取数据；
            document.getElementById('paging-page').getElementsByClassName('active')[0].className='';
            //判断是否在最左边
            if(lefeaIndex==index){
                if((options.showFirstLastBtn && index<=options.pageBtnCount-3) || (!options.showFirstLastBtn && index<=options.pageBtnCount-2)){
                    this.renderPage(options,index,3);
                }
                else if((options.showFirstLastBtn && index==countIndex-options.pageBtnCount+3) || (!options.showFirstLastBtn && index>=countIndex-options.pageBtnCount+2)){
                    this.renderPage(options,index,2,'lsecond');
                }
                else{
                    options.showFirstLastBtn ? dealIndex=parseInt(index)-options.pageBtnCount+6 : dealIndex=parseInt(index)-options.pageBtnCount+4;
                    for(var i=0;i<length;i++){
                        $page.getElementsByTagName('a')[i].innerHTML=dealIndex+i;
                        $page.getElementsByTagName('a')[i].setAttribute('data-index',dealIndex+i);
                    }
                    $page.getElementsByTagName('a')[length-2].className='active';
                }
            }
            //最右边
            else if(rightaIndex==index){
                if((options.showFirstLastBtn && index==options.pageBtnCount-2) || (!options.showFirstLastBtn && index==options.pageBtnCount-1)){
                    this.renderPage(options,index,2,'fsecond');
                }
                else if((options.showFirstLastBtn && index>=countIndex-options.pageBtnCount+2) || (!options.showFirstLastBtn && index>=countIndex-options.pageBtnCount+1)){
                    this.renderPage(options,index,1);
                }
                else{
                    for(var i=0;i<length;i++){
                        $page.getElementsByTagName('a')[i].innerHTML=parseInt(index)+i-1;
                        $page.getElementsByTagName('a')[i].setAttribute('data-index',parseInt(index)+i-1);
                    }
                    $page.getElementsByTagName('a')[1].className='active';
                }
            }
            else{
                this.defaultClick(index);
            }
            this.renderInfo(options,index-1);
        },
        'defaultClick':function(index){
            var $page=document.getElementById('paging-page'),
                length=$page.getElementsByTagName('a').length;
            for(var i=0;i<length;i++){
                if($page.getElementsByTagName('a')[i].getAttribute('data-index')==index){
                    $page.getElementsByTagName('a')[i].className='active';
                }
            }
        },
        'jumpClick':function(options){
            var countIndex=Math.ceil(options.total/options.pageSize),
                index=document.getElementById('paging-jump').getElementsByTagName('input')[0].value,
                minIndex,
                maxIndex;
            if(index<=countIndex && index){
                if(options.showFirstLastBtn){
                    minIndex=options.pageBtnCount-2;
                    maxIndex=countIndex-options.pageBtnCount + 3;
                }
                else{
                    minIndex=options.pageBtnCount-1;
                    maxIndex=countIndex-options.pageBtnCount + 2;
                }
                this.changeIndex(options,index);
                this.jumpIndex(minIndex,maxIndex,index,options);
                document.getElementById('paging-jump').getElementsByTagName('input')[0].value='';
            }
        },
        'jumpIndex':function(minIndex,maxIndex,index,options){
            if(0<index && index<minIndex){
                this.renderPage(options,index,3);
            }
            else if(index>=minIndex  && index<=maxIndex){
                this.renderPage(options,index,2,'fsecond');
            }
            else{
                this.renderPage(options,index,1);
            }
            this.renderInfo(options,index-1)
        },
        'prvebtnClick':function(options,index){
            var countIndex=Math.ceil(options.total/options.pageSize),//共有几页
                $page=document.getElementById('paging-page'),
                alength=$page.getElementsByTagName('a').length,//当前按钮的个数
                $secondaIndex=$page.getElementsByTagName('a')[1].getAttribute('data-index'),
                minIndex,//上界限
                maxIndex,//下界限
                activeIndex;
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
                this.renderPage(options,index-1,3,'lsecond');
            }
            //当处于正数第二个的时候就要全部按钮都减小
            else if($secondaIndex==index){
                activeIndex=$page.getElementsByClassName('active')[0].innerHTML;
                for(var i=0;i<$page.getElementsByTagName('a').length;i++){
                    options.showFirstLastBtn ? $page.getElementsByTagName('a')[i].innerHTML=activeIndex-options.pageBtnCount+5+i :
                        $page.getElementsByTagName('a')[i].innerHTML=activeIndex-options.pageBtnCount+3+i
                    $page.getElementsByTagName('a')[i].setAttribute('data-index',$page.getElementsByTagName('a')[i].innerHTML);
                }
                $page.getElementsByClassName('active')[0].className='';
                $page.getElementsByTagName('a')[alength-2].className='active';
            }
            //当处于中间的话就只需要改变高亮
            else{
                for(var i=0;i<$page.getElementsByTagName('a').length;i++){
                    if($page.getElementsByTagName('a')[i].getAttribute('data-index')==index){
                        $page.getElementsByTagName('a')[i-1].className='active';
                        $page.getElementsByTagName('a')[i].className='';
                    }
                }
            }
            this.renderInfo(options,index-1);
        },
        'nextbtnClick':function(options,index){
            var countIndex=Math.ceil(options.total/options.pageSize),//共有几页
                $page=document.getElementById('paging-page'),
                alength=$page.getElementsByTagName('a').length,//当前按钮的个数
                $secondaIndex=$page.getElementsByTagName('a')[alength-2].getAttribute('data-index'),
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
                activeIndex=$page.getElementsByClassName('active')[0].innerHTML;
                for(var i=0;i<$page.getElementsByTagName('a').length;i++){
                    $page.getElementsByTagName('a')[i].innerHTML=parseInt(activeIndex)+i
                    $page.getElementsByTagName('a')[i].setAttribute('data-index',$page.getElementsByTagName('a')[i].innerHTML);
                }
                $page.getElementsByClassName('active')[0].className='';
                $page.getElementsByTagName('a')[1].className='active';
            }
            //当处于中间的话就只需要改变高亮
            else{
                for(var i=0;i<$page.getElementsByTagName('a').length;i++){
                    if($page.getElementsByTagName('a')[i].getAttribute('data-index')==index){
                        $page.getElementsByTagName('a')[i+1].className='active';
                        $page.getElementsByTagName('a')[i].className='';
                    }

                }
            }
            this.renderInfo(options,index);
        },
        //页数改变数据重新请求了
        'changeIndex':function(options,index){
            options.pageIndex=index;
            this.ajax(options.remote,options);
        },
        //每页的条数改变重新请求
        'changeSize':function(options,pageSize){
            options.pageSize=pageSize;
            options.pageIndex=1;
            this.ajax(options.remote,options);
            fw.extend(options,{pageSize:pageSize});
            document.getElementById('paging-page').innerHTML='';
            this.initPage(options);
            this.renderInfo(options,0);
        }
    });
});