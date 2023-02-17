const ccxt = require('ccxt')
var underscore = require('underscore');
require('dotenv').config()
const { env } = process
const HttpsProxyAgent = require('https-proxy-agent')
const fetch = require('node-fetch')
const proxy = env.PROXYURL // HTTP/HTTPS proxy to connect to
const agent = new HttpsProxyAgent(proxy)
const jingdu = require('./xiadanjingdu')

const requestMethod = function(url, options) {
    return fetch(url, Object.assign({}, options, { agent: agent }))
}

let bian =  null

 if(env.PROXYUSE == '1')
 {
    bian = new ccxt.binance({
        'apiKey': process.env.APIKEY,
        'secret': process.env.SECRETKEY,
        //'timeout': 30000,
        'hostname':process.env.BINANHOSTNAME,
        'enableRateLimit': true,
        'options': {
            'defaultType': 'future',
        },
        'fetchImplementation':requestMethod,
    })

 }
 else
 {
    bian = new ccxt.binance({
        'apiKey': process.env.APIKEY,
        'secret': process.env.SECRETKEY,
        //'timeout': 30000,
        'hostname':process.env.BINANHOSTNAME,
        'enableRateLimit': true,
        'options': {
            'defaultType': 'future',
        },
        
    })

 }



 const getnowprice = async(symbol) =>{
    let res = await bian.fetchFundingRate(symbol);
    return res;
}

//获取持仓信息
async function getaccount() {
    let res = await bian.fapiPrivateGetAccount();
    //console.log(res);

    let result = new Map();
    for (var i = 0; i < res.positions.length; i++) {
        let chicang = res.positions[i];
        
        if (Number(chicang.initialMargin) != 0) {
            //console.log(chicang);
            var symbol = chicang.symbol;
            var startprice = chicang.entryPrice;
            var leverage = chicang.leverage;
            //保证金
            var baozhengjin = chicang.initialMargin;
            //盈利或者亏损
            var win = chicang.unrealizedProfit;
            var positionAmt = chicang.positionAmt;
            var winpercent = Number(win)/(Number(leverage)*Number(baozhengjin))*100; 
            result.set(symbol,{ symbol, startprice, leverage, baozhengjin, win,positionAmt ,winpercent})
        }
    }
    return result;
}

async function getbalance() {
    let res = await bian.fapiPrivateGetBalance();
    //console.log(res);

    
    let result = 0;
    for (var i = 0; i < res.length; i++) {
        let chicang = res[i];
        
        if ((chicang.asset == "USDT") ||(chicang.asset == "BUSD")) {
            //console.log(chicang);
            result += Number(chicang.withdrawAvailable)
        }
    }
    return result;
}

//获得当前最大杠杆水平
async function getleverageBracket(symbol)
{
    let result = await bian.fapiPrivateGetLeverageBracket({
        
        symbol,
    })
    var leverage = 1;
    if(result.length >0)
    {
       
        for(var i =0;i<result[0].brackets.length;i++)
        {
            var tmp = Number(result[0].brackets[i].initialLeverage);
            if(tmp >leverage)
            {
                leverage = tmp;
            }

        }
    }
    
    
    return leverage;
}

//设置杠杆水平
async function setLeverage(symbol, leverage = 1) {
    await bian.fapiPrivatePostLeverage({
        leverage,
        symbol,
    })
}

function getzuixiaoxiadanliang(symbol)
{
    var tmp = jingdu[symbol];
    if(tmp)
    {
        tmp = tmp.toString();
        var pos = tmp.indexOf(".");
        if(pos==-1)
        {
            return 0;
        }
        else
        {
            var length = tmp.length - 1 - pos;
            return length;
        }
    }
    else
    {
        return 0;
    }
}

//市价平仓
async function FanFangxiangOrder(symbol, side = 'SELL', type = 'MARKET',quantity) {
    quantity = Number(quantity).toFixed(getzuixiaoxiadanliang(symbol));
    let res = await bian.fapiPrivatePostOrder({ symbol, side, type, quantity })
    console.log(res);
}

//测试用例
async function test() {
    try {
        //获得账户详情
        let balance = await getbalance()
        console.log("账户价值：" + balance )
        //await getleverageBracket("WAVESUSDT")
        //测试开单
        //
        //await Order('BTCUSDT');
        //Order('BTSsUSDT');
        //getfuturepprice("BTCUSDT")
        //Order("UNFIUSDT")
        //getxianhuo()
        //getohcv("RLC/BUSD")
        //getglobalLongShortAccountRatio("1000SHIB/USDT")
    }
    catch (e) {
        console.log(e);
    }
}

async function getfuturepprice(symbol)
{
    var futureprice = await (await bian.fetchTicker(symbol)).info.lastPrice;
    return futureprice;
}


async function getbalance() {
    let res = await bian.fapiPrivateGetBalance();
    //console.log(res);

    
    let result = 0;
    for (var i = 0; i < res.length; i++) {
        let chicang = res[i];
        
        if ((chicang.asset == "USDT") ||(chicang.asset == "BUSD")) {
            //console.log(chicang);
            result += Number(chicang.withdrawAvailable)
        }
    }
    return result;
}

test();
module.exports = {
    
    setLeverage:setLeverage,
    getaccount:getaccount,
    getfuturepprice:getfuturepprice,
    FanFangxiangOrder:FanFangxiangOrder,
    getnowprice:getnowprice,
    getleverageBracket:getleverageBracket,
    getbalance:getbalance,
    
}
