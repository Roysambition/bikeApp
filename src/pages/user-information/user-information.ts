import { Component,ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams,AlertController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';

@IonicPage()
@Component({
  selector: 'page-user-information',
  templateUrl: 'user-information.html',
})
export class UserInformationPage {

  userName:string 
  userWeight:number 
  constructor(private nativeStorage: NativeStorage,public navCtrl: NavController, public navParams: NavParams,public alertCtrl:AlertController) {
   
  }
    
  registerUser(){
    this.nativeStorage.setItem('user',{name:this.userName,
                                       weight:this.userWeight}).then(
      () => {
       let alert =  this.alertCtrl.create({
         title:'輸入成功',
         buttons:['確定']
       });
       alert.present()
      }
      ,error => console.log('saveUser Error',error)
   )
  }
}

