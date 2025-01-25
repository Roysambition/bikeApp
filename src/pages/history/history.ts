//datalist:表名
import { Component,ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { NativeStorage } from '@ionic-native/native-storage';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Screenshot } from '@ionic-native/screenshot';
import * as echarts from 'echarts'         //npm install echarts --save
import * as numeral from 'numeral'
import * as _ from 'lodash';

const limitMonth = new Date().getMonth() + 1 ;
const limitYear  = new Date().getFullYear() ;
const dateArr =[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31] 


@IonicPage()
@Component({
  selector: 'page-history',
  templateUrl: 'history.html'
})
export class HistoryPage {
  @ViewChild('colorTimes') colorTimes:any;
  @ViewChild('colorAveRPM') colorAveRPM:any;
  @ViewChild('colorDistance') colorDistance:any;
  @ViewChild('colorCalories') colorCalories:any;
   
  dataLists: any = [];

  private aveRPMArr = []
  private timesArr = []
  private distanceArr = []
  private caloriesArr =  []

  temp:string;
  state:any ='TIMES';
  public monthAveRPM: number
  public monthDistance: number
  public monthCalories: number 
  public monthTimes:any =numeral(0).format('00:00:00');
  public year:any = new Date().getFullYear() ;
  public month:any = new Date().getMonth() + 1 ;
  strMonth = this.month.toString()
  public chartMonth
  x:number = 0;
  

  constructor(public navCtrl: NavController,
              private sqlite: SQLite,
              private nativeStorage: NativeStorage,
              private socialSharing: SocialSharing,
              private screenshot: Screenshot) {
      
              }
        
              accordion(index,temp) { //history list
                this.temp=temp+index;
            }
            ionViewDidEnter(){
              this.getData()
              this.chartMonth = this.month  
              if(this.chartMonth < 10 ){
                this.chartMonth = '0' + this.chartMonth
              }
             this.timesChange()
            }

            otherShare(){
              this.screenshot.URI(100).then((res) =>{
                this.socialSharing.share('message','Subject',res.URI,null).then(() =>{
                })
              })
            }
       
            nextMonth(){
               this.month = this.month + 1 
                 if(this.year == limitYear && this.month > limitMonth ){
                     this.month = limitMonth
                 }else{     
                  if(this.month == 13){
                    this.year = this.year + 1
                    this.month = 1 
                  } 
                 }
                 this.chartMonth = this.month     
                 if(this.chartMonth < 10 ){
                  this.chartMonth = '0' + this.chartMonth
                    }
                 this.x = 0
                 this.aveRPMArr = []
                 this.timesArr = []
                 this.distanceArr = []
                 this.caloriesArr =  []
                // console.log(this.chartMonth)
                 this.getChartData(this.chartMonth)
                 this.getData() 
            }
       
