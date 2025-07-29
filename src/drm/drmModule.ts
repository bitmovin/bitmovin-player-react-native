import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { DrmConfig } from './index';

export type DrmModuleEvents = {
  onPrepareCertificate: ({
    nativeId,
    id,
    certificate,
  }: {
    nativeId: string;
    id: string;
    certificate: string;
  }) => void;
  onPrepareMessage: ({
    nativeId,
    id,
    data,
    message,
    assetId,
  }: {
    nativeId: string;
    id: string;
    data?: string;
    message?: string;
    assetId?: string;
  }) => void;
  onPrepareSyncMessage: ({
    nativeId,
    id,
    syncMessage,
    assetId,
  }: {
    nativeId: string;
    id: string;
    syncMessage: string;
    assetId: string;
  }) => void;
  onPrepareLicense: ({
    nativeId,
    id,
    data,
    license,
  }: {
    nativeId: string;
    id: string;
    data?: string;
    license?: string;
  }) => void;
  onPrepareLicenseServerUrl: ({
    nativeId,
    id,
    licenseServerUrl,
  }: {
    nativeId: string;
    id: string;
    licenseServerUrl: string;
  }) => void;
  onPrepareContentId: ({
    nativeId,
    id,
    contentId,
  }: {
    nativeId: string;
    id: string;
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
  setPreparedCertificate(id: string, certificate: string): any;
  setPreparedMessage(id: string, message?: string): any;
  setPreparedSyncMessage(id: string, syncMessage?: string): any;
  setPreparedLicense(id: string, license?: string): any;
  setPreparedLicenseServerUrl(id: string, url?: string): any;
  setPreparedContentId(id: string, contentId?: string): any;
}

export default requireNativeModule<DrmModule>('DrmModule');
