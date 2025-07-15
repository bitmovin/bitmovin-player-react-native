import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { DrmConfig } from './index';

export type DrmModuleEvents = {
  onPrepareCertificate: ({
    nativeId,
    certificate,
  }: {
    nativeId: string;
    certificate: string;
  }) => void;
  onPrepareMessage: ({
    nativeId,
    data,
    message,
    assetId,
  }: {
    nativeId: string;
    data?: string;
    message?: string;
    assetId?: string;
  }) => void;
  onPrepareSyncMessage: ({
    nativeId,
    syncMessage,
    assetId,
  }: {
    nativeId: string;
    syncMessage: string;
    assetId: string;
  }) => void;
  onPrepareLicense: ({
    nativeId,
    data,
    license,
  }: {
    nativeId: string;
    data?: string;
    license?: string;
  }) => void;
  onPrepareLicenseServerUrl: ({
    nativeId,
    licenseServerUrl,
  }: {
    nativeId: string;
    licenseServerUrl: string;
  }) => void;
  onPrepareContentId: ({
    nativeId,
    contentId,
  }: {
    nativeId: string;
    contentId: string;
  }) => void;
};

/**
 * Native DrmModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class DrmModule extends NativeModule<DrmModuleEvents> {
  initializeWithConfig(nativeId: string, config: DrmConfig): Promise<void>;
  destroy(nativeId: string): Promise<void>;
  setPreparedCertificate(nativeId: string, certificate: string): any;
  setPreparedMessage(nativeId: string, message?: string): any;
  setPreparedSyncMessage(nativeId: string, syncMessage?: string): any;
  setPreparedLicense(nativeId: string, license?: string): any;
  setPreparedLicenseServerUrl(nativeId: string, url?: string): any;
  setPreparedContentId(nativeId: string, contentId?: string): any;
}

export default requireNativeModule<DrmModule>('DrmModule');
