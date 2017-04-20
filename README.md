# JSON Validator

Yet another stupid JSON/Object validator.

Made for Akashi project to validate project/pattern files.

# Usage

## `JsonValidator.validateJson(input, rules)`
* `input` <`String` or `Buffer`> JSON string, or buffer of JSON
  Input JSON should be an object.
* `rules` <`Array`> Validation rules

# Validation Rule

`rules` parameter will accept an array of validation rules.

One validation rule will validate one object property.
One validation rule can have following properties:

## `key` <`String`> - **REQUIRED**

Name of a single object property. This is **required** for every validation rule.

## `optional` <`Boolean`>

Whether this object property is required, or optional.

By default, every property with a validation rule will be required. Setting `optional` to `false` will not make error if a object property doesn't exist.

## `type` <`String` or `Array`>

One of `"boolean", "number", "integer", "string", "array", "object"`.

`integer` is special type to represent a number without fractional part.
`number` type will also cover `integer` type.

In Javascript, `typeof []` is `"object"`, but in this validator, array has a special type of `array`.

By setting `type` to an array of the types above, an object property can be multiple types.

## `eq` <`Boolean`, `Number`, `String`, or `Array`>
## `neq` <`Boolean`, `Number`, `String`, or `Array`>

Setting `eq` or `neq` to a `Boolean`, `Number`, `String` type will test whether object property's value (does not) equals to the specified value.

By setting `eq` or `neq` to an array, it will look up for the expected value.

## `gt` <`Number` or `Array`>
## `gte` <`Number` or `Array`>
## `lt` <`Number` or `Array`>
## `lte` <`Number` or `Array`>

Setting `gt`, `gte`, `lt`, or `lte` to a `Number` type will test whether object property's value is greater/lesser than (or equals to) the specified value.

By setting `gt`, `gte`, `lt`, or `lte` to an array, it will look up for the comparison value.

## `in` <`Array`>

Check for the object property value type strictly equals to the one of given array.

## `unique` <`String`>

Check for the object property value is unique for the given scope.

## `each` <`Object`>

Test each element of an array by given validation rule.

Validation rule can have any property from above or below, but `key` property won't have any meaning, since element of array don't have a key.

## `child` <`Array`>

Test each property of an object by given validation rules.

## Lookup (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`)

By setting some property to an array, it can get another property's value to test.

### Lookup Examples

* `eq: ["a"]` : Get the value of property `a` at the same scope, and check for the equality.
* `eq: ["a", "b"]` : Get the value of property `a.b` at the same scope, and check for the equality. (`a` should be an `Object` at here)
* `eq: ["a", 0]` : Get the value of property `a[0]` at the same scope, and check for the equality. (`a` should be an `Array` at here)
* `eq: ["$parent", "a"]` : Get the value of property `b` at the parent scope, and check for the equality.
