export interface PluginManifestAuthor {
    name: string;
    email: string;
    url: string;
}

export interface PluginManifestResources {
    loc?: string;
    css?: string;
    js?: string;
}

export interface PluginManifestLocale {
    name: string;
    title: string;
    flag?: string;
}

export interface PluginManifestTheme {
    name: string;
    title: string;
}

export interface PluginManifest {
    version: string;
    manifestVersion: string;
    name: string;
    description: string;
    author: PluginManifestAuthor;
    license: string;
    url: string;
    resources: PluginManifestResources;
    publicKey: string;
    locale?: PluginManifestLocale;
    theme?: PluginManifestTheme;
    desktop?: boolean;
    versionMin?: string;
    versionMax?: string;
}

export interface PluginGalleryPlugin {
    url: string;
    official: boolean;
    manifest: PluginManifest;
}

export interface PluginGalleryData {
    date: string;
    signature: string;
    plugins: PluginGalleryPlugin[];
}

export interface PluginSettingOption {
    value: string;
    label: string;
}

export interface PluginSetting {
    name: string;
    label: string;
    type: 'text' | 'select' | 'checkbox';
    value?: string | boolean;
    placeholder?: string;
    maxlength?: string;
    options?: PluginSettingOption[];
}

export interface StoredPlugin {
    manifest: PluginManifest;
    url: string;
    enabled: boolean;
    autoUpdate: boolean;
}

export interface StoredPlugins {
    autoUpdateAppVersion?: string;
    autoUpdateDate?: string | number;
    plugins?: StoredPlugin[];
}
