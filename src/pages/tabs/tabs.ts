import { Component } from '@angular/core';
import { HomePage } from '../home/home';
import { HistoryPage } from '../history/history';
import { BlePage } from '../ble/ble';
import { UserInformationPage } from '../user-information/user-information';
@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  //tab1Root = HomePage;
  tab1Root = BlePage;
  tab2Root = HistoryPage;
  tab3Root = UserInformationPage;
  constructor() {

  }
}
