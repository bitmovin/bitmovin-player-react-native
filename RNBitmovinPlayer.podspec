require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNBitmovinPlayer"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "14.0", :tvos => "14.0" }
  s.source       = {
    :git => "https://github.com/bitmovin/bitmovin-player-react-native.git",
    :tag => "v#{s.version}"
  }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.swift_version = "5.10"
  s.dependency "React-Core"
  s.dependency "BitmovinPlayer", "3.75.0"
  s.ios.dependency "GoogleAds-IMA-iOS-SDK", "3.23.0"
  s.tvos.dependency "GoogleAds-IMA-tvOS-SDK", "4.13.0"
end
