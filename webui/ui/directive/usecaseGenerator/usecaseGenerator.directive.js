angular.module('kityminderEditor')
    .directive('usecaseGenerator', function () {
        return {
            restrict: 'E',
            templateUrl: 'ui/directive/usecaseGenerator/usecaseGenerator.html',
            scope: {
                minder: '='
            },
            replace: true,
            controller: function ($scope, $rootScope, $timeout, UsecaseGeneratorService) {
                var minder = $scope.minder;
                
                // 侧边面板状态
                $scope.panelVisible = false;
                $scope.currentView = 'main'; // main, modelConfig, knowledgeConfig
                
                // 从本地存储加载配置
                var loadConfigFromStorage = function() {
                    try {
                        var savedModelConfig = localStorage.getItem('usecaseGenerator.modelConfig');
                        if (savedModelConfig) {
                            var parsed = JSON.parse(savedModelConfig);
                            return {
                                provider: parsed.provider || 'OpenRouter',
                                apiKey: parsed.apiKey || '',
                                model: parsed.model || 'openai/gpt-4o-mini',
                                temperature: parsed.temperature || 0.7,
                                maxTokens: parsed.maxTokens || 2000
                            };
                        }
                    } catch (error) {
                        console.warn('加载配置失败:', error);
                    }
                    return {
                        provider: 'OpenRouter', // OpenRouter, OpenAI, Azure, DeepSeek
                        apiKey: '',
                        model: 'openai/gpt-4o-mini',
                        temperature: 0.7,
                        maxTokens: 2000
                    };
                };

                // 模型配置
                $scope.modelConfig = loadConfigFromStorage();
                
                // 从本地存储加载知识库配置
                var loadKnowledgeConfigFromStorage = function() {
                    try {
                        var savedKnowledgeConfig = localStorage.getItem('usecaseGenerator.knowledgeConfig');
                        if (savedKnowledgeConfig) {
                            var parsed = JSON.parse(savedKnowledgeConfig);
                            return {
                                enableRAG: parsed.enableRAG !== undefined ? parsed.enableRAG : true,
                                enableCodeContext: parsed.enableCodeContext !== undefined ? parsed.enableCodeContext : true,
                                enableDocContext: parsed.enableDocContext !== undefined ? parsed.enableDocContext : true,
                                enableHistoryContext: parsed.enableHistoryContext !== undefined ? parsed.enableHistoryContext : true,
                                searchDepth: parsed.searchDepth || 5
                            };
                        }
                    } catch (error) {
                        console.warn('加载知识库配置失败:', error);
                    }
                    return {
                        enableRAG: true,
                        enableCodeContext: true,
                        enableDocContext: true,
                        enableHistoryContext: true,
                        searchDepth: 5
                    };
                };

                // 知识库配置
                $scope.knowledgeConfig = loadKnowledgeConfigFromStorage();
                
                // 生成配置
                $scope.generateConfig = {
                    outputFormat: 'xmind', // xmind, km
                    description: '',
                    analysisType: 'comprehensive', // comprehensive, boundary, scenario
                    includeEdgeCases: true,
                    includeNegativeCases: true
                };
                
                // 生成状态 - 强制初始化为false
                $scope.generating = false;
                $scope.generationProgress = 0;
                $scope.currentStep = '';
                
                // 重置生成状态的函数
                $scope.resetGenerationState = function() {
                    console.log('重置生成状态');
                    $scope.generating = false;
                    $scope.generationProgress = 0;
                    $scope.currentStep = '';
                };
                
                // 强制初始化重置状态
                $timeout(function() {
                    $scope.resetGenerationState();
                }, 100);
                
                // 可用模型列表
                $scope.availableModels = [
                    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenRouter' },
                    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenRouter' },
                    { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'OpenRouter' },
                    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'OpenRouter' },
                    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
                    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
                    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
                    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
                    { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek' }
                ];
                
                // 根据供应商过滤模型
                $scope.getFilteredModels = function() {
                    if (!$scope.modelConfig.provider) return $scope.availableModels;
                    return $scope.availableModels.filter(function(model) {
                        return model.provider === $scope.modelConfig.provider;
                    });
                };
                
                // 监听供应商变化，自动选择第一个模型
                $scope.$watch('modelConfig.provider', function(newProvider, oldProvider) {
                    if (initialized && newProvider !== oldProvider) {
                        var filteredModels = $scope.getFilteredModels();
                        if (filteredModels.length > 0) {
                            $scope.modelConfig.model = filteredModels[0].id;
                        }
                    }
                });
                
                // 打开用例生成助手面板
                $scope.openUsecasePanel = function() {
                    $scope.panelVisible = true;
                    $scope.currentView = 'main';
                    // 重置生成状态
                    $scope.resetGenerationState();
                    // 添加面板显示的CSS类
                    angular.element('body').addClass('usecase-panel-open');
                };
                
                // 关闭面板
                $scope.closePanel = function() {
                    $scope.panelVisible = false;
                    $scope.currentView = 'main';
                    // 重置生成状态
                    $scope.resetGenerationState();
                    angular.element('body').removeClass('usecase-panel-open');
                };
                
                // 切换视图
                $scope.switchView = function(view) {
                    $scope.currentView = view;
                };
                
                // 保存配置到本地存储
                var saveConfigToStorage = function() {
                    try {
                        localStorage.setItem('usecaseGenerator.modelConfig', JSON.stringify($scope.modelConfig));
                        localStorage.setItem('usecaseGenerator.knowledgeConfig', JSON.stringify($scope.knowledgeConfig));
                        console.log('配置已保存到本地存储');
                    } catch (error) {
                        console.warn('保存配置失败:', error);
                    }
                };

                // 保存API配置
                $scope.saveApiKey = function() {
                    saveConfigToStorage();
                    alert('配置已保存');
                };
                
                // 初始化标记，避免首次加载时触发watch
                var initialized = false;
                $timeout(function() {
                    initialized = true;
                    console.log('用例生成器初始化完成');
                }, 500);

                // 监听配置变化，自动保存
                $scope.$watch('modelConfig', function(newConfig, oldConfig) {
                    if (initialized && newConfig !== oldConfig) {
                        saveConfigToStorage();
                    }
                }, true);
                
                $scope.$watch('knowledgeConfig', function(newConfig, oldConfig) {
                    if (initialized && newConfig !== oldConfig) {
                        saveConfigToStorage();
                    }
                }, true);
                
                // 生成测试用例
                $scope.generateUsecases = function() {
                    console.log('generateUsecases called');
                    console.log('description:', $scope.generateConfig.description);
                    console.log('apiKey:', $scope.modelConfig.apiKey ? '已配置' : '未配置');
                    
                    if (!$scope.generateConfig.description.trim()) {
                        alert('请输入需求描述');
                        return;
                    }
                    
                    if (!$scope.modelConfig.apiKey.trim()) {
                        alert('请先配置API Key');
                        $scope.switchView('modelConfig');
                        return;
                    }
                    
                    $scope.generating = true;
                    $scope.generationProgress = 0;
                    
                    // 设置服务配置
                    UsecaseGeneratorService.setModelConfig($scope.modelConfig);
                    UsecaseGeneratorService.setKnowledgeConfig($scope.knowledgeConfig);
                    
                    // 使用真实的服务生成测试用例
                    UsecaseGeneratorService.generateCompleteTestcases(
                        $scope.generateConfig.description,
                        $scope.generateConfig,
                        function(progress, step) {
                            // 使用$timeout确保安全更新
                            $timeout(function() {
                                $scope.generationProgress = progress;
                                $scope.currentStep = step;
                            });
                        }
                    ).then(function(testcases) {
                        $timeout(function() {
                            $scope.generating = false;
                            $scope.currentStep = '生成完成';
                            $scope.applyGeneratedData(testcases);
                        });
                    }).catch(function(error) {
                        $timeout(function() {
                            $scope.generating = false;
                            $scope.currentStep = '生成失败';
                            console.error('生成测试用例失败:', error);
                            alert('生成失败: ' + (error.message || error));
                        });
                    });
                };
                

                
                // 应用生成的数据到思维导图
                $scope.applyGeneratedData = function(data) {
                    try {
                        // 清空当前思维导图
                        minder.execCommand('selectall');
                        minder.execCommand('removenode');
                        
                        // 导入新的数据结构
                        minder.importData('json', JSON.stringify(data));
                        
                        alert('测试用例生成完成！');
                    } catch (error) {
                        console.error('导入数据失败:', error);
                        alert('生成失败，请重试');
                    }
                };
                
                // 导出文件
                $scope.exportFile = function(format) {
                    try {
                        var exportType;
                        var fileType;
                        
                        if (format === 'xmind') {
                            exportType = 'json';
                            fileType = 'xmind';
                        } else if (format === 'km') {
                            exportType = 'json';
                            fileType = 'km';
                        } else {
                            throw new Error('不支持的导出格式: ' + format);
                        }
                        
                        // 使用minder的导出API
                        minder.exportData(exportType).then(function(content) {
                            // 获取根节点文本作为文件名
                            var filename = minder.getRoot().getData('text') || '测试用例';
                            
                            // 通过vscode接口保存文件
                            if (window.vscode) {
                                window.vscode.postMessage({
                                    command: "export",
                                    filename: filename,
                                    type: fileType,
                                    content: content
                                });
                            } else {
                                // 浏览器环境下载文件
                                $scope.downloadFile(content, filename + '.' + fileType, fileType);
                            }
                        }).catch(function(error) {
                            console.error('导出数据失败:', error);
                            alert('导出失败: ' + error.message);
                        });
                        
                    } catch (error) {
                        console.error('导出失败:', error);
                        alert('导出失败，请重试');
                    }
                };
                
                // 浏览器环境下载文件
                $scope.downloadFile = function(content, filename, type) {
                    var blob, url;
                    
                    if (type === 'xmind' || type === 'km') {
                        // JSON格式
                        blob = new Blob([JSON.stringify(content, null, 2)], 
                            { type: 'application/json' });
                    } else {
                        blob = new Blob([content], { type: 'text/plain' });
                    }
                    
                    url = window.URL.createObjectURL(blob);
                    
                    var link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    window.URL.revokeObjectURL(url);
                };
            }
        };
    });
