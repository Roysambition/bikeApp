import { Component ,ViewChild} from '@angular/core';
import { IonicPage, NavController, NavParams,Events } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation'
import { TrainingResultsPage } from '../training-results/training-results';
import { ToastController } from 'ionic-angular';
import { NativeAudio} from '@ionic-native/native-audio'
import * as _ from 'lodash';
import * as numeral from 'numeral'
@IonicPage()
@Component({
  selector: 'page-training',
  templateUrl: 'training.html',
})

export class TrainingPage {

@ViewChild('ran') ran:any;

  public area: string ='熱身區';
  public areaChangeTime:number = 10
  private rpmRemindTimer: number;

  public RPM:number; 
  public aveRPM:number;
  public calories:number;
  public distance:number;

  
  public second:number = 0;
  public countTime: number = 180;
  public timer:any;
  public countDownTimer:any;
  public s:number = this.countTime % 60 ;
  public m:number =_.floor( this.countTime / 60);
  public spState: any;
  public initValue:number = 50;
  public upDateInt:any

  public pressTimer:number;
  public current: number = 0;
  public max: number = 60;
  public color: string = '#45ccce';
  public background: string = '#eaeaea';
  public gradient: boolean = true;
  public radius: number = 125;
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public alertCtrl: AlertController,
              private screenOrientation: ScreenOrientation,
              public events: Events,
              public toastCtrl: ToastController,
              public nativeAudio: NativeAudio,) {
  }
  getOverlayStyle() { 
    let transform = 'translateY(-50%) ' + 'translateX(-50%)';
    return {
      'top': '50%',
      'bottom': 'auto',
      'left': '50%',
      'transform': transform,
      '-moz-transform': transform,
      '-webkit-transform': transform,
      'font-size': this.radius / 3.5 + 'px'
    };
  }
  
  ngAfterViewInit():void {
  this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE)
  this.Init()
  this.sportState('VIDEO')
  this.events.subscribe('sendData',(RPM,distance,calories) =>{
    this.RPM = RPM;
    this.distance = distance;
    this.calories = calories
    })
  this.calAverageRPM()  
  this.nativeAudio.preloadComplex('Sport','assets/audio/Sport.mp3',1,1,0,)
  setTimeout(()=>{ 
    this.sportState('RIDING')
    this.playMusic()
    this.showToast('請調整好最佳的騎行姿勢','toastCss') 
    },3000)
  }

  Init(){
    this.second = 0;
    this.current = 0;
    this.distance = 0;
    this.calories = 0;
  }
  playMusic(){  
    this.nativeAudio.play('Sport')
    this.nativeAudio.loop('Sport')
  }
 
    sportState(spState) {
      //console.log("Changing state to " +spState);
      this.spState = spState;
      switch (spState) {
       case 'RIDING':
        this.startTimer()
        this.countdownTimer()
       break
  
       case 'PAUSING': 
       clearInterval(this.countDownTimer)
       clearInterval(this.timer)
       
       break

        default:
        break;
    }
  } 


stopRiding(){
  clearInterval(this.upDateInt)
  clearInterval(this.countDownTimer)
  clearInterval(this.timer)
  this.nativeAudio.stop('Sport')
  this.nativeAudio.unload('Sport')
  this.events.unsubscribe('sendData') 
  this.navCtrl.push(TrainingResultsPage,{
     aveRPM: this.aveRPM, 
     distance:this.distance,
     calories:this.calories,
     second:this.second
    })
 } 

pressed(){
  this.pressTimer=setInterval(() =>{
  this.current++
  },50)
}
released(){
 clearInterval(this.pressTimer)
 this.current = 0
}

changeVolume(volume){
  this.nativeAudio.setVolumeForComplexAsset('Sport',volume.value/100) 
}
startTimer(){
  this.timer=setInterval(() =>{
  this.second++
  //console.log(this.second)
  if(this.second == 10){
     this.areaChangeTime = 16
     this.area = '脂肪燃燒區'
     this.showToast('請將踏頻保持在100-120rpm','toastCss')
     this.rpmRemind(1)
  }
  if(this.second == 25){
     this.areaChangeTime = 16
     this.area = '休息區'
     this.showToast('請將踏頻保持在60rpm','toastCss')
  }
  if(this.second == 40){
     this.areaChangeTime = 31
     this.area = '脂肪燃燒區'
     this.showToast('請將踏頻保持在100-120rpm','toastCss')
     this.rpmRemind(2)
  } 
  if(this.second == 70){
     this.areaChangeTime = 31
     this.area = '休息區'
     this.showToast('請將踏頻保持在60rpm','toastCss')
  }
  if(this.second == 100){
     this.areaChangeTime = 46
     this.area = '脂肪燃燒區'
     this.showToast('請將踏頻保持在100-120rpm','toastCss')
     this.rpmRemind(3)
  }
  if(this.second == 145){
     this.areaChangeTime = 36
     this.area = '運動恢復區'
     this.showToast('請將踏頻保持在60rpm','toastCss')
  }

  if(this.second == 175){
    this.areaChangeTime= 6
   this.area = '課程即將結束'
  }
  },1000)
}
countdownTimer(){
  this.countDownTimer=setInterval(() =>{
    this.countTime = this.countTime -1 
    this.areaChangeTime = this.areaChangeTime -1
    this.m = _.floor(this.countTime/60) ;
    this.s = this.countTime % 60
  if(this.countTime == 0){
    this.stopRiding()
  }
  },1000)
}

calAverageRPM(){
  let RPMArr = []
  this.upDateInt = setInterval(() =>{
      if(this.RPM != 0){
        RPMArr.push(this.RPM)
        this.aveRPM = _.mean(RPMArr)
      }
  },1000)
}

rpmRemind(x){
  let rpmArr = []
  let i = 0
    setTimeout(()=>{
      this.rpmRemindTimer=setInterval(()=>{
        _.compact(rpmArr.push(this.RPM))
        if(rpmArr.length == 4){
          let aveRPM = _.mean(rpmArr)
          // console.log(rpmArr)
          // console.log(aveRPM)
          if( aveRPM > 120){
            this.showToast('踏頻有點高哦，請放慢下來','highCss')
          }
          if(aveRPM >= 100 && aveRPM <= 120){
            this.showToast('很棒哦！繼續保持','goodCss')
          }
          if(aveRPM < 100){
            this.showToast('踏頻有點低哦，再加把勁！','lowCss')
          }
          i++
          if( i == x){
            clearInterval(this.rpmRemindTimer)
          }else{
            rpmArr=[]
          }
        }
      },1000)
    },5000)
}

showToast(msg,changeCss){
  const toast = this.toastCtrl.create({
    message: msg,
    duration: 3000,
    cssClass: changeCss,
    position:'top'
    
  });
  toast.present();

}
}
