import { Component, ViewChild } from 'angular2/core';
import { BehaviorSubject } from 'rxjs/subject/BehaviorSubject';

// a component template for testing other components, by just selector (easier than html)
let test_comp = (selector, cls) => (obs_pars = {}, static_pars = {}, content = '') => {
  let obj = Object.assign({}, obs_pars, static_pars);
  let par_str = Object.keys(obj).map(k => ` [${k}]='${k}'`).join('');
  let tmplt = `<${selector}${par_str}>${content}</${selector}>`;
  return test_comp_html(tmplt, cls, obs_pars, static_pars);
}

// a component template for testing other components, by full html template
let test_comp_html = (tmplt, cls, obs_pars = {}, static_pars = {}) => {
  let cmp = class {
    //http://blog.mgechev.com/2016/01/23/angular2-viewchildren-contentchildren-difference-viewproviders
    // @ViewChild(cls) comp;
    constructor() {
      for (let k in obs_pars) this[k] = new BehaviorSubject(obs_pars[k]);
      for (let k in static_pars) this[k] = static_pars[k];
    }
  };
  Reflect.decorate([Component({
    // selector: 'test',
    directives: [cls],
    template: tmplt,
  })], cmp);
  Reflect.decorate([ViewChild(cls)], cmp.prototype, 'comp');
  return cmp;
}

// asynchronously create and test a component
// let comp_test = (tcb, done, test_class, test_fn = (cmp, el) => {}, actions = (cmp) => {}) => {
let comp_test = (tcb, test_class, test_fn = (cmp, el) => {}, actions = (cmp) => {}) => (done) => {
  return tcb.createAsync(test_class).then((fixture) => {
// let comp_test = (tcb, test_class, test_fn = (cmp, el) => {}, actions = (cmp) => {}) => async function(done) {
//   try {
//     let fixture = await tcb.createAsync(test_class);
    fixture.detectChanges();
    let test_cmp = fixture.componentInstance;
    let target_comp = test_cmp.comp;
    actions(test_cmp); //target_comp?
    //test_cmp.items.push(3);
    // https://angular.io/docs/ts/latest/api/testing/ComponentFixture-class.html
    // https://angular.io/docs/ts/latest/api/testing/NgMatchers-interface.html
    fixture.detectChanges();
    let native_el = fixture.debugElement.childNodes[0].nativeElement;
    test_fn(done, target_comp, native_el);
  }).catch(done.fail);
  // }
  // catch(e) {
  //   done.fail(e);
  // }
}

// test_fn for comp_test to check a property value
let assert = (assertion) => (pass, comp, el) => {
  assertion(comp, el);
  pass();
}

// test_fn for comp_test to check an Observable property's first value
let assert$ = (selector, matcher) => (pass, comp) => {
  selector(comp).subscribe(prop => {
    matcher(expect(prop));
    pass();
  })
}

export { test_comp, test_comp_html, comp_test, assert, assert$ };