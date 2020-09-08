# MarkdownEnhance

使用markdown写作react组件文档与demo的编译工具  
   
目前该工具主要应用于自己公司的组件库主站生成，文档较为简陋，有希望使用该工具但阅读理解不便的朋友，可以提issue给我。

### CONFIG
```json
{
    "COMPONENT_PAHT": "/Users/project/src/components",
    "OUTPUT_PATH": "/Users/project/src/__site__",
    "INDEX_READAME_PATH": "/Users/project/src/README.md"
}
```

1. COMPONENT_PAHT 组件根目录
2. OUTPUT_PATH 输出目录，会按照COMPONENT_PAHT下的目录结构输出
3. INDEX_READAME_PATH, 一般来说，组件库根目录需要有一个README.me文档。用于输出整个组件库的描述

*OUTPUT_PATH，除了输出组件信息外，还会生成一个site_info.json, 用于使用网站生成目录树*

### 运行

#### 第一种方式   
从https://github.com/pacez/MarkdownEnhance.git下载项目。   
进入项目，在项目下创建.me_config.json，按照config配置好参数。  
运行即可
```javascript
node ./index.js
```

#### 第二种  
进入你的文档组件库项目
```javascript
// 安装依赖
yarn add markdownenhance
```
打开package.json，在scripts添加以下脚本
```javascript
// 安装依赖
"g": "node ./node_modules/markdownenhance --config ./.me_config.json"
```
运行
```javascript
yarn g
// or
npm run g
```

### 组件库目录
```
---[src]
    --[components]
        --[ComonentName]
            --[demos]
                -- demo1.js
                -- demo2.js
            --index.js
            --README.md
    README.md
```


### Component README.md 模板

***本工具会自动寻找组件目录下的README.md文档进行解析，并编译README.md中在代码块里通过source://引入的组件，进行组件与code双重展示。***

```markdown

# Title

### 示例

/`/`/`javascript
source://index.js
/`/`/`
index.js 位于 组件目录下 [demos]目录下, 参考上面组件库目录内容。  

...
```

