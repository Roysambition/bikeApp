import { Component,NgZone, EventEmitter } from '@angular/core';
import { Platform,IonicPage, NavController, NavParams,LoadingController,Events } from 'ionic-angular';
import { BLE } from '@ionic-native/ble';
import { FreeRidingPage } from '../lesson/free-riding/free-riding';
import { TrainingPage } from '../lesson/training/training';
import { RealScenePage } from '../lesson/real-scene/real-scene';
import { BattlePage } from '../lesson/battle/battle';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { EmmParserService } from '../../providers/emm-parser.service';
import { NativeStorage } from '@ionic-native/native-storage';
import { Socket } from 'ngx-socket-io';
import * as _ from 'lodash';
import * as numeral from 'numeral'

const bikeWheelSize:number = 0.004545   
const KPH_PER_RPM:number = bikeWheelSize * 60.0;


const UART_SERVICE:string         = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; // 服务
const UART_TX_CHAR_WRITE:string   = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; //写入/Write Characteristics (App → emm)
const UART_RX_CHAR_NOTIFY:string  = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // 通知/Notify Characteristics
const CONFIG_NUM_SCANS: number = 20;
const KEEPALIVE_CHECK_TIME: number = 1000;

@IonicPage()
export class DeviceInfo {
  id: string;
  idhash:string;
  advertising: any;
  rssi: Number;
  timestamp: Date;
  name: string; //Device name == 'emm' 
  

  constructor(x) {
    this.id = x.id;
    this.name = x.name;
    this.advertising = x.advertising;
    this.rssi = x.rssi;
    this.timestamp = new Date();
    this.idhash = "#" + this.idHash(x.id)
  }

  update(x) {
    this.advertising = x.advertising;
    this.rssi = x.rssi;
    this.timestamp = new Date();
  }
  idHash(id) {
    // var parts = id.split(':');
    // var hash;

    // var num;
    // for (var i = 0; i < parts.length; i++) {
    // 	num = parseInt(parts[i], 16);
    // 	console.log("num: " +num);
    // }
    // return hash;

    var hash = 0, i, chr;
    if (id.length == 0) return hash;
    for (i = 0; i < id.length; i++) {
      chr   = id.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer  |=:local logic的或閘
    }
    if (hash < 0) hash = -hash;
    return (hash % 10000);
  }
}

export class DataTransformModel {
  x: number;
  z: number
  y: number;
  timeStamp: number;
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.timeStamp = new Date().getTime();
  }

}


enum AppStatus { 
  INIT,
  SCAN,
  CONNECTION,
  TALKING,
  //Extra Status
  TALKING_TO_SCAN,
}

@Component({
  selector: 'page-ble',
  templateUrl: 'ble.html',
})



export class BlePage  {
  reScaleTime: number;
  spmMovingAverage: number = 0;
  currCalories: number =0;
  
  name:string = 'USER'
  weight:number = 66
  userId:any

  constructor(private platform: Platform,
              private navCtrl:NavController, 
              private bleDevice: BLE,
              private zone: NgZone,
              private locationAccuracy: LocationAccuracy,
              public emmService:EmmParserService,
              public loadingCtrl: LoadingController,
              public nativeStorage:NativeStorage,
              public events: Events,
              public socket: Socket,
              ) { 
              
             
              }
    
page:any;
//APP status
_AppStatus = AppStatus;
appStatus: AppStatus = AppStatus.INIT;
//目前指令
currentCmdMode;
datas: any = [];
connectedDevice: DeviceInfo; 
state;
onAppStatusEvent: EventEmitter<AppStatus> = new EventEmitter(); 

//Recevied
currentEmmData: DataTransformModel;
batVolt;
emmSwInfo = {
  protoVerMajor: '-',
  protoVerMinor: '-',
  swVerMajor: '-',
  swVerMinor: '-'
};
//Cmd-Queue 送出的指令
txQ = [];

//Interval Dispatcher
txQDispatcher = null;
keepAliveDispatcher = null;
scanBtDispatcher = null;
//Log
logs = [];

//計數
public spData = {round:0,
                 RPM:0,
                 distance:0,
                 calories:0,
                 speed:0}
public status: any;
public getSignInt: number;
private countTs: number;

public currentX;
public currentY;
public currentZ;

