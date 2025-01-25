import { Component ,ViewChild} from '@angular/core';
import { IonicPage, NavController, NavParams,Events } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation'
import { RealSceneResultsPage } from '../real-scene-results/real-scene-results';
import { Socket } from 'ngx-socket-io';
import * as _ from 'lodash';
import * as numeral from 'numeral'
@IonicPage()
@Component({
  selector: 'page-real-scene',
  templateUrl: 'real-scene.html',
})
export class RealScenePage {
  @ViewChild('myVideo') myVideo:any;
  @ViewChild('ran') ran:any;
  
    public RPM:number=0; 
    public aveRPM:number=0;
    public calories:number=0;
    public distance:number=0;
    
    
    public second:number = 0;
    public countTime: number = 75;
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
                public socket: Socket,) {
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
    setTimeout(()=>{ 
      this.sportState('RIDING') 
      },3000)
    }   

    Init(){
      this.second = 0;
      this.current = 0;
      this.distance = 0;
      this.calories = 0;
    }
  
      sportState(spState) {
        //console.log("Changing state to " +spState);
        this.spState = spState;
        switch (spState) {
         case 'RIDING':
          this.myVideo.nativeElement.play()
          this.startTimer()
          this.countdownTimer()
         break
    
         case 'PAUSING': 
         this.myVideo.nativeElement.pause()
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
    this.events.unsubscribe('sendData') 
    this.navCtrl.push(RealSceneResultsPage,{
      aveRPM: this.aveRPM, 
      distance:this.distance,
      calories:this.calories,
      second:this.second
     })
   } 
  
  changeVolume(){
    this.myVideo.nativeElement.volume=this.ran.nativeElement.value/100
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
  
  startTimer(){
    this.timer=setInterval(() =>{
    this.second++
    },1000)
  }
  countdownTimer(){
    this.countDownTimer=setInterval(() =>{
      this.m = _.floor(this.countTime/60) ;
      this.s = this.countTime%60
      this.countTime--
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

}