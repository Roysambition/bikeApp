import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,Events } from 'ionic-angular';
import { BattleResultPage } from '../battle-result/battle-result';
import { NativeAudio} from '@ionic-native/native-audio'
import { Socket } from 'ngx-socket-io';
import * as echarts from 'echarts'
import * as _ from 'lodash';
import * as numeral from 'numeral'

@IonicPage()
@Component({
  selector: 'page-battle',
  templateUrl: 'battle.html',
})
export class BattlePage {

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
  public sendDisTimer: any;
  public myUserName = this.navParams.get('userName')
  public id = this.navParams.get('userId')
  public otherUserName:any 
  public otherDistance:any
  public users = [
    {name:this.myUserName,distance:this.distance},
    {name:'-',distance:0 }
  ]


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
              public nativeAudio: NativeAudio,
              public socket: Socket
            ) {
              this.socket.fromEvent('otherUserName').subscribe((otherName) =>{
                this.otherUserName = otherName
                console.log('otherName:' + this.otherUserName)
                })
          
              this.socket.fromEvent('otherUserDistance').subscribe((otherDistance) =>{
                  this.otherDistance = otherDistance 
                  console.log('otherDistance:' + this.otherDistance)
                 if( this.distance >= otherDistance){
                   this.users = [
                    {name:this.myUserName,distance:this.distance},
                    {name:this.otherUserName,distance:this.otherDistance}
                   ]
                 }else{
                  this.users = [
                    {name:this.otherUserName,distance:this.otherDistance},
                    {name:this.myUserName,distance:this.distance}
                   ]
                 }
             }) 
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

  //this.sendDataToServer()  
  this.sendDataToServer()  
    this.calAverageRPM()
    this.chart()
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
    
  chart(){
    const ec = echarts as any;
    const container = document.getElementById('dashBoard');
    const chart= ec.init(container);
     setInterval(()=>{
      chart.setOption ({
         title: [{
        x: "40%",
        y:"70%",
        text: 'rpm',
            textStyle: {
                fontWeight: 'normal',
                fontSize: 30,
                color: "#fff"
            },
        }],
        series : [
            {
                name:'速度',
                type:'gauge',
                min:0,
                max:200,
                center: ['50%', '50%'], // 默认全局居中
                radius: '90%',
                axisLine: {            // 坐标轴线
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.1, '#ff4500'],[0.8, '#4EE3FF'],[1, 'lime']],
                        width: 5,
                        //shadowColor : '#fff', //默认透明
                        shadowBlur: 10
                    }
                },
                axisLabel: {            // 坐标轴小标记
                    textStyle: {       // 属性lineStyle控制线条样式
                        fontWeight: 'bolder',
                        color: '#fff',
                        //shadowColor : '#fff', //默认透明
                        shadowBlur: 10
                    }
                },
                axisTick: {            // 坐标轴小标记
                    length :15,        // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: 'auto',
                        width:3,
                        //shadowColor : '#fff', //默认透明
                        shadowBlur: 10
                    }
                },
                splitLine:{//橙色分割线
                    length:25,
                    lineStyle:{
                        width:3,
                        color:'#FCD209',
                    }
                },
                itemStyle:{//指针颜色
                    color:'#1e90ff',
                },
                pointer:{//指针长短
                    length:110
                },
                data:[{value:this.RPM}]
            }
        ]
       });
     },250)
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
    this.socket.disconnect()
    clearInterval(this.sendDisTimer)
    clearInterval(this.upDateInt)
    this.navCtrl.push(BattleResultPage,{
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
  sendDataToServer(){
    this.sendDisTimer = setInterval(() =>{
      this.socket.emit('sendUserData',{userName:this.myUserName,
                                       distance:this.distance,
                                       id:this.id
      })
      },1000)
  }

  // sendDataToServer(){

  //   this.sendDisTimer = setInterval(() =>{
  //     this.socket.emit('sendDistance',{distance:this.distance,
  //                                  id:this.id
  //     })
  //     this.socket.emit('sendName',{userName:this.myUserName,
  //                                  id:this.id
  //     })
  //     },1000)
  // }

  // sendDataToServerTest(){
  //   let distance = 1
  //   this.sendDisTimer = setInterval(() =>{
  //     distance = distance +0.231 
  //     this.socket.emit('sendDistance',{distance:distance,
  //                                  id:this.id
  //     })
  //     this.socket.emit('sendName',{userName:'user1',
  //                                  id:this.id
  //     })
  //     },1000)
  // }

}
