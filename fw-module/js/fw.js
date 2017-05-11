/**
 * Created by zyj on 2016/12/13.
 */
define(function(){
    var fw=(function(){
        var fw=function(selector){
            return new fw.fn.init(selector);
        };
        var hasOwn = ({}).hasOwnProperty;
        fw.prototype=fw.fn={
            'constructor':'fw',
            'init':function(selector){//这个是选择器如fw('div')
                this[0]=document.getElementById(selector);
                this.selector=selector;
                return this;
            }
        };
        //这个是用于合并的方法
        fw.extend=fw.fn.extend=function(){
            var target=arguments[0] || {},
                options,
                length=arguments.length,
                i= 1,
                deep=false,
                name,
                src,
                copy,
                clone,
                copyisArray;
            if(typeof target === 'boolean'){
                deep=target;
                target=arguments[1] || {};
                i=2;
            }
            if(typeof target !=='object' && !fw.isFunction(target)){
                target={};
            }
            if(length===i){
                target=this;
                --i;
            }
            for(;i<length;i++){
                if((options=arguments[i]) != null){
                    for(name in options){
                        src=target[name];
                        copy=options[name];
                        if(target===copy){
                            continue;
                        }
                        if(deep && copy && (fw.isPlainObject(copy) || (copyisArray=fw.isArray(copy)))) {
                            if (copyisArray){
                                copyisArray=false;
                                clone=src && fw.isArray(src) ? src : [];
                            }
                            else{
                                clone=src && fw.isPlainObject(src) ? src : {};
                            }
                            target[name]=fw.extend(deep,clone,copy);
                        }
                        else if(copy !== undefined){
                            target[name]=copy;
                        }
                    }
                }
            }
            return target;
        };
        //这里是给fw提前定义一些方法用于extend函数
        fw.extend({
            'isFunction':function(obj){
                return typeof obj == 'function';
            },
            'isArray':function(obj){
                return Object.prototype.toString.call(obj) === '[object Array]';
            },
            'isPlainObject':function(obj){
                if ( !obj || fw.type(obj) !== "object" || obj.nodeType || fw.isWindow( obj ) ) {
                    return false;
                }
                if ( obj.constructor &&
                    !hasOwn.call(obj, "constructor") &&
                    !hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
                    return false;
                }
                var key;
                for ( key in obj ) {}
                return key === undefined || hasOwn.call( obj, key );
            },
            'type':function(obj){
                return obj == null ? String( obj ) : [ toString.call(obj) ] || "object";
            },
            'isWindow':function(obj){
                return obj && typeof obj === "object" && "setInterval" in obj;
            }
        });
        //给元素绑定事件
        fw.fn.extend({
            'addClick':function(dom,fn){
                if(typeof dom.onclick === 'function'){
                    var oldClickfn=dom.onclick;
                    dom.onclick=function(){
                        oldClickfn();
                        fn();
                    }
                }
                else{
                    dom.onclick=fn;
                }
            }
        });
        //ajax的方法
        fw.extend({
            'formatParams':function(data){
                var arr = [];
                for (var name in data) {
                    arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
                }
                arr.push(("v=" + Math.random()).replace(".",""));
                return arr.join("&");
            },
            'ajax':function(options){
               options = options || {};
               options.type = (options.type || "GET").toUpperCase();
               options.dataType = options.dataType || "json";
               var params = this.formatParams(options.data);
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
                           options.success && options.success(xhr.responseText, xhr.responseXML);
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
           }
        });
        fw.fn.init.prototype=fw.fn;
        return fw;
    })();
    return fw;
});