             ngAfterViewInit() {
          
                // this.locationAccuracy.canRequest().then((canRequest: boolean) => { //位置服務
                //   if(canRequest) {
                //     this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
                //       () => console.log('Request successful'),
                //       error => console.log('Error requesting location permissions', error)
                //     );
                //   }         
                // })
               
                  this.events.subscribe('closeBLE',()=>{
                    this.sleepMode()  
                })
                
                this.onAppStatusEvent.subscribe((status: AppStatus) => {
                //  console.log(status)
                  switch (status) {
                    case AppStatus.INIT:
                      this.appStatus = AppStatus.INIT
                      break;
                    case AppStatus.SCAN:
                      this.appStatus = AppStatus.SCAN;
                        this.loadingCtrl.create({
                          content: "裝置配對中 <br> 請讓emm保持待配對狀態",
                          dismissOnPageChange:true,
                          cssClass:'loading'
                        }).present();
                      
                      this.scanAllDevice();
                      this.removeDeviceFromListIfTimeout(4000); //?換頁問題
                      break;
                    case AppStatus.CONNECTION:
                      this.appStatus = AppStatus.CONNECTION;
                      this.nativeStorage.getItem('user').then( user =>{
                        this.name = user.name
                        this.weight = user.weight
                      },
                      error =>{
                        this.name = ''
                        this.weight = 66  
                      })
                        this.bleDevice.stopScan().then(() => {
                        this.clearBtDispatch();
                        this.clearDevice();
                      }).catch(() =>{
                        this.clearBtDispatch();
                        this.clearDevice();
                      });
                      break;
                    case AppStatus.TALKING:
                      this.appStatus = AppStatus.TALKING;
                     // this.setMode(0); this.currentCmdMode = 0;//1.裝置狀態回到 Idle
                      this.setMode(100);  //? 75:會多計數 100:會少計數
                      this.keepAliveTimer();  //2.問裝置是否還活著
                      if(this.page == BattlePage){
                        this.socket.emit('getID')
                        this.userWaiting()
                      }else{
                        this.start()
                      } 
                      //3.註冊通知訊息
                      this.bleDevice.startNotification(this.connectedDevice.id, UART_SERVICE, UART_RX_CHAR_NOTIFY).subscribe(data => {
                        this.zone.run(() => { //zone:當UI處理雙向細節,確保性能不會改變(因為一直不斷執行)
                          this.recevieData(data);
                        });
                      }, (err) => { alert('裝置連結失敗,請重新再連') });
                      break;
                    case AppStatus.TALKING_TO_SCAN:
                      this.appStatus = AppStatus.TALKING_TO_SCAN;
                      this.bleDevice.disconnect(this.connectedDevice.id);
                      this.clearTxQDispatcher();
                      this.clearKeepAliveDispatcher();
                      this.clearDebugInfo();
                      this.onAppStatusEvent.emit(AppStatus.INIT);
                      break;
                    default:
                      break;
                  }
                });
                this.platform.ready().then(() => {
                this.onAppStatusEvent.emit(AppStatus.INIT);
                });
              }
    ionViewDidEnter(){
    this.spData.round = 0
    this.spData.RPM = 0
    this.spData.distance = 0
    this.spData.calories = 0
    this.spData.speed = 0
    this.spmMovingAverage = 0
    this.currCalories = 0
    }

 
 /**
 * 掃描 裝置
 */
 scanAllDevice() {
  this.bleDevice.startScanWithOptions([], { reportDuplicates: true }).subscribe((x) => {
    this.zone.run(() => {
      console.log('xID' + x.id)
      if (x.name != 'emm') return;
      var index = _.findIndex(this.datas, (item) => { return item.id == x.id }); 
      if (index == -1) {
        this.datas.push( new DeviceInfo(x)); //*新增mcu
 
      }
      else {
        this.datas[index].update(x); 
      }
      this.connect(x)
      // x讀取整個EMM全部資料
    });
  });
}

/**
 *  移除藍芽清單內沒更新的資料
 * @param timeout millsec
 */
private removeDeviceFromListIfTimeout(timeout: number) { //將休眠狀態的裝置移除
  if (!this.scanBtDispatcher) {
    this.scanBtDispatcher = setInterval(() => {
      var date = Date.now();
      this.datas = _.filter(this.datas, (element) => {
        return date - element.timestamp.getTime() < timeout;
      });
    }, timeout);
  } else {
    clearInterval(this.scanBtDispatcher);
    this.scanBtDispatcher(); //?換頁問題
   this.removeDeviceFromListIfTimeout(5000);
  }
}

connect(item: DeviceInfo) {
  this.connectedDevice = item;
  this.onAppStatusEvent.emit(AppStatus.CONNECTION);
  //let bestBleDevice = _.chain(this.datas).maxBy((item)=>{ return item.rssi}).value();
  // console.log("MAX RSSI", bestBleDevice.rssi);
  // this.bleDevice.autoConnect(bestBleDevice.rssi,this.connectCB.bind(this),this.disConnectCB.bind(this))
    this.bleDevice.autoConnect(this.connectedDevice.id,this.connectCB.bind(this),this.disConnectCB.bind(this))
}
connectCB(){
  this.onAppStatusEvent.emit(AppStatus.TALKING);
}
disConnectCB(){ //進入暫停狀態一段時間後進入休眠狀態
 this.onAppStatusEvent.emit(AppStatus.TALKING_TO_SCAN);
}

keepAliveTimer() { //keepAlive透過bite封包下指令
  if (!this.keepAliveDispatcher) {
    this.keepAliveDispatcher = setInterval(() => {
      var buf = new Uint8Array(6);
      for (var i = 0; i < 6; i++) {
        buf[i] = i + 1;
      }
      this.pushAndConsume(this.emmService.EMM_COMMANDS.ProtoverSwverState, buf);
    }, KEEPALIVE_CHECK_TIME);
  } else {
    clearInterval(this.keepAliveDispatcher);
    this.keepAliveDispatcher = null;
    this.keepAliveTimer();
  }
}

//push cmd to queue 
private pushAndConsume(func: number, buf: Uint8Array) {
  this.txQ.push({ func: func, data: buf });
  //第一次建立Interval(100ms) 執行 txQ 指令
  if (!this.txQDispatcher) {
    this.consumeTxQ();
  }
  this.enableTxQDispatcher(true);

}
//建立interval(100ms)  執行 queue 的cmd
private enableTxQDispatcher(enable) {
  /* Schedule a poller to consume the queued tx commands */
  if (enable) {
    if (this.txQDispatcher)
      return;
    this.txQDispatcher = setInterval(() => { this.consumeTxQ() }, 100);
    return;
  } else if (this.txQDispatcher) {
    /* Disable */
    clearInterval(this.txQDispatcher);
    this.txQDispatcher = null;
    this.txQ = [];
  }
}

private consumeTxQ() {
  var commands = [];
  while (1) {
    var o = this.txQ.shift();
    if (o) {
      commands.push(o);
      if (commands.length >= 2) {
        break;
      }
    } else
      break;
  }
  if (commands.length > 0) {
    var buf = new Uint8Array(this.emmService.NUM_BYTES * commands.length);
    var index = 0;

    for (var i = 0; i < commands.length; i++) {
      var o = commands[i];
      var cmdBuf = this.emmService.fmtCommand(o.func, o.data);
      for (var j = 0; j < this.emmService.NUM_BYTES; j++) {
        buf[index++] = cmdBuf[j];
      }
    }
    var promise = this.bleDevice.writeWithoutResponse(this.connectedDevice.id, UART_SERVICE, UART_TX_CHAR_WRITE, buf.buffer);
    promise.then(() => {
      this.writeLog('Success,excute cmd fallbak');
    }, () => {
      this.writeLog('Error,could excute Cmd');
    });
  }
}
//處理收到的資料
private recevieData(data) {
  var buf = new Uint8Array(data);
  let accParserData = {
    rxbuf: new Uint8Array(this.emmService.NUM_BYTES),
    pos: 0,
    fcsErrorCount: 0
  };


  for (var i = 0; i < buf.length; i++) {
    let accCmd = this.emmService.pushByte(accParserData, buf[i]);

    if (accCmd === null) continue;
    if (typeof accCmd == 'undefined') continue;

    if (accCmd.func <= this.emmService.EMM_COMMANDS.DataIndexEnd) {
      let data = new DataTransformModel(accCmd.x, accCmd.y, accCmd.z);

      this.currentEmmData = data;
      //})


      // if (!this.paused)
      // 	updateMotionStates(accCmd);

      //if (this.dataInterval === 0) {
      // 	/*
      // 	 * If we get the accelerometer data, but we are not in streaming mode,
      // 	 * we probably want to send the stop command.
      // 	 */
      //	this.setMode(this.dataInterval);
      //}
      continue;
    }

    if (accCmd.func == this.emmService.EMM_COMMANDS.Alive) {
      // console.log("#### got alive");
      this.batVolt = ((accCmd.data[0] << 8) | accCmd.data[1]) / 1000.0;
      //if (this.dataInterval > 0) {
      // 	/*
      // 	 * If we get the ALIVE command, but we are not in IDLE mode,
      // 	 * we probably want to re-send the streaming start command.
      // 	 */
      //this.setMode(this.dataInterval);
      //}
      continue;
    }



    if (accCmd.func == this.emmService.EMM_COMMANDS.ReadRegRaw) {
       console.log("got read reg raw");
    //  dumpArray("--- read reg raw data ---", accCmd.data, 6);
      continue;
    }

    if (accCmd.func == this.emmService.EMM_COMMANDS.WriteRegRaw) {
      console.log("got write reg raw");
      continue;
    }

    if (accCmd.func == this.emmService.EMM_COMMANDS.ProtoverSwverState) {
      // console.log("Got proto/sw/state");
      // console.log("  proto: " +accCmd.x);
      // console.log("  sw: " +accCmd.y);
      // console.log("  state: " +accCmd.z);
      this.emmSwInfo.protoVerMajor = accCmd.data[0];
      this.emmSwInfo.protoVerMinor = accCmd.data[1];

      this.emmSwInfo.swVerMajor = accCmd.data[2];
      this.emmSwInfo.swVerMinor = accCmd.data[3];
    }

  }

}

