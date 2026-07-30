function tagTestSuite(registerSuite, defaultTag) {
  return (spec) => {
    const describe = spec.describe.bind(spec);

    spec.describe = (label, defineTests, tag = defaultTag) =>
      describe(label, defineTests, tag);

    return registerSuite(spec);
  };
}

module.exports = { tagTestSuite };
