/**
     * 根据模板格式化时间戳
     * Y: 年 M: 月 D: 日
     * h: 时 m: 分 s: 秒
     * 
     * 重复次数表示占位，如：
     * YY-MM-DD hh:mm:ss
     * 19-01-25 18:52:00
     * 
     * @param seconds 时间戳
     * @param template 模板
     */
    export function formatDate(seconds: number, template: string) {
        let date = new Date(seconds * 1000);

        function pad(s: number | string, n: number) {
            switch (n) {
                case 1: return ('0' + s).slice(-1);
                case 2: return ('00' + s).slice(-2);
                case 3: return ('000' + s).slice(-3);
                case 4: return ('0000' + s).slice(-4);
                default: return '' + s; // 不应该出现
            }
        }
        return template
            .replace(/Y+/, s => pad(String(date.getFullYear()), s.length))
            .replace(/M+/, s => pad(date.getMonth() + 1, s.length))
            .replace(/D+/, s => pad(date.getDay(), s.length))
            .replace(/h+/, s => pad(date.getHours(), s.length))
            .replace(/m+/, s => pad(date.getMinutes(), s.length))
            .replace(/s+/, s => pad(date.getSeconds(), s.length));
    }
