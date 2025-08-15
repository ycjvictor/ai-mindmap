#!/bin/bash

# AI Mindmap 开发模式启动脚本
# 用途：同时启动前端开发服务器和主扩展监听

set -e

echo "🚀 启动 AI Mindmap 开发模式..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 检查是否已经构建过
if [ ! -d "webui/dist" ]; then
    echo "⚠️  检测到项目尚未构建，正在执行首次构建..."
    ./build.sh
fi

echo "🎨 启动 WebUI 开发服务器..."
echo "📝 提示：WebUI 开发服务器将在浏览器中打开 http://localhost:3000"
echo "⚙️  同时启动主扩展监听模式..."
echo ""
echo "🔧 按 Ctrl+C 停止所有服务"
echo ""

# 使用 trap 捕获退出信号，确保所有后台进程都被杀死
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# 在后台启动 WebUI 开发服务器
cd webui
npm run dev &
WEBUI_PID=$!

# 回到根目录启动主扩展监听
cd ..
npm run watch &
MAIN_PID=$!

echo "✅ 服务已启动："
echo "   - WebUI 开发服务器 (PID: $WEBUI_PID)"
echo "   - 主扩展监听模式 (PID: $MAIN_PID)"
echo ""
echo "💡 在 VSCode 中按 F5 可以启动扩展调试"

# 等待用户中断
wait
