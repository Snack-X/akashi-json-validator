const chai = require("chai");
const expect = chai.expect;

const { validateJson, validateObject } = require(".");

const expectSuccess = (object, rules, f = validateObject) =>
  expect(f(object, rules)).to.be.true;

const expectFail = (object, rules, arg = Error, f = validateObject) =>
  expect(() => f(object, rules)).to.throw(arg);

describe("JsonValidator", () => {
  describe("#validateJson()", () => {
    it("SHOULD success when input is a valid json", () => {
      expectSuccess("{}", [], validateJson);
      expectSuccess(Buffer.from("{}"), [], validateJson);
    });

    it("SHOULD NOT success when input is NOT a valid json", () => {
      expectFail("invalid json", [], "Bad input", validateJson);
      expectFail(Buffer.from("invalid json"), [], "Bad input", validateJson);
    });

    it("SHOULD NOT success when input is NOT <String|Buffer>", () => {
      expectFail({}, [], "Bad input", validateJson);
      expectFail(1234, [], "Bad input", validateJson);
      expectFail(true, [], "Bad input", validateJson);
      expectFail(null, [], "Bad input", validateJson);
      expectFail(undefined, [], "Bad input", validateJson);
    });

    it("SHOULD NOT success when rule is NOT <Array>", () => {
      expectFail("{}", {}, "Bad argument", validateJson);
      expectFail("{}", true, "Bad argument", validateJson);
    });
  });

  describe("#validateObject()", () => {
    it("SHOULD success when input is <Object>", () => {
      expectSuccess({}, []);
      expectSuccess({ a: 1, b: 2 }, []);
    });

    it("SHOULD NOT success when input is not <Object>", () => {
      expectFail("{}", [], "Bad input");
      expectFail(1234, [], "Bad input");
      expectFail(true, [], "Bad input");
      expectFail([], [], "Bad input");
      expectFail(null, [], "Bad input");
      expectFail(undefined, [], "Bad input");
    });

    it("SHOULD NOT success when rule is not <Array>", () => {
      expectFail({}, {}, "Bad argument");
      expectFail({}, true, "Bad argument");
    });
  });

  describe("- validation rules", () => {
    describe("- required and optional", () => {
      it("SHOULD success when required value is NOT missing", () => {
        expectSuccess({ a: 0       }, [{ key: "a" }              ]);
        expectSuccess({ a: 0, b: 0 }, [{ key: "a" }, { key: "b" }]);
        expectSuccess({ a: ""      }, [{ key: "a" }              ]);
        expectSuccess({ a: false   }, [{ key: "a" }              ]);
      });

      it("SHOULD not success when required value is missing", () => {
        expectFail({      }, [{ key: "a" }              ], "Missing value");
        expectFail({ a: 0 }, [{ key: "b" }              ], "Missing value");
        expectFail({ a: 0 }, [{ key: "a" }, { key: "b" }], "Missing value");
      });

      it("SHOULD success when optional value is missing", () => {
        expectSuccess({            }, [{ key: "a", optional: true }              ]);
        expectSuccess({ a: 0       }, [{ key: "a", optional: true }              ]);
        expectSuccess({ a: 0, b: 0 }, [{ key: "a" }, { key: "b", optional: true }]);
      });
    });

    describe("- type checking", () => {
      it("SHOULD success when type is matching", () => {
        expectSuccess({ a: true }, [{ key: "a", type: "boolean" }]);
        expectSuccess({ a: 3.14 }, [{ key: "a", type: "number"  }]);
        expectSuccess({ a: 3    }, [{ key: "a", type: "number"  }]);
        expectSuccess({ a: 42   }, [{ key: "a", type: "integer" }]);
        expectSuccess({ a: "1"  }, [{ key: "a", type: "string"  }]);
        expectSuccess({ a: []   }, [{ key: "a", type: "array"   }]);
        expectSuccess({ a: {}   }, [{ key: "a", type: "object"  }]);
      });

      it("SHOULD not success when type is NOT matching", () => {
        expectFail({ a: "true" }, [{ key: "a", type: "boolean" }], "Type mismatch");
        expectFail({ a: 3.14   }, [{ key: "a", type: "integer" }], "Type mismatch");
        expectFail({ a: "42"   }, [{ key: "a", type: "number"  }], "Type mismatch");
        expectFail({ a: []     }, [{ key: "a", type: "object"  }], "Type mismatch");
      });
    });

    describe("- equality", () => {
      it("SHOULD success when two value is strictly same using `eq` rule", () => {
        expectSuccess({ a: true }, [{ key: "a", eq: true }]);
        expectSuccess({ a: 1    }, [{ key: "a", eq: 1    }]);
        expectSuccess({ a: ""   }, [{ key: "a", eq: ""   }]);
        expectSuccess({ a: "a"  }, [{ key: "a", eq: "a"  }]);
      });

      it("SHOULD NOT success when two value is NOT strictly same using `eq` rule", () => {
        expectFail({ a: true   }, [{ key: "a", eq: "true" }], "Value mismatch");
        expectFail({ a: true   }, [{ key: "a", eq: 1      }], "Value mismatch");
        expectFail({ a: 1      }, [{ key: "a", eq: "1"    }], "Value mismatch");
        expectFail({ a: 1      }, [{ key: "a", eq: true   }], "Value mismatch");
        expectFail({ a: "true" }, [{ key: "a", eq: true   }], "Value mismatch");
        expectFail({ a: "1"    }, [{ key: "a", eq: 1      }], "Value mismatch");
      });

      it("SHOULD NOT success when two value is strictly same using `neq` rule", () => {
        expectFail({ a: true }, [{ key: "a", neq: true }], "Value match");
        expectFail({ a: 1    }, [{ key: "a", neq: 1    }], "Value match");
        expectFail({ a: ""   }, [{ key: "a", neq: ""   }], "Value match");
        expectFail({ a: "a"  }, [{ key: "a", neq: "a"  }], "Value match");
      });

      it("SHOULD success when two value is strictly same using `eq` lookup", () => {
        expectSuccess({ a: true, b: true }, [{ key: "b", eq: ["a"] }]);
        expectSuccess({ a: 1,    b: 1    }, [{ key: "b", eq: ["a"] }]);
        expectSuccess({ a: "",   b: ""   }, [{ key: "b", eq: ["a"] }]);
        expectSuccess({ a: "a",  b: "a"  }, [{ key: "b", eq: ["a"] }]);
      });

      it("SHOULD NOT success when two value is NOT strictly same using `eq` lookup", () => {
        expectFail({ a: true,   b: "true" }, [{ key: "b", eq: ["a"] }], "Value mismatch");
        expectFail({ a: true,   b: 1      }, [{ key: "b", eq: ["a"] }], "Value mismatch");
        expectFail({ a: 1,      b: "1"    }, [{ key: "b", eq: ["a"] }], "Value mismatch");
        expectFail({ a: 1,      b: true   }, [{ key: "b", eq: ["a"] }], "Value mismatch");
        expectFail({ a: "true", b: true   }, [{ key: "b", eq: ["a"] }], "Value mismatch");
        expectFail({ a: "1",    b: 1      }, [{ key: "b", eq: ["a"] }], "Value mismatch");
      });

      it("SHOULD NOT success when two value is strictly same using `neq` lookup", () => {
        expectFail({ a: true, b: true }, [{ key: "b", neq: ["a"] }], "Value match");
        expectFail({ a: 3.14, b: 3.14 }, [{ key: "b", neq: ["a"] }], "Value match");
        expectFail({ a: 42,   b: 42   }, [{ key: "b", neq: ["a"] }], "Value match");
        expectFail({ a: "",   b: ""   }, [{ key: "b", neq: ["a"] }], "Value match");
        expectFail({ a: "a",  b: "a"  }, [{ key: "b", neq: ["a"] }], "Value match");
      });
    });

    describe("- comparison", () => {
      it("SHOULD success when comparison is true using `gt` rule");
      it("SHOULD NOT success when comparison is NOT true using `gt` rule");

      it("SHOULD success when comparison is true using `gte` rule");
      it("SHOULD NOT success when comparison is NOT true using `gte` rule");

      it("SHOULD success when comparison is true using `lt` rule");
      it("SHOULD NOT success when comparison is NOT true using `lt` rule");

      it("SHOULD success when comparison is true using `lte` rule");
      it("SHOULD NOT success when comparison is NOT true using `lte` rule");

      it("SHOULD success when comparison is true using `gt|gte|lt|lte` lookup");
      it("SHOULD NOT success when comparison is NOT true using `gt|gte|lt|lte` lookup");
    });

    describe("- other", () => {
      it("SHOULD success when value is in between of values using `in` rule");
      it("SHOULD NOT success when value is NOT in between of values using `in` rule");

      it("SHOULD success when value is unique using `unique` rule");
      it("SHOULD NOT success when value is NOT unique using `unique` rule");
    });

    describe("- nested", () => {
      it("SHOULD success when each element of array is valid using `each` rule");
      it("SHOULD NOT success when each element of array is NOT valid using `each` rule");

      it("SHOULD success when each child of object is valid using `child` rule");
      it("SHOULD NOT success when each child of object is NOT valid using `child` rule");

      it("SHOULD correctly handle `$parent` lookup");
    });

    //==========================================================================
    // Comparison
  });
});
