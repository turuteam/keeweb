import * as kdbxweb from 'kdbxweb';
import { Model } from 'util/model';
import { unreachable } from 'util/fn';

class Attachment extends Model {
    title: string;
    data: kdbxweb.KdbxBinary | kdbxweb.KdbxBinaryWithHash;
    ext?: string;
    icon?: string;
    mimeType?: string;

    constructor(title: string, data: kdbxweb.KdbxBinary | kdbxweb.KdbxBinaryWithHash) {
        super();

        this.title = title;
        this.data = data;

        this.ext = Attachment.getExtension(title);
        this.icon = Attachment.getIcon(this.ext);
        this.mimeType = Attachment.getMimeType(this.ext);
    }

    getBinary(): Uint8Array {
        let value: kdbxweb.KdbxBinary;
        if (kdbxweb.KdbxBinaries.isKdbxBinaryWithHash(this.data)) {
            value = this.data.value;
        } else {
            value = this.data;
        }

        if (value instanceof kdbxweb.ProtectedValue) {
            return value.getBinary();
        } else if (value instanceof ArrayBuffer) {
            return new Uint8Array(value);
        } else {
            unreachable('Bad attachment', value);
        }
    }

    private static getExtension(fileName: string): string | undefined {
        return fileName?.split('.')?.pop()?.toLowerCase();
    }

    private static getIcon(ext: string | undefined): string {
        switch (ext) {
            case 'txt':
            case 'log':
            case 'rtf':
            case 'pem':
                return 'file-alt';
            case 'html':
            case 'htm':
            case 'js':
            case 'css':
            case 'xml':
            case 'config':
            case 'json':
            case 'yaml':
            case 'cpp':
            case 'c':
            case 'h':
            case 'cc':
            case 'hpp':
            case 'mm':
            case 'cs':
            case 'php':
            case 'sh':
            case 'py':
            case 'java':
            case 'rb':
            case 'cfg':
            case 'properties':
            case 'yml':
            case 'asm':
            case 'bat':
                return 'file-code';
            case 'pdf':
                return 'file-pdf';
            case 'zip':
            case 'rar':
            case 'bz':
            case 'bz2':
            case '7z':
            case 'gzip':
            case 'gz':
            case 'tar':
            case 'cab':
            case 'ace':
            case 'dmg':
            case 'jar':
                return 'file-archive';
            case 'doc':
            case 'docx':
                return 'file-word';
            case 'xls':
            case 'xlsx':
                return 'file-excel';
            case 'ppt':
            case 'pptx':
                return 'file-powerpoint';
            case 'jpeg':
            case 'jpg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'tiff':
            case 'svg':
            case 'ico':
            case 'psd':
                return 'file-image';
            case 'avi':
            case 'mp4':
            case '3gp':
            case 'm4v':
            case 'mov':
            case 'mpeg':
            case 'mpg':
            case 'mpe':
                return 'file-video';
            case 'mp3':
            case 'wav':
            case 'flac':
                return 'file-audio';
        }
        return 'file';
    }

    private static getMimeType(ext: string | undefined): string | undefined {
        switch (ext) {
            case 'txt':
            case 'log':
            case 'html':
            case 'htm':
            case 'js':
            case 'css':
            case 'xml':
            case 'config':
            case 'json':
            case 'yaml':
            case 'cpp':
            case 'c':
            case 'h':
            case 'cc':
            case 'hpp':
            case 'mm':
            case 'cs':
            case 'php':
            case 'sh':
            case 'py':
            case 'java':
            case 'rb':
            case 'cfg':
            case 'properties':
            case 'yml':
            case 'asm':
            case 'pem':
                return 'text/plain';
            case 'pdf':
                return 'application/pdf';
            case 'jpeg':
            case 'jpg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'tiff':
            case 'svg':
                return 'image/' + ext;
        }
    }
}

export { Attachment };
