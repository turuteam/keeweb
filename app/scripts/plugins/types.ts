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
