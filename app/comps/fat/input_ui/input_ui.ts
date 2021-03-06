let _ = require('lodash/fp');
let map_iterator = require('map-iterator');
import { Input, Output, EventEmitter, ViewChild, forwardRef } from '@angular/core';
import { arr2obj, ng2comp, combine, methodPars, extractIterables, parameterizeStructure, cartesian, toQuery } from '../../lib/js';
import { FormComp } from '../..';
import { BaseComp } from '../../base_comp';
import { ExtComp } from '../../lib/annotations';

@ExtComp({
  selector: 'input-ui',
  template: `<input-form [schema]="pars" [desc]="desc" (submit)="submit($event)"></input-form>`,
  directives: [
    // FormComp,
    forwardRef(() => FormComp),
  ],
})
export class InputUiComp extends BaseComp {
  @Output() handler = new EventEmitter(false);
  @Input() spec: Front.ApiSpec;
  @Input() fn_path: Front.FnPath;
  @Input() token: string;
  _spec: Front.ApiSpec;
  _fn_path: Front.FnPath;
  _token: string;
  @ViewChild(forwardRef(() => FormComp)) form: FormComp;
  desc = '';
  pars: Front.IPathSchema[];

  get spec(): Front.ApiSpec {
    return this._spec;
  }
  set spec(x: Front.ApiSpec) {
    if(_.isUndefined(x)) return;
    this._spec = x;
    this.combInputs();
  }

  get fn_path(): Front.FnPath {
    return this._fn_path;
  }
  set fn_path(x: Front.FnPath) {
    if(_.isUndefined(x)) return;
    this._fn_path = x;
    this.combInputs();
  }

  // combInputs = () => combine((spec: Front.ApiSpec, fn_path: Front.FnPath) => {
  combInputs(): void {
    let { spec, fn_path } = this;
    if([spec, fn_path].some(_.isNil)) return;
    // let { pars: this.pars, desc: this.desc } = methodPars(spec, fn_path);
    let obj = methodPars(spec, fn_path, true);
    this.pars = obj.pars;
    this.desc = obj.desc || '';
  // })(this.spec, this.fn_path);
  }

  // submit param inputs for an API function
  submit(form_val: {}): void {
    if(form_val instanceof Event) return;
    // why is the EventEmitter first yielding an Event?
    let reqMetas; //= [];
    let coll = extractIterables(form_val);
    if(_.size(coll)) {
      let fn = parameterizeStructure(form_val, coll);
      let iterables = coll.map(([path, arr]) => arr);
      let cp = cartesian(...iterables);
      let combinations = map_iterator(cp, pars => fn(...pars));
      // for (let comb in combinations) {
      //   reqMetas.push(this.request(comb);
      // }
      reqMetas = Array.from(map_iterator(combinations, comb => this.makeMeta(comb)));
    } else {
      reqMetas = [this.makeMeta(form_val)];
    }
    this.handler.emit(reqMetas);
  }

  makeMeta(form_val: {}): Front.ReqMeta {
    let kind_map = _.mapValues(y => y.in)(this.pars.properties);
    // let spec = this.spec;
    // Swagger
    // let { host, basePath } = spec;  //, schemes
    // let base = `{uri_scheme}://${host}${basePath}`;  //${spec.schemes}
    // OpenAPI
    let host = this.spec.hosts[0];
    let { host: domain, basePath, scheme } = host;
    let base = `${scheme}://${domain}${basePath}`;
    base = base.replace(/\/$/, '');
    let [p_path, p_query, p_header, p_form, p_body] = ['path', 'query', 'header', 'form', 'body'].map(x => {
      let good_keys = _.keys(_.pickBy(y => y == x)(kind_map));
      return arr2obj(good_keys, k => form_val[k]);
    });
    let fold_fn = (acc, v, idx, arr) => acc.replace(`{${v}}`, p_path[v]);
    let query = _.assign({ access_token: this.token }, p_query);
    // alt: header { Authorization: `token ${this.token}` }
    let [endpoint, method] = this.fn_path;
    let url = _.keys(p_path).reduce(fold_fn, `${base}${endpoint}`)
        + (_.size(query) ? '?' + toQuery(query) : '');
    // this.handler.emit(url);
    let body_keys = _.keys(p_body);
    if(body_keys.length > 1) throw "cannot have multiple body params!";
    let body = body_keys.length ?
        p_body[body_keys[0]] :
        _.join('&')(_.toPairs(p_form).map(_.join('=')));
    // if(_.size(p_form) && _.any(x => p_header['Content-Type'].includes(x))
    //   (['application/x-www-form-urlencoded', 'multipart/form-data']))
    //     throw "consider adding a form-appropriate header!";
    return { urls: url, headers: p_header, method, body };

    //case 'form':
      // post payload (mutex with body)
      // application/x-www-form-urlencoded: foo=1&bar=swagger
      // multipart/form-data: `Content-Disposition: form-data; name="submit-name"`
    //case 'body':
      // post payload (mutex with form)
      // handle by schema instead of type
  };

}
