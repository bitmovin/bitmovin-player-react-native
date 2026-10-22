require 'json'
require 'tmpdir'

class FakePlatform
  def dependency(*) end
end

module Pod
  class Config
    class << self
      attr_accessor :installation_root

      def instance
        self
      end
    end
  end

  class Spec
    attr_reader :ios, :tvos

    def self.new
      spec = allocate
      spec.send(:initialize)
      yield spec
      spec
    end

    def initialize
      @attributes = {}
      @ios = FakePlatform.new
      @tvos = FakePlatform.new
    end

    def dependency(*) end

    def method_missing(name, *arguments)
      if name.to_s.end_with?('=')
        return @attributes[name.to_s.delete_suffix('=').to_sym] = arguments.first
      end
      return @attributes[name] if @attributes.key?(name)

      super
    end

    def respond_to_missing?(name, include_private = false)
      name.to_s.end_with?('=') || @attributes.key?(name) || super
    end
  end
end

def spm_dependency(_spec, **dependency)
  $spm_dependencies << dependency
end

def assert_equal(expected, actual, message)
  return if expected == actual

  raise "#{message}\nExpected: #{expected.inspect}\nActual: #{actual.inspect}"
end

root = File.expand_path('..', __dir__)
podspec = File.join(root, 'ios', 'RNBitmovinPlayer.podspec')
dependencies = JSON.parse(File.read(File.join(root, 'ios', 'dependencies.json')))

%w[ios tvos].product([false, true]).each do |platform, google_ima|
  Dir.mktmpdir do |directory|
    properties = {
      'BITMOVIN_APPLE_PLATFORM' => platform,
      'BITMOVIN_ENABLE_GOOGLE_IMA' => google_ima.to_s,
    }
    File.write(
      File.join(directory, 'Podfile.properties.json'),
      JSON.generate(properties)
    )
    Pod::Config.installation_root = directory
    $spm_dependencies = []

    load podspec

    expected = [dependencies.fetch('player')]
    expected << dependencies.fetch('ima').fetch(platform) if google_ima
    actual = $spm_dependencies.map do |dependency|
      {
        'url' => dependency.fetch(:url),
        'version' => dependency.fetch(:requirement).fetch(:version),
        'product' => dependency.fetch(:products).fetch(0),
      }
    end
    assert_equal(
      expected,
      actual,
      "Unexpected SPM dependencies for #{platform} with googleIMA=#{google_ima}"
    )
  end
end

def load_podspec_with_google_ima(podspec, value)
  Dir.mktmpdir do |directory|
    File.write(
      File.join(directory, 'Podfile.properties.json'),
      JSON.generate('BITMOVIN_APPLE_PLATFORM' => 'ios', 'BITMOVIN_ENABLE_GOOGLE_IMA' => value)
    )
    Pod::Config.installation_root = directory
    $spm_dependencies = []
    load podspec
    $spm_dependencies.length
  end
end

assert_equal(2, load_podspec_with_google_ima(podspec, ' True '), 'Expected a padded, capitalized true to enable Google IMA')

begin
  load_podspec_with_google_ima(podspec, 'yes')
  raise 'Expected an invalid BITMOVIN_ENABLE_GOOGLE_IMA value to fail'
rescue RuntimeError => error
  raise error unless error.message.include?('must be true or false')
end

puts 'PASS RNBitmovinPlayer podspec selects optional Google IMA dependencies'

