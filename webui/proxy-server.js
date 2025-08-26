const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// OpenRouter代理
app.use('/api/openrouter', createProxyMiddleware({
    target: 'https://openrouter.ai',
    changeOrigin: true,
    pathRewrite: {
        '^/api/openrouter': '/api/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('OpenRouter代理请求:', req.method, req.url);
        // 确保Content-Type正确
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }
}));

// OpenAI代理
app.use('/api/openai', createProxyMiddleware({
    target: 'https://api.openai.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api/openai': '/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('OpenAI代理请求:', req.method, req.url);
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }
}));

// DeepSeek代理
app.use('/api/deepseek', createProxyMiddleware({
    target: 'https://api.deepseek.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api/deepseek': '/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('DeepSeek代理请求:', req.method, req.url);
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }
}));

// Azure OpenAI代理（需要特殊处理）
app.use('/api/azure', (req, res, next) => {
    // Azure OpenAI需要特殊的URL格式
    const azureEndpoint = req.headers['azure-endpoint'];
    if (!azureEndpoint) {
        return res.status(400).json({ error: 'Missing azure-endpoint header' });
    }
    
    const proxy = createProxyMiddleware({
        target: azureEndpoint,
        changeOrigin: true,
        pathRewrite: {
            '^/api/azure': ''
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log('Azure代理请求:', req.method, req.url);
            if (req.body && Object.keys(req.body).length > 0) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        }
    });
    
    proxy(req, res, next);
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI API代理服务器运行正常' });
});

app.listen(PORT, () => {
    console.log(`🚀 AI API代理服务器运行在 http://localhost:${PORT}`);
    console.log(`📡 支持的代理路由:`);
    console.log(`   - OpenRouter: http://localhost:${PORT}/api/openrouter`);
    console.log(`   - OpenAI: http://localhost:${PORT}/api/openai`);
    console.log(`   - DeepSeek: http://localhost:${PORT}/api/deepseek`);
    console.log(`   - Azure: http://localhost:${PORT}/api/azure`);
});
