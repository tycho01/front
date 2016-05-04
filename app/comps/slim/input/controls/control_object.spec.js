let _ = require('lodash/fp');
import { Control } from '@angular/common';
import { ControlObject } from './control_object';
import { objectControl } from '../input'  //input_control

describe('ControlObject', () => {
  var obj;

  beforeEach(() => {
    obj = objectControl({type: 'object', additionalProperties: { type: 'number' } }); //input_control
  });

  // it('should test', () => {
  //   throw 'works'
  // })

  it('should serialize as an object', () => {
    obj.add();
    obj.controls[0].controls['name'].updateValue('foo');
    obj.controls[0].controls['val'].updateValue(1);
    expect(obj.value).toEqual({foo: 1});
  });

  it('should error on duplicate keys', () => {
    obj.add();
    obj.controls[0].controls['name'].updateValue('foo');
    obj.controls[0].controls['val'].updateValue(1);
    obj.add();
    obj.controls[1].controls['name'].updateValue('bar');
    obj.controls[1].controls['val'].updateValue(2);
    expect(obj.errors).toEqual(null);
    obj.controls[1].controls['name'].updateValue('foo');
    expect(obj.errors).toEqual({uniqueKeys: true});
  });

});