  //設定
  setMode(msec) {
    var buf = new Uint8Array(6);
    /* SET INTERVAL MODE: 0x01 0x00 */
    buf[0] = 0x01;
    buf[1] = 0x00;
    /* Interval */
    buf[2] = 0x00;
    buf[3] = 0x00;
    buf[4] = (msec >> 8) & 0xff;
    buf[5] = msec & 0xff;

    //this.dataInterval = msec;
    this.pushAndConsume(this.emmService.EMM_COMMANDS.SetMode, buf);
  }

  /**
   * 休眠模式等於斷線，送 4 次(確認跑到休眠)
   */
  sleepMode() { 
    /* Set sleep mode: 0x02:0xaa:0xbb:0xcc:0xdd:0xee */
    var buf = new Uint8Array(6);
    buf[0] = 0x02;
    buf[1] = 0xaa;
    buf[2] = 0xbb;
    buf[3] = 0xcc;
    buf[4] = 0xdd;
    buf[5] = 0xee;
    for (var i; i < 4; i++) {
      this.pushAndConsume(this.emmService.EMM_COMMANDS.SetMode, buf);
    }

    this.onAppStatusEvent.emit(AppStatus.TALKING_TO_SCAN);
  }
  //升級硬體目前不使用
  DFUMode() {
    var buf = new Uint8Array(6);
    /* Set DFU mode : 0xdf:0x12:0x34:0x56:0x78:0x9a */
    buf[0] = 0xdf;
    buf[1] = 0x12;
    buf[2] = 0x34;
    buf[3] = 0x56;
    buf[4] = 0x78;
    buf[5] = 0x9a;
    for (var i; i < 4; i++) {
      this.pushAndConsume(this.emmService.EMM_COMMANDS.SetMode, buf);
    }
  }

