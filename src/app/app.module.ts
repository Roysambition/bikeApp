import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import { BlePage } from '../pages/ble/ble';
import { HomePage } from '../pages/home/home';
import { HistoryPage } from '../pages/history/history';
import { UserInformationPage } from '../pages/user-information/user-information';

import { FreeRidingPage } from '../pages/lesson/free-riding/free-riding';
import { TrainingPage } from '../pages/lesson/training/training';
import { RealScenePage } from '../pages/lesson/real-scene/real-scene';
import { BattlePage } from '../pages/lesson/battle/battle';

import { FreeRidingResultsPage} from '../pages/lesson/free-riding-results/free-riding-results'
import { TrainingResultsPage } from '../pages/lesson/training-results/training-results';
import { RealSceneResultsPage } from '../pages/lesson/real-scene-results/real-scene-results';
import { BattleResultPage } from '../pages/lesson/battle-result/battle-result';

import { NativeAudio } from '@ionic-native/native-audio';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { SQLite } from '@ionic-native/sqlite';
import { Toast } from '@ionic-native/toast';
import { VideoPlayer } from '@ionic-native/video-player';

import { BLE } from '@ionic-native/ble';

import { HttpClient,HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader,TranslateModule} from '@ngx-translate/core';
import { ScreenOrientation } from '@ionic-native/screen-orientation'
import { LongPressModule } from 'ionic-long-press'
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { EmmParserService } from '../providers/emm-parser.service';
import { Insomnia } from '@ionic-native/insomnia'; //keepawake
import { NativeStorage } from '@ionic-native/native-storage';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Screenshot } from '@ionic-native/screenshot';
import { Instagram } from '@ionic-native/instagram';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
//建立TranslateHttpLoader作為語系檔的讀取器
export function createTranslateHttpLoader(http:HttpClient){         //TranslateHttpLoader有兩個參數可以使用，分別是多語系的檔案路徑及json檔如果都沒有設定的話預設會使用「/assets/i18n/」及「.json」
  return new TranslateHttpLoader(http,'./assets/i18n/','.json');    //也就是說只要在assets目錄下建立一個叫i18n的資料夾，之後設定語系時和json檔的檔名一樣他就會自己找到相對應的語系了
}
//const config: SocketIoConfig = { url: 'https://bikeserver.herokuapp.com/', options: {} };
const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };
@NgModule({
  declarations: [
    MyApp,
    BlePage,
    HomePage,
    UserInformationPage,
    TabsPage,
    HistoryPage,
    FreeRidingPage,
    FreeRidingResultsPage,
    TrainingPage,
    TrainingResultsPage,
    RealScenePage,
    RealSceneResultsPage,
    BattlePage,
    BattleResultPage
  
  ],
  imports: [
    BrowserModule,
    HttpClientModule,                        // 將 TranslateHttpLoader作為 TranslateModule 的語系檔讀取器(loader)
    LongPressModule,
    RoundProgressModule,
    SocketIoModule.forRoot(config),
    IonicModule.forRoot( //for.Root目的:在应用程序中使用单例服务,也就是说一个应用里只会有一个该服务的实例。这能确保我们用服务共享数据时，不同模块取到的数据是一致的。
      MyApp,{tabsHideOnSubPages:true }), 
    TranslateModule.forRoot({                //但当我们懒加载某一个模块时，该模块上面的服务会重新注册，如果该服务已经被注册过了，就会造成应用中一个服务有多个实例的情况因此就要使用forRoot或forChild確保單例服務
      loader:{
        provide: TranslateLoader,
        useFactory:(createTranslateHttpLoader),
        deps:[HttpClient]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    BlePage,
    HomePage,
    UserInformationPage,
    TabsPage,
    HistoryPage,
    FreeRidingPage,
    FreeRidingResultsPage,
    TrainingPage,
    TrainingResultsPage ,
    RealScenePage,
    RealSceneResultsPage,
    BattlePage,
    BattleResultPage
 
  ],
  providers: [
    BLE,
    StatusBar,
    SplashScreen,
    SQLite,
    Toast,
    LocationAccuracy,
    VideoPlayer,
    ScreenOrientation,
    NativeAudio,
    EmmParserService,
    Insomnia,
    NativeStorage,
    SocialSharing,
    Screenshot,
    Instagram,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    

  ]
})
export class AppModule {}
