var bianapi = require("./binanceapi");

// 这里控制所有的币安操作
/*
1、实时读取仓位数据
2、实时读取保证金数据
3、提供一键平仓功能
4、提供一键反向开单功能
5、提供一键止盈一半功能
6、提供一键多单变空单功能
7、提供一键空单变多单功能
*/

//1、实时读取仓位数据
async function getaccountinfo() {
    //result 只适合内部用，不适合前台展示，给前台把map 传回去，前台自己分解
    var result = ""
    var kaicangjine=0;
    var maxbaozhengjin=0;
    var lirun=0;
    var count=0;
    var kaicang = await bianapi.getaccount();
    for (var key of kaicang.keys()) {

        var tmp = kaicang.get(key);
       

        var futureprice = await bianapi.getfuturepprice(tmp.symbol);
        tmp.futureprice = futureprice;

        kaicang.set(key, tmp);
        result += "币种：" + tmp.symbol + "\n";
        result += "开仓价格：" + tmp.startprice + "USDT\n";
        result += "当前价格：" + futureprice + "USDT\n";
        result += "保证金：" + (Number(1) * Number(tmp.baozhengjin)).toFixed(2) + "USDT\n";
        result += "当前盈利：" + tmp.win + "USDT\n";
        result += "盈利比例：" + (tmp.winpercent * Number(tmp.leverage)).toFixed(4) + "%\n";
        //获得开仓方向
        //大于当前价格
        if (Number(futureprice) > Number(tmp.startprice)) {
            if (Number(tmp.win) >= 0) {
                result += "开仓方向：做多\n";
            }
            else {
                result += "开仓方向：做空\n";
            }
        }
        else {
            if (Number(tmp.win) >= 0) {
                result += "开仓方向：做空\n";
            }
            else {
                result += "开仓方向：做多\n";
            }
        }

        result += "------------------------------\n";
        kaicangjine += Number(tmp.leverage) * Number(tmp.baozhengjin)
        maxbaozhengjin += Number(tmp.baozhengjin);
        lirun += Number(tmp.win)
        count++;
    }
    result += "总共开仓金额：" + kaicangjine.toFixed(2) + "USDT\n";
    result += "总共投入保证金：" + maxbaozhengjin.toFixed(2) + "USDT\n";
    result += "浮盈：" + lirun.toFixed(2) + "USDT\n"
    return [kaicang,maxbaozhengjin + lirun];
}


//2、实时读取保证金数据
async function getnowmoney() {
    let balance = await bianapi.getbalance()
    console.log("账户价值：" + balance)
    return balance;
}


//3、提供一键平仓功能
async function stopall() {
    await chose(0, 1)
    await chose(1, 1)
}

//4、提供一键反向开单功能 ，反向开单2.0倍
//一键订单调头，多变空，空变多
async function fanxiangkaicang() {
    await chose(0, 2)
    await chose(1, 2)
}

//5、提供一键平仓一半功能
async function pingcang50() {
    await pingcangpercent();
}
//6、提供一键多单变空单功能
async function longtoshort() {
    await chose(1, 2);
}
//7、提供一键空单变多单功能


async function shorttolong() {
    await chose(0, 2);
}

//8、按照指定百分比平仓
async function pingcangpercent(percent = 0.5) {
    await chose(0, percent)
    await chose(1, percent)
}

//本功能一般不增加持仓张数
//基础功能，选择操作的是多单还是空单 ,0代表多单,1代表空单 stoppercent 代表反向订单
async function chose(type = 0, stoppercent = 2) {
    var kaicang = await bianapi.getaccount();

    var kaicanglength = kaicang.size;
    //console.log(kaicanglength);

    if (kaicanglength != 0) {

        for (var key of kaicang.keys()) {
            var ordertype = "BUY";
            var tmp = kaicang.get(key);
            var futureprice = await bianapi.getfuturepprice(tmp.symbol);
            var nowtype = -1;
            //获得开仓方向
            //大于当前价格
            if (Number(futureprice) > Number(tmp.startprice)) {
                if (Number(tmp.win) >= 0) {
                    //result += "开仓方向：做多\n"; 
                    //那么做反向就就开空
                    ordertype = "SELL";
                    nowtype = 1;
                }
                else {
                    nowtype = 0;
                    //result += "开仓方向：做空\n"; 

                }
            }
            else {
                if (Number(tmp.win) >= 0) {
                    // result += "开仓方向：做空\n"; 
                    nowtype = 0;
                }
                else {
                    // result += "开仓方向：做多\n"; 
                    nowtype = 1;
                    ordertype = "SELL";
                }
            }
            if (nowtype != type) {
                //如果订单方向不符合操作要求，就跳过
                continue;
            }
            quantity = tmp.positionAmt * stoppercent;
            if (quantity < 0) {
                quantity = quantity * -1.0;
            }
            await bianapi.FanFangxiangOrder(tmp.symbol, ordertype, "MARKET", quantity)
        }
    }

}



//基础功能，订单反向开单
async function stop(percent = 0.5) {
    var kaicang = await bianapi.getaccount();

    var kaicanglength = kaicang.size;
    //console.log(kaicanglength);

    if (kaicanglength != 0) {

        for (var key of kaicang.keys()) {
            var ordertype = "BUY";
            var tmp = kaicang.get(key);
            var futureprice = await bianapi.getfuturepprice(tmp.symbol);

            //获得开仓方向
            //大于当前价格
            if (Number(futureprice) > Number(tmp.startprice)) {
                if (Number(tmp.win) >= 0) {
                    //result += "开仓方向：做多\n"; 
                    //那么做反向就就开空
                    ordertype = "SELL";
                }
                else {
                    //result += "开仓方向：做空\n"; 

                }
            }
            else {
                if (Number(tmp.win) >= 0) {
                    // result += "开仓方向：做空\n"; 

                }
                else {
                    // result += "开仓方向：做多\n"; 
                    ordertype = "SELL";
                }
            }
            quantity = tmp.positionAmt * percent;
            if (quantity < 0) {
                quantity = quantity * -1.0;
            }
            await bianapi.FanFangxiangOrder(tmp.symbol, ordertype, "MARKET", quantity)
        }
    }
}


//所有功能全部做成接口

module.exports = {
    getaccountinfo: getaccountinfo,
    getnowmoney: getnowmoney,
    stopall: stopall,
    fanxiangkaicang: fanxiangkaicang,
    pingcang50: pingcang50,
    longtoshort: longtoshort,
    shorttolong: shorttolong,
    pingcangpercent: pingcangpercent,
}