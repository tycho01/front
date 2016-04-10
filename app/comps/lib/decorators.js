import { decorate } from 'core-decorators/lib/private/utils';  //, metaFor

let decMethod = (
  k = 'value',
  wrapper = (fn) => fn.bind(this, ...arguments),
) => (target, key, descriptor, pars) => {
  const fn = descriptor.value;
  if (typeof fn !== 'function') {
    throw new SyntaxError(`can only decorate methods, while ${key} is a ${typeof fn}!`);
  }
  return {
    ...descriptor,
    [k]: wrapper(fn, pars),
  };
}

// 'cast' a function such that in case it receives a bad (non-conformant)
// value for input, it will return a default value of its output type
// intercepts bad input values for a function so as to return a default output value
// ... this might hurt when switching to like Immutable.js though.
export let typed = (...args) => decorate(decMethod('value', (fn, [from, to]) => function() {
  for (var i = 0; i < from.length; i++) {
    let frm = from[i];
    let v = arguments[i];
    if(frm && (_.isUndefined(v) || _.isNull(v) || v.constructor != frm)) return (new to).valueOf();
  }
  return fn.call(this, ...arguments);
}), args);

// simpler guard, just a try-catch wrapper with default value
export let fallback = (...args) => decorate(decMethod('value', (fn, [def]) => function() {
  try {
    return fn.call(this, ...arguments);
  }
  catch(e) {
    console.log('an error occurred, falling back to default value:', e);
    return def;
  }
}), args);

// just log errors. only useful in contexts with silent crash.
export let try_log = (...args) => decorate(decMethod('value', (fn, []) => function() {
  try {
    return fn.call(this, ...arguments);
  }
  catch(e) {
    console.log('try_log error:', e);
  }
}), args);

// wrapper for setter methods, return if not all parameters are defined
export let combine = (...args) => decorate(decMethod('value', (fn, [allow_undef = {}]) => function() {
  // let names = /([^\(]+)(?=\))'/.exec(fn.toString()).split(',').slice(1);
  let names = fn.toString().split('(')[1].split(')')[0].split(/[,\s]+/);
  for (var i = 0; i < arguments.length; i++) {
    let v = arguments[i];
    let name = names[i]
      .replace(/_\d+$/, '')   // fixes SweetJS suffixing all names with like _123. this will however break functions already named .*_\d+, e.g. foo_123
      // do not minify the code while uing this function, it will break -- functions wrapped in combine will no longer trigger.
    if(_.isUndefined(v) && !allow_undef[name]) return; // || _.isNull(v)
  }
  fn.call(this, ...arguments);  //return
}), args);

export let getter = (...args) => decorate(decMethod('get'), args);

export let setter = (...args) => decorate(decMethod('set'), args);
