let _ = require('lodash/fp');
// let lodash = require('lodash');
import { Directive, Renderer, ElementRef, ViewContainerRef, EmbeddedViewRef, ViewRef, TemplateRef, DoCheck, KeyValueDiffer, KeyValueDiffers, KeyValueChangeRecord } from '@angular/core';
import { DomElementSchemaRegistry } from '@angular/compiler/src/schema/dom_element_schema_registry';
import { isPresent, isBlank } from '@angular/core/src/facade/lang';
import { evalExpr, transformWhile, print } from './js';
import { NgForRow } from '@angular/common/src/directives/ng_for';
// import { ExtDir } from './annotations';

// [HTML attribute vs. DOM property](https://angular.io/docs/ts/latest/guide/template-syntax.html#!#html-attribute-vs-dom-property)
// [HTML attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes)
// [properties / IDL attributes](https://www.w3.org/TR/DOM-Level-2-HTML/idl-definitions.html)
// PropertyBindingType: Property, Attribute, Class, Style -- https://github.com/angular/angular/blob/master/modules/angular2/src/compiler/template_ast.ts
// [prefix definitions](https://github.com/angular/angular/blob/master/modules/angular2/src/compiler/template_parser.ts)
// each calls a respective `setElement*` -- https://github.com/angular/angular/blob/master/modules/angular2/src/compiler/view_compiler/property_binder.ts
const setMethod = {
  property: 'setElementProperty',
  attribute: 'setElementAttribute',
  class: 'setElementClass',
  style: 'setElementStyle',
  // directive: 'setElementDirective',  // <-- nope, doesn't exist :(
  // ^ compiled components instantiate directives (names numbered!), then in
  // `detectChangesInternal` feeds the expression results into their inputs,
  // and finally saves the result to detect changes on the next check.
};
// https://github.com/angular/angular/blob/master/modules/%40angular/platform-browser/src/web_workers/worker/_renderer.ts
// setText, invokeElementMethod, listen, listenGlobal
// this._el.style.backgroundColor = color;

// return a string key of the method to set the given key for the element in question
function keyMethod(registry: DomElementSchemaRegistry, elName: string, k: string): string {
  return setMethod[registry.hasProperty(elName, k) ? 'property' : 'attribute'];
}

abstract class ObjDirective implements DoCheck {
  _el: HTMLElement;
  _obj: {[key: string]: string};
  _differ: KeyValueDiffer;
  _elName: string;

  // constructor(
  //   // ObjDirective
  //   private _differs: KeyValueDiffers,
  //   private _elRef: ElementRef,
  //   private _renderer: Renderer,
  // ) {
  //   // ObjDirective
  //   this._el = _elRef.nativeElement;
  // }

  set attributes(obj: {[key: string]: string}) {
    this._obj = obj;
    if (isBlank(this._differ) && isPresent(obj)) {
      this._differ = this._differs.find(obj).create(null);
    }
  }

}

// mixin: http://www.2ality.com/2016/05/six-nifty-es6-tricks.html
const DynamicDirective = Sup => class extends Sup {
  _context: ComponentClass;
  _extra: {};

  // constructor() {
  //   // DynamicDirective
  //   this._extra = {};
  // }

  set extraVars(obj: {[key: string]: any}) {
    this._extra = obj;
  }

  ngDoCheck() {
    let obj = this._obj;
    if (isPresent(this._differ)) {
      var changes = this._differ.diff(obj);
      if (isPresent(changes)) {
        changes.forEachRemovedItem((record: KeyValueChangeRecord) => {
          this._setItem(record.key, null);
        });
      }
    }
    _.each((v, k) => {  // mapBoth?
      this._setItem(k, v);
    })(obj);
  }

};

// set multiple properties/attributes from an object without knowing which is which.
// named after attributes rather than properties so my json-schema could go with
// that without causing confusing with its existing `properties` attribute.
@Directive({
  selector: '[setAttrs]',
  inputs: ['attributes: setAttrs'],
})
export class SetAttrs extends ObjDirective {

  constructor(
    // ObjDirective
    private _differs: KeyValueDiffers,
    private _elRef: ElementRef,
    private _renderer: Renderer,
    // this
    private _registry: DomElementSchemaRegistry,
  ) {
    super();
    // ObjDirective
    this._el = _elRef.nativeElement;
    // this
    this._elName = this._el.tagName;
  }

  private _setItem(name: string, val: string): void {
    let method = keyMethod(this._registry, this._elName, name);
    this._renderer[method](this._el, name, val);
  }

  ngDoCheck() {
    if (isPresent(this._differ)) {
      var changes = this._differ.diff(this._obj);
      if (isPresent(changes)) {
        this._applyChanges(changes);
      }
    }
  }

  private _applyChanges(changes: any): void {
    changes.forEachAddedItem((record: KeyValueChangeRecord) => {
      this._setItem(record.key, record.currentValue);
    });
    changes.forEachChangedItem((record: KeyValueChangeRecord) => {
      this._setItem(record.key, record.currentValue);
    });
    changes.forEachRemovedItem((record: KeyValueChangeRecord) => {
      this._setItem(record.key, null);
    });
  }

}

// get the context for a viewContainer -- for e.g. `_View_FieldComp5` first go up to `_View_FieldComp0`.
function getContext(view: ViewContainerRef): Object {
  let condition = x => [Object, NgForRow].includes(x.context.constructor);
  return transformWhile(condition, y => y.parent, view._element.parentView).context;
}