            lastMonth(){
                this.month = this.month - 1
                if(this.month == 0){
                this.year = this.year - 1
                this.month = 12 
                } 

                this. chartMonth = this.month     
                if(this.chartMonth < 10 ){
                    this.chartMonth = '0' + this.chartMonth
                }
                 this.x = 0
                 this.aveRPMArr = []
                 this.timesArr = []
                 this.distanceArr = []
                 this.caloriesArr =  []
                 console.log(this.chartMonth)
                 this.getChartData(this.chartMonth)
                 this.getData() 
            }
                setState(state) { 
                    //console.log("Changing state to " +state);      
                    this.state = state;
                    switch (state) {
                    case 'TIMES':
                            var ec = echarts as any;
                            var container = document.getElementById('histogram');
                            var chart = ec.init(container);
                             chart.setOption({
                              backgroundColor:"#111c4e",
                              color: ['#3398DB'], 
                              grid: {
                                  left: '5%',
                                  right: '3%',
                                  bottom: '0%',
                                  top: '10%',
                                  height: '90%',
                                  containLabel: true,
                                 // z: 22
                              },
                              xAxis: [{
                                  type: 'category',
                                  gridIndex: 0,
                                  data: dateArr,
                                  splitNumber:6,
                                  axisTick: {
                                    alignWithLabel: true
                                },
                                  axisLine: {
                                      lineStyle: {
                                          color: '#0c3b71'
                                      }
                                  },
                                  axisLabel: {
                                      show: true,
                                      interval:5,
                                       color: 'rgb(170,170,170)',
                                       fontSize:15
                                  }
                              }],
                              yAxis: [{
                                      type: 'value',
                                      name: '時長(分鐘)',
                                      nameLocation: 'end',
                                      minInterval: 1,
                                      nameTextStyle: {
                                        color: 'rgba(255,255,255,.5)'
                                      },
                                      gridIndex: 0,
                                      splitLine: {
                                          show: false
                                      },
                                      axisTick: {
                                          show: false
                                      },
                                    //   min: minRound,
                                    //   max: maxRound,
                                      axisLine: {
                                          lineStyle: {
                                              color: '#0c3b71'
                                          }
                                      },
                                      axisLabel: {
                                          color: 'rgb(170,170,170)',
                                          formatter: '{value}'
                                      }
                                  },
                                  {
                                      type: 'value',   //格子
                                      gridIndex: 0,
                                    //   min: minRound,
                                    //   max: 100,
                                      splitNumber: 12,
                                      splitLine: {
                                          show: false
                                      },
                                      axisLine: {
                                          show: false
                                      },
                                      axisTick: {
                                          show: false
                                      },
                                      axisLabel: {
                                          show: false
                                      },
                                      splitArea: {
                                          show: true,
                                          areaStyle: {
                                              color: ['rgba(250,250,250,0.0)', 'rgba(250,250,250,0.05)']
                                          }
                                      }
                                  }
                              ],
                              
                              series: [{  
                                      type: 'bar',
                                      barWidth: '30%',
                                      xAxisIndex: 0,
                                      yAxisIndex: 0,
                                      itemStyle: {
                                          normal: {
                                              barBorderRadius: 30,
                                              color: new echarts.graphic.LinearGradient(
                                                  0, 0, 0, 1, [{
                                                          offset: 0,
                                                          color: '#00feff'
                                                      },
                                                      {
                                                          offset: 0.5,
                                                          color: '#027eff'
                                                      },
                                                      {
                                                          offset: 1,
                                                          color: '#0286ff'
                                                      }
                                                  ]
                                              )
                                          }
                                      },
                                      data:this.timesArr,
                                      zlevel: 11
                                  },
                                  {
                                    name: '背景',
                                    type: 'bar',
                                    barWidth: '50%',
                                    xAxisIndex: 0,
                                    yAxisIndex: 1,
                                    barGap: '-135%',
                                    data: [100000, 100000, 100000, 100000, 100000, 100000, 100000,100000, 100000, 100000, 100000, 100000, 100000, 100000,100000, 100000, 100000, 100000, 100000, 100000, 100000,100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000],
                                    itemStyle: {
                                        normal: {
                                            color: 'rgba(255,255,255,0.1)'
                                        }
                                    },
                                    zlevel: 9
                                },]
                               }); 
                        break;
                        
                    case 'AVERPM':
                      var ec = echarts as any;
                      var container = document.getElementById('histogram');
                      var chart = ec.init(container);
                      chart.setOption({
                        yAxis: [{
                          name: '平均踏頻(rpm)',
                          type: 'value'
                        }],
                        series: [{         
                                data: this.aveRPMArr,
                        }]
                      }); 
                        break;
                        
                    case 'DISTANCE':
                        var ec = echarts as any;
                        var container = document.getElementById('histogram');
                        var chart = ec.init(container);
                        chart.setOption({
                          yAxis: [{
                            name: '距離(km)',
                            type: 'value'
                          }],
                              series: [{
                                data: this.distanceArr,
                              }]    
                            });
                        break;
            
                    case 'CALORIES':
                          var ec = echarts as any;
                          var container = document.getElementById('histogram');
                          var chart = ec.init(container);
                          chart.setOption({   
                            yAxis: [{
                              name: '熱量(kcal)',
                              type: 'value'
                            }],              
                            series: [{               
                             data: this.caloriesArr,
                            }]                   
                          });
                      break;
                        default:
                        break;        
                     }
                }
            
              timesChange(){
                this.state ='TIMES'
          
                this.x = 0
                this.colorTimes.nativeElement.style.color ="blue"
                this.colorAveRPM.nativeElement.style.color =""
                this.colorDistance.nativeElement.style.color =""
                this.colorCalories.nativeElement.style.color =""
                this.getChartData(this.chartMonth)
              }

              aveRPMChange(){
                this.state ='AVERPM'
          
               this.x = 0
                this.colorAveRPM.nativeElement.style.color ="blue"
                this.colorTimes.nativeElement.style.color =""
                this.colorDistance.nativeElement.style.color =""
                this.colorCalories.nativeElement.style.color =""
                this.getChartData(this.chartMonth)
              }
          
              distanceChange(){
                this.state ='DISTANCE'
                
               this.x = 0
                this.colorDistance.nativeElement.style.color ="blue"
                this.colorTimes.nativeElement.style.color =""
                this.colorAveRPM.nativeElement.style.color =""
                this.colorCalories.nativeElement.style.color =""
                this.getChartData(this.chartMonth)
              }

              caloriesChange(){
                this.state ='CALORIES'
       
               this.x = 0
                this.colorCalories.nativeElement.style.color ="blue"
                this.colorTimes.nativeElement.style.color =""
                this.colorAveRPM.nativeElement.style.color =""
                this.colorDistance.nativeElement.style.color =""
                this.getChartData(this.chartMonth)
              }
            

