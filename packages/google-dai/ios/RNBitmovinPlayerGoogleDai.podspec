require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'RNBitmovinPlayerGoogleDai'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.swift_version  = '5.10'
  s.source         = {
    git: 'https://github.com/bitmovin/bitmovin-player-react-native-integrations-google-dai',
    tag: "v#{s.version}"
  }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'RNBitmovinPlayer'
  s.dependency 'BitmovinPlayer', '3.117.0'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
