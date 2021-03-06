import { inject, addProviders } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { ControlVector, SchemaControlVector } from './control_vector';

describe('ControlVector', () => {
  let a;

  beforeEach(() => {
    let items = [
      () => new FormControl('a'),
      () => new FormControl('b', c => ({ someError: true })),
    ];
    let add = () => new FormControl('c');
    a = new ControlVector().seed(items, add);
  });

  // it('should test', () => {
  //   throw 'works'
  // })

  it('should push the right controls', () => {
    expect(a.length).toEqual(0);
    a.add();
    expect(a.length).toEqual(1);
    expect(a.at(0).value).toEqual('a');
    a.add();
    expect(a.length).toEqual(2);
    expect(a.at(1).value).toEqual('b');
    expect(a.at(1).errors).toEqual({ someError: true });
    a.add();
    expect(a.length).toEqual(3);
    expect(a.at(2).value).toEqual('c');
  });

  it('should allow removing controls, keeping validators in place', () => {
    a.add();
    a.add();
    a.add();
    a.add();
    expect(a.value).toEqual(['a','b','c','c']);
    expect(a.at(1).valid).toEqual(false);
    expect(a.at(1).errors).toEqual({ someError: true });
    a.removeAt(1);
    expect(a.value).toEqual(['a','c','c']);
    expect(a.at(1).value).toEqual('c');
    expect(a.at(1).valid).toEqual(false);
    expect(a.at(1).errors).toEqual({ someError: true });
  });

});

describe('SchemaControlVector', () => {
  let a;

  beforeEach(() => {
    let schema = {
      type: 'array',
      items: [
        { type: 'string', default: 'a' },
        { type: 'string', default: 'b' }, // can't hardcode in custom errors like above
      ],
      additionalItems: { type: 'string', default: 'c' },
    };
    a = new SchemaControlVector(schema).init();
  });

  it('should push the right controls', () => {
    expect(a.length).toEqual(0);
    a.add();
    expect(a.length).toEqual(1);
    expect(a.at(0).value).toEqual('a');
    a.add();
    expect(a.length).toEqual(2);
    expect(a.at(1).value).toEqual('b');
    // expect(a.at(1).errors).toEqual({ someError: true });
    a.add();
    expect(a.length).toEqual(3);
    expect(a.at(2).value).toEqual('c');
  });


});
