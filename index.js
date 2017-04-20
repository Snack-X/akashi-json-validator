//==============================================================================
// Internal functions

function _lookup(lookupPath, data) {
  let v = data, key;

  for(let k of lookupPath) {
    if(!key) key = k;
    else if(Array.isArray(v)) key += `[${k}]`;
    else key += `->${k}`;

    if(k in v) v = v[k];
    else throw `Invalid lookup - ${key} does not exist`;
  }

  return { value: v, key: key };
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

  let valueType;

  //============================================================================
  // Optional and required

  // == is intended to check both null and undefined
  if(rule.optional && value == null) return;
  if(value == null)
    throw `Missing value - ${key} is required`;

  //============================================================================
  // Type

  if(Array.isArray(value)) valueType = "array";
  else if(typeof value === "number" && Number.isInteger(value)) valueType = "integer";
  else valueType = typeof value;

  if("type" in rule) {
    if(typeof rule.type === "string") {
      if(rule.type !== valueType && !(rule.type === "number" && valueType === "integer")) {
        throw `Type mismatch - ${key} is not ${rule.type}, but ${valueType}`;
      }
    }
    else if(Array.isArray(rule.type)) {
      if(!rule.type.includes(valueType) && !(!rule.type.includes("integer") && rule.type.includes("number") && valueType === "integer")) {
        throw `Type mismatch - ${key} is not ${rule.type.join("|")}, but ${valueType}`;
      }
    }
  }

  //============================================================================
  // Equality

  const eqValidType = ["boolean", "number", "string"];

  if("eq" in rule && eqValidType.includes(typeof value)) {
    let lookup, expected = rule.eq;
    const actual = value;

    if(Array.isArray(expected)) {
      lookup = _lookup(expected, valueContext);
      expected = lookup.value;
    }

    if(eqValidType.includes(typeof expected) && expected !== actual) {
      let errMsg = `Value mismatch - ${JSON.stringify(actual)} (from ${key}) should be ${JSON.stringify(expected)}`;
      if(Array.isArray(rule.eq)) errMsg += ` (from ${lookup.key})`;

      throw errMsg;
    }
  }

  if("neq" in rule && eqValidType.includes(typeof value)) {
    let lookup, expected = rule.neq;
    const actual = value;

    if(Array.isArray(expected)) {
      lookup = _lookup(expected, valueContext);
      expected = lookup.value;
    }

    if(eqValidType.includes(typeof expected) && expected === actual) {
      let errMsg = `Value match - ${JSON.stringify(actual)} (from ${key}) should not be ${JSON.stringify(expected)}`;
      if(Array.isArray(rule.neq)) errMsg += ` (from ${lookup.key})`;

      throw errMsg;
    }
  }

  //============================================================================
  // Comparison

  if("gt" in rule && typeof value === "number") {
    let lookup, compare = rule.gt;

    if(Array.isArray(compare)) {
      lookup = _lookup(compare, valueContext);
      compare = lookup.value;
    }

    if(typeof compare === "number" && value <= compare) {
      let errMsg = `Comparison fail - ${value} (from ${key}) should be greater than ${compare}`;
      if(Array.isArray(rule.gt)) errMsg += ` (from ${lookup.key})`;

      throw errMsg;
    }
  }

  if("gte" in rule && typeof value === "number") {
    let lookup, compare = rule.gte;

    if(Array.isArray(compare)) {
      lookup = _lookup(compare, valueContext);
      compare = lookup.value;
    }

    if(typeof compare === "number" && value < compare) {
      let errMsg = `Comparison fail - ${value} (from ${key}) should be greater than or equal to ${compare}`;
      if(Array.isArray(rule.gte)) errMsg += ` (from ${lookup.key})`;

      throw errMsg;
    }
  }

  if("lt" in rule && typeof value === "number") {
    let lookup, compare = rule.lt;

    if(Array.isArray(compare)) {
      lookup = _lookup(compare, valueContext);
      compare = lookup.value;
    }

    if(typeof compare === "number" && value >= compare) {
      let errMsg = `Comparison fail - ${value} (from ${key}) should be lesser than ${compare}`;
      if(Array.isArray(rule.lt)) errMsg += ` (from ${lookup.key})`;

      throw errMsg;
    }
  }

  if("lte" in rule && typeof value === "number") {
    let lookup, compare = rule.lte;

    if(Array.isArray(compare)) {
      lookup = _lookup(compare, valueContext);
      compare = lookup.value;
    }

    if(typeof compare === "number" && value > compare) {
      let errMsg = `Comparison fail - ${value} (from ${key}) should be lesser than or equal to ${compare}`;
      if(Array.isArray(rule.lte)) errMsg += ` (from ${lookup.key})`;

      throw errMsg;
    }
  }

  //============================================================================
  // One of these

  if("in" in rule && !rule.in.includes(value)) {
    throw `Unexpected value: ${JSON.stringify(value)} (from ${key}) should be one of following: ${rule.in.map(v => JSON.stringify(v)).join(", ")}`;
  }

  //============================================================================
  // Unique

  if("unique" in rule) {
    if(!this.unique[rule.unique]) this.unique[rule.unique] = new Set();
    if(this.unique[rule.unique].has(value)) {
      throw `Duplicated value: ${JSON.stringify(value)} (from ${key}) should be unique as ${rule.unique}`;
    }
    else {
      this.unique[rule.unique].add(value);
    }
  }

  //============================================================================
  // Array each

  if("each" in rule && Array.isArray(value)) {
    value.forEach((v, i) => {
      _validateValue.call(this, v, rule.each, `${key}[${i}]`, context, parentKey)
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
