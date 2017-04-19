//==============================================================================
// Internal functions

function _lookup(lookupPath, data) {
  let v = data;

  for(let k of lookupPath) {
    if(k in v) v = v[k];
    else throw `lookup fail: ${lookupPath.join("->")} does not exist`;
  }

  return v;
}

function _validateObject(object, rules, key, valueContext) {
  for(let rule of rules) {
    const value = object[rule.key];

    const context = Object.assign({}, valueContext);
    if(rule.key in context) delete context[rule.key];

    _validateValue.call(this, value, rule, key + rule.key, context, rule.key);
  }

  return true;
}

function _validateValue(value, rule, key, valueContext, parentKey) {
  const parent = Object.assign({}, valueContext);
  const context = Object.assign({}, value);
  delete parent[parentKey];
  context.$parent = parent;

  //============================================================================
  // Optional and required

  if(rule.optional && !value) return;

  // == is intended to check both null and undefined
  if(value == null)
    throw `Missing value - ${key} is required`;

  //============================================================================
  // Type

  if("type" in rule) {
    if(rule.type === "array") {
      if(!Array.isArray(value)) {
        throw `Type mismatch - ${key} is not array, but ${typeof value}`;
      }
    }
    else if(rule.type === "object") {
      if(Array.isArray(value)) {
        throw `Type mismatch - ${key} is not object, but array`;
      }
    }
    else if(rule.type === "integer") {
      if(typeof value !== "number" || !Number.isInteger(value)) {
        throw `Type mismatch - ${key} is not integer, but ${typeof value}`;
      }
    }
    else if(typeof value !== rule.type) {
      throw `Type mismatch - ${key} is not ${rule.type}, but ${typeof value}`;
    }
  }

  //============================================================================
  // Equality

  const eqValidType = ["boolean", "number", "string"];

  if("eq" in rule && eqValidType.includes(typeof value)) {
    const expected = Array.isArray(rule.eq) ? _lookup(rule.eq, valueContext) : rule.eq;
    const actual = value;

    if(eqValidType.includes(typeof expected) && expected !== actual) {
      let errMsg = `Value mismatch - ${key} should be ${JSON.stringify(expected)}, but ${JSON.stringify(actual)} was found`;
      if(Array.isArray(rule.eq)) errMsg += ` from ${rule.eq.join("->")}`;

      throw errMsg;
    }
  }

  if("neq" in rule && eqValidType.includes(typeof value)) {
    const expected = Array.isArray(rule.neq) ? _lookup(rule.neq, valueContext) : rule.neq;
    const actual = value;

    if(eqValidType.includes(typeof expected) && expected === actual) {
      let errMsg = `Value match - ${key} should not be ${JSON.stringify(expected)}, but ${JSON.stringify(actual)} was found`;
      if(Array.isArray(rule.neq)) errMsg += ` from ${rule.neq.join("->")}`;

      throw errMsg;
    }
  }

  //============================================================================
  // Comparison

  if("gt" in rule && typeof value === "number") {
    const compare = Array.isArray(rule.gt) ? _lookup(rule.gt, valueContext) : rule.gt;

    if(typeof compare === "number" && value <= compare) {
      let errMsg = `${key} is invalid: ${value} should be greater than ${compare}`;
      if(Array.isArray(rule.gt)) errMsg += ` (from ${rule.gt.join("->")})`;

      throw errMsg;
    }
  }

  if("gte" in rule && typeof value === "number") {
    const compare = Array.isArray(rule.gte) ? _lookup(rule.gte, valueContext) : rule.gte;

    if(typeof compare === "number" && value < compare) {
      let errMsg = `${key} is invalid: ${value} should be greater than or equal to ${compare}`;
      if(Array.isArray(rule.gte)) errMsg += ` (from ${rule.gte.join("->")})`;

      throw errMsg;
    }
  }

  if("lt" in rule && typeof value === "number") {
    const compare = Array.isArray(rule.lt) ? _lookup(rule.lt, valueContext) : rule.lt;

    if(typeof compare === "number" && value >= compare) {
      let errMsg = `${key} is invalid: ${value} should be lesser than ${compare}`;
      if(Array.isArray(rule.lt)) errMsg += ` (from ${rule.lt.join("->")})`;

      throw errMsg;
    }
  }

  if("lte" in rule && typeof value === "number") {
    const compare = Array.isArray(rule.lte) ? _lookup(rule.lte, valueContext) : rule.lte;

    if(typeof compare === "number" && value > compare) {
      let errMsg = `${key} is invalid: ${value} should be lesser than or equal to ${compare}`;
      if(Array.isArray(rule.lte)) errMsg += ` (from ${rule.lte.join("->")})`;

      throw errMsg;
    }
  }

  //============================================================================
  // One of these

  if("in" in rule && !rule.in.includes(value)) {
    throw `${key} is invalid: ${value} should be one of ( ${rule.in.map(v => JSON.stringify(v)).join(" | ")} )`;
  }

  //============================================================================
  // Unique

  if("unique" in rule) {
    if(!this.unique[rule.unique]) this.unique[rule.unique] = new Set();
    if(this.unique[rule.unique].has(value)) {
      throw `${key} is invalid: ${value} should be unique for ${rule.unique}`;
    }
    else {
      this.unique[rule.unique].add(value);
    }
  }

  //============================================================================
  // Array each

  if("each" in rule && Array.isArray(value)) {
    value.forEach((v, i) => {
      _

      validateValue.call(this, v, rule.each, `${key}[${i}]`, context, parentKey)
    });
  }

  //============================================================================
  // Object child

  if("child" in rule && typeof value === "object") {
    _validateObject.call(this, value, rule.child, key + "->", context);
  }

  return true;
}

//==============================================================================
// Exported functions

function validateJson(input, rules = []) {
  // Check arguments
  if(!Array.isArray(rules)) throw "Bad argument - rules should be an array";

  let json;
  if(Buffer.isBuffer(input)) json = input.toString("utf8");
  else if(typeof input === "string") json = input;
  else throw "Bad input - input should be one of String, or Buffer";

  // Parse JSON input
  let object;
  try { object = JSON.parse(json); }
  catch(e) { throw "Bad input - input is not a valid JSON"; }

  // Validate
  return validateObject(object, rules);
}

function validateObject(input, rules = []) {
  // Check arguments
  if(!Array.isArray(rules)) throw "Bad argument - rules should be an array";

  if(input === null || typeof input !== "object") throw "Bad input - input should be an object";
  if(Array.isArray(input)) throw "Bad input - input should be an object, not an array";

  // Validate
  // Uniqueness context
  let context = { unique: {} };
  return _validateObject.call(context, input, rules, "", input);
}

module.exports = { validateJson, validateObject };
