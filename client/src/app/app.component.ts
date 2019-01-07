import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { faSearch, faChartPie, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { SocketService } from 'src/app/socket.service'
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
  title = 'client';
  faSearch = faSearch;
  faChartPie = faChartPie;
  faSpinner = faSpinner;
  progressIndicator = '';
  connection;
  single: any[];
  single_gender: any[];
  multi: any[];
  location = 'united states';
  view: any[] = [700, 400];
  hideGraph = true;
  hideProgress = true;

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Sentiment';
  showYAxisLabel = true;
  yAxisLabel = 'Score';
  getAnalytics;
  update 
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };
  colorScheme1 = {
    domain: ['#ADD8E6', '#F08080', '#C7B42C', '#AAAAAA']
  };

  ngOnInit() {
    this.connection = this.socketService.getMessage().subscribe(message => {
      console.log('msg1', message);
      if(Object.keys(message)[0] == 'positive') {
        this.single.forEach( (item) => {
          if(item.name == 'positive') {
            item.value = item.value + 1;
          }
        });
      } else if (Object.keys(message)[0] == 'negative') {
        this.single.forEach( (item) => {
          if(item.name == 'negative') {
            item.value = item.value + 1;
          }
        })
      } else if (Object.keys(message)[0] == 'male') {
        this.single_gender.forEach( (item) => {
          if(item.name == 'male') {
            item.value = item.value + 1;
          }
        })
      } else if ( Object.keys(message)[0] == 'female') {
        this.single_gender.forEach( (item) => {
          if(item.name == 'female') {
            item.value = item.value + 1;
          }
        })
      }
      this.zone.run(() => {
        this.single = [...this.single];
        this.single_gender = [...this.single_gender];
        this.hideGraph = false;
        this.hideProgress = false;

        this.progressIndicator = 'Fetching & Plotting values...';
        setTimeout(() => {
          this.progressIndicator = '';
          this.hideProgress = true;
        }, 50000);
      });
      console.log('this', this.single);
    });
  }

  ngOnDestroy() {
    this.connection.unsubscribe();
  }

  constructor(private socketService: SocketService, private zone: NgZone ) {

    this.getAnalytics = function() {
      this.progressIndicator = 'Getting coordinates...';
      this.socketService.sendMessage(this.location);  
    }

    this.single = [
      {
        "name": "positive",
        "value": 1
      },
      {
        "name": "negative",
        "value": 0
      }
    ];

    this.single_gender = [
      {
        "name": "male",
        "value": 1
      },
      {
        "name": "female",
        "value": 0
      }
    ]
    
  }

  onSelect(event) {
    console.log(event);
  }
}
