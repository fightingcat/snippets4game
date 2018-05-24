namespace utils {
    type Scanner = (r: RegExp, i: number) => string;

    // 匹配标签开始
    const matchHead = /^<(font|b|i|u)/;
    const matchAttr = /^\s+(\w+)/;
    const matchTail = /^\s*>/;
    // 匹配标签结束
    const matchClose = /^<\/(\w+)\s*>/;
    // 匹配文本
    const matchText = /^[^<]+/;
    // 匹配属性
    const matchInit = /^\s*=\s*/;
    const matchValue = /^\w+/;
    const matchString = /^('|")((\1|.)*?)\1/;

    /**
     * 将HTML解析为egret富文本格式
     * 支持的标签：
     * <b></b> 加粗
     * <i></i> 倾斜
     * <u></u> 下划线
     * <font></font> 通过属性指定样式
     * 所有标签都可以通过属性指定样式，支持egret.ITextStyle中的所有属性，属性值可以加单引号或双引号或没有引号。
     * 
     * 例：<font stroke=2> 所有文本描边 <b>这里加粗</b> <u href="https://egret.com/">链接</u> </font>
     * 
     * @param html HTML字符串
     * @param defaultStyle 默认字体样式（内层HTML元素会继承、覆盖外层元素属性）
     */
    export function parseRichText(html: string, defaultStyle?: egret.ITextStyle): egret.ITextElement[] {
        html = `<p>${html}</p>`;
        return parseHtml(getScanner(html), defaultStyle || {});
    }

    function getScanner(source: string): Scanner {
        return function match(regexp: RegExp, index: number) {
            const result = regexp.exec(source);

            if (result) {
                source = source.substring(result[0].length);
                return result[index];
            }
            return '';
        };
    }

    function parseHtml(scan: Scanner, style: egret.ITextStyle): egret.ITextElement[] {
        const head = scan(matchHead, 1);
        const result: egret.ITextElement[] = [];

        if (head) {
            style = parseTag(head, style);

            for (let attr: string; attr = scan(matchAttr, 1);) {
                let init = scan(matchInit, 0);

                if (!init) style = parseAttr(attr, 'true', style);
                else style = parseAttr(attr, scan(matchValue, 0) || scan(matchString, 2), style);
            }
            if (!scan(matchTail, 0)) {
                throw Error(`Met unclosed tag: ${head}`);
            }
            while (true) {
                const text = scan(matchText, 0);
                const inner = parseHtml(scan, style);

                if (text) result.push({ text, style });
                if (inner) result.push(...inner);
                else break;
            }
            if (scan(matchClose, 1) != head) {
                throw Error(`Tag not closed or unmatched: ${head}`);
            }
            return result;
        }
        return null;
    }

    function parseBool(text: string) {
        if (text == 'true') return true;
        if (text == 'false') return false;
        return Boolean(Number(text));
    }

    function parseTag(tagName: string, style: egret.ITextStyle) {
        switch (tagName) {
            case 'b': return { ...style, bold: true };
            case 'i': return { ...style, italic: true };
            case 'u': return { ...style, underline: true };
        }
        return style;
    }

    function parseAttr(attr: string, value: string, style: egret.ITextStyle) {
        switch (attr) {
            case 'bold':
            case 'italic':
            case 'underline':
                return { ...style, [attr]: parseBool(value) };
            case 'size':
            case 'stroke':
            case 'textColor':
            case 'strokeColor':
                return { ...style, [attr]: Number(value) };
            case 'href':
            case 'target':
            case 'fontFamily':
                return { ...style, [attr]: value };
        }
        return style;
    }
}