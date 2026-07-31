function tagTestSuite(registerSuite, defaultTag) {
  return (spec) => {
    const describe = spec.describe.bind(spec);

    spec.describe = (label, defineTests) =>
      describe(label, defineTests, defaultTag);

    return registerSuite(spec);
  };
}

module.exports = { tagTestSuite };
