require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNBitmovinPlayer"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "12.4", :tvos => "12.4" }
  s.source       = {
    :git => "https://github.com/bitmovin/bitmovin-player-react-native.git",
    :tag => "v#{s.version}"
  }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "React-Core"
  s.dependency "BitmovinPlayer", "3.36.0"
  s.dependency "BitmovinAnalyticsCollector/Core", "2.9.4"
  s.dependency "BitmovinAnalyticsCollector/BitmovinPlayer", "2.9.4"
  s.ios.dependency "GoogleAds-IMA-iOS-SDK", "3.17.0"
  s.tvos.dependency "GoogleAds-IMA-tvOS-SDK", "4.6.1"
end