  //====Clear && Reset Data

  clearDevice() {
    this.datas = [];
  }
  private clearBtDispatch() {
    if (this.scanBtDispatcher) {
      clearInterval(this.scanBtDispatcher);
      this.scanBtDispatcher = null;
    }
  }
  private clearTxQDispatcher() {
    if (this.txQDispatcher) {
      clearInterval(this.txQDispatcher);
      this.txQDispatcher = null;
    }

  }
  private clearKeepAliveDispatcher() {
    if (this.keepAliveDispatcher) {
      clearInterval(this.keepAliveDispatcher);
      this.keepAliveDispatcher = null;
    }
  }
  private clearDebugInfo() {
    this.connectedDevice = null;
    this.logs = [];
  }
  //=====Debug 
  private writeLog(text) {
    if (this.logs.length > 1) {
      this.logs.shift();
    }
    this.logs.push({ text: text, timestamp: new Date() })
  }

  //*圈數計數

  setStatus(status) {   
    this.status = status;
    //console.log( 'status:' + this.status )
    
    switch (status) {
      case 'currentSign':
        this.spData.RPM = 0
          this.getSign()
            this.events.subscribe('SIGN',((xSign,ySign,zSign) =>{
            //  if(xSign != null  && ySign !=null && zSign !=null  && xSign != 0  && ySign !=0 && zSign !=0){
                if(xSign != null  && ySign !=null   && xSign != 0  && ySign !=0 ){//?圓周運動不考慮Ｚ
                    this.currentX = xSign
                    this.currentY = ySign
                    this.currentZ = zSign
                    // console.log('X初始位置：' + this.currentX)
                    // console.log('Y初始位置：' + this.currentY)
                    // console.log('Z初始位置：' + this.currentZ)
                    this.events.unsubscribe('SIGN')
                    this.setStatus('nextSign')
                  }
            })  
          )
      break
      case 'nextSign': 
        this.events.subscribe('SIGN',(xSign,ySign,zSign) =>{
        //  if( this.currentX != xSign || this.currentY != ySign || this.currentZ != zSign){
          if( this.currentX != xSign || this.currentY != ySign){ 
            // console.log('X下個位置：' + xSign)
            // console.log('Y下個位置：' + ySign)
            // console.log('Z下個位置：' + zSign)
            this.events.unsubscribe('SIGN')
            this.setStatus('roundAdd') 
          }
        })
        this.countTs= Date.now() 
        clearTimeout(this.reScaleTime)
        break
      case 'roundAdd':
        this.events.subscribe('SIGN',(xSign,ySign,zSign) =>{
          //  if(this.currentX == xSign && this.currentY == ySign && this.currentZ == zSign){
            if(this.currentX == xSign && this.currentY == ySign){
              // console.log('X計數位置：' + xSign)
              // console.log('Y計數位置：' + ySign)
              // console.log('Z計數位置：' + zSign)
              this.spData.round = this.spData.round +1 
            let gap:number = Date.now() - this.countTs
            //console.log('gap:' +  gap)
            this.upDateSPM(gap)
            let dist = bikeWheelSize * this.spData.round
            this.spData.distance = numeral(dist).format('0,0.00');
            this.updateCalories()
            this.events.unsubscribe('SIGN')
            this.setStatus('nextSign')
            }
          })
          let tpRound = this.spData.round
          this.reScaleTime = setTimeout(() =>{ //軌跡重新偵測
            if(tpRound == this.spData.round){
              this.events.unsubscribe('SIGN')
              this.setStatus('currentSign')
             // console.log('reScale')
            }
          },2000)
        
      break
      default:
        break;
    }
  }

