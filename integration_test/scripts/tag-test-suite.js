function tagTestSuite(registerSuite, defaultTag) {
  return (spec) => {
    const describe = spec.describe.bind(spec);
    const it = spec.it.bind(spec);

    spec.describe = (label, defineTests, tag = defaultTag) =>
      describe(label, defineTests, tag);
    spec.it = (label, test, tag = defaultTag) => it(label, test, tag);

    return registerSuite(spec);
  };
}

module.exports = { tagTestSuite };
