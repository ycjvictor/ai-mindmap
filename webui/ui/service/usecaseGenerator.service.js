angular.module('kityminderEditor')
    .service('UsecaseGeneratorService', function($http, $q) {
        
        var self = this;
        
        // AI模型调用配置
        self.modelConfig = {
            provider: 'OpenRouter',
            apiKey: '',
            model: 'openai/gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 2000,
            baseUrl: 'https://openrouter.ai/api/v1'
        };
        
        // 获取API端点（通过代理服务器）
        self.getApiUrl = function(provider) {
            switch(provider) {
                case 'OpenRouter':
                    return 'http://localhost:3001/api/openrouter';
                case 'OpenAI':
                    return 'http://localhost:3001/api/openai';
                case 'DeepSeek':
                    return 'http://localhost:3001/api/deepseek';
                case 'Azure':
                    return 'http://localhost:3001/api/azure';
                default:
                    return 'http://localhost:3001/api/openrouter';
            }
        };
        
        // 获取API Headers
        self.getApiHeaders = function(provider, apiKey) {
            var headers = {
                'Content-Type': 'application/json'
            };
            
            switch(provider) {
                case 'OpenRouter':
                    headers['Authorization'] = 'Bearer ' + apiKey;
                    headers['HTTP-Referer'] = window.location.href;
                    headers['X-Title'] = 'AI Mind Map Generator';
                    break;
                case 'OpenAI':
                    headers['Authorization'] = 'Bearer ' + apiKey;
                    break;
                case 'DeepSeek':
                    headers['Authorization'] = 'Bearer ' + apiKey;
                    break;
                case 'Azure':
                    headers['api-key'] = apiKey;
                    break;
                default:
                    headers['Authorization'] = 'Bearer ' + apiKey;
            }
            
            return headers;
        };
        
        // 知识库配置
        self.knowledgeConfig = {
            enableRAG: true,
            enableCodeContext: true,
            enableDocContext: true,
            enableHistoryContext: true,
            searchDepth: 5
        };
        
        /**
         * 设置模型配置
         */
        self.setModelConfig = function(config) {
            angular.extend(self.modelConfig, config);
            // 更新基础URL
            if (config.provider) {
                self.modelConfig.baseUrl = self.getApiUrl(config.provider);
            }
        };
        
        /**
         * 设置知识库配置
         */
        self.setKnowledgeConfig = function(config) {
            angular.extend(self.knowledgeConfig, config);
        };
        
        /**
         * 步骤1: 需求理解和解析
         */
        self.parseRequirement = function(description) {
            var deferred = $q.defer();
            
            setTimeout(function() {
                try {
                    // 验证描述是否有效
                    if (!description || typeof description !== 'string' || description.trim() === '') {
                        throw new Error('需求描述不能为空');
                    }
                    
                    // 解析需求描述，提取关键信息
                    var parsedInfo = {
                        mainFeature: description.trim(),
                        subFeatures: self.extractSubFeatures(description),
                        boundaries: self.identifyBoundaries(description),
                        scenarios: self.identifyScenarios(description)
                    };
                    
                    console.log('parseRequirement - 生成的parsedInfo:', parsedInfo);
                    deferred.resolve(parsedInfo);
                } catch (error) {
                    deferred.reject(error);
                }
            }, 500);
            
            return deferred.promise;
        };
        
        /**
         * 步骤2: 检索相关上下文
         */
        self.retrieveContext = function(parsedInfo) {
            var deferred = $q.defer();
            
            setTimeout(function() {
                try {
                    // 验证输入
                    if (!parsedInfo) {
                        throw new Error('解析信息不能为空');
                    }
                    
                    var context = {
                        parsedInfo: parsedInfo, // 重要：确保parsedInfo被包含在context中
                        codeContext: self.knowledgeConfig.enableCodeContext ? self.getCodeContext() : null,
                        docContext: self.knowledgeConfig.enableDocContext ? self.getDocContext() : null,
                        historyContext: self.knowledgeConfig.enableHistoryContext ? self.getHistoryContext() : null,
                        ragContext: self.knowledgeConfig.enableRAG ? self.getRAGContext(parsedInfo) : null
                    };
                    
                    console.log('retrieveContext - 接收到的parsedInfo:', parsedInfo);
                    console.log('retrieveContext - 返回的context:', context);
                    deferred.resolve(context);
                } catch (error) {
                    deferred.reject(error);
                }
            }, 800);
            
            return deferred.promise;
        };
        
        /**
         * 步骤3: LLM生成测试用例
         */
        self.generateTestcases = function(parsedInfo, context, generateConfig) {
            var deferred = $q.defer();
            
            // 验证输入参数
            if (!parsedInfo) {
                console.error('parsedInfo参数为空');
                deferred.reject(new Error('解析信息不能为空'));
                return deferred.promise;
            }
            
            // 构建prompt
            var prompt = self.buildPrompt(parsedInfo, context, generateConfig);
            
            // 调用AI模型
            self.callAIModel(prompt)
                .then(function(response) {
                    try {
                        var testcases = self.parseAIResponse(response, generateConfig);
                        deferred.resolve(testcases);
                    } catch (error) {
                        deferred.reject(error);
                    }
                })
                .catch(function(error) {
                    deferred.reject(error);
                });
            
            return deferred.promise;
        };
        
        /**
         * 步骤4: 验证和优化
         */
        self.validateAndOptimize = function(testcases, parsedInfo) {
            var deferred = $q.defer();
            
            setTimeout(function() {
                try {
                    // 验证测试用例的完整性和一致性
                    var validatedTestcases = self.validateTestcases(testcases);
                    
                    // 优化测试用例结构
                    var optimizedTestcases = self.optimizeTestcases(validatedTestcases, parsedInfo);
                    
                    deferred.resolve(optimizedTestcases);
                } catch (error) {
                    deferred.reject(error);
                }
            }, 600);
            
            return deferred.promise;
        };
        
        /**
         * 调用AI模型的主要方法
         */
        self.callAIModel = function(prompt) {
            var deferred = $q.defer();
            
            if (!self.modelConfig.apiKey) {
                deferred.reject(new Error('API Key未配置'));
                return deferred.promise;
            }
            
            // 构建请求配置
            var baseUrl = self.getApiUrl(self.modelConfig.provider);
            var apiUrl = baseUrl + '/chat/completions';
            var headers = self.getApiHeaders(self.modelConfig.provider, self.modelConfig.apiKey);
            
            var requestData = {
                model: self.modelConfig.model,
                messages: [
                    {
                        role: 'system', 
                        content: '你是一个专业的测试用例生成专家。请根据用户提供的需求描述，分析并提取关键功能点，然后为每个功能点生成对应的测试用例。返回的结果必须是JSON格式的思维导图数据结构。'
                    },
                    {
                        role: 'user', 
                        content: prompt
                    }
                ],
                temperature: self.modelConfig.temperature || 0.7,
                max_tokens: self.modelConfig.maxTokens || 2000
            };
            
            console.log('调用AI接口:', apiUrl);
            console.log('请求数据:', requestData);
            
            // 为Azure添加特殊处理
            if (self.modelConfig.provider === 'Azure' && self.modelConfig.azureEndpoint) {
                headers['azure-endpoint'] = self.modelConfig.azureEndpoint;
            }
            
            console.log('最终请求URL:', apiUrl);
            console.log('请求headers:', headers);
            
            // 发起真实的API请求（通过代理服务器）
            $http.post(apiUrl, requestData, {
                headers: headers,
                timeout: 30000
            }).then(function(response) {
                console.log('AI接口响应:', response.data);
                
                try {
                    var content = response.data.choices[0].message.content;
                    
                    // 尝试解析JSON响应
                    var jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        var jsonData = JSON.parse(jsonMatch[0]);
                        deferred.resolve(jsonData);
                    } else {
                        // 如果AI没有返回JSON格式，使用备用方案
                        console.warn('AI返回的不是JSON格式，使用备用生成方案');
                        var backupResponse = self.generateBackupResponse(content);
                        deferred.resolve(backupResponse);
                    }
                } catch (error) {
                    console.error('解析AI响应失败:', error);
                    // 使用备用方案
                    var backupResponse = self.generateBackupResponse(response.data.choices[0].message.content);
                    deferred.resolve(backupResponse);
                }
            }).catch(function(error) {
                console.error('AI接口调用失败:', error);
                
                // API调用失败时的备用方案
                if (error.status === 401) {
                    deferred.reject(new Error('API Key无效或已过期'));
                } else if (error.status === 429) {
                    deferred.reject(new Error('API调用频率超限，请稍后重试'));
                } else {
                    var errorMessage = 'AI接口调用失败';
                    if (error.data && error.data.error && error.data.error.message) {
                        errorMessage += ': ' + error.data.error.message;
                    } else if (error.message) {
                        errorMessage += ': ' + error.message;
                    }
                    deferred.reject(new Error(errorMessage));
                }
            });
            
            return deferred.promise;
        };
        
        /**
         * 构建AI提示词
         */
        self.buildPrompt = function(parsedInfo, context, generateConfig) {
            // 安全检查
            if (!parsedInfo) {
                console.error('buildPrompt: parsedInfo为空', parsedInfo);
                throw new Error('需求信息未定义');
            }
            
            if (!parsedInfo.mainFeature) {
                console.error('buildPrompt: mainFeature为空', parsedInfo);
                throw new Error('主要功能信息未定义');
            }
            
            var timestamp = Date.now();
            var rootDescription = parsedInfo.mainFeature;
            
            // 子需求描述
            var childDescriptions = parsedInfo.subFeatures || [];
            var childDescriptionStr = childDescriptions.length > 0 ? childDescriptions.join('\n') : '无子功能';
            
            // 基础结构模板
            var part1 = {
                "root": {
                    "data": {
                        "id": "d868fsvqsuw0",
                        "created": timestamp,
                        "text": rootDescription
                    },
                    "children": []
                },
                "template": "default",
                "theme": "fresh-blue-compat",
                "version": "1.4.43",
                "id": "d868fsvqsuw0"
            };
            
            // 测试点结构
            var part2 = {
                "data": {
                    "id": "d86982ow4yg0",
                    "created": timestamp,
                    "text": "子需求名称1",
                    "usecase": 0
                },
                "children": []
            };
            
            // 用例结构
            var part3 = {
                "data": {
                    "id": "d8698dvdbmg0",
                    "created": timestamp,
                    "text": "测试用例",
                    "usecase": 2
                },
                "children": [
                    {
                        "data": {
                            "id": "d8698efskz40",
                            "created": timestamp,
                            "text": "前置条件",
                            "usecase": 1
                        },
                        "children": [
                            {
                                "data": {
                                    "id": "d8698f7j6u80",
                                    "created": timestamp,
                                    "text": "操作步骤",
                                    "usecase": 4
                                },
                                "children": [
                                    {
                                        "data": {
                                            "id": "d8698fwp7zc0",
                                            "created": timestamp,
                                            "text": "预期结果",
                                            "usecase": 3
                                        },
                                        "children": []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            
            // 构建完整prompt
            var prompt = '"整体输出结构":\n' + JSON.stringify(part1, null, 2) + '\n' +
                '"子需求结构":\n' + JSON.stringify(part2, null, 2) + '\n' +
                '子需求名称替换usecase=0的单元的text字段.\n' +
                '最终生成的多个"子需求结构",append至"整体输出结构"["root"]["children"]内.\n' +
                '"用例结构":' + JSON.stringify(part3, null, 2) + '\n' +
                '前置条件替换"用例结构"中usecase=1的单元的text字段,\n' +
                '用例名称替换"用例结构"中usecase=2的单元的text字段,\n' +
                '预期结果替换"用例结构"中usecase=3的单元的text字段,\n' +
                '操作步骤替换"用例结构"中usecase=4的单元的text字段.\n' +
                '最终生成的多个"用例结构"，append至"子需求结构"["children"]内.\n' +
                '以上所有数据结构内,若存在created字段,则取生成结构时的时间戳填充.\n' +
                '若存在id字段,则随机生成位数相同且唯一的字符串填充.\n' +
                '"根需求名称":' + rootDescription + ',\n' +
                '以下为多个子需求描述:\n' + childDescriptionStr + ',\n' +
                '分析类型: ' + generateConfig.analysisType + '\n' +
                (generateConfig.includeEdgeCases ? '需要包含边界条件测试用例\n' : '') +
                (generateConfig.includeNegativeCases ? '需要包含异常场景测试用例\n' : '') +
                (context.codeContext ? '代码上下文:\n' + JSON.stringify(context.codeContext) + '\n' : '') +
                (context.docContext ? '文档上下文:\n' + JSON.stringify(context.docContext) + '\n' : '') +
                (context.historyContext ? '历史用例参考:\n' + JSON.stringify(context.historyContext) + '\n' : '') +
                '根据上文分析出来的所有测试点,生成符合上述格式要求的测试用例.\n' +
                '特别注意,确保最终输出结果为json格式,内部不要有注释,不要省略内容.\n' +
                '最后只需要返回"整体输出结构"即可,请按照json格式输出。';
            
            // 剔除无关空格
            return prompt.replace(/\s+/g, ' ').trim();
        };
        
        /**
         * 备用响应生成（当AI接口调用失败或返回格式不正确时使用）
         */
        self.generateBackupResponse = function(aiContent) {
            var timestamp = Date.now();
            
            // 尝试从AI返回的内容中提取有用信息
            var testCases = [];
            
            // 简单解析AI返回的文本内容
            var lines = aiContent.split('\n');
            var currentCase = null;
            
            lines.forEach(function(line) {
                var trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#') && trimmed.length > 3) {
                    if (trimmed.includes('测试') || trimmed.includes('验证') || trimmed.includes('检查')) {
                        if (currentCase) {
                            testCases.push(currentCase);
                        }
                        currentCase = {
                            name: trimmed,
                            precondition: "系统正常运行",
                            steps: "执行相关操作步骤",
                            expected: "操作成功完成"
                        };
                    }
                }
            });
            
            if (currentCase) {
                testCases.push(currentCase);
            }
            
            // 如果没有提取到测试用例，生成默认的
            if (testCases.length === 0) {
                testCases = [
                    {
                        name: "基本功能验证",
                        precondition: "系统正常运行，用户已登录",
                        steps: "1. 执行标准操作流程\n2. 确认操作完成",
                        expected: "功能正常工作，返回预期结果"
                    },
                    {
                        name: "异常情况处理",
                        precondition: "系统正常运行",
                        steps: "1. 输入无效数据\n2. 尝试执行操作",
                        expected: "系统正确处理异常，显示错误提示"
                    }
                ];
            }
            
            return {
                "root": {
                    "data": {
                        "id": "root_" + timestamp,
                        "created": timestamp,
                        "text": "中心主题"
                    },
                    "children": testCases.map(function(testCase, index) {
                        return {
                            "data": {
                                "id": "case_" + timestamp + "_" + index,
                                "created": timestamp + index + 1,
                                "text": testCase.name,
                                "usecase": 2
                            },
                            "children": [
                                {
                                    "data": {
                                        "id": "pre_" + timestamp + "_" + index,
                                        "created": timestamp + index + 100,
                                        "text": testCase.precondition,
                                        "usecase": 1
                                    },
                                    "children": []
                                },
                                {
                                    "data": {
                                        "id": "step_" + timestamp + "_" + index,
                                        "created": timestamp + index + 200,
                                        "text": testCase.steps,
                                        "usecase": 4
                                    },
                                    "children": []
                                },
                                {
                                    "data": {
                                        "id": "result_" + timestamp + "_" + index,
                                        "created": timestamp + index + 300,
                                        "text": testCase.expected,
                                        "usecase": 3
                                    },
                                    "children": []
                                }
                            ]
                        };
                    })
                },
                "template": "default",
                "theme": "fresh-blue-compat", 
                "version": "1.4.43",
                "id": "root_" + timestamp
            };
        };
        
        /**
         * 解析AI响应
         */
        self.parseAIResponse = function(response, generateConfig) {
            // 验证响应格式
            if (!response || !response.root) {
                throw new Error('AI响应格式不正确');
            }
            
            return response;
        };
        
        /**
         * 验证测试用例
         */
        self.validateTestcases = function(testcases) {
            // 验证必要字段
            if (!testcases.root || !testcases.root.data) {
                throw new Error('测试用例缺少根节点');
            }
            
            // 验证子节点结构
            self.validateNodeStructure(testcases.root);
            
            return testcases;
        };
        
        /**
         * 优化测试用例
         */
        self.optimizeTestcases = function(testcases, parsedInfo) {
            // 添加ID的唯一性验证
            self.ensureUniqueIds(testcases);
            
            // 优化文本内容
            self.optimizeTextContent(testcases);
            
            return testcases;
        };
        
        // 辅助方法
        self.extractSubFeatures = function(description) {
            try {
                if (!description || typeof description !== 'string') {
                    return [];
                }
                
                // 简单的关键词提取
                var features = [];
                var desc = description.toLowerCase();
                
                if (desc.includes('登录')) {
                    features.push('正常登录', '异常登录', '登录验证');
                }
                if (desc.includes('注册')) {
                    features.push('用户注册', '信息验证', '注册成功');
                }
                if (desc.includes('搜索')) {
                    features.push('关键词搜索', '搜索结果', '高级搜索');
            }
            return features.length > 0 ? features : ['基础功能', '异常处理'];
            } catch (error) {
                console.warn('提取子功能失败:', error);
                return ['基础功能', '异常处理'];
            }
        };
        
        self.identifyBoundaries = function(description) {
            try {
                if (!description || typeof description !== 'string') {
                    return ['输入为空', '超长输入', '特殊字符', '并发访问'];
                }
                return ['输入为空', '超长输入', '特殊字符', '并发访问'];
            } catch (error) {
                console.warn('识别边界条件失败:', error);
                return ['输入为空', '超长输入', '特殊字符', '并发访问'];
            }
        };
        
        self.identifyScenarios = function(description) {
            try {
                if (!description || typeof description !== 'string') {
                    return ['正常场景', '异常场景', '边界场景'];
                }
                return ['正常场景', '异常场景', '边界场景'];
            } catch (error) {
                console.warn('识别测试场景失败:', error);
                return ['正常场景', '异常场景', '边界场景'];
            }
        };
        
        self.getCodeContext = function() {
            return { message: '代码上下文信息' };
        };
        
        self.getDocContext = function() {
            return { message: '文档上下文信息' };
        };
        
        self.getHistoryContext = function() {
            return { message: '历史用例信息' };
        };
        
        self.getRAGContext = function(parsedInfo) {
            return { message: 'RAG检索信息' };
        };
        
        self.validateNodeStructure = function(node) {
            if (!node.data || !node.data.id || !node.data.text) {
                throw new Error('节点缺少必要字段');
            }
            
            if (node.children) {
                node.children.forEach(function(child) {
                    self.validateNodeStructure(child);
                });
            }
        };
        
        self.ensureUniqueIds = function(testcases) {
            var usedIds = new Set();
            
            function checkNode(node) {
                if (usedIds.has(node.data.id)) {
                    node.data.id = node.data.id + '_' + Math.random().toString(36).substr(2, 9);
                }
                usedIds.add(node.data.id);
                
                if (node.children) {
                    node.children.forEach(checkNode);
                }
            }
            
            checkNode(testcases.root);
        };
        
        self.optimizeTextContent = function(testcases) {
            function optimizeNode(node) {
                // 去除多余空格
                node.data.text = node.data.text.trim();
                
                if (node.children) {
                    node.children.forEach(optimizeNode);
                }
            }
            
            optimizeNode(testcases.root);
        };
        
        /**
         * 完整的测试用例生成流程
         */
        self.generateCompleteTestcases = function(description, generateConfig, progressCallback) {
            var deferred = $q.defer();
            
            var progress = 0;
            
            // 安全的进度回调包装
            var safeProgressCallback = function(prog, step) {
                try {
                    if (progressCallback && typeof progressCallback === 'function') {
                        progressCallback(prog, step);
                    }
                } catch (error) {
                    console.warn('进度回调失败:', error);
                }
            };
            
            // 步骤1: 需求理解和解析
            safeProgressCallback(20, '需求理解和解析');
            
            self.parseRequirement(description)
                .then(function(parsedInfo) {
                    progress = 40;
                    safeProgressCallback(progress, '检索相关上下文');
                    
                    // 步骤2: 检索相关上下文
                    return self.retrieveContext(parsedInfo);
                })
                .then(function(context) {
                    progress = 80;
                    safeProgressCallback(progress, 'LLM生成测试用例');
                    
                    console.log('准备调用generateTestcases:');
                    console.log('- context:', context);
                    console.log('- context.parsedInfo:', context.parsedInfo);
                    console.log('- generateConfig:', generateConfig);
                    
                    // 步骤3: LLM生成测试用例
                    return self.generateTestcases(context.parsedInfo, context, generateConfig);
                })
                .then(function(testcases) {
                    progress = 100;
                    safeProgressCallback(progress, '验证和优化');
                    
                    // 步骤4: 验证和优化 (直接返回测试用例，暂时跳过复杂验证)
                    return testcases;
                })
                .then(function(finalTestcases) {
                    safeProgressCallback(100, '生成完成');
                    deferred.resolve(finalTestcases);
                })
                .catch(function(error) {
                    console.error('生成失败:', error);
                    safeProgressCallback(0, '生成失败');
                    deferred.reject(error);
                });
            
            return deferred.promise;
        };
        
        return self;
    });
