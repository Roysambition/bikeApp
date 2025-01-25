import { Component,OnInit} from '@angular/core';
import { IonicPage, NavController, NavParams} from 'ionic-angular';
import * as echarts from 'echarts'


var currentTime = +new Date() + 1000 * 3600 * 24;  //+new Date()返回總毫秒數(從1970/1/1開始到現在)
var weekCategory = [];

var radarData = [];
var radarDataAvg = [];
var maxData = 25000;
var weekMaxData = [];
var weekLineData = [];

for (var i = 0; i < 7; i++) {
  // 日期
  var date = new Date( currentTime -= 1000 * 3600 * 24);
  weekCategory.unshift([   //unshift:在數組最前面的位置加入新元素
    date.getMonth() + 1,   //根据本地时间，返回一个指定的日期对象的月份
    date.getDate()         //根据本地时间，返回一个指定的日期对象为一个月中的哪一日
  ].join('/'));
  // 折线图数据
  weekMaxData.push(maxData);
  var distance = Math.round(Math.random() * 21000 + 2000 );  //Math.round:返回四舍五入后的整数
  weekLineData.push(distance);

  // 雷达图数据
  // 我的指标
  var averageSpeed = +(Math.random() * 10 + 3).toFixed(1); //toFixed(num)把 Number 四舍五入为指定小数位数的数字 num:小數的位數
  var maxSpeed = averageSpeed + (+(Math.random() * 5).toFixed(1));
  var hour = +(distance / 1000 / averageSpeed).toFixed(1);
  var radarDayData = [distance, averageSpeed, maxSpeed, hour];
  radarData.unshift(radarDayData);

  // 平均指标
  var distanceAvg = Math.round(Math.random() * 17000 + 4000);
  var averageSpeedAvg = +(Math.random() * 8 + 4).toFixed(1);
  var maxSpeedAvg = averageSpeedAvg + (+(Math.random() * 4).toFixed(1));
  var hourAvg = +(distance / 1000 / averageSpeed).toFixed(1);
  var radarDayDataAvg = [distanceAvg, averageSpeedAvg, maxSpeedAvg, hourAvg];
  radarDataAvg.unshift(radarDayDataAvg);
}

