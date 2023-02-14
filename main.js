// Modules to control application life and create native browser window
const electron = require('electron')
const path = require('path')


const schedule = require('node-schedule');

const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let mainWindow = null
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1100,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),

      nodeIntegration: true,
      contextIsolation: false

    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  //const mainMenu = Menu.buildFromTemplate(menuTemplate);
  //Menu.setApplicationMenu(mainMenu);
  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


var renwuid = null
const bn = require("./ccxtbotkongzhi");
//const { result } = require('underscore');
const eventListener = async () => {
  //获得账户持仓信息
  ipcMain.on('info:getaccountinfo', async (e, value) => {
    console.log("info:getaccountinfo");
    console.log(value)
    let result = await bn.getaccountinfo(value)
    
    //将查询的结果传给前台的html
    mainWindow.webContents.send("info:getaccountinfo", { "result":result[0] });
    if(renwuid == null)
    {
      task1();
    }
   
  })


  //获得现在账户未使用的保证金
  ipcMain.on('info:getnowmoney', async (e, value) => {
    console.log("info:getnowmoney");
    console.log(value)
    let money = await bn.getnowmoney()
  
    let result = await bn.getaccountinfo()
    //将查询的结果传给前台的html
    mainWindow.webContents.send("info:getnowmoney", { "result":result[1] + money });

  })



  ipcMain.on('info:pingcangpercent', async (e, value) => {
    console.log("info:pingcangpercent");
    console.log(value)
    result = await bn.pingcangpercent()
    //将查询的结果传给前台的html
    mainWindow.webContents.send("info:pingcangpercent", { result });

  })

  ipcMain.on('info:shorttolong', async (e, value) => {
    console.log("info:shorttolong");
    console.log(value)
    result = await bn.shorttolong()
    //将查询的结果传给前台的html
    mainWindow.webContents.send("info:shorttolong", { result });

  })

  ipcMain.on('info:longtoshort', async (e, value) => {
    console.log("info:longtoshort");
    console.log(value)
    result = await bn.longtoshort()
    //将查询的结果传给前台的html
    mainWindow.webContents.send("info:longtoshort", { result });

  })

  ipcMain.on('info:pingcang50', async (e, value) => {
    console.log("info:pingcang50");
    console.log(value)
    result = await bn.pingcang50()
    //将查询的结果传给前台的html
    mainWindow.webContents.send("info:pingcang50", { result });

  })

  ipcMain.on('info:fanxiangkaicang', async (e, value) => {
    console.log("info:fanxiangkaicang");
    console.log(value)
    result = await bn.fanxiangkaicang()
    //将查询的结果传给前台的html
    mainWindow.webContents.send("info:fanxiangkaicang", { result });

  })

  ipcMain.on('info:stopall', async (e, value) => {
    console.log("info:stopall");
    console.log(value)
    let result = await bn.stopall()
    //将查询的结果传给前台的html
    mainWindow.webContents.send("info:stopall", { result });

  })



  //定时查询账户持仓
  const task1 = async () => {
    //每分钟的1-10秒都会触发，其它通配符依次类推

    const j = schedule.scheduleJob('*/30 * * * * *', async () => {
      let nowmoney = await bn.getnowmoney()
      let accountinfo = await bn.getaccountinfo()
      let result = accountinfo[0]
      nowmoney += accountinfo[1];

      mainWindow.webContents.send("info:getaccountinfo", { result });
      mainWindow.webContents.send("info:getnowmoney", { "result":nowmoney });
    })
    return j;
  }


}

//启动监听程序
eventListener();