function tagTestSuite(registerSuite, defaultTag) {
  return (spec) => {
    const taggedSpec = Object.create(spec);

    taggedSpec.describe = (label, defineTests, tag = defaultTag) =>
      spec.describe(label, defineTests, tag);
    taggedSpec.it = (label, test, tag = defaultTag) =>
      spec.it(label, test, tag);

    return registerSuite(taggedSpec);
  };
}

module.exports = { tagTestSuite };
