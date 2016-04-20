let _ = require('lodash/fp');
import { TestComponentBuilder, ComponentFixture, NgMatchers, inject, injectAsync, beforeEachProviders, it, fit, xit, expect, afterEach, beforeEach, } from "angular2/testing";
import { dispatchEvent, fakeAsync, tick, flushMicrotasks } from 'angular2/testing_internal';
import { test_comp, makeComp, setInput, myAsync } from '../../../test';

import { provide } from 'angular2/core';
import { ChangeDetectorGenConfig } from 'angular2/src/core/change_detection/change_detection';

import { ValueComp } from './value';
let cls = test_comp('value', ValueComp);
let path = ['test'];
let scalar = 'foo';
let arr = [ 'foo', 'bar', 'baz' ];
let obj = { a: 1, b: 2 };
let table = [ { a: 1, b: 2 }, { a: 'A', b: 'B' } ];
let obs_pars = {
  path,
  val: null,
  schema: {},
};

describe('ValueComp', () => {
  let tcb;

  // how could I override a provider for one specific test instead?
  beforeEachProviders(() => [
    provide(ChangeDetectorGenConfig, {useValue: new ChangeDetectorGenConfig(false, false, false)}),
  ]);

  beforeEach(inject([TestComponentBuilder], (builder) => {
    tcb = builder;
  }));

  it('should handle scalars', fakeAsync(() => {
    let { comp, el, fixture, debugEl } = makeComp(tcb, cls(_.assign(obs_pars, { val: scalar })));
    expect(el).toHaveText(scalar);
    tick(1000);
  }));

  it('should handle arrays', fakeAsync(() => {
    let { comp, el } = makeComp(tcb, cls(_.assign(obs_pars, { val: arr })));
    expect(el).toHaveText(arr.join(''));
    tick(1000);
  }));

  it('should handle objects', fakeAsync(() => {
    let { comp, el } = makeComp(tcb, cls(_.assign(obs_pars, { val: obj })));
    expect(el).toHaveText('a1b2');
    tick(1000);
  }));

  xit('should handle tables', fakeAsync(() => {
    let { comp, el } = makeComp(tcb, cls(_.assign(obs_pars, { val: table })));
    expect(el).toHaveText('ab12AB');
    tick(1000);
  }));

});
