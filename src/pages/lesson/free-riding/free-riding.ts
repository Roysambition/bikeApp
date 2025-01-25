import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,Events } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { FreeRidingResultsPage } from '../free-riding-results/free-riding-results';
import { NativeAudio} from '@ionic-native/native-audio'
import * as _ from 'lodash';
import * as numeral from 'numeral'

@IonicPage()
@Component({
  selector: 'page-free-riding',
  templateUrl: 'free-riding.html',
})


export class FreeRidingPage  {


  public calories:number=0;
  public RPM:number=0; 
  public distance:number=0;
  public aveRPM:number=0; 
  public second:number = 0;
  public times:any =numeral(0).format('00:00:00');

 
  public timer:any;
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
              public events: Events,
              public navParams: NavParams,
              public alertCtrl: AlertController,
              public nativeAudio: NativeAudio,
              ) {
  
   
   
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
    
  startTimer(){
    this.timer=setInterval(() =>{
      this.second++
      this.times = numeral(this.second).format('00:00:00')
      },1000)
    
  }

  sportState(spState) {
    //console.log("Changing state to " +spState);
    this.spState = spState;
    switch (spState) {
     case 'RIDING':
      this.startTimer()
     break

     case 'PAUSING': 
     clearInterval(this.timer)
     break

     case 'SETTING':
      clearInterval(this.timer)
      
     break
      default:
      break;
  }
}  
    
  pressed(){ //圓形進度條(長按時)
    this.pressTimer=setInterval(() =>{
    this.current++
    },50)
  }
  released(){ //圓形進度條(放開時)
    clearInterval(this.pressTimer)
    this.current = 0
  }
    
  stopRiding(){ //圓形進度條(完成時)
    this.nativeAudio.stop('Sport')
    this.nativeAudio.unload('Sport')
    this.events.unsubscribe('sendData')
    clearInterval(this.upDateInt)
    this.navCtrl.push(FreeRidingResultsPage,{
         aveRPM: this.aveRPM, 
         calories: this.calories,
         distance:this.distance,
         second:this.second
        })
  } 
    
  changeVolume(volume){
    this.nativeAudio.setVolumeForComplexAsset('Sport',volume.value/100) 
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
