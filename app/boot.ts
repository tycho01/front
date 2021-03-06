/// <reference path='../typings.d.ts'/>
/// <reference path='../typings/tsd.d.ts'/>

require('./styles');
import 'babel-core/register';
import 'babel-polyfill';
let _ = require('lodash/fp');

import 'angular2/bundles/angular2-polyfills.js';
// ^ what's the @angular equivalent here? [#8412](https://github.com/angular/angular/issues/8412)
import { bootstrap } from '@angular/platform-browser-dynamic';
// import { bootstrapStatic } from '@angular/platform-browser';
// import { ROUTER_PROVIDERS } from '@angular/router';
import { provideRouter } from '@angular/router';
import { HTTP_BINDINGS } from '@angular/http';
import { enableProdMode } from '@angular/core';

import { App } from './comps/fat/app/app';
import { wsServiceProvider, requestServiceProvider, globalsServiceProvider, FetcherService } from './comps/services';
import { CONFIG, APP_CONFIG } from './config';

let singletons = [
  HTTP_BINDINGS,
  // ROUTER_PROVIDERS,
  // provideRouter(MyRoutes),
  requestServiceProvider,
  wsServiceProvider,
  globalsServiceProvider,
  { provide: APP_CONFIG, useValue: CONFIG },
  FetcherService,
];
enableProdMode();  // Augury needs dev mode... but is slow
bootstrap(App, singletons);
// .catch(err => console.error('ERROR CAUGHT BY BOOT:' + err));

window._ = _;
window.jQuery = window.$ = require('jquery');
//Materialize
require('materialize-css/dist/js/materialize');
window.noUiSlider = require('materialize-css/extras/noUiSlider/nouislider');
(function($){
  $(function(){
    Waves.displayEffect();
    $('.button-collapse').sideNav();
    $('.collapsible').collapsible({});
    $('.tooltipped').tooltip({delay: 50});
    /*
    $('select').material_select();
    $('.datepicker').pickadate({ selectMonths: true, selectYears: 15 });
    $('ul.tabs').tabs();
    */
  })
})(window.$)
