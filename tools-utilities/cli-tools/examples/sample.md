# Markdown Preview 示例文档

这是一个用于测试 **markdown-preview** 工具的示例文档。

## 功能展示

### 1. 标题层级

Markdown Preview 工具支持多级标题显示，从 H1 到 H6。

### 2. 文本格式

- **粗体文本** 使用双星号
- *斜体文本* 使用单星号
- ~~删除线~~ 使用双波浪号

### 3. 列表

#### 无序列表
- 苹果
- 香蕉
- 橙子
  - 橙汁
  - 橙皮

#### 有序列表
1. 第一步：安装工具
2. 第二步：运行命令
3. 第三步：查看结果

### 4. 代码展示

#### 行内代码
使用 `python markdown_preview.py sample.md` 命令来预览文件。

#### 代码块

```python
def hello_world():
    """简单的Python函数示例"""
    print("Hello, World!")
    return True

if __name__ == "__main__":
    hello_world()
```

```javascript
// JavaScript 示例
function greet(name) {
    console.log(`Hello, ${name}!`);
}

greet('World');
```

### 5. 引用

> 这是一个引用块。
> 可以用来展示重要的信息或引用他人的话。
>
> — 作者名

### 6. 链接

- [Vibe Coding Apps GitHub](https://github.com)
- [Markdown 语法指南](https://www.markdownguide.org/)

### 7. 表格

| 工具名称 | 功能描述 | 语言 |
|---------|---------|------|
| filetree.py | 目录树生成器 | Python |
| passgen.py | 密码生成器 | Python |
| markdown-preview | Markdown预览 | Python |
| file-organizer | 文件整理工具 | Python |
| todo-cli | 待办事项管理 | Python |

### 8. 分隔线

---

## 使用方法

### 在终端中预览
```bash
python markdown-preview/markdown_preview.py examples/sample.md
```

### 在浏览器中预览
```bash
python markdown-preview/markdown_preview.py examples/sample.md --browser
```

### 导出为 HTML
```bash
python markdown-preview/markdown_preview.py examples/sample.md --output output.html
```

---

## 结论

这个示例文档展示了 Markdown 的主要语法特性，可以用来测试 markdown-preview 工具的各种功能。

**Happy Coding!** 🚀
