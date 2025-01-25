import { Component,Injectable } from '@angular/core';
import { IonicPage, NavController, NavParams,Events } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { ScreenOrientation } from '@ionic-native/screen-orientation'
import { NativeStorage } from '@ionic-native/native-storage';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Screenshot } from '@ionic-native/screenshot';
import { Instagram } from '@ionic-native/instagram';
import * as _ from 'lodash';
import * as numeral from 'numeral';
import * as moment from 'moment';
let todayDate = new Date() 

@IonicPage()
@Injectable()
@Component({
  selector: 'page-training-results',
  templateUrl: 'training-results.html',
})
export class TrainingResultsPage {

  public year:number = todayDate.getFullYear() 
public month:number = todayDate.getMonth() + 1 
public day:number =  todayDate.getDate() //日

  public data = { name:'課程騎行',
                  month:this.month,
                  day:this.day,
                  date:moment(todayDate).format('YYYYMMDD'),
                  aveRPM:_.round(this.navParams.get('aveRPM')),
                  distance:this.navParams.get('distance'),
                  calories:this.navParams.get('calories'),
                  times:this.navParams.get('second'),
   }
   
public times:any = numeral(this.data.times).format('00:00:00') 

dataLists: any = [];

dayAveRPM: number;
dayDistance: number;
dayTimes: number;
dayCalories: number;
  today: string;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              private sqlite: SQLite,
              private screenOrientation: ScreenOrientation,
              public events: Events,
              private nativeStorage: NativeStorage,
              private socialSharing: SocialSharing,
                private screenshot: Screenshot,
                private instagram: Instagram
            ) { 
              this.saveData()
  }

  FBShare(){
    this.screenshot.URI(100).then((res) =>{
      this.socialSharing.shareViaFacebook(null,res.URI,null).then(()=>{
      })
    })
    }
  
    IGShare(){
    this.screenshot.URI(100).then((res) =>{
      this.instagram.share(res.URI,null).then(() =>{
      })
    })
    }
  
    otherShare(){
      this.screenshot.URI(100).then((res) =>{
        this.socialSharing.share('','',res.URI,null).then(() =>{
        }).catch((err) =>{
          console.log(err)
        })
      })
    }

  saveData() {
    this.sqlite.create({
      name: 'sportData.db',
      location: 'default'
    }).then((db: SQLiteObject) => { //INSERT INTO:向表中插入新记录(新行) //datalist:表名 executeSql():在打開的數據庫上執行SQL語法
     // db.executeSql('INSERT INTO datalist VALUES(NULL,?,?,?,?,?,?,?)',[this.data.month,this.data.day,this.data.date,_.round(this.data.aveRPM),this.data.times,_.round(this.data.distance,1),_.round(this.data.calories)])
     db.executeSql('INSERT INTO datalist VALUES(NULL,?,?,?,?,?,?,?,?)',[this.data.name,this.data.month,this.data.day,this.data.date,_.round(this.data.aveRPM),this.data.times,_.round(this.data.distance,1),_.round(this.data.calories)])
      db.executeSql('CREATE TABLE IF NOT EXISTS dataList(rowId INT PRIMARY KEY,name TEXT,month INT,day INT,date TEXT, aveRPM INT, times INT, distance INT, calories INT)', [])
      .then(() => console.log('Executed SQL'))
      .catch(() => console.log('SQL開啟 fail'));

      let todayMonth = this.data.month.toString() 
      let todayDay = this.data.day.toString()
      let todayYear = this.year.toString()
      if(todayDay.length == 1 ){
        todayDay = '0' + todayDay
       }            
        if(todayMonth.length == 1 ){
         todayMonth = '0' + todayMonth
        }
       this.today = todayYear + todayMonth + todayDay 
      db.executeSql('SELECT AVG(aveRPM) AS dayAveRPM FROM dataList WHERE date =' + this.today , []) 
      .then(res => {
        if(res.rows.length>0) {
          this.dayAveRPM = Number(res.rows.item(0).dayAveRPM);   //parseInt():一個字符串並返回一個整數   
       //   console.log('A'+this.dayAveRPM)
        }
      })
      .catch(() => console.log('monthAveRPM fail'))

      db.executeSql('SELECT SUM(times) AS dayTimes FROM dataList WHERE date =' + this.today , []) 
      .then(res => {
        if(res.rows.length>0) {
          this.dayTimes = res.rows.item(0).dayTimes;   //parseInt():一個字符串並返回一個整數
         // console.log(this.dayTimes)
        }
      })
      .catch(() => console.log('monthAveRPM fail'))    
      
      db.executeSql('SELECT SUM(distance) AS dayDistance FROM dataList WHERE date =' + this.today , []) 
      .then(res => {
        if(res.rows.length>0) {
          this.dayDistance = Number(res.rows.item(0).dayDistance);   //parseInt():一個字符串並返回一個整數
       //   console.log(this.dayDistance)
        }
      })
      .catch(() => console.log('monthAveRPM fail'))     

         db.executeSql('SELECT SUM(calories) AS dayCalories FROM dataList WHERE date =' + this.today , []) 
          .then(res => {
            if(res.rows.length>0) {
              this.dayCalories = Number(res.rows.item(0).dayCalories);   //parseInt():一個字符串並返回一個整數
          //    console.log(this.dayCalories)
            }
          })
          .catch(() => console.log('monthAveRPM fail')) 
    })
  }

   nativeStore(){
    // this.nativeStorage.clear()
    // .then(
    //   () => console.log('deleate item!'),
    //   error => console.error('Error storing item', error)
    //   )
  //  console.log(this.today)
  //  console.log(+this.dayAveRPM)
  //  console.log(this.dayTimes)
  //  console.log(this.dayDistance)
  //  console.log(this.dayCalories)
  this.nativeStorage.setItem(this.today,{dayAveRPM:_.round(this.dayAveRPM),
                                    dayTimes:this.dayTimes,
                                    dayDistance:_.round(this.dayDistance,1),
                                    dayCalories:_.round(this.dayCalories),
                                   })  
                                   .then(
                                    () => console.log('saveData Success'),
                                    error => console.log('saveData Error',error)
                                 ) ;        
   }

  backHome(){
   //this.screenOrientation.unlock()  無法使用unlock成功改變方向
   this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT)
   this.events.publish('closeBLE')
   this.nativeStore()
   this.navCtrl.popToRoot()
}

}