  getSign(){ 
    let currXArr = []
    let currYArr = []
    let currZArr = []
    let MAXArr =[]
    let MAYArr =[]
    let MAZArr =[]
    clearInterval(this.getSignInt)
    this.getSignInt = setInterval(() => {
      currXArr.push(this.currentEmmData.x)
      currYArr.push(this.currentEmmData.y)
      currZArr.push(this.currentEmmData.z)
        // console.log('currXArr:'+currXArr)
        // console.log('currYArr:'+currYArr)
        // console.log('currZArr:'+currZArr)
        if(currXArr.length > 4 ){  //五點平均線
        MAXArr.push( _.mean(currXArr))
        MAYArr.push( _.mean(currYArr))
        MAZArr.push( _.mean(currZArr))
        currXArr =  _.tail(currXArr)
        currYArr =  _.tail(currYArr)
        currZArr=  _.tail(currZArr)
        // console.log('MAXArr:'+MAXArr)
        // console.log('MAYArr'+MAYArr)
        // console.log('MAZArr:'+MAZArr)//MA採集
        if (MAXArr.length > 1){
      if(((MAXArr[1] - MAXArr[0]) < -300) || ((MAXArr[1] - MAXArr[0]) > 300 ) 
      || ((MAYArr[1] - MAYArr[0]) < -300) || ((MAYArr[1] - MAYArr[0]) > 300 )
      || ((MAZArr[1] - MAZArr[0]) < -300) || ((MAZArr[1] - MAZArr[0]) > 300 )
      ){
          let xSign = Math.sign(MAXArr[1] - MAXArr[0]) //正號為1 負號為-1
          let ySign = Math.sign(MAYArr[1] - MAYArr[0])
          let zSign = Math.sign(MAZArr[1] - MAZArr[0])
          this.events.publish('SIGN',xSign,ySign,zSign)
        MAXArr =  _.tail(MAXArr)
        MAYArr =  _.tail(MAYArr)
        MAZArr =  _.tail(MAZArr)
      }else{
        MAXArr =  _.tail(MAXArr)
        MAYArr =  _.tail(MAYArr)
        MAZArr =  _.tail(MAZArr)
      }
    }}
    },200)   //? 100:會多計數 200:會少計數
  } 