      getData(){
        let month = this.month.toString()
                let year = this.year.toString()
                if(month.length == 1 ){
                  month = '0' + month
                }
                this.sqlite.create({   //create:打開或創建一個SQLite數據庫文件，如果數據庫已創建則不再創建
                  name: 'sportData.db',  //數據庫名稱(參數一)
                  location: 'default'  //數據庫位置(參數二)
                }).then((db: SQLiteObject) => {
                  db.executeSql('CREATE TABLE IF NOT EXISTS dataList(rowId INT PRIMARY KEY,name TEXT,month INT,day INT,date TEXT, aveRPM INT, times INT, distance INT, calories INT)', [])
                  .then(() => console.log('Executed SQL'))
                  .catch(() => console.log('SQL開啟 fail'));

                 let startDateCondition:string = year + month +'01' 
                 let endDateCondition:string = year + month +'31' 
                // console.log(startDateCondition)  
                  db.executeSql('SELECT * FROM dataList WHERE date >= ' + startDateCondition  + ' AND date <= ' + endDateCondition + ' ORDER BY rowId DESC', [])//ORDER BY:对结果集按照一个列或者多个列进行排序 date DESC:對date降序排列
                  .then(res => {
                    this.dataLists = [];
                    for(var i=0; i<res.rows.length; i++) {
                      this.dataLists.push({rowId:res.rows.item(i).rowId,
                                           name:res.rows.item(i).name,
                                           month:res.rows.item(i).month,
                                           day:res.rows.item(i).day,
                                           date:res.rows.item(i).date, // YYYY/MM/DD
                                           aveRPM:res.rows.item(i).aveRPM,
                                           times:numeral(res.rows.item(i).times).format('00:00:00'), //second 
                                           distance:res.rows.item(i).distance,
                                           calories:res.rows.item(i).calories})                                 
                    }
                  })
                  .catch(() => console.log('SQL排序 fail')); //?fail也沒關係

          db.executeSql('SELECT ROUND(AVG(aveRPM)) AS monthAveRPM FROM dataList WHERE date >= ' + startDateCondition  + ' AND date <= ' + endDateCondition, [])  //SUM():返回数值列的和 AS:和存在inWeight
          .then(res => {
            if(res.rows.length>0) {
              this.monthAveRPM =  Number(res.rows.item(0).monthAveRPM);   //Number:將type轉為number     
              if(this.monthAveRPM == 0 ){//沒資料時也顯示0
                this.monthAveRPM = 0 
             }
            }
          })
          .catch(() => console.log('monthAveRPM fail'))

          db.executeSql('SELECT SUM(times) AS monthTimes FROM dataList WHERE date >= ' + startDateCondition  + ' AND date <= ' + endDateCondition, []) 
          .then(res => {
            if(res.rows.length>0) {
              this.monthTimes = res.rows.item(0).monthTimes;
              this.monthTimes = numeral(this.monthTimes).format('00:00:00')
            }
          })
          .catch(() => console.log('monthSecond fail'))

          db.executeSql('SELECT ROUND(SUM(distance),1) AS monthDistance FROM dataList WHERE date >= ' + startDateCondition  + ' AND date <= ' + endDateCondition, [])  
          .then(res => {
            if(res.rows.length>0) {
              this.monthDistance = Number(res.rows.item(0).monthDistance); 
              if(this.monthDistance == 0){
                 this.monthDistance = 0 
              }
            
            }
          })
          .catch(() => console.log('monthDistance fail'))

          db.executeSql('SELECT ROUND(SUM(calories)) AS monthCalories FROM dataList WHERE date >= ' + startDateCondition  + ' AND date <= ' + endDateCondition, []) 
          .then(res => {
            if(res.rows.length>0) {
              this.monthCalories = Number(res.rows.item(0).monthCalories);   
              if(this.monthCalories == 0){
                this.monthCalories = 0 
             }
            }
          })
          .catch(() => console.log('monthCalories fail'))
          
        })
  
      }
      getChartData(strDate?){ 
        
        this.x++
        let strX = this.x.toString()
        let strYear = this.year.toString()
    
    if(this.x < 10){
      strX = '0' + strX
    }

    //console.log(strDate)
        let chartMonthDate = strYear+ strDate  + strX
     // console.log(chartMonthDate)

        this.nativeStorage.getItem(chartMonthDate)
         .then(
         chartData => {
         
         
          this.aveRPMArr.push(chartData.dayAveRPM)
         // console.log(chartData.dayAveRPM)
         
          this.timesArr.push(chartData.dayTimes /60)    
          //console.log(chartData.dayTimes)

          this.distanceArr.push(chartData.dayDistance)  
         // console.log(chartData.dayDistance)
         
          this.caloriesArr.push(chartData.dayCalories)
          //console.log(chartData.dayCalories)
          if(this.x<31){
            this.getChartData(this.chartMonth)
     
          }
         },
         error => {
         //  console.error(this.x+error)
          this.aveRPMArr.push(0)
          this.timesArr.push(0)  
          this.distanceArr.push(0) 
          this.caloriesArr.push(0)  
    
          if(this.x<31){
            this.getChartData(this.chartMonth)
         
          }
         }
         )
        if(this.x == 31){
          this.setState(this.state)
          
        } 
      //   console.log(this.state)
      // console.log(this.aveRPMArr)
      // console.log(this.distanceArr)
      // console.log(this.timesArr)
      // console.log(this.caloriesArr)
        } 
      
       

      }
      
       



