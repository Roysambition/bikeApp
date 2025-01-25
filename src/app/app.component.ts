import { Component,OnInit } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Insomnia } from '@ionic-native/insomnia';
import { TranslateService } from '@ngx-translate/core';
import { ScreenOrientation } from '@ionic-native/screen-orientation'

import { TabsPage } from '../pages/tabs/tabs'

import { BlePage } from '../pages/ble/ble'
import { FreeRidingPage } from '../pages/lesson/free-riding/free-riding'
import { TrainingPage } from '../pages/lesson/training/training'
import { RealScenePage} from '../pages/lesson/real-scene/real-scene'
import { TrainingResultsPage } from '../pages/lesson/training-results/training-results'
import { FreeRidingResultsPage} from '../pages/lesson/free-riding-results/free-riding-results'
import { RealSceneResultsPage} from '../pages/lesson/real-scene-results/real-scene-results'
import { HistoryPage } from '../pages/history/history'
import { BattlePage } from '../pages/lesson/battle/battle'



@Component({
  templateUrl: 'app.html'
})
export class MyApp  implements OnInit {  //implements OnInit：angular定義了一個OnInit的接口,所有實施implements 這個接口的Class必須要實現成員ngOnInit
  rootPage:any = TabsPage  ;

  ngOnInit(){                            //ngOnInit:初始化Component或Directive
    this.translateService.addLangs(['zh-TW','zh-CN','en-US',]);        //將新的語言添加到列表中
    this.translateService.setDefaultLang('en-US');                     //當在當前語言翻譯中找不到翻譯時en-US將會被使用
    const browserLang = this.translateService.getBrowserCultureLang(); //得到手機系統的語言,getBrowserCultureLang:能使用中文簡體及繁體等更細微的語言
    this.translateService.use(browserLang.match(/zh-TW|zh-CN|en-US/) ? browserLang :'') //優先使用getBrowserCultureLang所得到的浏览器语言  ？：可选参数和可选属性,使browserLang能使用參數不只一個  
      }                               // use:更改當前使用的語言           //match:將字符串與支持匹配的對象匹配，並返回包含該搜索結果的數組。
        
   

  constructor(platform: Platform, 
              statusBar: StatusBar,
              splashScreen: SplashScreen,
              private insomnia: Insomnia,
              public translateService : TranslateService,
              private screenOrientation: ScreenOrientation,) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
    this.insomnia.keepAwake()
    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT)
    platform.registerBackButtonAction(() =>{},1)
  }

}