  freeScan(){
    this.onAppStatusEvent.emit(AppStatus.SCAN)
    this.page = FreeRidingPage
  }

  trainScan(){
    this.onAppStatusEvent.emit(AppStatus.SCAN)
    this.page = TrainingPage
  }

  realScan(){
    this.onAppStatusEvent.emit(AppStatus.SCAN)
    this.page = RealScenePage 
  }

  battleScan(){
    this.onAppStatusEvent.emit(AppStatus.SCAN)
    this.socket.fromOneTimeEvent('sendID').then((id)=>{ 
      this.userId = id
      this.socket.emit('userReady',this.userId)
      console.log(this.userId)
    })
    this.socket.fromEvent('userStart').subscribe(() =>{
      this.userWaiting(true)
 })
    //this.socket.connect(); //開啟webSocket  //?不確定作用
    this.page = BattlePage 
  }

  start(){
      setTimeout(() =>{
      this.setStatus('currentSign')
      setInterval(() =>{
        this.events.publish('sendData',this.spData.RPM,
                                       this.spData.distance,
                                       this.spData.calories)  
      },250) 
      },3000)

      this.navCtrl.push(this.page,{ userName:this.name,
                                    userId:this.userId
      }) 
  }
   
   userWaiting(userReady?){ 
      if(userReady ===true){
        this.start()
      // this.startTest()
       }else{
         this.loadingCtrl.create({
          content: "請等待其他使用者",
          dismissOnPageChange:true,
          cssClass:'loading'
        }).present();
       }
     }
  
  upDateSPM(gap){
    let rate = (60 * 1000) / gap
    let TOTAL = 2
    let ALPHA = 1
    let tmp = this.spmMovingAverage * (TOTAL - ALPHA) + rate * ALPHA
    this.spmMovingAverage = tmp/TOTAL 
   this.setSPM(this.spmMovingAverage)
  }

  setSPM(spm){
   // this.vSPM = _.round(spm)
    let speed = KPH_PER_RPM * spm
    this.spData.speed = numeral(speed).format('0,0.0');
    this.spData.RPM = _.round(spm)
  }
  

  updateCalories(){
    let kc = this.currCalories
    if (this.spData.speed == 0) {
      kc += 0;
    }
    else if (this.spData.speed >0 && this.spData.speed <= 16.1){
      kc += 4 * this.weight * (1/3600);
    }
    else if(this.spData.speed > 16.1 && this.spData.speed <= 19.31){
      kc += 6 * this.weight * (1/3600);
    }
    else if(this.spData.speed > 19.31 && this.spData.speed <= 22.53){
      kc += 8 * this.weight * (1/3600);
    }
    else if(this.spData.speed > 22.53 && this.spData.speed <= 25.75){
      kc += 10 * this.weight * (1/3600);
    }
    else if(this.spData.speed > 25.75 && this.spData.speed <= 32.19){
      kc += 12 * this.weight * (1/3600);
    }
    else if(this.spData.speed > 32.19){
      kc += 16 * this.weight * (1/3600);
    }
   
    this.setCalories(kc);
    
  }

  setCalories(kc) {
    this.currCalories = kc;
    this.spData.calories = kc;
    this.spData.calories = numeral(this.spData.calories).format('0,0');
    
  }
//   socketTest(){
//     this.socket.fromEvent('userStart').subscribe(() =>{
//       this.userWaiting(true)
//  })
//  this.socket.connect(); //開啟webSocket
//  this.page = BattlePage
//  this.userWaiting() 
//   }

//   startTest(){
//     this.navCtrl.push(this.page,{ userName:this.name,
//       userId:this.id
// }) 
//   }

}

