require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
podfile_properties = JSON.parse(File.read("#{Pod::Config.instance.installation_root}/Podfile.properties.json")) rescue {}

new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'
new_arch_compiler_flags = '-DRCT_NEW_ARCH_ENABLED'
compiler_flags = ''

if new_arch_enabled
  compiler_flags << ' ' << new_arch_compiler_flags
end

Pod::Spec.new do |s|
  s.name           = 'RNBitmovinPlayer'
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
  s.source         = { git: 'https://github.com/bitmovin/bitmovin-player-react-native', :tag => "v#{s.version}" }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency "BitmovinPlayer", "3.97.0"
  s.ios.dependency "GoogleAds-IMA-iOS-SDK", "3.26.1"
  s.tvos.dependency "GoogleAds-IMA-tvOS-SDK", "4.15.1"

  if podfile_properties['BITMOVIN_GOOGLE_CAST_SDK_VERSION'].to_s != ''
    s.ios.dependency "google-cast-sdk", podfile_properties['BITMOVIN_GOOGLE_CAST_SDK_VERSION'].to_s
  end

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_SWIFT_FLAGS' => "$(inherited) #{new_arch_enabled ? new_arch_compiler_flags : ''}",
  }
  s.compiler_flags = compiler_flags

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
