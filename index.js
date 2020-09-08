/**
 * author: pace_zhong@foxmail.com
 */

const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const hljs = require('highlightjs');
const cheerio = require('cheerio');
const prettier = require("prettier"); // 格式化JS
let $console = require('Console'); // 高亮控制台输出

// 语法高亮
const markdown = require('markdown-it')({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre className="hljs"><code>' +
                    hljs.highlight(lang, str, true).value +
                    '</code></pre>';
            } catch (__) { }
        }

        return '';
    }
});

const commandParams = process.argv.splice(2)

// 检查参数是否正确
if (commandParams[0] !== '--config' && !commandParams[1]) {
    $console.error('scripts cofnig error, examples: node ./node_modules/markdownenhance --config ./.me_config.json')
    return 
}

let ME_CONFIG = null;
try {
    ME_CONFIG = require(path.resolve(__dirname, '../../', commandParams[1]))
}catch(e) {
    console.log(e)
}

if (!ME_CONFIG) {
    $console.error(" Not Found .me.config.json in your project root folder ")
    return
}

const ICE_README_PATH = ME_CONFIG.INDEX_READAME_PATH; // 组件项目README.md文档
const ICE_COMPONENTS_PATH = ME_CONFIG.COMPONENT_PAHT;  // 组件目录
const SITE_PATH = ME_CONFIG.OUTPUT_PATH; // 当前项目site目录

const SITE_INFO = {
    components: []
};

// 清理SITE_PATH
exec(`rm -rf ${SITE_PATH}`);

// 首字母大写转换
const firstToUpperCase = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1)
}

// 格式化输出代码
const outputFormat = (str) => {
    return prettier.format(str, { semi: false, parser: "babel" })
}

const demoFolderName = "demo";

// 日期对象扩展时间格式化方法

const formatDate = (dateObj, format) => {
    var date = {
        "M+": dateObj.getMonth() + 1,
        "d+": dateObj.getDate(),
        "h+": dateObj.getHours(),
        "m+": dateObj.getMinutes(),
        "s+": dateObj.getSeconds(),
        "q+": Math.floor((dateObj.getMonth() + 3) / 3),
        "S+": dateObj.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (dateObj.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1
                ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
}


// 广告注释
const banner = `
/**
 * Create By MarkdownEnhance (https://github.com/pacez/MarkdownEnhance)
 * Create Time ${formatDate(new Date(), 'YYYY-MM-dd hh:mm:ss')}
 */
`

// 构建整站
const build = (lib) => {
    // 读取组件目录
    let components = glob.sync(`${ICE_COMPONENTS_PATH}/*`);


    // 遍历组件
    components.forEach(component => {
        // 组件名
        const name = component.match(/\/([\w\d]+)$/)[1];
        const demosPathSource = `${ICE_COMPONENTS_PATH}/${name}/${demoFolderName}`;

        // 生成网站信息的JSON
        SITE_INFO.components.push(name);

        try {
            // readme文档
            const doc = `${component}/README.md`;
            const content = `${fs.readFileSync(doc, 'utf8')}`;
            const $ = cheerio.load(markdown.render(content), {
                withDomLvl1: true,
                normalizeWhitespace: false,
                xmlMode: true,
                decodeEntities: false
            });
            const codes = $('code');
            const components = [];
            const codesTPl = [];

            codes.each((i, code) => {
                const data = $(code).text();

                const sourceString = data.replace('<span class="hljs-comment">', '').replace('</span>', '').replace(/\s/g, '');

                if (!/^source:\/\//.test(sourceString)) {
                    // 普通的代码块
                    $(code).text(`<div dangerouslySetInnerHTML={{__html: markdown.render(\` \\\`\\\`\\\`javascript\\n\${code_${name}_${i}} \\n \\\`\\\`\\\` \`)}}></div>`);
                    // code.children = [code.children[0]];
                    codesTPl.push(`const code_${name}_${i}=\`${data.replace(/&lt;/g, '<').replace(/&gt;/g, '>')}\`;\n`)
                    return
                }

                const demoName = sourceString.split('source://')[1].replace(/\s/g, '');
                const demoNameSplit = demoName.split('.');
                const componentName = demoNameSplit[0];

                if (demoName) {
                    // 命中demo文件路径
                    components.push(demoName);
                    const rawCode = fs.readFileSync(`${demosPathSource}/${demoName}`, 'utf-8');
                    $(code).text(`<div dangerouslySetInnerHTML={{__html: markdown.render(\` \\\`\\\`\\\`javascript\\n\${code_${componentName}} \\n \\\`\\\`\\\` \`)}}></div>`)
                    $(code.parent).before(`<${firstToUpperCase(componentName)}/>  \n <hr />`);
                    // $(code).parent.insertBefore(`<${firstToUpperCase(componentName)}></${firstToUpperCase(componentName)}>  \n <hr />`);
                    codesTPl.push(`const code_${componentName}=\`${rawCode}\`;\n`)
                }
            })

            let importDemosCode = '';

            // import demo 组件
            if (components.length > 0) {
                importDemosCode = components.map(item => {
                    const demoName = item.split('.')[0];
                    return `import ${firstToUpperCase(demoName)} from './${demoFolderName}/${item}'`;
                }).join('\n');
            }

            const codeArea = `
                ${banner}
                import React, { Component } from 'react';
                ${importDemosCode}
                const hljs = require('highlightjs');
                const markdown = require('markdown-it')({
                    highlight: function (str, lang) {
                        if (lang && hljs.getLanguage(lang)) {
                            try {
                                return '<pre className="hljs"><code>' +
                                    hljs.highlight(lang, str, true).value +
                                    '</code></pre>';
                            } catch (__) { }
                        }

                        return '';
                    }
                });


                // 定义代码片断变量
                ${codesTPl.join('')}

                export default class Basic extends Component {
                    render() {
                        return <div>
                            ${$.html()}
                        </div>
                    }
                }
            `;

            fs.outputFileSync(`${SITE_PATH}/${name}/index.js`, outputFormat(codeArea))
        } catch (e) {
            console.log(`组件文件${name}拷贝异常`, e);
        }

        // 获取组件下的demo
        glob.sync(`${component}/${demoFolderName}/*`).map(demo => {
            try {
                const demoSplit = demo.split('/');
                const fileName = demoSplit[demoSplit.length - 1];
                const demoDestPath = `${SITE_PATH}/${name}/${demoFolderName}/${fileName}`;
                fs.copySync(
                    demo,
                    demoDestPath,
                );
            } catch (e) {
                console.log(`${name} ${demoFolderName} 拷贝异常`, e);
            }
            return demo
        });
    });

    // 写入站点信息
    fs.writeJsonSync(`${SITE_PATH}/site_info.json`, SITE_INFO);

    // 生成
    buildIndex()
}

// 构建首页
const buildIndex = () => {
    const README_HTML = markdown.render(fs.readFileSync(ICE_README_PATH, 'utf8'), {
        highlight: function (str, lang) {
            console.log(str)
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(lang, str).value;
                } catch (__) { }
            }

            return ''; // 使用额外的默认转义
        }
    });
    const codeArea = `
        ${banner}
        import React, { Component } from 'react';
        const README_HTML=\`${README_HTML}\`;

        export default class Index extends Component {
            render() {
                return <div dangerouslySetInnerHTML={{__html: README_HTML}}></div>
            }
        }
    `;

    fs.outputFileSync(`${SITE_PATH}/index.js`, outputFormat(codeArea))
}

build()