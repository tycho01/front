var Phoenix = require('phoenix-js-derp');
import { Observable } from '@reactivex/rxjs';
// import { autobind } from 'core-decorators';
// import { addUrl, parsley, toCurl } from './requests';

// @autobind
export class WS {
//   requests: {};
//   id: number;
//   ws: any;  //Phoenix.Socket
//   chan: any;  //Phoenix.Channel
//   _out: Observable<any>;
//   connected: boolean;

  constructor(url = "ws://127.0.0.1:8080/socket", chan_name = "rooms:lobby", onOpen = () => {}, onClose = () => {}) {
  //constructor({ url = "ws://127.0.0.1:8080/socket", chan_name = "rooms:lobby", onOpen = () => {}, onClose = () => {} }) {
    this.requests = {};
    this.id = 0;
    let logger = ((kind, msg, data) => {}); // console.log(`${kind}: ${msg}`, data)
    this.ws = new Phoenix.Socket(url, {logger: logger});
    this.ws.connect({});
    this.chan = this.ws.channel(chan_name, {user: "tycho"});
    this.chan.join();
    this.ws.onOpen(() => {
      this.connected = true;
      onOpen();
    });
    this.ws.onClose(() => {
      this.connected = false;
      onClose();
    });
  }

  // taken from https://github.com/robwormald/aim/, example at TickerService.ts (also exposed `in` Observer).
  // should soon be made into a RxJS 5 compatible Subject at https://github.com/blesh/RxSocketSubject/
  get out() {   //: Observable<any>
    if(!this._out) {
      this._out = Observable.create(sub => {
        let chan = this.chan;
        chan.onClose(() => sub.complete());
        chan.onError(e => sub.error(e));
		    chan.on("msg", e => sub.next(e));
        //return () => {
        //  chan.leave();
        //  this._out = null;
        //};
      }).share();
    }
    return this._out;
  }

  //url: string, pars: {}
  ask_many(url, pars = {}) {
    let id = this.id++;
    this.chan.push(url, {body: pars, id: id});
    return this.out
      .filter(x => x.id == id)
      .map(e => e.body);
  }
  // ^ the server doesn't currently send complete events. Rx operators definitely affected by this:
  // Last, SkipLast, TakeLast, To(Array/Map/Set), Sum, Reduce, Min, Max, Count, Concat, IgnoreElements
  // Average, SequenceEqual, DefaultIfEmpty, (Contains), All, (Using), (TimeInterval), Do
  // solution: use one of the below overrides which use pre-existing question-answer knowledge to complete.
  // (trying this server-sided would suck too due to having to guarantee order of client reception.)

  // request that completes after n responses
  ask(url, pars = {}, n = 1) {
    return this.ask_many(url, pars).take(n);
  }

  // alt: directly scrape pages from browser using Chrome startup flag `--disable-web-security` or by making this into an extension?

  // addUrl = addUrl;
  // parsley = parsley;
  // toCurl = toCurl;

}

export default WS