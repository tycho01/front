let _ = require('lodash/fp');
import { Observable } from 'rxjs/Observable';
import { Component, OnInit, Input, forwardRef, ChangeDetectionStrategy, ChangeDetectorRef } from 'angular2/core';
import { CORE_DIRECTIVES, NgSwitch, NgSwitchWhen, NgSwitchDefault } from 'angular2/common';
import { mapComb } from '../rx_helpers';
import { Templates } from '../jade';
import { ULComp } from './ul';
import { TableComp } from './table';
import { infer_type, try_schema } from '../output'
import { ng2comp } from '../js';

let inputs = ['path$', 'val$', 'schema$', 'named'];

export let ArrayComp = ng2comp({
  component: {
    selector: 'array',
    inputs: inputs,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: Templates.ng_array,
    directives: [CORE_DIRECTIVES, NgSwitch, NgSwitchWhen, NgSwitchDefault,
      forwardRef(() => ULComp),
      forwardRef(() => TableComp),
    ]
  },
  parameters: [ChangeDetectorRef],
  // decorators: {},
  class: class ArrayComp {
    // type: Observable<string>;
    // new_spec$: Observable<any>;

    constructor(cdr) {
      this.cdr = cdr;
    }

    ngOnDestroy() {
      this.cdr.detach();
    }

    ngOnInit() {
      let first$ = this.val$.map(_.get([0]));
      this.new_spec$ = mapComb([first$, this.schema$], getSpec);
      let type$ = mapComb([first$, this.new_spec$], (first, spec) => _.get(['type'], spec) || infer_type(first));
      type$.subscribe(x => {
        this.type = x;
        this.cdr.markForCheck();
      });
    }

  }
})

let getSpec = (first, spec) => _.get(['items', 'type'], spec) ? spec.items : try_schema(first, _.get(['items'], spec))
  //items/anyOf/allOf/oneOf, additionalItems
  //no array of multiple, this'd be listed as anyOf/allOf or additionalItems, both currently unimplemented