// dynamically bind properties/attributes (cf. SetAttrs), using strings evaluated in the component context
// intended as a `[[prop]]="evalStr"`, if now `[dynamicAttrs]="{ prop: evalStr }"`
// hint toward original: `bindAndWriteToRenderer` @ `compiler/view_compiler/property_binder.ts`.
// alternative: `[prop]="eval(evalStr)"` for `eval = evalExpr(this)` on class.
// ^ try that for directives! but can't dynamically bind to different things like this.
// challenge: even if I extract rules from JSON, how do I generate these bindings?...
// unless I could dynamically bind to directives, which was the problem, so use this.
@Directive({
  selector: '[dynamicAttrs]',
  inputs: ['attributes: dynamicAttrs', 'extraVars: extraVars'],
})
export class DynamicAttrs extends DynamicDirective(ObjDirective) {

  constructor(
    // ObjDirective
    private _differs: KeyValueDiffers,
    private _elRef: ElementRef,
    private _renderer: Renderer,
    // this
    private _registry: DomElementSchemaRegistry,
    _viewContainer: ViewContainerRef,
  ) {
    super();
    // ObjDirective
    this._el = _elRef.nativeElement;
    // DynamicDirective
    this._extra = {};
    // this
    this._context = getContext(_viewContainer);
    this._elName = this._el.tagName;
  }

  private _setItem(name: string, evalStr: string): void {
    let method = keyMethod(this._registry, this._elName, name);
    let val = evalExpr(this._context, this._extra)(evalStr);
    this._renderer[method](this._el, name, val);
  }

}

@Directive({
  selector: '[applies]',
  inputs: ['doesApply: applies', 'extraVars: extraVars'],
})
export class AppliesDirective extends DynamicDirective(ObjDirective) {

  constructor(
    // ObjDirective
    private _differs: KeyValueDiffers,
    private _elRef: ElementRef,
    private _renderer: Renderer,
    // this
    private _registry: DomElementSchemaRegistry,
    _viewContainer: ViewContainerRef,
  ) {
    super();
    // ObjDirective
    this._el = _elRef.nativeElement;
    // DynamicDirective
    this._extra = {};
    // this
    this._context = getContext(_viewContainer);
    this._elName = this._el.tagName;
  }

  set doesApply(bool: boolean) {
    this._renderer.setElementProperty(this._el, 'hidden', !bool);
  }

}

@Directive({
  selector: '[appliesExpr]',
  inputs: ['doesApply: appliesExpr', 'extraVars: extraVars'],
})
export class AppliesExprDirective extends DynamicDirective(ObjDirective) {

  constructor(
    // ObjDirective
    private _differs: KeyValueDiffers,
    private _elRef: ElementRef,
    private _renderer: Renderer,
    // this
    private _registry: DomElementSchemaRegistry,
    _viewContainer: ViewContainerRef,
  ) {
    super();
    // ObjDirective
    this._el = _elRef.nativeElement;
    // DynamicDirective
    this._extra = {};
    // this
    this._context = getContext(_viewContainer);
    this._elName = this._el.tagName;
  }

  set doesApply(evalStr: string) {
    let val = evalStr ? evalExpr(this._context, this._extra)(evalStr) : true;
    this._renderer.setElementProperty(this._el, 'hidden', !val);
  }

}

// set styles dynamically (cf. NgStyle), using strings evaluated in the component context
@Directive({
  selector: '[dynamicStyle]',
  inputs: ['attributes: dynamicStyle', 'extraVars: extraVars'],
})
export class DynamicStyle extends DynamicDirective(ObjDirective) {

  constructor(
    // ObjDirective
    private _differs: KeyValueDiffers,
    private _elRef: ElementRef,
    private _renderer: Renderer,
    // this
    _viewContainer: ViewContainerRef,
  ) {
    super();
    // ObjDirective
    this._el = _elRef.nativeElement;
    // DynamicDirective
    this._extra = {};
    // this
    this._context = getContext(_viewContainer);
  }

  private _setItem(name: string, evalStr: string): void {
    let val = evalExpr(this._context, this._extra)(evalStr);
    this._renderer.setElementStyle(this._el, name, val);
  }

}

// set classes dynamically (cf. NgClass), using strings evaluated in the component context
@Directive({
  selector: '[dynamicClass]',
  inputs: ['attributes: dynamicClass', 'extraVars: extraVars'],
})
export class DynamicClass extends DynamicDirective(ObjDirective) {

  constructor(
    // ObjDirective
    private _differs: KeyValueDiffers,
    private _elRef: ElementRef,
    private _renderer: Renderer,
    // this
    _viewContainer: ViewContainerRef,
  ) {
    super();
    // ObjDirective
    this._el = _elRef.nativeElement;
    // DynamicDirective
    this._extra = {};
    // this
    this._context = getContext(_viewContainer);
  }

  private _setItem(name: string, evalStr: string): void {
    let val = evalExpr(this._context, this._extra)(evalStr);
    this._renderer.setElementClass(this._el, name, val);
  }

}

// set local template variables from an object.
@Directive({
  selector: '[assignLocal]',
  inputs: ['localVariable: assignLocal'],
})
export class AssignLocal {
  _el: HTMLElement;
  constructor(
    _viewContainer: ViewContainerRef,
  ) {
    this._context = getContext(_viewContainer);
  }
  set localVariable(obj) {
    _.each((v, k) => {  // mapBoth?
      let context = this._context;
      context[k] = v;
      // Object.assign(context, { [k]: v });
      // _.set(k, v)(context);
      // lodash.set(context, k, v);
      // print('context', context);
    })(obj);
  }
}

// binding to [multiple events](https://github.com/angular/angular/issues/6675)
// https://developer.mozilla.org/en-US/docs/Web/Events
