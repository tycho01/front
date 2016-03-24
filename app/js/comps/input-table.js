import { Component, OnInit, Input, forwardRef, ChangeDetectionStrategy, ChangeDetectorRef } from 'angular2/core';
import { Templates } from '../jade';
import { COMMON_DIRECTIVES, FORM_DIRECTIVES } from 'angular2/common';
import { FieldComp } from './input-field';
import { getPaths, ng2comp } from '../js';
let _ = require('lodash/fp');

export let InputTableComp = ng2comp({
  component: {
    selector: 'input-table',
    inputs: ['named', 'path', 'spec', 'ctrl'],  //ctrl is expected to be a ControlList seeded with a ControlGroup
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: Templates.ng_input_table,
    directives: [
      COMMON_DIRECTIVES, FORM_DIRECTIVES,
      FieldComp,
    ]
  },
  parameters: [ChangeDetectorRef],
  decorators: {},
  class: class InputTableComp {
    // type: Observable<string>;

    constructor(cdr) {
      this.cdr = cdr;
    }

    ngOnInit() {
      let props = getPaths(this.path);
      ['k', 'id'].forEach(x => this[x] = props[x]);
      this.counter = 0;
      this.items = new Set([]);
      // [working example](http://plnkr.co/edit/mcfYMx?p=preview)
      console.log('input-table:this.spec', this.spec);
      this.keys = Object.keys(this.spec.items.properties);
    }

    add() {
      this.items.add(this.counter++);
      this.ctrl.add();
      this.cdr.markForCheck();
    }

    remove(item) {
      let idx = _.findIndex(x => x == item)(Array.from(this.items));
      this.ctrl.removeAt(idx);
      this.items.delete(item);
      this.cdr.markForCheck();
    }
  }
})