var color = {
  linearYtoG: {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 1,
    y2: 1,
    colorStops: [{
      offset: 0,
      color: '#f5b44d'
    }, {
      offset: 1,
      color: '#28f8de'
    }]
  },
  linearGtoB: {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 1,
    y2: 0,
    colorStops: [{
      offset: 0,
      color: '#43dfa2'
    }, {
      offset: 1,
      color: '#28f8de'
    }]
  },
  linearBtoG: {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 1,
    y2: 0,
    colorStops: [{
      offset: 0,
      color: '#1c98e8'
    }, {
      offset: 1,
      color: '#28f8de'
    }]
  },
  areaBtoG: {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [{
      offset: 0,
      color: 'rgba(35,184,210,.2)'
    }, {
      offset: 1,
      color: 'rgba(35,184,210,0)'
    }]
  }
};
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage  {


  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
           
              ) {
               
              }
              ionViewDidEnter() {
                let ec = echarts as any;
                let container = document.getElementById('home');
                let chart = ec.init(container);
                chart.setOption({
                  title: {
                   
                    textStyle: {
                      color: '#fff',
                      fontSize: 26,
                      fontWeight: 'normal'
                    },
                    
                    subtextStyle: {
                      color: '#fff',
                      fontSize: 16,
                    },
                    top: 10,
                    left: 60
                  },
                  legend: {
                    top: 80,
                    left: 10,
                    orient: 'vertical',
                    itemGap: 15,
                    itemWidth: 15,
                    itemHeight: 15,
                    data: ['平均指標', '我的指標'],
                    textStyle: {
                      color: '#fff',
                      fontSize: 14,
                    },
                  },
                  tooltip: {
                    trigger: 'item' 
                  },
                  radar: {                //調整雷達圖
                    center: ['50%', '35%'],   
                    radius: '55%',
                    name: {
                      color: '#fff'
                    },
                    splitNumber: 8,
                    axisLine: {
                      lineStyle: {
                        color: color.linearYtoG,
                        opacity: .6
                      }
                    },
                    splitLine: {
                      lineStyle: {
                        color: color.linearYtoG,
                        opacity: .6
                      }
                    },
                    splitArea: {
                      areaStyle: {
                        color: '#fff',
                        opacity: .1,
                        shadowBlur: 25,
                        shadowColor: '#000',
                        shadowOffsetX: 0,
                        shadowOffsetY: 5,
                      }
                    },
                    indicator: [{
                      name: '騎行距離',
                      max: maxData
                    }, {
                      name: '平均踏頻',
                      max: 12
                    }, {
                      name: '熱量消耗',
                      max: 18
                    }, {
                      name: '騎行時間',
                      max: 4
                    }]
                  },
                  grid: {   //調整折線圖
                    left: 50,
                    right: 50,
                    bottom: 60,
                    top: '60%',
                  },
                  xAxis: {
                    type: 'category',
                    position: 'bottom',
                    axisLine: true,
                    axisLabel: {
                      color: 'rgba(255,255,255,.8)',
                      fontSize: 10
                    },
                    data: weekCategory,
                  },
                  yAxis: {
                    name: '騎行距離(km)',
                    nameLocation: 'end',
                    nameGap: 24,
                    nameTextStyle: {
                      color: 'rgba(255,255,255,.5)',
                      fontSize: 14
                    },
                    max: maxData,
                    splitNumber: 4,
              
                    axisLine: {
                      lineStyle: {
                        opacity: 0
                      }
                    },
                    splitLine: {
                      show: true,
                      lineStyle: {
                        color: '#fff',
                        opacity: .1
                      }
                    },
                    axisLabel: {
                      color: 'rgba(255,255,255,.8)',
                      fontSize: 12
              
                    }
                  },
                  series: [{
                    name: '每日跑步指标分布与比较',
                    type: 'radar',
                    symbolSize: 0,
                    data: [{
                      value: radarDataAvg[6],
                      name: '平均指標',
                      itemStyle: {
                        normal: {
                          color: '#f8d351',
                        }
                      },
                      lineStyle: {
                        normal: {
                          opacity: 0,
                        }
                      },
                      areaStyle: {
                        normal: {
                          color: '#f8d351',
                          shadowBlur: 25,
                          shadowColor: 'rgba(248,211,81,.3)',
                          shadowOffsetX: 0,
                          shadowOffsetY: -10,
                          opacity: 1
                        }
                      },
                    }, {
                      value: radarData[6],
                      name: '我的指標',
                      itemStyle: {
                        normal: {
                          color: '#43dfa2',
                        }
                      },
                      lineStyle: {
                        normal: {
                          opacity: 0,
                        }
                      },
                      areaStyle: {
                        normal: {
                          color: color.linearGtoB,
                          shadowBlur: 15,
                          shadowColor: 'rgba(0,0,0,.2)',
                          shadowOffsetX: 0,
                          shadowOffsetY: 5,
                          opacity: .8
                        }
                      },
                    }]
                  }, {
                    name: '每日運動里程',
                    type: 'line',
                    smooth: true,
                    symbol: 'emptyCircle',
                    symbolSize: 8,
                    itemStyle: {
                      normal: {
                        color: '#fff'
                      }
                    },
                    lineStyle: {
                      normal: {
                        color: color.linearBtoG,
                        width: 3
                      }
                    },
                    areaStyle: {
                      normal: {
                        color: color.areaBtoG,
                      }
                    },
                    data: weekLineData,
                    lineSmooth: true,
                    markLine: {
                      silent: true,
                      data: [{
                        type: 'average',
                        name: '平均值'
                      }],
                      precision: 0,
                      label: {
                        normal: {
                          formatter: '平均值: \n {c}'
                        }
                      },
                      lineStyle: {
                        normal: {
                          color: 'rgba(248,211,81,.7)'
                        }
                      }
                    },
                    tooltip: {
                      position: 'top',
                      formatter: '{c} m',
                      backgroundColor: 'rgba(28,152,232,.2)',
                      padding: 6
                    }
                  },],
                  backgroundColor: '#383546',
                
               })
            
            
               chart.on('click', function(params) {
                if (params.componentType === 'series' && params.seriesType === 'line') {
            
                  var dataIndex = params.dataIndex;
                  chart.setOption({
                    series: [
                    {
                  name: '每日運動指標分布與比較',
                  type: 'radar',
                  symbolSize: 0,
                  data: [{
                    name: '平均指標',
                    value: radarDataAvg[dataIndex],
                    itemStyle: {
                      normal: {
                        color: '#f8d351',
                      }
                    },
                    lineStyle: {
                      normal: {
                        opacity: 0,
                      }
                    },
                    areaStyle: {
                      normal: {
                        color: '#f8d351',
                        shadowBlur: 25,
                        shadowColor: 'rgba(248,211,81,.3)',
                        shadowOffsetX: 0,
                        shadowOffsetY: -10,
                        opacity: 1
                      }
                    },
                  }, {
                    name: '我的指標',
                    value: radarData[dataIndex],
                    itemStyle: {
                      normal: {
                        color: '#43dfa2',
                      }
                    },
                    lineStyle: {
                      normal: {
                        opacity: 0,
                      }
                    },
                    areaStyle: {
                      normal: {
                        color: color.linearGtoB,
                        shadowBlur: 15,
                        shadowColor: 'rgba(0,0,0,.2)',
                        shadowOffsetX: 0,
                        shadowOffsetY: 5,
                        opacity: .8
                      }
                    },
                  }]
                }]
                  })
                }
              });
  }   
  

}