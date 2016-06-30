let _ = require('lodash/fp');
import { FormControl, AbstractControl } from '@angular/forms';
import { ValidatorFn } from '@angular/forms/src/directives/validators';
import { inputControl } from '../../input'
import { SchemaControl } from '../schema_control';
import { try_log, fallback } from '../../../../lib/decorators';

export class PolymorphicControl extends FormControl {
  _ctrl: AbstractControl;

  constructor() {
    super(null);
  }

  get ctrl(): AbstractControl {
    let x = this._ctrl;
    if(_.isUndefined(x)) x = this._ctrl = new FormControl(null);
    return x;
  }
  set ctrl(x: AbstractControl) {
    if(_.isUndefined(x)) return;
    x.setParent(this);
    this._ctrl = x;
  }

  @try_log()
  setSchema(schema: Front.Schema): void {
    this.ctrl = inputControl(schema);
  }

  // wrap all FormControl/AbstractControl methods

  get value(): any { return this.ctrl.value; }
  get status(): string { return this.ctrl.status; }
  get valid(): boolean { return this.ctrl.valid; }
  get errors(): {[key: string]: any} { return this.ctrl.errors; }
  get pristine(): boolean { return this.ctrl.pristine; }
  get dirty(): boolean { return this.ctrl.dirty; }
  get touched(): boolean { return this.ctrl.touched; }
  get untouched(): boolean { return this.ctrl.untouched; }
  get valueChanges(): Observable<any> { return this.ctrl.valueChanges; }
  get statusChanges(): Observable<any> { return this.ctrl.statusChanges; }
  get pending(): boolean { return this.ctrl.pending; }

  markAsTouched(): void { this.ctrl.markAsTouched(); }

  markAsDirty(opts): void { this.ctrl.markAsDirty(opts); }

  markAsPending(opts): void { this.ctrl.markAsPending(opts); }

  // setParent(parent: FormGroup | FormArray): void { this.ctrl.setParent(parent); }

  updateValueAndValidity(opts): void { this.ctrl.updateValueAndValidity(_.assign(opts, { onlySelf: true })); }

  updateValue(value: any, opts): void { this.ctrl.updateValue(value, opts); }

}

// doesn't actually use one schema...
export class SchemaPolymorphicControl extends SchemaControl(PolymorphicControl) {

  constructor(
    schema: Front.Schema,
    path: string[] = [],
  ) {
    super();
    this.schema = schema;
    this.path = path;
  }

  @try_log()
  setSchema(schema: Front.Schema): void {
    this.ctrl = inputControl(schema, this.path);
  }

}