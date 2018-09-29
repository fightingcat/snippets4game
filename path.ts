namespace path {
    const slashes = /\/+/g;

    function nonempty(path: string) {
        return path !== '';
    }

    export function normalize(path: string) {
        return path.replace(slashes, '/');
    }

    export function normalizeStrict(path: string) {
        const normpath = path.replace(slashes, '/');
        const lastpos = normpath.length - 1;

        if (normpath.charAt(lastpos) !== '/') {
            return normpath;
        }
        return normpath.substring(0, lastpos);
    }

    export function join(...paths: string[]) {
        return normalize(paths.filter(nonempty).join('/'));
    }

    export function dirname(path: string) {
        const normpath = normalizeStrict(path);
        const pathend = normpath.lastIndexOf('/');
        return pathend !== -1 ? normpath.substring(0, pathend) : normpath;
    }

    export function extname(path: string) {
        const normpath = normalizeStrict(path);
        const extstart = normpath.lastIndexOf('.');
        return extstart !== -1 ? normpath.substring(extstart) : '';
    }

    export function basename(path: string, extname = '') {
        const normpath = normalizeStrict(path);
        const filename = normpath.substring(path.lastIndexOf('/') + 1);
        const extstart = filename.length - extname.length;

        if (filename.substring(extstart) == extname) {
            return filename.substring(0, extstart);
        }
        return filename;
    }

    export function include(dir: string, file: string) {
        const normdir = normalizeStrict(dir) + '/';
        const normfile = normalizeStrict(file);
        return normdir === normfile.substring(0, normdir.length);
    }
}