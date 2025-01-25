import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RealScenePage } from './real-scene';

@NgModule({
  declarations: [
    RealScenePage,
  ],
  imports: [
    IonicPageModule.forChild(RealScenePage),
  ],
})
export class RealScenePageModule {}
