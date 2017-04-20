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

Name of a single object property. This is required for every validation rule.

## `optional` <`Boolean`>

Whether this object property is required, or optional.

By default, every property with a validation rule will be required. Setting `optional` to `false` will not make error if a object property doesn't exist.

## `type` <`String` or `Array`>

One of `"boolean", "number", "integer", "string", "array", "object"`.

`"integer"` is special type to represent a number without fractional part.
`"number"` type will also cover `"integer"` type.

In Javascript, `typeof []` is `"object"`, but in this validator, array has a special type of `"array"`.

By setting `type` to an array of the types above, an object property can be multiple types.

## `eq` <`Boolean`, `Number`, `String`, or `Array`>

## `neq` <`Boolean`, `Number`, `String`, or `Array`>

## `gt` <`Number` or `Array`>

## `gte` <`Number` or `Array`>

## `lt` <`Number` or `Array`>

## `lte` <`Number` or `Array`>

## `in` <`Array`>

## `unique` <`String`>

## `each` <`Object`>

## `child` <`Array`>

## Lookup (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`)
