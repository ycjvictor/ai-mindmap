#!/bin/bash

# AI Mindmap 项目构建脚本
# 作者：AI Assistant
# 用途：一键构建整个项目

set -e  # 遇到错误立即退出

echo "🚀 开始构建 AI Mindmap 项目..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

echo "📦 安装主项目依赖..."
npm install

echo "🎨 构建 WebUI 前端..."
cd webui

# 检查是否需要安装全局工具
if ! command -v grunt &> /dev/null; then
    echo "📥 安装 Grunt CLI..."
    npm install -g grunt-cli
fi

if ! command -v bower &> /dev/null; then
    echo "📥 安装 Bower..."
    npm install -g bower
fi

if ! command -v lessc &> /dev/null; then
    echo "📥 安装 Less..."
    npm install -g less
fi

# 初始化和构建 WebUI
echo "🔧 初始化 WebUI 依赖..."
npm install
bower install

echo "🔨 构建 WebUI..."
npm run build

# 回到根目录构建主扩展
cd ..
echo "⚙️ 构建主扩展..."
npm run package

echo "✅ 构建完成！"
echo ""
echo "🎯 下一步："
echo "1. 在 VSCode 中打开项目"
echo "2. 按 F5 运行扩展进行调试"
echo "3. 或运行 'npm run build' 打包成 .vsix 文件"
echo ""
echo "🔧 开发模式："
echo "- 运行 'npm run watch' 监听主扩展变化"
echo "- 运行 'cd webui && npm run dev' 启动前端开发服务器"
